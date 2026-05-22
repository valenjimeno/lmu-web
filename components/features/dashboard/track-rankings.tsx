import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DashboardRankingItem } from '@/services/dashboard.service';

type TrackRankingsProps = {
  title: string;
  kicker: string;
  items: DashboardRankingItem[];
  minimumSessions: number;
};

const confidenceLabels = {
  low: 'Confianza baja',
  medium: 'Confianza media',
  high: 'Confianza alta',
} as const;

function formatPositionDelta(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export function TrackRankings({ title, kicker, items, minimumSessions }: TrackRankingsProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <p className="section-kicker font-semibold">{kicker}</p>
      <h3 className="editorial-title mt-3 text-2xl text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Sólo aparecen entradas con al menos {minimumSessions} sesiones para evitar lecturas
        frágiles.
      </p>

      <div className="mt-6 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article
              key={`${title}-${item.label}`}
              className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    #{index + 1}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.label}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    <span>{item.sessions} sesiones analizadas</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/75">
                      {confidenceLabels[item.confidence]}
                    </span>
                  </div>
                </div>

                <div className="rounded-full border border-[rgba(225,178,122,0.2)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-sm font-semibold text-[#f0cca0]">
                  {item.score.toFixed(1)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Mejor media</p>
                  <p className="mt-1 text-white">
                    {item.bestLapMs !== null ? formatLapTime(item.bestLapMs) : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Consistencia</p>
                  <p className="mt-1 text-white">
                    {item.lapConsistencyMs !== null
                      ? formatLapTime(item.lapConsistencyMs)
                      : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Pos. media</p>
                  <p className="mt-1 text-white">
                    {item.averageFinishPos !== null
                      ? item.averageFinishPos.toFixed(1)
                      : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Delta posiciones</p>
                  <p className="mt-1 text-white">{formatPositionDelta(item.averagePositionGain)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Penalizaciones</p>
                  <p className="mt-1 text-white">
                    {item.averagePenalties !== null
                      ? item.averagePenalties.toFixed(1)
                      : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em]">Track limits</p>
                  <p className="mt-1 text-white">
                    {item.averageTrackLimits !== null
                      ? item.averageTrackLimits.toFixed(1)
                      : 'No definido'}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-white/10 p-5 text-sm text-muted">
            Todavía no hay suficiente muestra dentro del filtro para construir un ranking estable.
          </div>
        )}
      </div>
    </article>
  );
}
