import Link from 'next/link';
import { formatDate, formatLapTime } from '@/lib/utils/setup-formatters';
import { cn } from '@/lib/utils/cn';
import type {
  DashboardTrendMetric,
  DashboardTrendRange,
  DriverOverviewData,
} from '@/services/dashboard.service';

type PerformanceTrendChartProps = {
  trends: DriverOverviewData['trends'];
  metric: DashboardTrendMetric;
  range: DashboardTrendRange;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

const metricOptions: Array<{ key: DashboardTrendMetric; label: string }> = [
  { key: 'bestLapMs', label: 'Mejor vuelta' },
  { key: 'averageLapMs', label: 'Ritmo medio' },
  { key: 'lapConsistencyMs', label: 'Consistencia' },
  { key: 'finishPos', label: 'Posición final' },
  { key: 'positionGain', label: 'Posiciones ganadas' },
  { key: 'validLapRate', label: 'Vueltas válidas' },
  { key: 'incidentsCount', label: 'Incidentes' },
];

const rangeOptions: Array<{ key: DashboardTrendRange; label: string }> = [
  { key: '10', label: '10' },
  { key: '30', label: '30' },
  { key: 'all', label: 'Todo' },
];

function buildHref(
  basePath: string,
  currentSearchParams: Record<string, string | undefined>,
  updates: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentSearchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

function selectSeries(
  trends: DriverOverviewData['trends'],
  metric: DashboardTrendMetric,
  range: DashboardTrendRange,
) {
  const limit = range === '10' ? 10 : range === '30' ? 30 : trends.length;
  const subset = trends.slice(0, limit).reverse();

  return subset.map((trend) => {
    switch (metric) {
      case 'bestLapMs':
        return { ...trend, value: trend.bestLapMs, format: 'lapTime' as const };
      case 'averageLapMs':
        return { ...trend, value: trend.averageLapMs, format: 'lapTime' as const };
      case 'lapConsistencyMs':
        return { ...trend, value: trend.lapConsistencyMs, format: 'lapTime' as const };
      case 'finishPos':
        return { ...trend, value: trend.finishPos, format: 'position' as const };
      case 'positionGain':
        return { ...trend, value: trend.positionGain, format: 'position' as const };
      case 'validLapRate':
        return { ...trend, value: trend.validLapRate, format: 'percent' as const };
      case 'incidentsCount':
        return { ...trend, value: trend.incidentsCount, format: 'decimal' as const };
    }
  });
}

function formatTooltipValue(
  value: number | null,
  format: 'lapTime' | 'position' | 'percent' | 'decimal',
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

  if (format === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return value.toFixed(1);
}

function buildPath(values: number[]) {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export function PerformanceTrendChart({
  trends,
  metric,
  range,
  basePath,
  searchParams,
}: PerformanceTrendChartProps) {
  const series = selectSeries(trends, metric, range);
  const definedValues = series
    .map((point) => point.value)
    .filter((value): value is number => typeof value === 'number');
  const path = buildPath(definedValues);
  const min = definedValues.length > 0 ? Math.min(...definedValues) : null;
  const max = definedValues.length > 0 ? Math.max(...definedValues) : null;
  const chartPoints =
    min !== null && max !== null
      ? series
          .filter(
            (point): point is (typeof series)[number] & { value: number } => point.value !== null,
          )
          .map((point, index) => {
            const valueSpan = max - min || 1;

            return {
              sessionId: point.sessionId,
              x: (index / Math.max(definedValues.length - 1, 1)) * 100,
              y: 100 - ((point.value - min) / valueSpan) * 100,
            };
          })
      : [];

  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Trendline</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Progresión sesión a sesión</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Mira si tu mejora viene por ritmo puro, por control del stint o por mejor ejecución en
            carrera.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2">
            {metricOptions.map((option) => (
              <Link
                key={option.key}
                href={buildHref(basePath, searchParams, { metric: option.key })}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                  option.key === metric
                    ? 'border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] text-[#f0cca0]'
                    : 'border-white/8 bg-white/[0.03] text-muted hover:text-white',
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-2">
            {rangeOptions.map((option) => (
              <Link
                key={option.key}
                href={buildHref(basePath, searchParams, { range: option.key })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition',
                  option.key === range
                    ? 'border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] text-[#f0cca0]'
                    : 'border-white/8 bg-white/[0.03] text-muted hover:text-white',
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="panel-dark rounded-[1.5rem] p-4">
          {definedValues.length > 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
                <span>Ventana activa</span>
                <span>{series.length} sesiones</span>
              </div>

              <div className="relative overflow-hidden rounded-[1.2rem] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                <svg viewBox="0 0 100 100" className="h-64 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dashboardTrendStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e1b27a" />
                      <stop offset="100%" stopColor="#8fc5a4" />
                    </linearGradient>
                  </defs>
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#dashboardTrendStroke)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                  />
                  {chartPoints.map((point) => (
                    <circle
                      key={point.sessionId}
                      cx={point.x}
                      cy={point.y}
                      r="2.4"
                      fill="#f7d6ae"
                      stroke="rgba(5, 6, 8, 0.8)"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-[1.2rem] border border-dashed border-white/10 text-sm text-muted">
              Necesitas al menos dos sesiones dentro del filtro para trazar una tendencia.
            </div>
          )}
        </div>

        <div className="panel-dark rounded-[1.5rem] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
            <span>Últimas sesiones</span>
            <span>
              {min !== null && max !== null
                ? `${formatTooltipValue(min, series[0]?.format ?? 'decimal')} - ${formatTooltipValue(max, series[0]?.format ?? 'decimal')}`
                : 'Sin rango'}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {series
              .slice()
              .reverse()
              .slice(0, 6)
              .map((point) => (
                <article
                  key={point.sessionId}
                  className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{point.trackName}</p>
                      <p className="mt-1 text-xs text-muted">{point.carName}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#f0cca0]">
                      {formatTooltipValue(point.value, point.format)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted">{formatDate(point.sessionDate)}</p>
                </article>
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}
