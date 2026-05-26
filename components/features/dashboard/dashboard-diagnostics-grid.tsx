import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DriverOverviewData } from '@/services/dashboard.service';

type DashboardDiagnosticsGridProps = {
  diagnostics: DriverOverviewData['contextDiagnostics'];
};

function formatValue(value: number | null, kind: 'lapTime' | 'position' | 'percent' | 'decimal') {
  if (value === null) {
    return 'No definido';
  }

  if (kind === 'lapTime') {
    return formatLapTime(value);
  }

  if (kind === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (kind === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
}

function DiagnosticCard({
  title,
  body,
  rows,
}: {
  title: string;
  body: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="app-shell-card rounded-[1.6rem] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="panel-dark rounded-[1.2rem] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {row.label}
            </p>
            <p className="mt-2 text-base font-semibold text-white">{row.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function DashboardDiagnosticsGrid({ diagnostics }: DashboardDiagnosticsGridProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <DiagnosticCard
        title="Pace"
        body="Mide si el tiempo está en el coche o en la ejecución de vuelta."
        rows={[
          { label: 'Best lap', value: formatValue(diagnostics.pace.bestLapMs, 'lapTime') },
          { label: 'Optimal lap', value: formatValue(diagnostics.pace.optimalLapMs, 'lapTime') },
          {
            label: 'Gap a optimal',
            value: formatValue(diagnostics.pace.gapToOptimalMs, 'lapTime'),
          },
          {
            label: 'Best 3-lap avg',
            value: formatValue(diagnostics.pace.bestThreeLapAverageMs, 'lapTime'),
          },
        ]}
      />

      <DiagnosticCard
        title="Stint"
        body="Mira si el coche sostiene lo que promete en una vuelta y cuánto cae."
        rows={[
          {
            label: 'Best 5-lap avg',
            value: formatValue(diagnostics.stint.bestFiveLapAverageMs, 'lapTime'),
          },
          {
            label: 'Last 3-lap avg',
            value: formatValue(diagnostics.stint.lastThreeLapAverageMs, 'lapTime'),
          },
          { label: 'Pace fade', value: formatValue(diagnostics.stint.paceFadeMs, 'lapTime') },
          {
            label: 'Fuel / lap',
            value: formatValue(diagnostics.stint.averageFuelUsedPerLap, 'decimal'),
          },
        ]}
      />

      <DiagnosticCard
        title="Execution"
        body="Separa el rendimiento de salida y carrera de la velocidad pura."
        rows={[
          {
            label: 'Finish pos media',
            value: formatValue(diagnostics.execution.averageFinishPosition, 'decimal'),
          },
          {
            label: 'Position gain',
            value: formatValue(diagnostics.execution.averagePositionGain, 'position'),
          },
          { label: 'Wins rate', value: formatValue(diagnostics.execution.winsRate, 'percent') },
          {
            label: 'Podiums rate',
            value: formatValue(diagnostics.execution.podiumsRate, 'percent'),
          },
        ]}
      />

      <DiagnosticCard
        title="Cleanliness"
        body="La mejora solo es real si puedes sostenerla sin pagar demasiado en errores."
        rows={[
          {
            label: 'Valid lap rate',
            value: formatValue(diagnostics.cleanliness.validLapRate, 'percent'),
          },
          {
            label: 'Clean session rate',
            value: formatValue(diagnostics.cleanliness.cleanSessionRate, 'percent'),
          },
          {
            label: 'Incidents / session',
            value: formatValue(diagnostics.cleanliness.incidentsPerSession, 'decimal'),
          },
          {
            label: 'Penalties / session',
            value: formatValue(diagnostics.cleanliness.penaltiesPerSession, 'decimal'),
          },
        ]}
      />
    </section>
  );
}
