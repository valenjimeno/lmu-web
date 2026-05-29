import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { DeleteSessionDialog } from '@/components/features/sessions/delete-session-dialog';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import { formatDate, formatLapTime, formatRaceDurationMinutes } from '@/lib/utils/setup-formatters';
import { formatSessionType } from '@/lib/utils/session-type';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import { getSessionDetail } from '@/services/session.service';
import LoadingSessionDetail from './loading';

type SessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function formatPositionDelta(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  if (value > 0) {
    return `+${value}`;
  }

  if (value < 0) {
    return String(value);
  }

  return '0';
}

function formatNumber(value: number | null, suffix = '', decimals = 2) {
  if (value === null) {
    return 'No definido';
  }

  return `${value.toFixed(decimals)}${suffix}`;
}

function formatPercentage(value: number | null, decimals = 0) {
  if (value === null) {
    return 'No definido';
  }

  return `${(value * 100).toFixed(decimals)}%`;
}

function formatPercentageRange(minValue: number | null, maxValue: number | null, decimals = 1) {
  if (minValue === null || maxValue === null) {
    return 'No definida';
  }

  return `${formatPercentage(minValue, decimals)} - ${formatPercentage(maxValue, decimals)}`;
}

function formatLapDelta(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatLapTime(Math.abs(value))}`;
}

function formatSessionDuration(value: number | null) {
  if (value === null) {
    return 'No definido';
  }

  const totalMilliseconds = Math.max(0, Math.round(value * 1000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

function SessionMetricCard({
  label,
  value,
  helpText,
  tone,
}: {
  label: string;
  value: string;
  helpText: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={`mt-3 text-[1.85rem] leading-none font-medium ${tone ?? 'text-white'}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-white/48">{helpText}</p>
    </div>
  );
}

function SessionPositionCard({
  finishPos,
  gridPos,
  positionGain,
}: {
  finishPos: number | null;
  gridPos: number | null;
  positionGain: number | null;
}) {
  const gainTone =
    positionGain === null
      ? 'text-white/58'
      : positionGain > 0
        ? 'text-emerald-300'
        : positionGain < 0
          ? 'text-[#f3b4aa]'
          : 'text-white/78';

  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Posicion</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-[1.85rem] leading-none font-medium text-white">
          {finishPos ?? 'No definida'}
        </p>
        <p className={`text-sm font-semibold ${gainTone}`}>{formatPositionDelta(positionGain)}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-white/48">
        <span>Salida P{gridPos ?? 'ND'}</span>
        <span>Resultado final</span>
      </div>
    </div>
  );
}

function SessionDataLine({
  label,
  value,
  tone = 'text-white/78',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/52">{label}</span>
      <span className={`text-right ${tone}`}>{value}</span>
    </div>
  );
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <Suspense fallback={<LoadingSessionDetail />}>
      <SessionDetailContent params={params} />
    </Suspense>
  );
}

