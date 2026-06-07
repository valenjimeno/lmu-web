'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { appNavigationItems } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { AppNavigationBadgeMap } from '@/services/app-notification.service';

type AppNavigationProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  badges?: AppNavigationBadgeMap;
};

export function AppNavigation({ orientation = 'vertical', className, badges }: AppNavigationProps) {
  const pathname = usePathname();
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      className={cn(
        isHorizontal
          ? 'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'space-y-2',
        className,
      )}
      aria-label="Navegacion privada"
    >
      {appNavigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badgeCount = badges?.[item.icon] ?? 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition duration-200',
              isHorizontal ? 'shrink-0' : 'w-full',
              isActive
                ? 'border border-[rgba(225,178,122,0.24)] bg-[linear-gradient(135deg,rgba(225,178,122,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_14px_28px_rgba(0,0,0,0.26)]'
                : 'border border-transparent bg-transparent text-muted hover:border-white/8 hover:bg-white/[0.05] hover:text-foreground',
            )}
          >
            <NavPendingWash />
            <NavIcon type={item.icon} />
            <span>{item.label}</span>
            {badgeCount > 0 ? (
              <span
                className={cn(
                  'ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-[11px] font-bold leading-none',
                  isActive
                    ? 'bg-white/14 text-white'
                    : 'border border-[rgba(140,214,169,0.24)] bg-[rgba(140,214,169,0.12)] text-[#b9efc6]',
                )}
                aria-label={`${badgeCount} invitaciones pendientes`}
              >
                {badgeCount}
              </span>
            ) : null}
            <NavPendingHint />
          </Link>
        );
      })}
    </nav>
  );
}

function NavPendingWash() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200',
        pending ? 'opacity-100' : 'opacity-0',
      )}
    >
      <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(225,178,122,0.12),transparent)] motion-safe:animate-[nav-wash_1.1s_ease-in-out_infinite]" />
    </span>
  );
}

function NavPendingHint() {
  const { pending } = useLinkStatus();

  return (
    <span aria-hidden="true" className="ml-auto flex h-5 w-7 shrink-0 items-center justify-end">
      <span
        className={cn(
          'h-[3px] w-5 rounded-full bg-current/20 opacity-0 transition-all duration-200',
          pending ? 'opacity-100' : 'translate-x-1',
        )}
      >
        <span
          className={cn(
            'block h-full w-2 rounded-full bg-current/80 motion-safe:animate-[nav-pulse_0.9s_ease-in-out_infinite]',
            pending ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
    </span>
  );
}

function NavIcon({
  type,
}: {
  type: 'dashboard' | 'speed' | 'compare' | 'profile' | 'sessions' | 'teams';
}) {
  const className = 'h-[18px] w-[18px] shrink-0';

  if (type === 'dashboard') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.75 12.25h5.5v7h-5.5z" />
        <path d="M13.75 4.75h5.5v14.5h-5.5z" />
        <path d="M4.75 4.75h5.5v4h-5.5z" />
        <path d="M13.75 12.25h5.5v7h-5.5z" />
      </svg>
    );
  }

  if (type === 'speed') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M4 15a8 8 0 1 1 16 0" />
        <path d="M12 12l4.5-4.5" />
        <path d="M7 18h10" />
      </svg>
    );
  }

  if (type === 'compare') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 5v14" />
        <path d="M16 5v14" />
        <path d="M5 8h6" />
        <path d="M13 16h6" />
        <path d="M5 12h4" />
        <path d="M15 12h4" />
      </svg>
    );
  }

  if (type === 'sessions') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3.75v2.5" />
        <path d="M16 3.75v2.5" />
        <path d="M4.75 8.25h14.5" />
        <rect x="4.75" y="5.75" width="14.5" height="13.5" rx="2.5" />
        <path d="M8.5 12h3" />
        <path d="M8.5 16h7" />
      </svg>
    );
  }

  if (type === 'teams') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" />
        <path d="M17 9.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
        <path d="M4.75 18.25a4.25 4.25 0 0 1 8.5 0" />
        <path d="M13.5 18.25a3.5 3.5 0 0 1 7 0" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3.75v3" strokeLinecap="round" />
      <path d="M12 17.25v3" strokeLinecap="round" />
      <path d="M5.64 6.14l2.12 2.12" strokeLinecap="round" />
      <path d="M16.24 16.74l2.12 2.12" strokeLinecap="round" />
      <path d="M3.75 12h3" strokeLinecap="round" />
      <path d="M17.25 12h3" strokeLinecap="round" />
      <path d="M5.64 17.86l2.12-2.12" strokeLinecap="round" />
      <path d="M16.24 7.26l2.12-2.12" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}
