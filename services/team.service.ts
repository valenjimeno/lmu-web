import { createClient } from '@/lib/supabase/server';
import { getUserEntitlements } from '@/services/entitlement.service';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamInvitationRow = Database['public']['Tables']['team_invitations']['Row'];

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  role: Database['public']['Enums']['team_role'];
  createdAt: string;
  updatedAt: string;
  joinedAt: string;
};

export type TeamMemberSummary = {
  teamId: string;
  userId: string;
  role: Database['public']['Enums']['team_role'];
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type TeamInvitationSummary = {
  id: string;
  teamId: string;
  email: string;
  role: Database['public']['Enums']['team_role'];
  invitedBy: string;
  token: string;
  status: Database['public']['Enums']['team_invitation_status'];
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IncomingTeamInvitationSummary = TeamInvitationSummary & {
  teamName: string;
  teamSlug: string | null;
};

type TeamAccessSummary = {
  teamId: string;
  role: Database['public']['Enums']['team_role'];
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

function normalizeEmailAddress(value: string) {
  return value.trim().toLocaleLowerCase();
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

function resolveTeamMemberDisplayOrder(left: TeamMemberSummary, right: TeamMemberSummary) {
  if (left.role !== right.role) {
    return left.role === 'owner' ? -1 : 1;
  }

  return Date.parse(left.joinedAt) - Date.parse(right.joinedAt);
}

async function getTeamAccess(teamId: string, userId: string): Promise<TeamAccessSummary | null> {
  const supabase = await createClient();
  const membershipResult = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const membership = membershipResult.data as Pick<TeamMemberRow, 'team_id' | 'role'> | null;

  if (!membership) {
    return null;
  }

  return {
    teamId: membership.team_id,
    role: membership.role,
  };
}

async function requireTeamAccess(teamId: string, userId: string) {
  const access = await getTeamAccess(teamId, userId);

  if (!access) {
    throw new Error('team_access_denied');
  }

  return access;
}

async function requireTeamOwner(teamId: string, userId: string) {
  const access = await requireTeamAccess(teamId, userId);

  if (access.role !== 'owner') {
    throw new Error('team_owner_required');
  }

  return access;
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

export async function getTeamMembers(input: { teamId: string; userId: string }) {
  await requireTeamAccess(input.teamId, input.userId);

  const supabase = await createClient();
  const teamMembersResult = await supabase
    .from('team_members')
    .select('team_id, user_id, role, joined_at, created_at, updated_at')
    .eq('team_id', input.teamId);

  if (teamMembersResult.error) {
    throw teamMembersResult.error;
  }

  const teamMembers = (teamMembersResult.data ?? []) as Pick<
    TeamMemberRow,
    'team_id' | 'user_id' | 'role' | 'joined_at' | 'created_at' | 'updated_at'
  >[];

  if (teamMembers.length === 0) {
    return [];
  }

  const userIds = [...new Set(teamMembers.map((teamMember) => teamMember.user_id))];
  const profilesResult = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .in('id', userIds);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profilesByUserId = new Map(
    (
      (profilesResult.data ?? []) as Pick<
        ProfileRow,
        'id' | 'display_name' | 'first_name' | 'last_name'
      >[]
    ).map((profile) => [profile.id, profile]),
  );

  return teamMembers
    .map((teamMember) => {
      const profile = profilesByUserId.get(teamMember.user_id);

      return {
        teamId: teamMember.team_id,
        userId: teamMember.user_id,
        role: teamMember.role,
        joinedAt: teamMember.joined_at,
        createdAt: teamMember.created_at,
        updatedAt: teamMember.updated_at,
        displayName: profile?.display_name ?? null,
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
      } satisfies TeamMemberSummary;
    })
    .sort(resolveTeamMemberDisplayOrder);
}

export async function getTeamInvitations(input: { teamId: string; userId: string }) {
  await requireTeamOwner(input.teamId, input.userId);

  const supabase = await createClient();
  const invitationsResult = await supabase
    .from('team_invitations')
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .eq('team_id', input.teamId)
    .order('created_at', { ascending: false });

  if (invitationsResult.error) {
    throw invitationsResult.error;
  }

  return ((invitationsResult.data ?? []) as TeamInvitationRow[]).map((invitation) => ({
    id: invitation.id,
    teamId: invitation.team_id,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invited_by,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expires_at,
    acceptedBy: invitation.accepted_by,
    acceptedAt: invitation.accepted_at,
    createdAt: invitation.created_at,
    updatedAt: invitation.updated_at,
  })) satisfies TeamInvitationSummary[];
}

export async function getPendingInvitationsForUser(input: { userEmail: string }) {
  const normalizedEmail = normalizeEmailAddress(input.userEmail);

  if (!normalizedEmail) {
    return [];
  }

  const supabase = await createClient();
  const invitationsResult = await supabase
    .from('team_invitations')
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (invitationsResult.error) {
    throw invitationsResult.error;
  }

  const invitations = (invitationsResult.data ?? []) as TeamInvitationRow[];

  if (invitations.length === 0) {
    return [];
  }

  const teamIds = [...new Set(invitations.map((invitation) => invitation.team_id))];
  const teamsResult = await supabase.from('teams').select('id, name, slug').in('id', teamIds);

  if (teamsResult.error) {
    throw teamsResult.error;
  }

  const teamsById = new Map(
    ((teamsResult.data ?? []) as Pick<TeamRow, 'id' | 'name' | 'slug'>[]).map((team) => [
      team.id,
      team,
    ]),
  );

  return invitations.map((invitation) => ({
    id: invitation.id,
    teamId: invitation.team_id,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invited_by,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expires_at,
    acceptedBy: invitation.accepted_by,
    acceptedAt: invitation.accepted_at,
    createdAt: invitation.created_at,
    updatedAt: invitation.updated_at,
    teamName: teamsById.get(invitation.team_id)?.name ?? 'Equipo',
    teamSlug: teamsById.get(invitation.team_id)?.slug ?? null,
  }));
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

export async function inviteTeamMember(input: { teamId: string; userId: string; email: string }) {
  const normalizedEmail = normalizeEmailAddress(input.email);

  if (!normalizedEmail) {
    throw new Error('missing_invitation_email');
  }

  const supabase = await createClient();
  const entitlements = await getUserEntitlements(input.userId);

  if (!entitlements.canInviteToTeams) {
    throw new Error('team_invitation_requires_pro');
  }

  await requireTeamOwner(input.teamId, input.userId);

  const existingPendingInvitationResult = await supabase
    .from('team_invitations')
    .select('id')
    .eq('team_id', input.teamId)
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPendingInvitationResult.error) {
    throw existingPendingInvitationResult.error;
  }

  if (existingPendingInvitationResult.data) {
    throw new Error('team_invitation_already_pending');
  }

  const existingProfileResult = await supabase.rpc('profile_exists_by_email', {
    candidate_email: normalizedEmail,
  });

  if (existingProfileResult.error) {
    throw existingProfileResult.error;
  }

  if (!existingProfileResult.data) {
    throw new Error('team_invitation_email_not_found');
  }

  const existingMembersResult = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', input.teamId);

  if (existingMembersResult.error) {
    throw existingMembersResult.error;
  }

  const existingMemberIds = (
    (existingMembersResult.data ?? []) as Pick<TeamMemberRow, 'user_id'>[]
  ).map((member) => member.user_id);

  if (existingMemberIds.length > 0) {
    const existingProfilesResult = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', existingMemberIds);

    if (existingProfilesResult.error) {
      throw existingProfilesResult.error;
    }

    const isExistingMember = (
      (existingProfilesResult.data ?? []) as Pick<ProfileRow, 'id' | 'email'>[]
    ).some((profile) => normalizeEmailAddress(profile.email ?? '') === normalizedEmail);

    if (isExistingMember) {
      throw new Error('team_member_already_exists');
    }
  }

  const insertResult = await supabase
    .from('team_invitations')
    .insert({
      team_id: input.teamId,
      email: normalizedEmail,
      role: 'member',
      invited_by: input.userId,
    })
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .single();

  if (insertResult.error) {
    if (isUniqueViolation(insertResult.error)) {
      throw new Error('team_invitation_already_pending');
    }

    throw insertResult.error;
  }

  const invitation = insertResult.data as TeamInvitationRow;

  return {
    id: invitation.id,
    teamId: invitation.team_id,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invited_by,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expires_at,
    acceptedBy: invitation.accepted_by,
    acceptedAt: invitation.accepted_at,
    createdAt: invitation.created_at,
    updatedAt: invitation.updated_at,
  } satisfies TeamInvitationSummary;
}

export async function revokeTeamInvitation(input: {
  invitationId: string;
  teamId: string;
  userId: string;
}) {
  await requireTeamOwner(input.teamId, input.userId);

  const supabase = await createClient();
  const updateResult = await supabase
    .from('team_invitations')
    .update({
      status: 'revoked',
    })
    .eq('id', input.invitationId)
    .eq('team_id', input.teamId)
    .eq('status', 'pending')
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .maybeSingle();

  if (updateResult.error) {
    throw updateResult.error;
  }

  if (!updateResult.data) {
    throw new Error('team_invitation_not_found');
  }

  const invitation = updateResult.data as TeamInvitationRow;

  return {
    id: invitation.id,
    teamId: invitation.team_id,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invited_by,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expires_at,
    acceptedBy: invitation.accepted_by,
    acceptedAt: invitation.accepted_at,
    createdAt: invitation.created_at,
    updatedAt: invitation.updated_at,
  } satisfies TeamInvitationSummary;
}

export async function acceptTeamInvitation(input: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const normalizedEmail = normalizeEmailAddress(input.userEmail);

  if (!normalizedEmail) {
    throw new Error('missing_user_email');
  }

  const supabase = await createClient();
  const invitationResult = await supabase
    .from('team_invitations')
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .eq('token', input.token)
    .eq('status', 'pending')
    .maybeSingle();

  if (invitationResult.error) {
    throw invitationResult.error;
  }

  const invitation = invitationResult.data as TeamInvitationRow | null;

  if (!invitation) {
    throw new Error('team_invitation_not_found');
  }

  if (normalizeEmailAddress(invitation.email) !== normalizedEmail) {
    throw new Error('team_invitation_email_mismatch');
  }

  if (Date.parse(invitation.expires_at) <= Date.now()) {
    const expiredResult = await supabase
      .from('team_invitations')
      .update({
        status: 'expired',
      })
      .eq('id', invitation.id)
      .eq('status', 'pending');

    if (expiredResult.error) {
      throw expiredResult.error;
    }

    throw new Error('team_invitation_expired');
  }

  const existingMembershipResult = await supabase
    .from('team_members')
    .select('team_id')
    .eq('team_id', invitation.team_id)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (existingMembershipResult.error) {
    throw existingMembershipResult.error;
  }

  if (existingMembershipResult.data) {
    throw new Error('team_member_already_exists');
  }

  const acceptedAt = new Date().toISOString();
  const invitationUpdateResult = await supabase
    .from('team_invitations')
    .update({
      status: 'accepted',
      accepted_by: input.userId,
      accepted_at: acceptedAt,
    })
    .eq('id', invitation.id)
    .eq('status', 'pending')
    .select(
      'id, team_id, email, role, invited_by, token, status, expires_at, accepted_by, accepted_at, created_at, updated_at',
    )
    .maybeSingle();

  if (invitationUpdateResult.error) {
    throw invitationUpdateResult.error;
  }

  if (!invitationUpdateResult.data) {
    throw new Error('team_invitation_not_found');
  }

  const membershipInsertResult = await supabase.from('team_members').insert({
    team_id: invitation.team_id,
    user_id: input.userId,
    role: invitation.role,
  });

  if (membershipInsertResult.error) {
    throw membershipInsertResult.error;
  }

  const profileResult = await supabase
    .from('profiles')
    .select('active_team_id')
    .eq('id', input.userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (!profileResult.data?.active_team_id) {
    const profileUpdateResult = await supabase
      .from('profiles')
      .update({
        active_team_id: invitation.team_id,
      })
      .eq('id', input.userId);

    if (profileUpdateResult.error) {
      throw profileUpdateResult.error;
    }
  }

  const acceptedInvitation = invitationUpdateResult.data as TeamInvitationRow;

  return {
    id: acceptedInvitation.id,
    teamId: acceptedInvitation.team_id,
    email: acceptedInvitation.email,
    role: acceptedInvitation.role,
    invitedBy: acceptedInvitation.invited_by,
    token: acceptedInvitation.token,
    status: acceptedInvitation.status,
    expiresAt: acceptedInvitation.expires_at,
    acceptedBy: acceptedInvitation.accepted_by,
    acceptedAt: acceptedInvitation.accepted_at,
    createdAt: acceptedInvitation.created_at,
    updatedAt: acceptedInvitation.updated_at,
  } satisfies TeamInvitationSummary;
}

export async function removeTeamMember(input: {
  teamId: string;
  memberUserId: string;
  userId: string;
}) {
  await requireTeamOwner(input.teamId, input.userId);

  if (input.memberUserId === input.userId) {
    throw new Error('team_owner_self_removal_not_allowed');
  }

  const supabase = await createClient();
  const memberResult = await supabase
    .from('team_members')
    .select('team_id, user_id, role')
    .eq('team_id', input.teamId)
    .eq('user_id', input.memberUserId)
    .maybeSingle();

  if (memberResult.error) {
    throw memberResult.error;
  }

  const member = memberResult.data as Pick<TeamMemberRow, 'team_id' | 'user_id' | 'role'> | null;

  if (!member) {
    throw new Error('team_member_not_found');
  }

  if (member.role === 'owner') {
    throw new Error('team_owner_removal_not_allowed');
  }

  const deleteResult = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', input.teamId)
    .eq('user_id', input.memberUserId);

  if (deleteResult.error) {
    throw deleteResult.error;
  }

  const profileUpdateResult = await supabase
    .from('profiles')
    .update({
      active_team_id: null,
    })
    .eq('id', input.memberUserId)
    .eq('active_team_id', input.teamId);

  if (profileUpdateResult.error) {
    throw profileUpdateResult.error;
  }
}

export async function setActiveTeam(input: { teamId: string; userId: string }) {
  await requireTeamAccess(input.teamId, input.userId);

  const supabase = await createClient();
  const profileUpdateResult = await supabase
    .from('profiles')
    .update({
      active_team_id: input.teamId,
    })
    .eq('id', input.userId);

  if (profileUpdateResult.error) {
    throw profileUpdateResult.error;
  }
}
