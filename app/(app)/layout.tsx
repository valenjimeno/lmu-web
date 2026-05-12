import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/header';
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
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6 lg:px-6">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[1.75rem] border border-border bg-surface lg:rounded-[2rem]">
          <Header />
          <div className="flex-1 p-4 sm:p-6 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
