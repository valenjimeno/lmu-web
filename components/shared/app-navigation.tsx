'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

const items = [
  { href: routes.dashboard, label: 'Resumen' },
  { href: routes.setups, label: 'Setups' },
  { href: routes.settings, label: 'Perfil' },
];

type AppNavigationProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export function AppNavigation({ orientation = 'vertical', className }: AppNavigationProps) {
  const pathname = usePathname();
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      className={cn(isHorizontal ? 'flex gap-2 overflow-x-auto pb-1' : 'space-y-2', className)}
      aria-label="Navegacion privada"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
              isHorizontal ? 'shrink-0' : 'block',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted hover:bg-surface-strong hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
