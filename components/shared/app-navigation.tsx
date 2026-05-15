'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

const items = [
  { href: routes.dashboard, label: 'Garage', icon: 'grid' },
  { href: routes.setups, label: 'Setups', icon: 'speed' },
  { href: routes.settings, label: 'Perfil', icon: 'user' },
] as const;

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
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-[1.4rem] px-4 py-3 text-sm font-semibold transition duration-200',
              isHorizontal ? 'shrink-0' : 'block',
              isActive
                ? 'border border-white/10 bg-[var(--gradient-accent)] text-accent-foreground shadow-[0_14px_28px_rgba(255,100,31,0.28)]'
                : 'border border-transparent bg-white/4 text-muted hover:border-white/8 hover:bg-white/7 hover:text-foreground',
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

function NavIcon({ type }: { type: 'grid' | 'speed' | 'user' }) {
  const className = 'h-[18px] w-[18px] shrink-0';

  if (type === 'grid') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
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

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  );
}
