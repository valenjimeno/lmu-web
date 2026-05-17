import { LogoutButton } from '@/components/features/auth/logout-button';
import { AppNavigation } from '@/components/shared/app-navigation';

export function Header() {
  return (
    <header className="hairline-divider border-b px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="lg:hidden">
          <div className="logo-stack text-[1.1rem] text-white">
            <div>LMU</div>
            <div className="text-[0.75rem]">WEB</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Setups</h1>
          </div>
          <LogoutButton className="h-9 min-h-0 rounded-full border border-white/8 bg-white/[0.03] px-4 py-0 text-[11px] font-medium text-white/65 hover:border-[rgba(225,178,122,0.24)] hover:bg-[rgba(225,178,122,0.08)] hover:text-[#e1b27a]" />
        </div>

        <AppNavigation
          orientation="horizontal"
          className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-2 lg:hidden"
        />
      </div>
    </header>
  );
}
