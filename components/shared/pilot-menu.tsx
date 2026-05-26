'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogoutButton } from '@/components/features/auth/logout-button';
import { routes } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

type PilotMenuProps = {
  pilotName: string;
  className?: string;
  align?: 'left' | 'right';
  side?: 'top' | 'bottom';
};

export function PilotMenu({
  pilotName,
  className,
  align = 'right',
  side = 'bottom',
}: PilotMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-[rgba(225,178,122,0.24)] hover:bg-[rgba(225,178,122,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(241,196,135,0.28)]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.12)] text-xs font-semibold uppercase tracking-[0.12em] text-[#f0cca0]">
          {getPilotInitials(pilotName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Piloto
          </p>
          <p className="truncate text-sm font-semibold text-white">{pilotName}</p>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cn('h-4 w-4 shrink-0 text-white/55 transition', isOpen ? 'rotate-180' : '')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute z-30 w-56 rounded-[1.1rem] border border-white/10 bg-[rgba(10,12,17,0.98)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl',
            align === 'right' ? 'right-0' : 'left-0',
            side === 'bottom' ? 'top-[calc(100%+0.65rem)]' : 'bottom-[calc(100%+0.65rem)]',
          )}
          role="menu"
          aria-label="Menú del piloto"
        >
          <Link
            href={routes.profile}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-[0.95rem] px-3 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.05] hover:text-white"
            role="menuitem"
          >
            <MenuIcon type="profile" />
            Perfil
          </Link>
          <div className="mt-1">
            <LogoutButton
              className="w-full justify-start rounded-[0.95rem] px-3 py-3 text-sm font-medium text-white/82 hover:bg-white/[0.05] hover:text-white"
              fullWidth
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getPilotInitials(pilotName: string) {
  const normalizedName = pilotName.trim();

  if (!normalizedName) {
    return 'P';
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function MenuIcon({ type }: { type: 'profile' }) {
  if (type === 'profile') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
        <path d="M5.5 19.25a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  return null;
}
