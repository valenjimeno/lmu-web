import { TeamsCard } from '@/components/features/teams/teams-card';
import { routes } from '@/lib/constants/routes';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import {
  getPendingInvitationsForUser,
  getTeamInvitations,
  getTeamMembers,
  getUserTeams,
} from '@/services/team.service';
import { redirect } from 'next/navigation';

type TeamsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
    team?: string | string[];
  }>;
};

function resolveQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const appContext = await getAuthenticatedAppContext();

  if (!appContext) {
    redirect(routes.login);
  }

  const { error, success, team } = await searchParams;
  const teams = await getUserTeams(appContext.user.id);
  const incomingInvitations = await getPendingInvitationsForUser({
    userEmail: appContext.user.email ?? '',
  });
  const requestedTeamId = resolveQueryParam(team);
  const selectedTeam =
    teams.find((item) => item.id === requestedTeamId) ??
    teams.find((item) => item.id === appContext.profile?.activeTeamId) ??
    teams[0] ??
    null;

  const members = selectedTeam
    ? await getTeamMembers({
        teamId: selectedTeam.id,
        userId: appContext.user.id,
      })
    : [];

  const invitations =
    selectedTeam?.role === 'owner'
      ? await getTeamInvitations({
          teamId: selectedTeam.id,
          userId: appContext.user.id,
        })
      : [];

  return (
    <section>
      <TeamsCard
        entitlements={appContext.entitlements}
        teams={teams}
        selectedTeam={selectedTeam}
        activeTeamId={appContext.profile?.activeTeamId ?? null}
        members={members}
        invitations={invitations}
        incomingInvitations={incomingInvitations}
        errorCode={resolveQueryParam(error)}
        successCode={resolveQueryParam(success)}
      />
    </section>
  );
}
