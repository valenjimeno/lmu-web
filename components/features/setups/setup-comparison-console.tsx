'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { SetupBadge } from '@/components/features/setups/setup-ui';
import {
  formatBrakeBiasSplit,
  formatDate,
  formatLapTime,
  formatMetricValue,
  formatRaceDurationMinutes,
  formatWeatherSummary,
} from '@/lib/utils/setup-formatters';
import type { SetupComparisonFilters, SetupSummary } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

type Option = {
  id: string;
  name: string;
};

type CarOption = Option & {
  carClassId: string;
};

type SetupComparisonConsoleProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  filters: SetupComparisonFilters;
  defaultCarClassId?: string;
  setups: SetupSummary[];
};

const MAX_SELECTED_SETUPS = 3;

type ComparisonMetric = {
  key: string;
  label: string;
  values: Record<string, string>;
  preferredSetupId?: string;
};

type SetupRecommendation = {
  preferredSetup: SetupSummary;
  summary: string;
  reasons: string[];
  scoringMode: 'lap-time' | 'data-quality';
};

export function SetupComparisonConsole({
  carClasses,
  cars,
  tracks,
  filters,
  defaultCarClassId,
  setups,
}: SetupComparisonConsoleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [draftFilters, setDraftFilters] = useState<SetupComparisonFilters>(filters);
  const [selectedSetupIds, setSelectedSetupIds] = useState<string[]>([]);

  const filteredCars = useMemo(
    () =>
      cars.filter((car) => !draftFilters.carClassId || car.carClassId === draftFilters.carClassId),
    [cars, draftFilters.carClassId],
  );
  const defaultSelectedSetupIds = useMemo(
    () => setups.slice(0, Math.min(MAX_SELECTED_SETUPS, 2)).map((setup) => setup.id),
    [setups],
  );
  const normalizedSelectedSetupIds = useMemo(
    () => normalizeSelection(selectedSetupIds, setups, defaultSelectedSetupIds),
    [defaultSelectedSetupIds, selectedSetupIds, setups],
  );

  const selectedSetups = useMemo(
    () =>
      normalizedSelectedSetupIds
        .map((setupId) => setups.find((setup) => setup.id === setupId) ?? null)
        .filter(Boolean) as SetupSummary[],
    [normalizedSelectedSetupIds, setups],
  );

  const comparisonMetrics = useMemo(() => buildComparisonMetrics(selectedSetups), [selectedSetups]);
  const recommendation = useMemo(() => buildRecommendation(selectedSetups), [selectedSetups]);

  function buildComparisonHref(nextFilters: SetupComparisonFilters) {
    const params = new URLSearchParams();

    if (nextFilters.carClassId && nextFilters.carClassId !== defaultCarClassId) {
      params.set('carClassId', nextFilters.carClassId);
    }
    if (nextFilters.carId) params.set('carId', nextFilters.carId);
    if (nextFilters.trackId) params.set('trackId', nextFilters.trackId);
    if (nextFilters.setupType) params.set('setupType', nextFilters.setupType);

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function applyFilters(nextFilters: SetupComparisonFilters) {
    router.push(buildComparisonHref(nextFilters));
  }

  function resetFilters() {
    setDraftFilters({
      carClassId: defaultCarClassId,
      carId: undefined,
      trackId: undefined,
      setupType: undefined,
    });
    router.push(pathname);
  }

  function toggleSetup(setupId: string) {
    setSelectedSetupIds((currentSelection) => {
      const baseSelection = normalizeSelection(currentSelection, setups, defaultSelectedSetupIds);

      if (baseSelection.includes(setupId)) {
        return baseSelection.filter((id) => id !== setupId);
      }

      if (baseSelection.length >= MAX_SELECTED_SETUPS) {
        return [...baseSelection.slice(1), setupId];
      }

      return [...baseSelection, setupId];
    });
  }

  const canCompare = Boolean(
    draftFilters.carClassId && draftFilters.carId && draftFilters.trackId && draftFilters.setupType,
  );
  const missingScope = !filters.carId || !filters.trackId || !filters.setupType;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
        <section className="panel-dark overflow-hidden rounded-[1.25rem]">
          <div className="hairline-divider border-b px-4 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Alcance
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Define la comparación</h3>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/62 transition hover:border-white/18 hover:text-white"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={draftFilters.carClassId ?? ''}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    carClassId: event.target.value || undefined,
                    carId: undefined,
                  }))
                }
                className="input-surface min-h-11 rounded-[0.95rem] border-white/10 px-3 text-sm text-white outline-none"
              >
                {carClasses.map((carClass) => (
                  <option key={carClass.id} value={carClass.id}>
                    {carClass.name}
                  </option>
                ))}
              </select>
              <select
                value={draftFilters.setupType ?? ''}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    setupType:
                      event.target.value === 'fixed' || event.target.value === 'open'
                        ? (event.target.value as Database['public']['Enums']['setup_type'])
                        : undefined,
                  }))
                }
                className="input-surface min-h-11 rounded-[0.95rem] border-white/10 px-3 text-sm text-white outline-none"
              >
                <option value="">Tipo de setup</option>
                <option value="fixed">Fixed</option>
                <option value="open">Open</option>
              </select>
              <select
                value={draftFilters.carId ?? ''}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    carId: event.target.value || undefined,
                  }))
                }
                className="input-surface min-h-11 rounded-[0.95rem] border-white/10 px-3 text-sm text-white outline-none"
              >
                <option value="">Selecciona coche</option>
                {filteredCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
              <select
                value={draftFilters.trackId ?? ''}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    trackId: event.target.value || undefined,
                  }))
                }
                className="input-surface min-h-11 rounded-[0.95rem] border-white/10 px-3 text-sm text-white outline-none"
              >
                <option value="">Selecciona circuito</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/52">
                La comparación se actualizará cuando pulses el botón.
              </p>
              <button
                type="button"
                onClick={() => applyFilters(draftFilters)}
                disabled={!canCompare}
                className={`min-h-11 rounded-[0.95rem] px-5 text-sm font-semibold transition ${
                  canCompare
                    ? 'bg-[linear-gradient(135deg,#e1b27a,#b88a58)] text-[#120d08] hover:brightness-105'
                    : 'cursor-not-allowed border border-white/8 bg-white/[0.03] text-white/34'
                }`}
              >
                Comparar setups
              </button>
            </div>

            <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Setups candidatos
                  </p>
                  <p className="mt-1 text-sm text-white/68">
                    Puedes mantener hasta {MAX_SELECTED_SETUPS} setups en la comparativa.
                  </p>
                </div>
                <SetupBadge tone="accent">{selectedSetups.length} elegidos</SetupBadge>
              </div>

              <div className="mt-3 space-y-2">
                {setups.length === 0 ? (
                  <div className="rounded-[0.95rem] border border-dashed border-white/10 px-4 py-6 text-sm text-white/55">
                    No hay setups con tiempo guardado para esta combinación.
                  </div>
                ) : (
                  setups.map((setup) => {
                    const isSelected = normalizedSelectedSetupIds.includes(setup.id);

                    return (
                      <button
                        key={setup.id}
                        type="button"
                        onClick={() => toggleSetup(setup.id)}
                        className={`flex w-full items-start justify-between gap-3 rounded-[1rem] border px-4 py-3 text-left transition ${
                          isSelected
                            ? 'border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.1)]'
                            : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{setup.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                            <span>{formatLapTime(setup.bestLapMs)}</span>
                            <span>•</span>
                            <span>{setup.setupType === 'fixed' ? 'Fixed' : 'Open'}</span>
                            <span>•</span>
                            <span>{formatDate(setup.updatedAt)}</span>
                          </div>
                        </div>
                        <div
                          className={`mt-1 h-5 w-5 shrink-0 rounded-full border transition ${
                            isSelected
                              ? 'border-[#e1b27a] bg-[#e1b27a]'
                              : 'border-white/20 bg-transparent'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {missingScope ? (
            <EmptyState
              eyebrow="Comparacion"
              title="Elige coche y circuito"
              description="La recomendación solo tiene sentido cuando todos los setups pertenecen al mismo combo. Selecciona primero el coche y el circuito que quieres estudiar."
            />
          ) : selectedSetups.length < 2 ? (
            <EmptyState
              eyebrow="Comparacion"
              title="Selecciona al menos dos setups"
              description="La vista comparativa se activará cuando tengas dos o más setups del mismo coche y circuito dentro de la selección."
            />
          ) : (
            <>
              {recommendation ? (
                <section className="app-hero rounded-[1.35rem] px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <p className="section-kicker">Recomendación inferida</p>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">
                          {recommendation.preferredSetup.name}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                          {recommendation.summary}
                        </p>
                      </div>
                    </div>
                    <SetupBadge tone="accent">
                      {recommendation.scoringMode === 'lap-time'
                        ? 'Prioridad: mejor vuelta'
                        : 'Prioridad: calidad de datos'}
                    </SetupBadge>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {recommendation.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="rounded-[1rem] border border-white/10 bg-black/10 px-3 py-3 text-sm text-white/72"
                      >
                        {reason}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="panel-dark overflow-hidden rounded-[1.25rem]">
                <div className="hairline-divider border-b px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        Cara a cara
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        Qué setup sale mejor parado
                      </h3>
                    </div>
                    <p className="max-w-xs text-right text-xs leading-5 text-white/50">
                      La preferencia se infiere con los datos guardados en la app, no con telemetría
                      completa de stint.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left">
                        <th className="hairline-divider border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          Métrica
                        </th>
                        {selectedSetups.map((setup) => (
                          <th
                            key={setup.id}
                            className="hairline-divider border-b px-4 py-3 text-left"
                          >
                            <div className="min-w-[12rem]">
                              <p className="text-sm font-semibold text-white">{setup.name}</p>
                              <p className="mt-1 text-xs text-white/52">
                                {setup.setupType === 'fixed' ? 'Fixed' : 'Open'} •{' '}
                                {formatDate(setup.updatedAt)}
                              </p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonMetrics.map((metric) => (
                        <tr key={metric.key}>
                          <th className="hairline-divider border-b px-4 py-3 text-left text-sm font-medium text-white/62">
                            {metric.label}
                          </th>
                          {selectedSetups.map((setup) => {
                            const isPreferred = metric.preferredSetupId === setup.id;

                            return (
                              <td
                                key={`${metric.key}-${setup.id}`}
                                className="hairline-divider border-b px-4 py-3"
                              >
                                <div
                                  className={`rounded-[0.95rem] border px-3 py-3 ${
                                    isPreferred
                                      ? 'border-[rgba(143,197,164,0.3)] bg-[rgba(143,197,164,0.12)]'
                                      : 'border-white/8 bg-white/[0.025]'
                                  }`}
                                >
                                  <p className="text-sm font-semibold text-white">
                                    {metric.values[setup.id]}
                                  </p>
                                  {isPreferred ? (
                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#bfe4cd]">
                                      Referencia
                                    </p>
                                  ) : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

function normalizeSelection(
  selection: string[],
  setups: SetupSummary[],
  defaultSelection: string[],
) {
  const availableIds = new Set(setups.map((setup) => setup.id));
  const persistedSelection = selection.filter((setupId) => availableIds.has(setupId));

  if (persistedSelection.length > 0) {
    return persistedSelection.slice(0, MAX_SELECTED_SETUPS);
  }

  return defaultSelection;
}

function buildComparisonMetrics(selectedSetups: SetupSummary[]): ComparisonMetric[] {
  if (selectedSetups.length === 0) {
    return [];
  }

  const fastestSetup = [...selectedSetups]
    .filter((setup) => setup.bestLapMs !== null)
    .sort(
      (left, right) =>
        (left.bestLapMs ?? Number.MAX_SAFE_INTEGER) - (right.bestLapMs ?? Number.MAX_SAFE_INTEGER),
    )[0];
  const freshestSetup = [...selectedSetups].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0];
  const richestDataSetup = [...selectedSetups].sort(
    (left, right) => getCompletenessScore(right) - getCompletenessScore(left),
  )[0];

  return [
    {
      key: 'lap',
      label: 'Mejor vuelta',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatLapTime(setup.bestLapMs)]),
      ),
      preferredSetupId: fastestSetup?.id,
    },
    {
      key: 'brake-bias',
      label: 'Brake Bias',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatBrakeBiasSplit(setup.brakeBias)]),
      ),
    },
    {
      key: 'abs',
      label: 'ABS',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatMetricValue(setup.abs)]),
      ),
    },
    {
      key: 'tc',
      label: 'Onboard TC',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatMetricValue(setup.onboardTc)]),
      ),
    },
    {
      key: 'tc-power',
      label: 'TC Power Cut',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatMetricValue(setup.tcPowerCut)]),
      ),
    },
    {
      key: 'tc-slip',
      label: 'TC Slip Angle',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatMetricValue(setup.tcSlipAngle)]),
      ),
    },
    {
      key: 'weather',
      label: 'Clima',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatWeatherSummary(setup.weatherSummary)]),
      ),
      preferredSetupId: richestDataSetup?.weatherSummary ? richestDataSetup.id : undefined,
    },
    {
      key: 'duration',
      label: 'Duración',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [
          setup.id,
          formatRaceDurationMinutes(setup.raceDurationMinutes),
        ]),
      ),
    },
    {
      key: 'updated',
      label: 'Actualización',
      values: Object.fromEntries(
        selectedSetups.map((setup) => [setup.id, formatDate(setup.updatedAt)]),
      ),
      preferredSetupId: freshestSetup?.id,
    },
  ];
}

