import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { DeleteSessionDialog } from '@/components/features/sessions/delete-session-dialog';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import { formatDate, formatLapTime, formatRaceDurationMinutes } from '@/lib/utils/setup-formatters';
import { getCurrentUser } from '@/lib/supabase/auth';
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
  const [user, resolvedParams] = await Promise.all([getCurrentUser(), params]);

  if (!user) {
    redirect(routes.login);
  }

  const session = await getSessionDetail(user.id, resolvedParams.sessionId);

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
  const paceFadeTone =
    session.paceFadeMs === null
      ? 'text-white'
      : session.paceFadeMs > 0
        ? 'text-[#f3b4aa]'
        : session.paceFadeMs < 0
          ? 'text-emerald-300'
          : 'text-white';

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
                {session.driverName} · {session.carName} · {session.trackName}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SessionMetricCard
                  label="Posición"
                  value={String(session.finishPos ?? 'No definida')}
                  helpText="Resultado final de la sesión."
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
                <SessionMetricCard
                  label="Caída de ritmo"
                  value={formatLapDelta(session.paceFadeMs)}
                  helpText="Diferencia entre el cierre y el arranque del stint."
                  tone={paceFadeTone}
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
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="space-y-3">
                  <SessionDataLine
                    label="Salida"
                    value={String(session.gridPos ?? 'No definido')}
                  />
                  <SessionDataLine
                    label="Posiciones ganadas"
                    value={formatPositionDelta(session.positionGain)}
                    tone={positionDeltaTone}
                  />
                  <SessionDataLine
                    label="Vueltas"
                    value={String(session.lapsCompleted ?? 'No definido')}
                  />
                  {session.pitstops !== 0 ? (
                    <SessionDataLine
                      label="Pitstops"
                      value={String(session.pitstops ?? 'No definido')}
                    />
                  ) : null}
                  <SessionDataLine label="Estado" value={session.finishStatus ?? 'No definido'} />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="space-y-3">
                  <SessionDataLine label="Válidas" value={String(session.validLapCount)} />
                  <SessionDataLine
                    label="Pico velocidad"
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
                    value={formatNumber(session.averageFuelUsedPerLap, '', 3)}
                  />
                  <SessionDataLine
                    label="Caída delantera"
                    value={formatNumber(session.tireDropFront, '', 3)}
                  />
                  <SessionDataLine
                    label="Caída trasera"
                    value={formatNumber(session.tireDropRear, '', 3)}
                  />
                  <SessionDataLine
                    label="Tiempo final"
                    value={formatSessionDuration(session.finishTimeSeconds)}
                  />
                </div>
              </div>
            </div>
          </section>

          {session.insights.length > 0 ? (
            <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                  Insights
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-white">
                  Lectura del stint
                </h3>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {session.insights.map((insight) => (
                  <div
                    key={insight}
                    className="rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white/78"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
                      <p className="text-sm text-white">{formatLapTime(lap.lapTimeMs)}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-white/45">
                        <p>S1 {formatLapTime(lap.sector1Ms)}</p>
                        <p>S2 {formatLapTime(lap.sector2Ms)}</p>
                        <p>S3 {formatLapTime(lap.sector3Ms)}</p>
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
                      <p className="text-sm text-white">{formatNumber(lap.fuelUsed, '', 3)}</p>
                      <p className="text-xs text-white/45">
                        Rem. {formatNumber(lap.fuelRemaining, '', 3)}
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
              Contexto
            </p>
            <div className="mt-5 space-y-3">
              <SessionDataLine label="Piloto" value={session.driverName} />
              <SessionDataLine label="Equipo" value={session.teamName ?? 'No definido'} />
              <SessionDataLine label="Coche" value={session.carName} />
              <SessionDataLine
                label="Clase"
                value={session.sourceCarClass ?? session.carClassId ?? 'No definida'}
              />
              <SessionDataLine label="Circuito" value={session.trackName} />
              <SessionDataLine
                label="Duración"
                value={formatRaceDurationMinutes(session.raceDurationMinutes)}
              />
              <SessionDataLine
                label="Fecha sesión"
                value={
                  session.sessionDateTime ? formatDate(session.sessionDateTime) : 'No definida'
                }
              />
              <SessionDataLine label="Importada" value={formatDate(session.importedAt)} />
            </div>
          </section>

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
                label="Ventana fuel"
                value={
                  session.fuelMinPerLap !== null && session.fuelMaxPerLap !== null
                    ? `${formatNumber(session.fuelMinPerLap, '', 3)} - ${formatNumber(
                        session.fuelMaxPerLap,
                        '',
                        3,
                      )}`
                    : 'No definida'
                }
              />
              <SessionDataLine
                label="Fuel 20 min"
                value={formatNumber(session.projectedFuel20Minutes, '', 3)}
              />
              <SessionDataLine
                label="Fuel 30 min"
                value={formatNumber(session.projectedFuel30Minutes, '', 3)}
              />
              <SessionDataLine
                label="Fuel 45 min"
                value={formatNumber(session.projectedFuel45Minutes, '', 3)}
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
