import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CompleteProfileModal } from '@/components/features/profile/complete-profile-modal';
import { AppNotificationCenter } from '@/components/shared/app-notification-center';
import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { routes } from '@/lib/constants/routes';
import { getAppNotifications } from '@/services/app-notification.service';
import { getAuthenticatedAppContext } from '@/services/profile.service';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </Suspense>
  );
}

async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appContext = await getAuthenticatedAppContext();

  if (!appContext) {
    redirect(routes.login);
  }

  const pilotName =
    [appContext.profile?.firstName?.trim(), appContext.profile?.lastName?.trim()]
      .filter(Boolean)
      .join(' ') ||
    appContext.preferredDriverName?.trim() ||
    appContext.profile?.nickname?.trim() ||
    appContext.user.email?.split('@')[0] ||
    'Piloto';
  const appNotifications = await getAppNotifications({
    userEmail: appContext.user.email,
  });

  return (
    <div className="min-h-screen bg-transparent lg:p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 px-4 py-4 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-row lg:gap-5 lg:px-0 lg:py-0">
        <Sidebar pilotName={pilotName} navigationBadges={appNotifications.navigationBadges} />
        <div className="app-panel-strong flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[1.75rem] lg:h-full lg:min-h-0 lg:rounded-[2rem]">
          <Header pilotName={pilotName} navigationBadges={appNotifications.navigationBadges} />
          <div className="flex-1 p-4 pb-7 sm:p-6 md:p-7 lg:min-h-0 lg:overflow-y-auto lg:pb-7">
            <AppNotificationCenter notifications={appNotifications.items} />
            <div className={appNotifications.items.length > 0 ? 'mt-5' : ''}>{children}</div>
          </div>
        </div>
      </div>
      {appContext.profileCompletion.isComplete ? null : (
        <CompleteProfileModal profile={appContext.profileCompletion.profile} />
      )}
    </div>
  );
}

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-transparent lg:p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 px-4 py-4 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-row lg:gap-5 lg:px-0 lg:py-0">
        <div className="panel-dark hidden min-h-[calc(100vh-2rem)] w-full max-w-[17rem] animate-pulse rounded-[1.75rem] bg-white/[0.04] lg:block" />
        <div className="app-panel-strong flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[1.75rem] lg:h-full lg:min-h-0 lg:rounded-[2rem]">
          <div className="border-b border-white/8 px-4 py-4 sm:px-6 md:px-7">
            <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="flex-1 p-4 pb-7 sm:p-6 md:p-7 lg:min-h-0 lg:overflow-y-auto lg:pb-7">
            <div className="h-full min-h-64 animate-pulse rounded-[1.5rem] bg-white/[0.035]" />
          </div>
        </div>
      </div>
    </div>
  );
}
