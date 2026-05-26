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

const modeOptions: Array<{ key: DashboardMode; label: string }> = [
  { key: 'global', label: 'Global' },
  { key: 'contextual', label: 'Contextual' },
  { key: 'compare', label: 'Comparar' },
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

  return (
    <section className="app-shell-card overflow-hidden rounded-[1.8rem]">
      <div className="hairline-divider flex flex-col gap-3 border-b px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-baseline gap-3">
          <p className="section-kicker font-semibold">Contexto</p>
          <span className="text-sm text-muted">
            {summary.comparedCarsCount} coches · {summary.comparedTracksCount} circuitos · Fuente:{' '}
            {filters.sourceSessionSetting}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {modeOptions.map((option) => (
            <Link
              key={option.key}
              href={buildHref(basePath, searchParams, { mode: option.key })}
              className={cn(
                'rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition',
                option.key === mode
                  ? 'border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] text-[#f0cca0]'
                  : 'border-white/8 bg-white/[0.03] text-muted hover:text-white',
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hairline-divider border-b px-5 py-3 sm:px-6">
        <div className="grid gap-2 xl:grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(150px,0.9fr)_minmax(150px,0.9fr)]">
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
    </section>
  );
}
