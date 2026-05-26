import { createClient } from '@/lib/supabase/server';
import { getUserEntitlements } from '@/services/entitlement.service';
import type { Database } from '@/types/database.types';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  role: Database['public']['Enums']['team_role'];
  createdAt: string;
  updatedAt: string;
  joinedAt: string;
};

function normalizeTeamSlugPart(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildCandidateTeamSlugs(teamName: string) {
  const baseSlug = normalizeTeamSlugPart(teamName).slice(0, 48) || 'team';

  return [
    baseSlug,
    `${baseSlug}-garage`,
    `${baseSlug}-squad`,
    `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`,
  ];
}

function isUniqueViolation(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function resolveTeamDisplayOrder(left: TeamSummary, right: TeamSummary) {
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

export async function getUserTeams(userId: string): Promise<TeamSummary[]> {
  const supabase = await createClient();
  const membershipResult = await supabase
    .from('team_members')
    .select('team_id, role, joined_at')
    .eq('user_id', userId);

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const memberships = (membershipResult.data ?? []) as Pick<
    TeamMemberRow,
    'team_id' | 'role' | 'joined_at'
  >[];

  if (memberships.length === 0) {
    return [];
  }

  const membershipsByTeamId = new Map(
    memberships.map((membership) => [membership.team_id, membership]),
  );
  const teamIds = memberships.map((membership) => membership.team_id);
  const teamsResult = await supabase
    .from('teams')
    .select('id, name, slug, created_by, created_at, updated_at')
    .in('id', teamIds);

  if (teamsResult.error) {
    throw teamsResult.error;
  }

  return (
    (teamsResult.data ?? []) as Pick<
      TeamRow,
      'id' | 'name' | 'slug' | 'created_at' | 'updated_at' | 'created_by'
    >[]
  )
    .map((team) => {
      const membership = membershipsByTeamId.get(team.id);

      if (!membership) {
        return null;
      }

      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        role: membership.role,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        joinedAt: membership.joined_at,
      } satisfies TeamSummary;
    })
    .filter((team): team is TeamSummary => team !== null)
    .sort(resolveTeamDisplayOrder);
}

export async function createTeam(input: { userId: string; name: string }) {
  const supabase = await createClient();
  const entitlements = await getUserEntitlements(input.userId);

  if (!entitlements.canCreateTeams) {
    throw new Error('team_creation_requires_pro');
  }

  const [ownedTeamsResult, profileResult] = await Promise.all([
    supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', input.userId),
    supabase.from('profiles').select('active_team_id').eq('id', input.userId).maybeSingle(),
  ]);

  if (ownedTeamsResult.error) {
    throw ownedTeamsResult.error;
  }

  if (profileResult.error) {
    throw profileResult.error;
  }

  const ownedTeamsCount = ownedTeamsResult.count ?? 0;

  if (entitlements.maxTeamsOwned !== null && ownedTeamsCount >= entitlements.maxTeamsOwned) {
    throw new Error('team_limit_reached');
  }

  const teamName = input.name.trim();
  const candidateSlugs = buildCandidateTeamSlugs(teamName);

  for (const slug of candidateSlugs) {
    const insertResult = await supabase
      .from('teams')
      .insert({
        name: teamName,
        slug,
        created_by: input.userId,
      })
      .select('id, name, slug, created_at, updated_at')
      .single();

    if (insertResult.error) {
      if (isUniqueViolation(insertResult.error)) {
        continue;
      }

      throw insertResult.error;
    }

    const createdTeam = insertResult.data as Pick<
      TeamRow,
      'id' | 'name' | 'slug' | 'created_at' | 'updated_at'
    >;

    const profileUpdateResult = await supabase
      .from('profiles')
      .update({
        active_team_id: createdTeam.id,
      })
      .eq('id', input.userId);

    if (profileUpdateResult.error) {
      throw profileUpdateResult.error;
    }

    return {
      id: createdTeam.id,
      name: createdTeam.name,
      slug: createdTeam.slug,
    };
  }

  throw new Error('team_slug_conflict');
}