async function SessionDetailContent({ params }: SessionDetailPageProps) {
  const [appContext, resolvedParams] = await Promise.all([getAuthenticatedAppContext(), params]);

  if (!appContext) {
    redirect(routes.login);
  }

  const session = await getSessionDetail(appContext.user.id, resolvedParams.sessionId);

  if (!session) {
    notFound();
  }

  const positionDeltaTone =
    session.positionGain === null
      ? 'text-white/78'
      : session.positionGain > 0
        ? 'text-emerald-300'
        : session.positionGain < 0
          ? 'text-[#f3b4aa]'
          : 'text-white/78';
  const bestSector1Ms = session.laps.reduce<number | null>((best, lap) => {
    if (lap.sector1Ms === null || lap.sector1Ms <= 0) {
      return best;
    }

    return best === null ? lap.sector1Ms : Math.min(best, lap.sector1Ms);
  }, null);
  const bestSector2Ms = session.laps.reduce<number | null>((best, lap) => {
    if (lap.sector2Ms === null || lap.sector2Ms <= 0) {
      return best;
    }

    return best === null ? lap.sector2Ms : Math.min(best, lap.sector2Ms);
  }, null);
  const bestSector3Ms = session.laps.reduce<number | null>((best, lap) => {
    if (lap.sector3Ms === null || lap.sector3Ms <= 0) {
      return best;
    }

    return best === null ? lap.sector3Ms : Math.min(best, lap.sector3Ms);
  }, null);
  return (
    <section className="space-y-6">
      <div className="panel-dark rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                Detalle de sesión
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {session.name}
              </h2>
              <p className="text-sm leading-7 text-muted">
                {session.driverName} ·{' '}
                {session.sourceCarClass ?? session.carClassId ?? 'Clase no definida'} ·{' '}
                {session.carName} · {session.trackName}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.12)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f0cca0]">
                  {formatSessionType(session.sessionType)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                  {formatRaceDurationMinutes(session.raceDurationMinutes)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                  {session.sessionDateTime
                    ? formatDate(session.sessionDateTime)
                    : 'Fecha no definida'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                  {session.lapsCompleted ?? 'ND'} vueltas
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                  {session.finishStatus ?? 'Estado no definido'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SessionPositionCard
                  finishPos={session.finishPos}
                  gridPos={session.gridPos}
                  positionGain={session.positionGain}
                />
                <SessionMetricCard
                  label="Mejor vuelta"
                  value={formatLapTime(session.bestLapMs)}
                  helpText="Vuelta más rápida válida de la sesión."
                />
                <SessionMetricCard
                  label="Vuelta óptima"
                  value={formatLapTime(session.optimalLapMs)}
                  helpText="Suma del mejor S1, S2 y S3 de toda la sesión."
                />
                <SessionMetricCard
                  label="Ritmo medio"
                  value={formatLapTime(session.averageLapMs)}
                  helpText="Promedio de vueltas válidas fuera de pit."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {session.setupId ? (
              <Button href={`${routes.setups}/${session.setupId}`} asChild variant="secondary">
                Abrir setup
              </Button>
            ) : null}
            <Button href={routes.sessions} asChild variant="secondary">
              Volver al listado
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
        <div className="space-y-6">
          <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                Resultado
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-white">Resumen completo</h3>
            </div>
            <div className="mt-6 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="space-y-3">
                <SessionDataLine label="Vueltas validas" value={String(session.validLapCount)} />
                <SessionDataLine
                  label="Velocidad maxima"
                  value={formatNumber(session.peakTopSpeedKph, ' km/h')}
                />
                <SessionDataLine
                  label="3 mejores vueltas"
                  value={formatLapTime(session.bestThreeLapAverageMs)}
                />
                <SessionDataLine
                  label="Últimas 3 vueltas"
                  value={formatLapTime(session.lastThreeLapAverageMs)}
                />
                <SessionDataLine
                  label="Ratio válidas"
                  value={formatPercentage(session.validLapRate)}
                />
                <SessionDataLine
                  label="Consumo/vuelta"
                  value={formatPercentage(session.averageFuelUsedPerLap, 1)}
                />
                <SessionDataLine
                  label="VE inicial"
                  value={formatPercentage(session.virtualEnergyStart, 1)}
                />
                <SessionDataLine
                  label="VE media/vuelta"
                  value={formatPercentage(session.averageVirtualEnergyUsedPerLap, 1)}
                />
                <SessionDataLine
                  label="VE final"
                  value={formatPercentage(session.virtualEnergyEnd, 1)}
                />
                <SessionDataLine
                  label="Desgaste delantero"
                  value={formatPercentage(session.tireDropFront, 1)}
                />
                <SessionDataLine
                  label="Desgaste trasero"
                  value={formatPercentage(session.tireDropRear, 1)}
                />
                <SessionDataLine
                  label="Tiempo final"
                  value={formatSessionDuration(session.finishTimeSeconds)}
                />
                {session.pitstops !== 0 ? (
                  <SessionDataLine
                    label="Pitstops"
                    value={String(session.pitstops ?? 'No definido')}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                Stint
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-white">Ritmo por vuelta</h3>
            </div>
            <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-white/8">
              <div className="hidden grid-cols-[0.65fr_1fr_0.7fr_0.8fr_0.8fr] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:grid">
                <span>Vuelta</span>
                <span>Tiempo</span>
                <span>Posición</span>
                <span>Fuel</span>
                <span>Pico</span>
              </div>
              <div className="divide-y divide-white/8">
                {session.laps.map((lap) => (
                  <div
                    key={lap.lapNumber}
                    className="grid grid-cols-2 gap-3 px-4 py-3 lg:grid-cols-[0.65fr_1fr_0.7fr_0.8fr_0.8fr] lg:items-center lg:gap-4"
                  >
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
                        Vuelta
                      </p>
                      <p className="text-sm text-white">{lap.lapNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
                        Tiempo
                      </p>
                      <p
                        className={
                          lap.lapTimeMs !== null && lap.lapTimeMs === session.bestLapMs
                            ? 'text-sm font-semibold text-emerald-300'
                            : 'text-sm text-white'
                        }
                      >
                        {formatLapTime(lap.lapTimeMs)}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs text-white/45">
                        <p
                          className={
                            lap.sector1Ms !== null && lap.sector1Ms === bestSector1Ms
                              ? 'font-semibold text-emerald-300'
                              : undefined
                          }
                        >
                          S1 {formatLapTime(lap.sector1Ms)}
                        </p>
                        <p
                          className={
                            lap.sector2Ms !== null && lap.sector2Ms === bestSector2Ms
                              ? 'font-semibold text-emerald-300'
                              : undefined
                          }
                        >
                          S2 {formatLapTime(lap.sector2Ms)}
                        </p>
                        <p
                          className={
                            lap.sector3Ms !== null && lap.sector3Ms === bestSector3Ms
                              ? 'font-semibold text-emerald-300'
                              : undefined
                          }
                        >
                          S3 {formatLapTime(lap.sector3Ms)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
                        Posición
                      </p>
                      <p className="text-sm text-white">{lap.runningPosition ?? 'No definida'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
                        Fuel
                      </p>
                      <p className="text-sm text-white">{formatPercentage(lap.fuelUsed, 1)}</p>
                      <p className="text-xs text-white/45">
                        Rem. {formatPercentage(lap.fuelRemaining, 1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
                        Pico
                      </p>
                      <p className="text-sm text-white">{formatNumber(lap.topSpeedKph, ' km/h')}</p>
                      <p className="text-xs text-white/45">
                        {lap.pitFlag ? 'Pit' : lap.isValidLap ? 'Válida' : 'Inválida'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
              Telemetría rápida
            </p>
            <div className="mt-5 space-y-3">
              <SessionDataLine
                label="Compuesto delantero"
                value={session.compounds.front ?? 'No definido'}
              />
              <SessionDataLine
                label="Compuesto trasero"
                value={session.compounds.rear ?? 'No definido'}
              />
              <SessionDataLine
                label="Ventana consumo"
                value={formatPercentageRange(
                  session.virtualEnergyMinPerLap,
                  session.virtualEnergyMaxPerLap,
                  1,
                )}
              />
              <SessionDataLine
                label="VE 20 min"
                value={formatPercentage(session.projectedVirtualEnergy20Minutes, 1)}
              />
              <SessionDataLine
                label="VE 30 min"
                value={formatPercentage(session.projectedVirtualEnergy30Minutes, 1)}
              />
              <SessionDataLine
                label="VE 45 min"
                value={formatPercentage(session.projectedVirtualEnergy45Minutes, 1)}
              />
              <SessionDataLine
                label="Deg. front/lap"
                value={formatNumber(session.tireDropFrontPerLap, '', 3)}
              />
              <SessionDataLine
                label="Deg. rear/lap"
                value={formatNumber(session.tireDropRearPerLap, '', 3)}
              />
              <SessionDataLine
                label="Ratio front/rear"
                value={formatNumber(session.frontRearWearRatio, 'x', 2)}
              />
              <SessionDataLine
                label="Ratio right/left"
                value={formatNumber(session.leftRightWearRatio, 'x', 2)}
              />
              <SessionDataLine label="Fuel mult." value={formatNumber(session.fuelMult, '', 2)} />
              <SessionDataLine label="Tire mult." value={formatNumber(session.tireMult, '', 2)} />
              <SessionDataLine
                label="Damage mult."
                value={formatNumber(session.damageMult, '', 2)}
              />
              <SessionDataLine label="Incidentes" value={String(session.incidentsCount)} />
              <SessionDataLine label="Penalizaciones" value={String(session.penaltiesCount)} />
              <SessionDataLine label="Track limits" value={String(session.trackLimitsCount)} />
            </div>
          </section>
        </aside>
      </div>

      <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffb7aa]">
              Borrado
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Eliminar esta sesión
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted">
              Si ya no la necesitas, puedes borrarla y recalcularemos las métricas agregadas que
              dependan de ella.
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-64">
            <DeleteSessionDialog
              sessionId={session.id}
              sessionName={session.name}
              returnTo={routes.sessions}
            />
          </div>
        </div>
      </section>
    </section>
  );
}
