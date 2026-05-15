import { AppNavigation } from '@/components/shared/app-navigation';

export function Sidebar() {
  return (
    <aside className="app-shell-card hidden w-72 shrink-0 rounded-[2rem] px-5 py-6 lg:block">
      <div className="mb-8 rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
        <p className="section-kicker text-xs font-semibold">Race Control</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">LMU Web</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Biblioteca de setups con una presencia más cercana a una app nativa de paddock.
        </p>
      </div>
      <AppNavigation />
    </aside>
  );
}
