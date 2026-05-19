import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';

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
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-5 lg:px-5 lg:pb-6">
        <Sidebar />
        <div className="app-panel-strong flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[1.75rem] lg:rounded-[2rem]">
          <Header />
          <div className="flex-1 p-4 pb-7 sm:p-6 md:p-7 lg:pb-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-5 lg:px-5 lg:pb-6">
        <div className="panel-dark hidden min-h-[calc(100vh-2rem)] w-full max-w-[17rem] animate-pulse rounded-[1.75rem] bg-white/[0.04] lg:block" />
        <div className="app-panel-strong flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="border-b border-white/8 px-4 py-4 sm:px-6 md:px-7">
            <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="flex-1 p-4 pb-7 sm:p-6 md:p-7 lg:pb-7">
            <div className="h-full min-h-64 animate-pulse rounded-[1.5rem] bg-white/[0.035]" />
          </div>
        </div>
      </div>
    </div>
  );
}
