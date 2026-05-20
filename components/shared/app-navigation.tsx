'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appNavigationItems } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

type AppNavigationProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export function AppNavigation({ orientation = 'vertical', className }: AppNavigationProps) {
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

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition duration-200',
              isHorizontal ? 'shrink-0' : 'block',
              isActive
                ? 'border border-[rgba(225,178,122,0.24)] bg-[linear-gradient(135deg,rgba(225,178,122,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_14px_28px_rgba(0,0,0,0.26)]'
                : 'border border-transparent bg-transparent text-muted hover:border-white/8 hover:bg-white/[0.05] hover:text-foreground',
            )}
          >
            <NavIcon type={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ type }: { type: 'speed' | 'compare' | 'profile' | 'sessions' }) {
  const className = 'h-[18px] w-[18px] shrink-0';

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
