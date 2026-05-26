import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DriverOverviewData } from '@/services/dashboard.service';

type DashboardComparePanelProps = {
  carFit: DriverOverviewData['carFit'];
};

function formatValue(value: number | null, kind: 'lapTime' | 'position' | 'decimal') {
  if (value === null) {
    return 'No definido';
  }

  if (kind === 'lapTime') {
    return formatLapTime(value);
  }

  if (kind === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

function formatDelta(
  primary: number | null,
  secondary: number | null,
  kind: 'lapTime' | 'position' | 'decimal',
  betterWhenLower: boolean,
) {
  if (primary === null || secondary === null) {
    return 'Sin base suficiente';
  }

  const delta = primary - secondary;
  const comparison = betterWhenLower ? -delta : delta;

  if (kind === 'lapTime') {
    return `${comparison >= 0 ? '+' : ''}${(comparison / 1000).toFixed(2)} s`;
  }

  return `${comparison >= 0 ? '+' : ''}${comparison.toFixed(1)}`;
}

export function DashboardComparePanel({ carFit }: DashboardComparePanelProps) {
  const [first, second] = carFit.ranking;

  if (!carFit.active) {
    return (
      <article className="app-shell-card rounded-[1.8rem] p-6">
        <p className="section-kicker font-semibold">Comparar</p>
        <h3 className="editorial-title mt-3 text-2xl text-white">
          Elige un circuito para contrastar
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Este modo está pensado para poner dos coches frente a frente dentro del mismo contexto y
          ver dónde gana cada uno.
        </p>
      </article>
    );
  }

  if (!first || !second) {
    return (
      <article className="app-shell-card rounded-[1.8rem] p-6">
        <p className="section-kicker font-semibold">Comparar</p>
        <h3 className="editorial-title mt-3 text-2xl text-white">
          Falta un segundo coche para comparar en {carFit.trackLabel}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Necesitas al menos dos coches con muestra suficiente en este circuito para activar una
          comparativa útil.
        </p>
      </article>
    );
  }

  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Comparar</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">
            {first.carName} vs {second.carName}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Vista de deltas dentro de {carFit.trackLabel}. Aquí importa menos el número absoluto y
            más dónde gana cada coche.
          </p>
        </div>
        <p className="text-sm text-muted">Top 2 del contexto activo</p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Referencia A
            </p>
            <p className="mt-3 text-xl font-semibold text-white">{first.carName}</p>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p>
                1 vuelta:{' '}
                <span className="text-white">
                  {formatValue(first.representativeBestLapMs, 'lapTime')}
                </span>
              </p>
              <p>
                5 vueltas:{' '}
                <span className="text-white">
                  {formatValue(first.representativeBestFiveLapAverageMs, 'lapTime')}
                </span>
              </p>
              <p>
                Consistencia:{' '}
                <span className="text-white">{formatValue(first.lapConsistencyMs, 'lapTime')}</span>
              </p>
              <p>
                Racecraft:{' '}
                <span className="text-white">
                  {formatValue(first.averagePositionGain, 'position')}
                </span>
              </p>
            </div>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Referencia B
            </p>
            <p className="mt-3 text-xl font-semibold text-white">{second.carName}</p>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p>
                1 vuelta:{' '}
                <span className="text-white">
                  {formatValue(second.representativeBestLapMs, 'lapTime')}
                </span>
              </p>
              <p>
                5 vueltas:{' '}
                <span className="text-white">
                  {formatValue(second.representativeBestFiveLapAverageMs, 'lapTime')}
                </span>
              </p>
              <p>
                Consistencia:{' '}
                <span className="text-white">
                  {formatValue(second.lapConsistencyMs, 'lapTime')}
                </span>
              </p>
              <p>
                Racecraft:{' '}
                <span className="text-white">
                  {formatValue(second.averagePositionGain, 'position')}
                </span>
              </p>
            </div>
          </article>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta 1 vuelta
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(
                first.representativeBestLapMs,
                second.representativeBestLapMs,
                'lapTime',
                true,
              )}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Techo puro a una vuelta.</p>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta 5 vueltas
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(
                first.representativeBestFiveLapAverageMs,
                second.representativeBestFiveLapAverageMs,
                'lapTime',
                true,
              )}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Stint corto y ritmo utilizable.</p>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta consistencia
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(first.lapConsistencyMs, second.lapConsistencyMs, 'lapTime', true)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Qué coche repite mejor la tanda.</p>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta racecraft
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(
                first.averagePositionGain,
                second.averagePositionGain,
                'position',
                false,
              )}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Conversión en carrera y tráfico.</p>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta incidentes
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(first.averageIncidents, second.averageIncidents, 'decimal', true)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Coste de errores al ir al límite.</p>
          </article>

          <article className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Delta equilibrio
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#f0cca0]">
              {formatDelta(first.fitScore, second.fitScore, 'decimal', false)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">Lectura compuesta del contexto.</p>
          </article>
        </div>
      </div>
    </article>
  );
}
