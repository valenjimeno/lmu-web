'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { CreateSetupModal, EditSetupModal } from '@/components/features/setups/create-setup-modal';
import { FavoriteToggleButton } from '@/components/features/setups/favorite-toggle-button';
import { SetupBadge } from '@/components/features/setups/setup-ui';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  formatBrakeBiasSplit,
  formatDate,
  formatLapTime,
  formatMetricValue,
  formatRaceDurationMinutes,
  formatWeatherSummary,
} from '@/lib/utils/setup-formatters';
import type { SetupSummary } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

type Option = {
  id: string;
  name: string;
};

type CarOption = Option & {
  carClassId: string;
};

type ComparisonMetric = {
  key: string;
  label: string;
  values: Record<string, string>;
  preferredSetupId?: string;
};

type SetupsConsoleProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  filters: {
    query?: string;
    carClassId?: string;
    carId?: string;
    trackId?: string;
    setupType?: Database['public']['Enums']['setup_type'];
    favoriteOnly?: boolean;
  };
  defaultCarClassId?: string;
  setups: SetupSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  feedbackMessage?: string;
  feedbackTone?: string;
  importedSessionHashes: string[];
  preferredDriverName?: string;
};

export function SetupsConsole({
  carClasses,
  cars,
  tracks,
  filters,
  defaultCarClassId,
  setups,
  totalCount,
  page,
  pageSize,
  feedbackMessage,
  feedbackTone,
  importedSessionHashes,
  preferredDriverName,
}: SetupsConsoleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissedFeedbackMessage, setDismissedFeedbackMessage] = useState<string | undefined>(
    undefined,
  );
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(setups[0]?.id ?? null);
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [comparisonSelectionIds, setComparisonSelectionIds] = useState<string[]>([]);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [mobileCarClassId, setMobileCarClassId] = useState(
    filters.carClassId ?? defaultCarClassId ?? '',
  );
  const [mobileCarId, setMobileCarId] = useState(filters.carId ?? '');
  const [mobileTrackId, setMobileTrackId] = useState(filters.trackId ?? '');
  const [mobileFixedOnly, setMobileFixedOnly] = useState(filters.setupType === 'fixed');
  const [mobileFavoriteOnly, setMobileFavoriteOnly] = useState(Boolean(filters.favoriteOnly));

  const filteredCars = useMemo(
    () => cars.filter((car) => !filters.carClassId || car.carClassId === filters.carClassId),
    [cars, filters.carClassId],
  );

  const selectedSetup = useMemo(
    () => setups.find((setup) => setup.id === selectedSetupId) ?? setups[0] ?? null,
    [selectedSetupId, setups],
  );
  const normalizedComparisonSelectionIds = useMemo(
    () => normalizeComparisonSelection(comparisonSelectionIds, setups),
    [comparisonSelectionIds, setups],
  );
  const selectedComparisonSetups = useMemo(
    () =>
      normalizedComparisonSelectionIds
        .map((setupId) => setups.find((setup) => setup.id === setupId) ?? null)
        .filter(Boolean) as SetupSummary[],
    [normalizedComparisonSelectionIds, setups],
  );
  const comparisonMetrics = useMemo(
    () => buildComparisonMetrics(selectedComparisonSetups),
    [selectedComparisonSetups],
  );

  const activeFilters = useMemo(
    () =>
      [
        filters.carClassId && filters.carClassId !== defaultCarClassId
          ? {
              key: 'carClassId',
              label: `Clase: ${carClasses.find((carClass) => carClass.id === filters.carClassId)?.name ?? ''}`,
            }
          : null,
        filters.carId
          ? {
              key: 'carId',
              label: `Coche: ${cars.find((car) => car.id === filters.carId)?.name ?? ''}`,
            }
          : null,
        filters.trackId
          ? {
              key: 'trackId',
              label: `Circuito: ${tracks.find((track) => track.id === filters.trackId)?.name ?? ''}`,
            }
          : null,
        filters.setupType ? { key: 'setupType', label: 'Fixed' } : null,
        filters.favoriteOnly ? { key: 'favoriteOnly', label: 'Solo favoritos' } : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>,
    [carClasses, cars, defaultCarClassId, filters, tracks],
  );

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedFeedbackMessage(feedbackMessage);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  useEffect(() => {
    if (!mobileInsightsOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileInsightsOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileInsightsOpen]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visibleFeedbackMessage =
    feedbackMessage && dismissedFeedbackMessage !== feedbackMessage ? feedbackMessage : undefined;

  function buildSetupsPageHref(nextPage: number, nextFilters: typeof filters = filters) {
    const params = new URLSearchParams();

    if (nextFilters.query) params.set('query', nextFilters.query);
    if (nextFilters.carClassId && nextFilters.carClassId !== defaultCarClassId) {
      params.set('carClassId', nextFilters.carClassId);
    }
    if (nextFilters.carId) params.set('carId', nextFilters.carId);
    if (nextFilters.trackId) params.set('trackId', nextFilters.trackId);
    if (nextFilters.setupType) params.set('setupType', nextFilters.setupType);
    if (nextFilters.favoriteOnly) params.set('favoriteOnly', '1');
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function applyDesktopFilters(nextFilters: typeof filters) {
    router.push(buildSetupsPageHref(1, nextFilters));
  }

  function clearSingleFilter(key: keyof typeof filters) {
    const nextFilters = {
      ...filters,
      [key]: key === 'favoriteOnly' ? false : key === 'carClassId' ? defaultCarClassId : undefined,
      ...(key === 'carClassId' ? { carId: undefined } : {}),
    };
    applyDesktopFilters(nextFilters);
  }

  function resetMobileFilters() {
    setMobileCarClassId(defaultCarClassId ?? '');
    setMobileCarId('');
    setMobileTrackId('');
    setMobileFixedOnly(false);
    setMobileFavoriteOnly(false);
  }

  function openMobileFilters() {
    setMobileCarClassId(filters.carClassId ?? defaultCarClassId ?? '');
    setMobileCarId(filters.carId ?? '');
    setMobileTrackId(filters.trackId ?? '');
    setMobileFixedOnly(filters.setupType === 'fixed');
    setMobileFavoriteOnly(Boolean(filters.favoriteOnly));
    setMobileFiltersOpen((value) => !value);
  }

  function handleSetupSelect(setupId: string) {
    setSelectedSetupId(setupId);

    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setMobileInsightsOpen(true);
    }
  }

  function toggleComparisonSetup(setupId: string) {
    setComparisonError(null);
    setComparisonSelectionIds((currentSelection) => {
      const normalizedSelection = normalizeComparisonSelection(currentSelection, setups);

      if (normalizedSelection.includes(setupId)) {
        return normalizedSelection.filter((id) => id !== setupId);
      }

      if (normalizedSelection.length >= 3) {
        setComparisonError('Solo puedes comparar un máximo de 3 setups al mismo tiempo.');
        return normalizedSelection;
      }

      return [...normalizedSelection, setupId];
    });
  }

  function handleCompare() {
    if (selectedComparisonSetups.length < 2) {
      return;
    }

    const firstSetup = selectedComparisonSetups[0];
    const sameScope = selectedComparisonSetups.every(
      (setup) => setup.carId === firstSetup.carId && setup.trackId === firstSetup.trackId,
    );

    if (!sameScope) {
      setComparisonModalOpen(false);
      setComparisonError('Selecciona setups del mismo coche y circuito para compararlos.');
      return;
    }

    const everySetupHasLapTime = selectedComparisonSetups.every(
      (setup) => setup.bestLapMs !== null,
    );

    if (!everySetupHasLapTime) {
      setComparisonModalOpen(false);
      setComparisonError('Todos los setups comparados deben tener un tiempo guardado.');
      return;
    }

    setComparisonError(null);
    setComparisonModalOpen(true);
  }

  return (
    <section className="space-y-4">
      {visibleFeedbackMessage ? (
        <div
          className={`rounded-[1rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm ${feedbackTone ?? ''}`}
        >
          {visibleFeedbackMessage}
        </div>
      ) : null}
      {comparisonError ? (
        <div className="rounded-[1rem] border border-[rgba(242,162,148,0.22)] bg-[rgba(242,162,148,0.08)] px-4 py-3 text-sm text-[#f3b4aa]">
          {comparisonError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="panel-dark overflow-hidden rounded-[1.25rem]">
          <div className="hairline-divider flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[1.9rem] font-medium text-white">Biblioteca</h2>
              <span className="text-sm text-muted">{totalCount} setups</span>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm.items-center">
              <Button
                type="button"
                onClick={handleCompare}
                disabled={selectedComparisonSetups.length < 2}
                className={`min-h-[4.625rem] w-full rounded-md px-3 py-2 text-center shadow-none disabled:cursor-not-allowed disabled:hover:brightness-100 sm:min-h-10 sm:w-[8.75rem] sm:px-4 sm:py-0 ${
                  selectedComparisonSetups.length >= 2
                    ? 'border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] text-white hover:bg-[rgba(225,178,122,0.26)]'
                    : 'border-white/8 bg-white/[0.03] text-white/38 opacity-70'
                }`}
              >
                <span className="max-w-full text-xs leading-none sm:text-sm">Comparar</span>
              </Button>
              <CreateSetupModal
                carClasses={carClasses}
                cars={cars}
                tracks={tracks}
                defaultCarClassId={defaultCarClassId}
                triggerClassName="min-h-[4.625rem] w-full rounded-md border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] px-3 py-2 text-center text-white shadow-none hover:bg-[rgba(225,178,122,0.26)] sm:min-h-10 sm:w-[8.75rem] sm:px-4 sm:py-0"
              />
            </div>
          </div>

          <div className="hairline-divider border-b px-4 py-2.5">
            <div className="grid gap-1.5 xl:grid-cols-[minmax(135px,0.8fr)_minmax(170px,1fr)_minmax(145px,0.8fr)_auto_auto_auto]">
              <button
                type="button"
                onClick={openMobileFilters}
                className="min-h-9 rounded-[0.8rem] border border-white/8 bg-white/[0.03] px-3 text-sm text-white/80 xl:hidden"
              >
                Filtros
              </button>
              <select
                value={filters.carClassId ?? ''}
                onChange={(event) =>
                  applyDesktopFilters({
                    ...filters,
                    carClassId: event.target.value || undefined,
                    carId: undefined,
                  })
                }
                className="input-surface hidden min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none xl:block"
              >
                {carClasses.map((carClass) => (
                  <option key={carClass.id} value={carClass.id}>
                    {carClass.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.carId ?? ''}
                onChange={(event) =>
                  applyDesktopFilters({ ...filters, carId: event.target.value || undefined })
                }
                className="input-surface hidden min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none xl:block"
              >
                <option value="">Coche</option>
                {filteredCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.trackId ?? ''}
                onChange={(event) =>
                  applyDesktopFilters({ ...filters, trackId: event.target.value || undefined })
                }
                className="input-surface hidden min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none xl:block"
              >
                <option value="">Circuito</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
              <label className="hidden min-h-9 items-center gap-2 rounded-[0.8rem] border border-white/10 bg-white/[0.03] px-3 text-[13px] text-white xl:flex">
                <input
                  type="checkbox"
                  checked={filters.setupType === 'fixed'}
                  onChange={(event) =>
                    applyDesktopFilters({
                      ...filters,
                      setupType: event.target.checked ? 'fixed' : undefined,
                    })
                  }
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                <span className="whitespace-nowrap text-white/85">Fixed</span>
              </label>
              <div className="hidden gap-2 xl:flex">
                <button
                  type="button"
                  onClick={() =>
                    applyDesktopFilters({ ...filters, favoriteOnly: !filters.favoriteOnly })
                  }
                  className={`min-h-9 whitespace-nowrap rounded-[0.8rem] border px-3 text-[13px] ${
                    filters.favoriteOnly
                      ? 'border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.1)] text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/75'
                  }`}
                >
                  Favoritos
                </button>
              </div>
            </div>
            {activeFilters.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => clearSingleFilter(filter.key as keyof typeof filters)}
                    className="rounded-full border border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] px-2 py-0.5 text-[10px] text-white"
                  >
                    {filter.label} ×
                  </button>
                ))}
                <Link
                  href={pathname}
                  className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60"
                >
                  Limpiar todo
                </Link>
              </div>
            ) : null}
            {mobileFiltersOpen ? (
              <div className="mt-2 rounded-[0.95rem] border border-white/8 bg-white/[0.025] p-3 xl:hidden">
                <div className="grid gap-1.5 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
                  <select
                    value={mobileCarClassId}
                    onChange={(event) => {
                      const nextCarClassId = event.target.value;
                      setMobileCarClassId(nextCarClassId);
                      setMobileCarId('');
                      router.push(
                        buildSetupsPageHref(1, {
                          ...filters,
                          carClassId: nextCarClassId || undefined,
                          carId: undefined,
                          trackId: mobileTrackId || undefined,
                          setupType: mobileFixedOnly ? 'fixed' : undefined,
                          favoriteOnly: mobileFavoriteOnly,
                        }),
                      );
                    }}
                    className="input-surface min-h-9 w-full rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
                  >
                    {carClasses.map((carClass) => (
                      <option key={carClass.id} value={carClass.id}>
                        {carClass.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={mobileCarId}
                    onChange={(event) => {
                      const nextCarId = event.target.value;
                      setMobileCarId(nextCarId);
                      router.push(
                        buildSetupsPageHref(1, {
                          ...filters,
                          carId: nextCarId || undefined,
                          trackId: mobileTrackId || undefined,
                          setupType: mobileFixedOnly ? 'fixed' : undefined,
                          favoriteOnly: mobileFavoriteOnly,
                        }),
                      );
                    }}
                    className="input-surface min-h-9 w-full rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
                  >
                    <option value="">Coche</option>
                    {cars
                      .filter((car) => !mobileCarClassId || car.carClassId === mobileCarClassId)
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={mobileTrackId}
                    onChange={(event) => {
                      const nextTrackId = event.target.value;
                      setMobileTrackId(nextTrackId);
                      router.push(
                        buildSetupsPageHref(1, {
                          ...filters,
                          carId: mobileCarId || undefined,
                          trackId: nextTrackId || undefined,
                          setupType: mobileFixedOnly ? 'fixed' : undefined,
                          favoriteOnly: mobileFavoriteOnly,
                        }),
                      );
                    }}
                    className="input-surface min-h-9 w-full rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
                  >
                    <option value="">Circuito</option>
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextFixedOnly = !mobileFixedOnly;
                      setMobileFixedOnly(nextFixedOnly);
                      router.push(
                        buildSetupsPageHref(1, {
                          ...filters,
                          carId: mobileCarId || undefined,
                          trackId: mobileTrackId || undefined,
                          setupType: nextFixedOnly ? 'fixed' : undefined,
                          favoriteOnly: mobileFavoriteOnly,
                        }),
                      );
                    }}
                    className={`flex min-h-9 items-center justify-center gap-2 rounded-[0.8rem] border px-3 text-[13px] font-medium transition ${
                      mobileFixedOnly
                        ? 'border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.1)] text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/75'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        mobileFixedOnly
                          ? 'border-[rgba(225,178,122,0.36)] bg-[rgba(225,178,122,0.18)]'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {mobileFixedOnly ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e1b27a]" />
                      ) : null}
                    </span>
                    Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextFavoriteOnly = !mobileFavoriteOnly;
                      setMobileFavoriteOnly(nextFavoriteOnly);
                      router.push(
                        buildSetupsPageHref(1, {
                          ...filters,
                          carId: mobileCarId || undefined,
                          trackId: mobileTrackId || undefined,
                          setupType: mobileFixedOnly ? 'fixed' : undefined,
                          favoriteOnly: nextFavoriteOnly,
                        }),
                      );
                    }}
                    className={`min-h-9 rounded-[0.8rem] border px-3 text-[13px] font-medium transition ${
                      mobileFavoriteOnly
                        ? 'border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.1)] text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/75'
                    }`}
                  >
                    Favoritos
                  </button>
                </div>

                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      resetMobileFilters();
                      router.push(pathname);
                    }}
                    className="inline-flex min-h-9 items-center justify-center rounded-[0.8rem] border border-white/8 px-4 text-[13px] text-white/70"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {setups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted">
                No hay resultados para esta combinación de filtros.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[auto_minmax(0,2.2fr)_1.45fr_1.25fr_0.9fr_1.15fr] gap-4 px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:grid">
                <span>Comparar</span>
                <span>Nombre</span>
                <span>Coche</span>
                <span>Circuito</span>
                <span>Tipo</span>
                <span>Modificado</span>
              </div>

              <div className="divide-y divide-white/8">
                {setups.map((setup) => {
                  const isSelected = setup.id === selectedSetup?.id;

                  return (
                    <article
                      key={setup.id}
                      onClick={() => handleSetupSelect(setup.id)}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-3 transition lg:grid-cols-[auto_minmax(0,2.2fr)_1.45fr_1.25fr_0.9fr_1.15fr] lg:items-center lg:gap-4 lg:py-4 ${
                        isSelected ? 'bg-white/[0.045]' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={normalizedComparisonSelectionIds.includes(setup.id)}
                          onChange={() => toggleComparisonSetup(setup.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Comparar setup ${setup.name}`}
                          className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#e1b27a]"
                        />
                      </div>

                      <div className="flex min-w-0 items-center gap-3 lg:min-w-0">
                        <div className="hidden lg:flex lg:justify-end">
                          <FavoriteToggleButton
                            setupId={setup.id}
                            isFavorite={setup.isFavorite}
                            returnTo={buildSetupsPageHref(page)}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="block truncate text-base font-medium text-white">
                            {setup.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start justify-end gap-2 lg:hidden lg:justify-end">
                        <FavoriteToggleButton
                          setupId={setup.id}
                          isFavorite={setup.isFavorite}
                          returnTo={buildSetupsPageHref(page)}
                        />
                      </div>

                      <div className="col-span-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:contents">
                        <DataLine label="Coche" value={setup.carName} muted="" />
                        <DataLine label="Circuito" value={setup.trackName} muted="" />
                        <DataLine
                          label="Tipo"
                          value={setup.setupType === 'fixed' ? 'Fixed' : 'Open'}
                          muted=""
                        />
                        <DataLine label="Modificado" value={formatDate(setup.updatedAt)} muted="" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {totalCount > pageSize ? (
            <div className="hairline-divider flex items-center justify-center gap-2 border-t px-4 py-4">
              {page > 1 ? (
                <Link
                  href={buildSetupsPageHref(page - 1)}
                  className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/80"
                >
                  ‹
                </Link>
              ) : (
                <span className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/30">
                  ‹
                </span>
              )}
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const pageNumber = index + 1;
                const active = page === pageNumber;
                return (
                  <Link
                    key={pageNumber}
                    href={buildSetupsPageHref(pageNumber)}
                    className={`rounded-md px-3 py-2 text-sm ${
                      active
                        ? 'border border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] text-white'
                        : 'border border-transparent text-white/70'
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}
              <span className="px-2 text-sm text-white/50">…</span>
              <span className="px-2 text-sm text-white/70">{totalPages}</span>
              {page < totalPages ? (
                <Link
                  href={buildSetupsPageHref(page + 1)}
                  className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/80"
                >
                  ›
                </Link>
              ) : (
                <span className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/30">
                  ›
                </span>
              )}
            </div>
          ) : null}
        </section>

        <div className="hidden xl:block">
          <InsightsPanel
            setup={selectedSetup}
            carClasses={carClasses}
            cars={cars}
            tracks={tracks}
            defaultCarClassId={defaultCarClassId}
            importedSessionHashes={importedSessionHashes}
            preferredDriverName={preferredDriverName}
            onClose={undefined}
          />
        </div>
      </div>

      {mobileInsightsOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="Cerrar insights"
                onClick={() => setMobileInsightsOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />
              <div className="absolute inset-0 overflow-y-auto p-3 pt-5 sm:pt-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-center">
                  <InsightsPanel
                    setup={selectedSetup}
                    carClasses={carClasses}
                    cars={cars}
                    tracks={tracks}
                    defaultCarClassId={defaultCarClassId}
                    importedSessionHashes={importedSessionHashes}
                    preferredDriverName={preferredDriverName}
                    onClose={() => setMobileInsightsOpen(false)}
                    mobile
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {comparisonModalOpen ? (
        <ComparisonModal
          setups={selectedComparisonSetups}
          metrics={comparisonMetrics}
          onClose={() => setComparisonModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

function InsightsPanel({
  setup,
  carClasses,
  cars,
  tracks,
  defaultCarClassId,
  importedSessionHashes,
  preferredDriverName,
  onClose,
  mobile = false,
}: {
  setup: SetupSummary | null;
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
  importedSessionHashes: string[];
  preferredDriverName?: string;
  onClose?: () => void;
  mobile?: boolean;
}) {
  return (
    <aside
      className={`panel-dark overflow-hidden rounded-[1.25rem] ${
        mobile
          ? 'w-full max-w-[min(42rem,calc(100vw-1.5rem))] overflow-x-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)]'
          : ''
      }`}
    >
      <div className="hairline-divider border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Detalles
          </p>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/8 px-2 py-1 text-xs text-white/70"
            >
              Cerrar
            </button>
          ) : (
            <div className="flex gap-2 text-white/50">
              <span>⊞</span>
              <span>☰</span>
            </div>
          )}
        </div>
      </div>

      {setup ? (
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-md border border-white/8 px-4 py-4">
            <p className="line-clamp-2 text-base font-medium leading-6 text-white">{setup.name}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Clase
                </span>
                <span className="truncate text-right text-white/72">{setup.carClassName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Coche
                </span>
                <span className="truncate text-right text-white/72">
                  {setup.manufacturerName} {setup.carName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Circuito
                </span>
                <span className="truncate text-right text-white/72">{setup.trackName}</span>
              </div>
              {setup.weatherSummary ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    CLIMA
                  </span>
                  <span className="truncate text-right text-white/72">
                    {formatWeatherSummary(setup.weatherSummary)}
                  </span>
                </div>
              ) : null}
              {setup.raceDurationMinutes !== null ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    DURACION
                  </span>
                  <span className="truncate text-right text-white/72">
                    {formatRaceDurationMinutes(setup.raceDurationMinutes)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <EditSetupModal
              carClasses={carClasses}
              cars={cars}
              tracks={tracks}
              defaultCarClassId={defaultCarClassId}
              importedSessionHashes={importedSessionHashes}
              setup={setup}
              preferredDriverName={preferredDriverName}
              triggerClassName="inline-flex min-h-11 w-full items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
            />
          </div>

          <div className="rounded-md border border-white/8 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Datos rápidos
            </p>
            <div className="mt-4 space-y-3">
              <MetricLine label="Brake Bias" value={formatBrakeBiasSplit(setup.brakeBias)} />
              <MetricLine label="ABS" value={formatMetricValue(setup.abs)} />
              <MetricLine label="ONBOARD TC" value={formatMetricValue(setup.onboardTc)} />
              <MetricLine label="TC POWER" value={formatMetricValue(setup.tcPowerCut)} />
              <MetricLine label="TC SLIP" value={formatMetricValue(setup.tcSlipAngle)} />
            </div>
          </div>

          {setup.bestLapMs !== null ? (
            <div className="rounded-md border border-white/8 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Resumen de rendimiento
              </p>
              <div className="mt-4">
                <MetricBox label="PERSONAL BEST" value={formatLapTime(setup.bestLapMs)} note="" />
              </div>
            </div>
          ) : null}

          {setup.notes?.trim() ? (
            <div className="rounded-md border border-white/8 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Notas
              </p>
              <p className="mt-3 text-sm leading-6 text-white/62">{setup.notes}</p>
              <p className="mt-4 text-xs text-white/42">
                Actualizado {formatDate(setup.updatedAt)} por {setup.ownerDisplayName}.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="px-4 py-8 text-sm text-muted">
          Selecciona un setup para ver su resumen, métricas y notas.
        </div>
      )}
    </aside>
  );
}

function DataLine({ label, value, muted }: { label: string; value: string; muted?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
        {label}
      </p>
      <p className="truncate text-[15px] leading-6 text-white lg:text-sm">{value}</p>
      {muted ? (
        <p className="truncate text-xs text-white/50 lg:mt-1 lg:text-sm lg:text-white/55">
          {muted}
        </p>
      ) : null}
    </div>
  );
}

function MetricBox({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-white/8 px-3 py-3 ${className ?? ''}`}>
      <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 break-words text-[1.9rem] leading-none font-medium text-white">{value}</p>
      {note ? <p className="mt-1 text-xs text-[#7ebd72]">{note}</p> : null}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/8 px-3 py-3">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function ComparisonModal({
  setups,
  metrics,
  onClose,
}: {
  setups: SetupSummary[];
  metrics: ComparisonMetric[];
  onClose: () => void;
}) {
  const winningSetupId = [...setups]
    .filter((setup) => setup.bestLapMs !== null)
    .sort(
      (left, right) =>
        (left.bestLapMs ?? Number.MAX_SAFE_INTEGER) - (right.bestLapMs ?? Number.MAX_SAFE_INTEGER),
    )[0]?.id;
  const winningSetup = setups.find((setup) => setup.id === winningSetupId) ?? setups[0] ?? null;

  return (
    <Modal title="Comparativa de setups" className="max-w-2xl xl:max-w-4xl">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-white/62">
            Comparando {setups.length} setups del mismo coche y circuito.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/62 transition hover:border-white/18 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-3 md:hidden">
          {winningSetup ? (
            <section className="rounded-[1.1rem] border border-[rgba(143,197,164,0.28)] bg-[rgba(143,197,164,0.08)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white">{winningSetup.name}</p>
                  <p className="mt-1 text-xs text-white/52">
                    {winningSetup.setupType === 'fixed' ? 'Fixed' : 'Open'} •{' '}
                    {formatDate(winningSetup.updatedAt)}
                  </p>
                </div>
                <SetupBadge tone="success">Mejor vuelta</SetupBadge>
              </div>

              <div className="mt-4 space-y-2">
                {metrics.map((metric) => (
                  <div
                    key={`${winningSetup.id}-${metric.key}`}
                    className={`flex items-center justify-between gap-3 rounded-[0.9rem] border px-3 py-3 ${
                      metric.preferredSetupId === winningSetup.id
                        ? 'border-[rgba(143,197,164,0.3)] bg-[rgba(143,197,164,0.12)]'
                        : 'border-white/8 bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-sm text-white/60">{metric.label}</span>
                    <span className="max-w-[55%] text-right text-sm font-semibold text-white">
                      {metric.values[winningSetup.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                <th className="hairline-divider border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Métrica
                </th>
                {setups.map((setup) => (
                  <th key={setup.id} className="hairline-divider border-b px-4 py-3 text-left">
                    <div
                      className={`min-w-[12rem] rounded-[1rem] border px-3 py-3 transition ${
                        setup.id === winningSetupId
                          ? 'border-[rgba(143,197,164,0.26)] bg-[rgba(143,197,164,0.08)]'
                          : 'border-transparent opacity-55'
                      }`}
                    >
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
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <th className="hairline-divider border-b px-4 py-3 text-left text-sm font-medium text-white/62">
                    {metric.label}
                  </th>
                  {setups.map((setup) => {
                    const isPreferred = metric.preferredSetupId === setup.id;
                    const isWinnerColumn = setup.id === winningSetupId;

                    return (
                      <td
                        key={`${metric.key}-${setup.id}`}
                        className="hairline-divider border-b px-4 py-3"
                      >
                        <div
                          className={`rounded-[0.95rem] border px-3 py-3 ${
                            isPreferred
                              ? 'border-[rgba(143,197,164,0.3)] bg-[rgba(143,197,164,0.12)]'
                              : isWinnerColumn
                                ? 'border-[rgba(255,255,255,0.12)] bg-white/[0.045]'
                                : 'border-white/8 bg-white/[0.025] opacity-55'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">
                            {metric.values[setup.id]}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

function normalizeComparisonSelection(selection: string[], setups: SetupSummary[]) {
  const availableIds = new Set(setups.map((setup) => setup.id));
  return selection.filter((setupId) => availableIds.has(setupId)).slice(0, 3);
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
    },
  ];
}
