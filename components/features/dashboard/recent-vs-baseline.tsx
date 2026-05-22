import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DriverOverviewData } from '@/services/dashboard.service';

type RecentVsBaselineProps = {
  data: DriverOverviewData['recentVsBaseline'];
};

function formatValue(
  value: number | null,
  format: 'count' | 'lapTime' | 'position' | 'percent' | 'decimal',
) {
  if (value === null) {
    return 'No definido';
  }

  if (format === 'lapTime') {
    return formatLapTime(value);
  }

  if (format === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (format === 'count') {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
  }

  if (format === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return value.toFixed(1);
}

function formatDelta(
  value: number | null,
  format: 'count' | 'lapTime' | 'position' | 'percent' | 'decimal',
) {
  if (value === null) {
    return 'Sin base suficiente';
  }

  if (format === 'lapTime') {
    return `${value > 0 ? '+' : ''}${(value / 1000).toFixed(2)} s`;
  }

  if (format === 'percent') {
    return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)} pts`;
  }

  if (format === 'count') {
    return `${value > 0 ? '+' : ''}${value.toFixed(0)}`;
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

const directionClasses = {
  better: 'text-[#8fc5a4]',
  worse: 'text-[#f2a294]',
  neutral: 'text-muted-strong',
} as const;

export function RecentVsBaseline({ data }: RecentVsBaselineProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Recent vs Baseline</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Lo último frente a tu media</h3>
        </div>
        <p className="text-sm text-muted">
          Últimas {data.recentWindowSize} sesiones vs base de {data.baselineWindowSize}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <article key={metric.key} className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {metric.label}
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-lg font-semibold text-white">
                {formatValue(metric.recentValue, metric.format)}
              </p>
              <p className="text-xs text-muted">
                Base: {formatValue(metric.baselineValue, metric.format)}
              </p>
              <p className={`text-sm font-semibold ${directionClasses[metric.direction]}`}>
                {formatDelta(metric.delta, metric.format)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
