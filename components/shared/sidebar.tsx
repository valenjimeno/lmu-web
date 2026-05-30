'use client';

import { AppNavigation } from '@/components/shared/app-navigation';
import { PilotMenu } from '@/components/shared/pilot-menu';
import type { AppNavigationBadgeMap } from '@/services/app-notification.service';

type SidebarProps = {
  pilotName: string;
  navigationBadges?: AppNavigationBadgeMap;
};

export function Sidebar({ pilotName, navigationBadges }: SidebarProps) {
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
          <AppNavigation
            orientation="vertical"
            badges={navigationBadges}
            className="mt-3 space-y-1"
          />
        </div>

        <div className="mt-auto border-t border-white/8 bg-[rgba(8,10,14,0.92)] px-3 py-4 backdrop-blur-xl">
          <PilotMenu pilotName={pilotName} className="w-full" align="right" side="top" />
        </div>
      </div>
    </aside>
  );
}
