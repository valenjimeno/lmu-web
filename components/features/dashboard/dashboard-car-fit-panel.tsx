import type { ReactNode } from 'react';
import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { DashboardCarFitWinner, DriverOverviewData } from '@/services/dashboard.service';

type DashboardCarFitPanelProps = {
  carFit: DriverOverviewData['carFit'];
};

function formatValue(
  value: number | null,
  format: DashboardCarFitWinner['format'] | 'lapTime' | 'position' | 'decimal',
) {
  if (value === null) {
    return 'No definido';
  }

  if (format === 'lapTime') {
    return formatLapTime(value);
  }

  if (format === 'position') {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

function formatGap(value: number | null, format: DashboardCarFitWinner['format']) {
  if (value === null) {
    return 'Sin segunda referencia';
  }

  if (format === 'lapTime') {
    return `+${(value / 1000).toFixed(2)} s sobre el segundo`;
  }

  if (format === 'position') {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)} pos sobre el segundo`;
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)} sobre el segundo`;
}

function confidenceLabel(confidence: DashboardCarFitWinner['confidence']) {
  switch (confidence) {
    case 'high':
      return 'Confianza alta';
    case 'medium':
      return 'Confianza media';
    case 'low':
      return 'Confianza baja';
  }
}

function WinnerCard({ title, winner }: { title: string; winner: DashboardCarFitWinner | null }) {
  return (
    <article className="panel-dark rounded-[1.4rem] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      {winner ? (
        <>
          <p className="mt-3 text-lg font-semibold text-white">{winner.carName}</p>
          <p className="mt-2 text-2xl font-semibold text-[#f0cca0]">
            {formatValue(winner.primaryValue, winner.format)}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{winner.supportingLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em]">
            <span className="rounded-full border border-white/10 px-2 py-1 text-white/75">
              {formatGap(winner.gapToNext, winner.format)}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-1 text-white/75">
              {confidenceLabel(winner.confidence)}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">
          Falta muestra suficiente para encontrar un ganador fiable.
        </p>
      )}
    </article>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="border-t border-white/8 px-4 py-3 text-sm text-white/84">{children}</td>;
}

export function DashboardCarFitPanel({ carFit }: DashboardCarFitPanelProps) {
  if (!carFit.active) {
    return (
      <article className="app-shell-card rounded-[1.8rem] p-6">
        <p className="section-kicker font-semibold">Car Fit</p>
        <h3 className="editorial-title mt-3 text-2xl text-white">Qué coche encaja mejor aquí</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Selecciona un circuito para comparar coches dentro de un contexto real. Ahí es donde el
          dashboard empieza a ayudarte a elegir entre hotlap, stint corto, consistencia y carrera.
        </p>
      </article>
    );
  }

  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Car Fit</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">
            Qué coche encaja mejor en {carFit.trackLabel}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            No hay un único ganador. Aquí ves qué coche te conviene según si priorizas una vuelta,
            un bloque corto, repetibilidad, conversión en carrera o equilibrio general.
          </p>
        </div>
        <p className="text-sm text-muted">
          {carFit.comparedCarsCount} coches comparados
          {carFit.classLabel ? ` en ${carFit.classLabel}` : ''}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <WinnerCard title="1 vuelta" winner={carFit.winners.oneLap} />
        <WinnerCard title="5 vueltas" winner={carFit.winners.fiveLap} />
        <WinnerCard title="Consistencia" winner={carFit.winners.consistency} />
        <WinnerCard title="Carrera" winner={carFit.winners.race} />
        <WinnerCard title="Equilibrio" winner={carFit.winners.balanced} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-[1.4rem] border border-white/8 bg-white/[0.02]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted">
              <th className="px-4 py-3 font-semibold">Coche</th>
              <th className="px-4 py-3 font-semibold">1 vuelta</th>
              <th className="px-4 py-3 font-semibold">5 vueltas</th>
              <th className="px-4 py-3 font-semibold">Consistencia</th>
              <th className="px-4 py-3 font-semibold">Pace fade</th>
              <th className="px-4 py-3 font-semibold">Racecraft</th>
              <th className="px-4 py-3 font-semibold">Incidentes</th>
              <th className="px-4 py-3 font-semibold">Fit score</th>
            </tr>
          </thead>
          <tbody>
            {carFit.ranking.length > 0 ? (
              carFit.ranking.map((item) => (
                <tr key={item.carName}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-white">{item.carName}</p>
                      <p className="mt-1 text-xs text-muted">{item.sessions} sesiones</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatValue(item.representativeBestLapMs, 'lapTime')}</TableCell>
                  <TableCell>
                    {formatValue(item.representativeBestFiveLapAverageMs, 'lapTime')}
                  </TableCell>
                  <TableCell>{formatValue(item.lapConsistencyMs, 'lapTime')}</TableCell>
                  <TableCell>{formatValue(item.paceFadeMs, 'lapTime')}</TableCell>
                  <TableCell>{formatValue(item.averagePositionGain, 'position')}</TableCell>
                  <TableCell>{formatValue(item.averageIncidents, 'decimal')}</TableCell>
                  <TableCell>{item.fitScore.toFixed(1)}</TableCell>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-muted">
                  Todavía no hay suficiente muestra estable para comparar coches en este circuito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
