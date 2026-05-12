import Link from 'next/link';
import { routes } from '@/lib/constants/routes';

const items = [
  { href: routes.dashboard, label: 'Dashboard' },
  { href: routes.settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-border bg-surface px-5 py-6 md:block">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Base App</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">LMU Web</h2>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
