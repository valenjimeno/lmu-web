import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DashboardKpi } from '@/services/dashboard.service';

type KpiGridProps = {
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

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
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
  );
}
