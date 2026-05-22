import type { DriverOverviewData } from '@/services/dashboard.service';

type PilotSummaryPanelProps = {
  pilotSummary: DriverOverviewData['pilotSummary'];
};

function formatValue(value: number | null, kind: 'count' | 'position' | 'decimal') {
  if (value === null) {
    return 'No definido';
  }

  if (kind === 'count') {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
  }

  if (kind === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

const cards = [
  {
    key: 'totalSessions',
    label: 'Sesiones',
    description: 'Volumen total analizado',
    kind: 'count',
    rateKey: null,
  },
  {
    key: 'averagePositionGain',
    label: 'Posiciones ganadas',
    description: 'Media por sesión',
    kind: 'position',
    rateKey: null,
  },
  {
    key: 'averageFinishPosition',
    label: 'Posición final media',
    description: 'Cierre promedio en carrera',
    kind: 'decimal',
    rateKey: null,
  },
  {
    key: 'incidentsPerSession',
    label: 'Incidentes por sesión',
    description: 'Riesgo medio pagado',
    kind: 'decimal',
    rateKey: null,
  },
  {
    key: 'wins',
    label: 'Victorias',
    description: 'P1 finales',
    kind: 'count',
    rateKey: 'winsRate',
  },
  {
    key: 'podiums',
    label: 'Podios',
    description: 'Top 3',
    kind: 'count',
    rateKey: 'podiumsRate',
  },
  {
    key: 'top5s',
    label: 'Top 5',
    description: 'Finales en los cinco primeros',
    kind: 'count',
    rateKey: 'top5sRate',
  },
  {
    key: 'top10s',
    label: 'Top 10',
    description: 'Regularidad en la zona alta',
    kind: 'count',
    rateKey: 'top10sRate',
  },
] as const;

function formatRate(value: number | null) {
  return value === null ? null : `${(value * 100).toFixed(1)}% de las sesiones finalizadas`;
}

export function PilotSummaryPanel({ pilotSummary }: PilotSummaryPanelProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Pilot Snapshot</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Bloque general del piloto</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Una lectura rápida de tu carrera: cuántas sesiones acumulas, cómo conviertes resultados
            y qué presencia tienes en victorias y zonas altas.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className="panel-dark rounded-[1.4rem] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {formatValue(
                pilotSummary[card.key] as number | null,
                card.kind as 'count' | 'position' | 'decimal',
              )}
            </p>
            {card.rateKey ? (
              <p className="mt-1 text-sm font-medium text-[#f0cca0]">
                {formatRate(pilotSummary[card.rateKey]) ?? 'Sin sesiones finalizadas suficientes'}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
