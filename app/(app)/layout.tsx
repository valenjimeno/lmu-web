import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { AppNavigation } from '@/components/shared/app-navigation';
import { Sidebar } from '@/components/shared/sidebar';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';

export default async function AppLayout({
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
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 pb-28 lg:flex-row lg:gap-6 lg:px-6 lg:pb-6">
        <Sidebar />
        <div className="app-shell-card flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[1.75rem] lg:rounded-[2rem]">
          <Header />
          <div className="flex-1 p-4 pb-36 sm:p-6 sm:pb-40 md:p-8 lg:pb-8">{children}</div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden">
        <div className="app-shell-card mx-auto max-w-xl rounded-[1.8rem] p-2">
          <AppNavigation orientation="horizontal" />
        </div>
      </div>
    </div>
  );
}
