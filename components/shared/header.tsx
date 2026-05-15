import { AppNavigation } from '@/components/shared/app-navigation';
import { LogoutButton } from '@/components/features/auth/logout-button';

export function Header() {
  return (
    <header className="hairline-divider border-b px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker text-xs font-semibold">ApexSetup Style</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              Garage privado
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted sm:block">
              Mobile-first cockpit
            </div>
            <LogoutButton />
          </div>
        </div>
        <AppNavigation
          orientation="horizontal"
          className="rounded-[1.6rem] border border-white/8 bg-white/4 p-2 lg:hidden"
        />
      </div>
    </header>
  );
}
