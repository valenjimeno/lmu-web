'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appNavigationItems } from '@/lib/constants/routes';
import { PilotMenu } from '@/components/shared/pilot-menu';
import { cn } from '@/lib/utils/cn';

type SidebarProps = {
  pilotName: string;
};

export function Sidebar({ pilotName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="panel-dark hidden w-[14rem] shrink-0 overflow-hidden rounded-[1.35rem] lg:flex lg:h-full lg:flex-col lg:self-stretch">
      <div className="flex h-full min-h-0 flex-col">
        <div className="hairline-divider border-b px-4 py-4">
          <div className="logo-stack text-[1.7rem] text-white">
            <div>LMU</div>
            <div className="text-[1.15rem]">WEB</div>
          </div>
        </div>

        <div className="hairline-divider flex-1 overflow-y-auto border-b px-3 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Principal
          </p>
          <nav className="mt-3 space-y-1">
            {appNavigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-[rgba(225,178,122,0.14)] text-white'
                      : 'text-white/70 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full border',
                      isActive ? 'border-[#e1b27a] bg-[#e1b27a]' : 'border-white/30 bg-transparent',
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/8 bg-[rgba(8,10,14,0.92)] px-3 py-4 backdrop-blur-xl">
          <PilotMenu pilotName={pilotName} className="w-full" align="right" side="top" />
        </div>
      </div>
    </aside>
  );
}