function buildRecommendation(selectedSetups: SetupSummary[]): SetupRecommendation | null {
  if (selectedSetups.length < 2) {
    return null;
  }

  const setupsWithLap = selectedSetups.filter((setup) => setup.bestLapMs !== null);
  const scoringMode = setupsWithLap.length > 0 ? 'lap-time' : 'data-quality';
  const ranked = [...selectedSetups].sort((left, right) => {
    const leftScore = getRecommendationScore(left, selectedSetups, scoringMode);
    const rightScore = getRecommendationScore(right, selectedSetups, scoringMode);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  const preferredSetup = ranked[0];
  const reasons = buildRecommendationReasons(preferredSetup, selectedSetups, scoringMode);
  const summary =
    scoringMode === 'lap-time'
      ? `${preferredSetup.name} sale como opción preferible porque combina la vuelta más competitiva registrada con un contexto de setup suficientemente completo para interpretar mejor cuándo usarlo.`
      : `${preferredSetup.name} sale como opción preferible porque es el setup con mejor contexto documentado y más señales para decidir su uso, ya que no hay tiempos de vuelta suficientes para desempatar por rendimiento puro.`;

  return {
    preferredSetup,
    summary,
    reasons,
    scoringMode,
  };
}

function getRecommendationScore(
  setup: SetupSummary,
  allSetups: SetupSummary[],
  scoringMode: SetupRecommendation['scoringMode'],
) {
  let score = getCompletenessScore(setup) * 4;
  score += getFreshnessScore(setup);

  if (scoringMode === 'lap-time') {
    const lapTimes = allSetups
      .map((item) => item.bestLapMs)
      .filter((value): value is number => value !== null);
    const bestLap = Math.min(...lapTimes);

    if (setup.bestLapMs !== null) {
      const lapDelta = setup.bestLapMs - bestLap;
      score += Math.max(0, 120 - lapDelta / 10);
    }
  }

  return score;
}

function buildRecommendationReasons(
  preferredSetup: SetupSummary,
  allSetups: SetupSummary[],
  scoringMode: SetupRecommendation['scoringMode'],
) {
  const reasons: string[] = [];
  const bestLapSetup = [...allSetups]
    .filter((setup) => setup.bestLapMs !== null)
    .sort(
      (left, right) =>
        (left.bestLapMs ?? Number.MAX_SAFE_INTEGER) - (right.bestLapMs ?? Number.MAX_SAFE_INTEGER),
    )[0];
  const richestDataSetup = [...allSetups].sort(
    (left, right) => getCompletenessScore(right) - getCompletenessScore(left),
  )[0];

  if (scoringMode === 'lap-time' && bestLapSetup?.id === preferredSetup.id) {
    reasons.push(`Marca la mejor vuelta del grupo con ${formatLapTime(preferredSetup.bestLapMs)}.`);
  }

  if (richestDataSetup?.id === preferredSetup.id) {
    reasons.push('Es el setup mejor documentado para interpretar clima, duración y reglajes.');
  }

  if (preferredSetup.notes?.trim()) {
    reasons.push('Incluye notas del piloto o ingeniero para entender mejor el contexto.');
  }

  if (reasons.length < 3) {
    reasons.push(
      `Fue actualizado el ${formatDate(preferredSetup.updatedAt)} y sigue siendo una referencia reciente.`,
    );
  }

  return reasons.slice(0, 3);
}

function getCompletenessScore(setup: SetupSummary) {
  return [
    setup.bestLapMs,
    setup.brakeBias,
    setup.abs,
    setup.onboardTc,
    setup.tcPowerCut,
    setup.tcSlipAngle,
    setup.weatherSummary,
    setup.raceDurationMinutes,
    setup.notes?.trim() ? setup.notes : null,
  ].filter((value) => value !== null && value !== undefined && value !== '').length;
}

function getFreshnessScore(setup: SetupSummary) {
  const ageInDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(setup.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return Math.max(0, 14 - ageInDays);
}
