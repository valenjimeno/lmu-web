'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AppNavigation } from '@/components/shared/app-navigation';
import { PilotMenu } from '@/components/shared/pilot-menu';
import { routes } from '@/lib/constants/routes';
import { appNavigationItems } from '@/lib/constants/routes';
import type { AppNavigationBadgeMap } from '@/services/app-notification.service';

type HeaderProps = {
  pilotName: string;
  navigationBadges?: AppNavigationBadgeMap;
};

export function Header({ pilotName, navigationBadges }: HeaderProps) {
  const pathname = usePathname();
  const title = useMemo(() => {
    const matchedItem = appNavigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

    if (pathname === routes.dashboard || pathname.startsWith(`${routes.dashboard}/`)) {
      return 'Dashboard';
    }

    if (pathname === routes.profile || pathname.startsWith(`${routes.profile}/`)) {
      return 'Perfil';
    }

    if (pathname === routes.teams || pathname.startsWith(`${routes.teams}/`)) {
      return 'Equipos';
    }

    return matchedItem?.title ?? 'LMU Web';
  }, [pathname]);

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
            <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          </div>
          <PilotMenu pilotName={pilotName} className="max-w-[15rem] lg:hidden" />
        </div>

        <AppNavigation
          orientation="horizontal"
          badges={navigationBadges}
          className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-2 lg:hidden"
        />
      </div>
    </header>
  );
}
