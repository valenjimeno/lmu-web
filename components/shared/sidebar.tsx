import Link from 'next/link';
import { routes } from '@/lib/constants/routes';

const mainItems = [{ label: 'Setups', href: routes.setups, active: true }];

export function Sidebar() {
  return (
    <aside className="panel-dark hidden w-[10.5rem] shrink-0 overflow-hidden rounded-[1.35rem] lg:flex lg:flex-col">
      <div className="flex h-full flex-col">
        <div className="hairline-divider border-b px-4 py-4">
          <div className="logo-stack text-[1.7rem] text-white">
            <div>LMU</div>
            <div className="text-[1.15rem]">WEB</div>
          </div>
        </div>

        <div className="hairline-divider border-b px-3 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Principal
          </p>
          <nav className="mt-3 space-y-1">
            {mainItems.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md bg-[rgba(225,178,122,0.14)] px-3 py-3 text-sm font-medium text-white"
                >
                  <span className="h-2 w-2 rounded-full bg-[#e1b27a]" />
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-white/70"
                >
                  <span className="h-2 w-2 rounded-full border border-white/30" />
                  {item.label}
                </div>
              ),
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
