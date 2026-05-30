import Link from 'next/link';
import type { AppNotification } from '@/services/app-notification.service';

type AppNotificationCenterProps = {
  notifications: AppNotification[];
};

export function AppNotificationCenter({ notifications }: AppNotificationCenterProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <section
          key={notification.id}
          className="rounded-[1.5rem] border border-[rgba(140,214,169,0.2)] bg-[linear-gradient(135deg,rgba(140,214,169,0.12),rgba(255,255,255,0.04))] px-5 py-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.2)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[rgba(140,214,169,0.28)] bg-[rgba(140,214,169,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9efc6]">
                  Aviso
                </span>
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-white/80">
                  {notification.count}
                </span>
              </div>
              <p className="text-base font-semibold sm:text-lg">{notification.title}</p>
              <p className="text-sm text-white/72">{notification.description}</p>
            </div>

            <Link
              href={notification.href}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
            >
              {notification.ctaLabel}
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
