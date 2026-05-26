import { ProfileCard } from '@/components/features/profile/profile-card';
import { routes } from '@/lib/constants/routes';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import { getUserTeams } from '@/services/team.service';
import { redirect } from 'next/navigation';

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function resolveQueryParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const appContext = await getAuthenticatedAppContext();

  if (!appContext) {
    redirect(routes.login);
  }

  const { error, success } = await searchParams;
  const teams = await getUserTeams(appContext.user.id);

  return (
    <section>
      <ProfileCard
        profile={appContext.profile}
        entitlements={appContext.entitlements}
        teams={teams}
        errorCode={resolveQueryParam(error)}
        successCode={resolveQueryParam(success)}
      />
    </section>
  );
}
