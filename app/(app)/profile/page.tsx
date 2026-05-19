import { ProfileCard } from '@/components/features/profile/profile-card';
import { getCurrentUser } from '@/lib/supabase/auth';
import { routes } from '@/lib/constants/routes';
import { getProfilePageData } from '@/services/profile.service';
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
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const [{ error, success }, { profile }] = await Promise.all([
    searchParams,
    getProfilePageData(user.id),
  ]);

  return (
    <section>
      <ProfileCard
        profile={profile}
        errorCode={resolveQueryParam(error)}
        successCode={resolveQueryParam(success)}
      />
    </section>
  );
}
