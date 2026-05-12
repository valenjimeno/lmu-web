import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 md:px-6">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-border bg-surface">
          <Header />
          <div className="flex-1 p-6 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
