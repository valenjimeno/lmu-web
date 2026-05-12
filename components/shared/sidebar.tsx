import { AppNavigation } from '@/components/shared/app-navigation';

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-border bg-surface px-5 py-6 lg:block">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Base App</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">LMU Web</h2>
      </div>
      <AppNavigation />
    </aside>
  );
}
