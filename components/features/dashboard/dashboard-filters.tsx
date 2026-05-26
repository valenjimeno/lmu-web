'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { DashboardMode, DriverOverviewData } from '@/services/dashboard.service';

type DashboardFiltersProps = {
  filters: DriverOverviewData['resolvedFilters'];
  options: DriverOverviewData['filterOptions'];
  summary: DriverOverviewData['contextSummary'];
  mode: DashboardMode;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

const modeOptions: Array<{
  key: DashboardMode;
  label: string;
  title: string;
  description: string;
}> = [
  {
    key: 'global',
    label: 'Resumen',
    title: 'Resumen ejecutivo',
    description:
      'Panorama global del piloto: rendimiento, tendencias y ranking de circuitos para ver dónde estás fuerte y dónde conviene insistir.',
  },
  {
    key: 'contextual',
    label: 'Foco',
    title: 'Foco por combo',
    description:
      'Lectura profunda del coche, clase y circuito activos para entender qué setup funciona, qué te frena y qué tocar después.',
  },
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

export function DashboardFilters({
  filters,
  options,
  summary,
  mode,
  basePath,
  searchParams,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sourceSessionSetting, setSourceSessionSetting] = useState(filters.sourceSessionSetting);
  const [carClassId, setCarClassId] = useState(filters.carClassId ?? '');
  const [trackId, setTrackId] = useState(filters.trackId ?? '');
  const [carId, setCarId] = useState(filters.carId ?? '');
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(filters.dateTo ?? '');
  const hasMountedRef = useRef(false);

  const carsForSelectedClass = useMemo(
    () => (carClassId ? options.cars.filter((car) => car.carClassId === carClassId) : options.cars),
    [carClassId, options.cars],
  );
  const activeFilters = useMemo(
    () =>
      [
        sourceSessionSetting && sourceSessionSetting !== options.defaultSourceSessionSetting
          ? { key: 'sourceSessionSetting', label: `Tipo: ${sourceSessionSetting}` }
          : null,
        carClassId
          ? {
              key: 'carClassId',
              label: `Clase: ${options.carClasses.find((carClass) => carClass.id === carClassId)?.name ?? ''}`,
            }
          : null,
        trackId
          ? {
              key: 'trackId',
              label: `Circuito: ${options.tracks.find((track) => track.id === trackId)?.name ?? ''}`,
            }
          : null,
        carId
          ? {
              key: 'carId',
              label: `Coche: ${carsForSelectedClass.find((car) => car.id === carId)?.name ?? ''}`,
            }
          : null,
        dateFrom ? { key: 'dateFrom', label: `Desde: ${dateFrom}` } : null,
        dateTo ? { key: 'dateTo', label: `Hasta: ${dateTo}` } : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>,
    [
      carClassId,
      carId,
      carsForSelectedClass,
      dateFrom,
      dateTo,
      options.carClasses,
      options.defaultSourceSessionSetting,
      options.tracks,
      sourceSessionSetting,
      trackId,
    ],
  );

  const applyFilters = useCallback(
    (nextFilters: {
      sourceSessionSetting?: string;
      carClassId?: string;
      trackId?: string;
      carId?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const nextHref = buildHref(basePath, searchParams, {
        sourceSessionSetting:
          nextFilters.sourceSessionSetting &&
          nextFilters.sourceSessionSetting !== options.defaultSourceSessionSetting
            ? nextFilters.sourceSessionSetting
            : undefined,
        carClassId: nextFilters.carClassId || undefined,
        trackId: nextFilters.trackId || undefined,
        carId: nextFilters.carId || undefined,
        dateFrom: nextFilters.dateFrom || undefined,
        dateTo: nextFilters.dateTo || undefined,
      });
      const currentHref = buildHref(basePath, searchParams, {});

      if (nextHref !== currentHref) {
        router.push(nextHref);
      }
    },
    [basePath, options.defaultSourceSessionSetting, router, searchParams],
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applyFilters({
        sourceSessionSetting,
        carClassId,
        trackId,
        carId,
        dateFrom,
        dateTo,
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [applyFilters, carClassId, carId, dateFrom, dateTo, sourceSessionSetting, trackId]);

  const clearHref = buildHref(basePath, searchParams, {
    carClassId: undefined,
    trackId: undefined,
    carId: undefined,
    sourceSessionSetting: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });

  function clearSingleFilter(key: string) {
    switch (key) {
      case 'sourceSessionSetting':
        setSourceSessionSetting(options.defaultSourceSessionSetting);
        break;
      case 'carClassId':
        setCarClassId('');
        setCarId('');
        break;
      case 'trackId':
        setTrackId('');
        break;
      case 'carId':
        setCarId('');
        break;
      case 'dateFrom':
        setDateFrom('');
        break;
      case 'dateTo':
        setDateTo('');
        break;
      default:
        break;
    }
  }

  const activeMode = modeOptions.find((option) => option.key === mode) ?? modeOptions[0];
  const contextBadges = [
    summary.activeClassName ? `Clase ${summary.activeClassName}` : null,
    summary.activeTrackName ? `Circuito ${summary.activeTrackName}` : null,
    summary.activeCarName ? `Coche ${summary.activeCarName}` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="space-y-4">
      <div className="app-shell-card overflow-hidden rounded-[1.8rem]">
        <div className="hairline-divider border-b px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker font-semibold">Modo de analisis</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {activeMode.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                {activeMode.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                {summary.comparedCarsCount} coches
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                {summary.comparedTracksCount} circuitos
              </span>
              <span className="accent-pill rounded-full px-3 py-2">
                Fuente {filters.sourceSessionSetting}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:px-6 lg:grid-cols-3">
          {modeOptions.map((option) => (
            <Link
              key={option.key}
              href={buildHref(basePath, searchParams, { mode: option.key })}
              className={cn(
                'group rounded-[1.5rem] border p-4 transition duration-200',
                option.key === mode
                  ? 'border-[rgba(225,178,122,0.3)] bg-[linear-gradient(135deg,rgba(225,178,122,0.16),rgba(255,255,255,0.04))] shadow-[0_18px_50px_rgba(0,0,0,0.24)]'
                  : 'border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      'text-[0.72rem] font-semibold uppercase tracking-[0.18em]',
                      option.key === mode ? 'text-[#f0cca0]' : 'text-white/55',
                    )}
                  >
                    {option.label}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-lg font-semibold tracking-tight',
                      option.key === mode ? 'text-white' : 'text-white/88',
                    )}
                  >
                    {option.title}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]',
                    option.key === mode
                      ? 'border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.14)] text-[#f0cca0]'
                      : 'border-white/10 bg-black/10 text-white/45 group-hover:text-white/70',
                  )}
                >
                  {option.key === mode ? 'Activa' : 'Abrir'}
                </span>
              </div>
              <p
                className={cn(
                  'mt-3 max-w-[32rem] text-sm leading-6',
                  option.key === mode ? 'text-white/72' : 'text-muted',
                )}
              >
                {option.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="app-shell-card overflow-hidden rounded-[1.8rem]">
        <div className="hairline-divider border-b px-5 py-5 sm:px-6">
          <div className="rounded-[1.5rem] border border-white/8 bg-black/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-1">
                <p className="section-kicker font-semibold">Ajustar contexto</p>
                <p className="text-sm leading-6 text-muted">
                  El modo cambia la historia; estos filtros cambian la muestra.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {contextBadges.length > 0 ? (
                  contextBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/42">
                    Sin restriccion extra
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(138px,0.92fr)_minmax(138px,0.92fr)]">
              <label className="block">
                <select
                  value={sourceSessionSetting}
                  onChange={(event) => setSourceSessionSetting(event.target.value)}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                >
                  {options.sessionSettings.map((setting) => (
                    <option key={setting.id} value={setting.id}>
                      {setting.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={carClassId}
                  onChange={(event) => {
                    const nextCarClassId = event.target.value;
                    const nextCarId = options.cars.some(
                      (car) =>
                        car.id === carId && (!nextCarClassId || car.carClassId === nextCarClassId),
                    )
                      ? carId
                      : '';
                    setCarClassId(nextCarClassId);
                    setCarId(nextCarId);
                  }}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                >
                  <option value="">Clase</option>
                  {options.carClasses.map((carClass) => (
                    <option key={carClass.id} value={carClass.id}>
                      {carClass.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={trackId}
                  onChange={(event) => setTrackId(event.target.value)}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                >
                  <option value="">Circuito</option>
                  {options.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={carId}
                  onChange={(event) => setCarId(event.target.value)}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                >
                  <option value="">Coche</option>
                  {carsForSelectedClass.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                />
              </label>

              <label className="block">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="input-surface min-h-11 w-full rounded-[1.2rem] border-white/10 px-4 text-[15px] text-white outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 ? (
              <>
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => clearSingleFilter(filter.key)}
                    className="rounded-full border border-[rgba(225,178,122,0.26)] bg-[rgba(225,178,122,0.1)] px-3 py-1.5 text-sm text-[#f3dfc2]"
                  >
                    {filter.label} ×
                  </button>
                ))}
                <Link
                  href={clearHref === basePath ? pathname : clearHref}
                  className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60"
                >
                  Limpiar todo
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted">
                Ajusta el contexto y el dashboard se actualizará al instante.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
