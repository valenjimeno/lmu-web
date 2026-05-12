import { AppNavigation } from '@/components/shared/app-navigation';
import { LogoutButton } from '@/components/features/auth/logout-button';

export function Header() {
  return (
    <header className="border-b border-border px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">LMU Web</p>
            <h1 className="text-lg font-semibold tracking-tight">Workspace privado</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border bg-surface-strong px-4 py-2 text-sm text-muted sm:block">
              Mobile first
            </div>
            <LogoutButton />
          </div>
        </div>
        <AppNavigation orientation="horizontal" className="lg:hidden" />
      </div>
    </header>
  );
}
