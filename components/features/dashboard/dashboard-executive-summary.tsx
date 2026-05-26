import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DashboardKpi, DriverOverviewData } from '@/services/dashboard.service';

type DashboardExecutiveSummaryProps = {
  summary: DriverOverviewData['contextSummary'];
  hero: DriverOverviewData['hero'];
  items: DashboardKpi[];
};

function formatValue(value: number | null, format: DashboardKpi['format']) {
  if (value === null) {
    return 'No definido';
  }

  if (format === 'lapTime') {
    return formatLapTime(value);
  }

  if (format === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (format === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  if (format === 'count') {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

export function DashboardExecutiveSummary({
  summary,
  hero,
  items,
}: DashboardExecutiveSummaryProps) {
  const executiveItems = items.slice(0, 4);

  return (
    <article className="app-hero hero-grid rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <p className="section-kicker font-semibold">Dashboard</p>
            <h2 className="display-title mt-4 text-[2.85rem] text-white sm:text-[3.9rem]">
              {summary.headline}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              {summary.subheadline}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="accent-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
              {hero.dateRangeLabel}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
              {hero.totalSessions} sesiones activas
            </div>
            {summary.activeTrackName ? (
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                {summary.activeTrackName}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {executiveItems.map((item) => (
            <article key={item.label} className="panel-dark rounded-[1.5rem] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {formatValue(item.value, item.format)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
