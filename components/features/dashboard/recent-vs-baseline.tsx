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

const directionSurfaceClasses = {
  better:
    'border-[rgba(143,197,164,0.18)] bg-[linear-gradient(180deg,rgba(143,197,164,0.1),rgba(255,255,255,0.02))]',
  worse:
    'border-[rgba(242,162,148,0.18)] bg-[linear-gradient(180deg,rgba(242,162,148,0.08),rgba(255,255,255,0.02))]',
  neutral:
    'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]',
} as const;

export function RecentVsBaseline({ data }: RecentVsBaselineProps) {
  return (
    <article className="app-shell-card overflow-hidden rounded-[1.8rem] p-6">
      <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <p className="section-kicker font-semibold">Recent vs Baseline</p>
          <div className="max-w-xl">
            <h3 className="editorial-title text-2xl text-white">Lo último frente a tu media</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Contrasta tu muestra más reciente con la base histórica del mismo contexto para ver si
              el progreso viene por ritmo, estabilidad o ejecución.
            </p>
          </div>
          <div className="grid min-w-[16rem] gap-2 sm:grid-cols-2 lg:min-w-[19rem]">
            <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Muestra reciente
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {data.recentWindowSize} sesiones
              </p>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Base activa
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {data.baselineWindowSize} sesiones
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <article
            key={metric.key}
            className={`rounded-[1.45rem] border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.14)] ${directionSurfaceClasses[metric.direction]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="max-w-[11rem] text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                {metric.label}
              </p>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${directionClasses[metric.direction]} border-current/15 bg-black/10`}
              >
                {metric.direction === 'better'
                  ? 'Mejor'
                  : metric.direction === 'worse'
                    ? 'Peor'
                    : 'Estable'}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Reciente
              </p>
              <p className="mt-2 text-[1.9rem] leading-none font-semibold text-white">
                {formatValue(metric.recentValue, metric.format)}
              </p>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Base
                </p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {formatValue(metric.baselineValue, metric.format)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Delta
                </p>
                <p className={`mt-1 text-base font-semibold ${directionClasses[metric.direction]}`}>
                  {formatDelta(metric.delta, metric.format)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
