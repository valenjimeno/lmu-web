'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CreateSessionModal } from '@/components/features/sessions/create-session-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { routes } from '@/lib/constants/routes';
import { formatDate, formatLapTime } from '@/lib/utils/setup-formatters';
import { formatSessionType } from '@/lib/utils/session-type';
import type { SessionImportJobSummary } from '@/services/session-import-job.service';
import type { SessionSummary } from '@/services/session.service';

type Option = {
  id: string;
  name: string;
};

type CarOption = Option & {
  carClassId: string;
};

type SessionConsoleFilters = {
  carClassId?: string;
  carId?: string;
  trackId?: string;
};

type SessionsConsoleProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  filters: SessionConsoleFilters;
  defaultCarClassId?: string;
  sessions: SessionSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  feedbackMessage?: string;
  feedbackTone?: string;
  importedSessionHashes: string[];
  preferredDriverName?: string;
  importJobs: SessionImportJobSummary[];
};

type SessionImportProgressSummary = {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  completedCount: number;
  failedCount: number;
  duplicateCount: number;
  invalidCount: number;
  filteredCount: number;
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

function buildCompactLabel(value: string, prefix: string) {
  return `${prefix}: ${value}`;
}

function aggregateImportJobs(jobs: SessionImportJobSummary[]): SessionImportProgressSummary | null {
  if (jobs.length === 0) {
    return null;
  }

  const hasProcessingJob = jobs.some((job) => job.status === 'processing');
  const hasQueuedJob = jobs.some((job) => job.status === 'queued');
  const hasFailedJob = jobs.some((job) => job.status === 'failed');

  return {
    id: jobs.map((job) => job.id).join(':'),
    status: hasProcessingJob
      ? 'processing'
      : hasQueuedJob
        ? 'queued'
        : hasFailedJob
          ? 'failed'
          : 'completed',
    totalCount: jobs.reduce((sum, job) => sum + job.totalCount, 0),
    completedCount: jobs.reduce((sum, job) => sum + job.completedCount, 0),
    failedCount: jobs.reduce((sum, job) => sum + job.failedCount, 0),
    duplicateCount: jobs.reduce((sum, job) => sum + job.duplicateCount, 0),
    invalidCount: jobs.reduce((sum, job) => sum + job.invalidCount, 0),
    filteredCount: jobs.reduce((sum, job) => sum + job.filteredCount, 0),
  };
}

export function SessionsConsole({
  carClasses,
  cars,
  tracks,
  filters,
  defaultCarClassId,
  sessions,
  totalCount,
  page,
  pageSize,
  feedbackMessage,
  feedbackTone,
  importedSessionHashes,
  preferredDriverName,
  importJobs,
}: SessionsConsoleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions[0]?.id ?? null,
  );
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false);
  const [dismissedFeedbackMessage, setDismissedFeedbackMessage] = useState<string | undefined>(
    undefined,
  );
  const [polledSessionImportJobs, setPolledSessionImportJobs] = useState<SessionImportJobSummary[]>(
    [],
  );
  const [transientFinishedJobIds, setTransientFinishedJobIds] = useState<string[]>([]);
  const filterFormKey = useMemo(
    () =>
      JSON.stringify({
        carClassId: filters.carClassId ?? defaultCarClassId ?? '',
        carId: filters.carId ?? '',
        trackId: filters.trackId ?? '',
      }),
    [defaultCarClassId, filters],
  );

  const activeFilters = useMemo(
    () =>
      [
        filters.carClassId && filters.carClassId !== defaultCarClassId
          ? {
              key: 'carClassId',
              label: buildCompactLabel(
                carClasses.find((carClass) => carClass.id === filters.carClassId)?.name ?? '',
                'Clase',
              ),
            }
          : null,
        filters.carId
          ? {
              key: 'carId',
              label: buildCompactLabel(
                cars.find((car) => car.id === filters.carId)?.name ?? '',
                'Coche',
              ),
            }
          : null,
        filters.trackId
          ? {
              key: 'trackId',
              label: buildCompactLabel(
                tracks.find((track) => track.id === filters.trackId)?.name ?? '',
                'Circuito',
              ),
            }
          : null,
      ].filter(Boolean) as Array<{ key: keyof SessionConsoleFilters; label: string }>,
    [carClasses, cars, defaultCarClassId, filters, tracks],
  );
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null,
    [selectedSessionId, sessions],
  );
  const visibleFeedbackMessage =
    feedbackMessage && dismissedFeedbackMessage !== feedbackMessage ? feedbackMessage : undefined;
  const sessionImportJobs = useMemo(() => {
    const jobsById = new Map<string, SessionImportJobSummary>();

    for (const job of importJobs) {
      jobsById.set(job.id, job);
    }

    for (const job of polledSessionImportJobs) {
      jobsById.set(job.id, job);
    }

    return Array.from(jobsById.values()).sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
  }, [importJobs, polledSessionImportJobs]);
  const activeImportJobs = useMemo(
    () => sessionImportJobs.filter((job) => job.status === 'queued' || job.status === 'processing'),
    [sessionImportJobs],
  );
  const activeImportSummary = useMemo(
    () => aggregateImportJobs(activeImportJobs),
    [activeImportJobs],
  );
  const transientFinishedJobs = useMemo(
    () =>
      transientFinishedJobIds
        .map((jobId) => sessionImportJobs.find((job) => job.id === jobId) ?? null)
        .filter((job): job is SessionImportJobSummary => job !== null),
    [sessionImportJobs, transientFinishedJobIds],
  );
  const transientFinishedSummary = useMemo(
    () => aggregateImportJobs(transientFinishedJobs),
    [transientFinishedJobs],
  );
  const visibleImportJob = activeImportSummary ?? transientFinishedSummary;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentHref = useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

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
    if (activeImportJobs.length === 0) {
      return undefined;
    }

    let isCancelled = false;
    const previousStatuses = new Map(sessionImportJobs.map((job) => [job.id, job.status]));

    async function pollJobs() {
      try {
        const response = await fetch('/api/session-import-jobs', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          jobs?: SessionImportJobSummary[];
        };

        if (isCancelled || !payload.jobs) {
          return;
        }

        setPolledSessionImportJobs(payload.jobs);

        const finishedJobs = payload.jobs.filter((job) => {
          const previousStatus = previousStatuses.get(job.id);
          return (
            previousStatus &&
            (previousStatus === 'queued' || previousStatus === 'processing') &&
            (job.status === 'completed' || job.status === 'failed')
          );
        });

        if (finishedJobs.length > 0) {
          setTransientFinishedJobIds((currentIds) => {
            const nextIds = new Set(currentIds);

            for (const job of finishedJobs) {
              nextIds.add(job.id);
            }

            return Array.from(nextIds);
          });
          router.refresh();
        }
      } catch {
        // Ignore transient polling errors and retry on next interval.
      }
    }

    const intervalId = window.setInterval(pollJobs, 3000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeImportJobs.length, router, sessionImportJobs]);

  useEffect(() => {
    if (transientFinishedJobIds.length === 0 || activeImportSummary) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const transientIds = new Set(transientFinishedJobIds);
      setTransientFinishedJobIds([]);
      setPolledSessionImportJobs((currentJobs) =>
        currentJobs.filter((job) => !transientIds.has(job.id)),
      );
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [activeImportSummary, transientFinishedJobIds]);

  const buildSessionsPageHref = useCallback(
    (nextPage: number, nextFilters: SessionConsoleFilters = filters) => {
      const params = new URLSearchParams();

      if (nextFilters.carClassId && nextFilters.carClassId !== defaultCarClassId) {
        params.set('carClassId', nextFilters.carClassId);
      }
      if (nextFilters.carId) params.set('carId', nextFilters.carId);
      if (nextFilters.trackId) params.set('trackId', nextFilters.trackId);
      if (nextPage > 1) params.set('page', String(nextPage));

      const search = params.toString();
      return search ? `${pathname}?${search}` : pathname;
    },
    [defaultCarClassId, filters, pathname],
  );

  const applyFilters = useCallback(
    (nextFilters: SessionConsoleFilters) => {
      const nextHref = buildSessionsPageHref(1, nextFilters);

      if (nextHref === currentHref) {
        return;
      }

      router.push(nextHref);
    },
    [buildSessionsPageHref, currentHref, router],
  );

  function clearSingleFilter(key: keyof SessionConsoleFilters) {
    const nextFilters = {
      ...filters,
      [key]: key === 'carClassId' ? defaultCarClassId : undefined,
      ...(key === 'carClassId' ? { carId: undefined } : {}),
    };

    applyFilters(nextFilters);
  }

  function handleSessionSelect(sessionId: string) {
    setSelectedSessionId(sessionId);

    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setMobileInsightsOpen(true);
    }
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

      {visibleImportJob ? (
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          {(() => {
            const processedCount =
              visibleImportJob.completedCount +
              visibleImportJob.failedCount +
              visibleImportJob.duplicateCount +
              visibleImportJob.invalidCount +
              visibleImportJob.filteredCount;
            const progressValue =
              visibleImportJob.totalCount > 0
                ? Math.min(100, Math.round((processedCount / visibleImportJob.totalCount) * 100))
                : 0;

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {visibleImportJob.status === 'queued'
                        ? 'Importación en cola'
                        : visibleImportJob.status === 'processing'
                          ? 'Importación en progreso'
                          : visibleImportJob.status === 'completed'
                            ? 'Importación finalizada'
                            : 'Importación con errores'}
                    </p>
                    <p className="text-xs text-muted">
                      {visibleImportJob.completedCount} importadas ·{' '}
                      {visibleImportJob.duplicateCount} duplicadas ·{' '}
                      {visibleImportJob.invalidCount + visibleImportJob.filteredCount} ignoradas ·{' '}
                      {visibleImportJob.failedCount} fallidas
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-white/72">{progressValue}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#e1b27a_0%,#b88a58_100%)] transition-[width] duration-300"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="panel-dark overflow-hidden rounded-[1.25rem]">
          <div className="hairline-divider flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[1.9rem] font-medium text-white">Sesiones</h2>
              <span className="text-sm text-muted">{totalCount} sesiones</span>
            </div>
            <CreateSessionModal
              importedSessionHashes={importedSessionHashes}
              preferredDriverName={preferredDriverName}
              onJobCreated={(job) => {
                setPolledSessionImportJobs((currentJobs) => [
                  job,
                  ...currentJobs.filter((currentJob) => currentJob.id !== job.id),
                ]);
                setTransientFinishedJobIds([]);
                setDismissedFeedbackMessage(undefined);
              }}
              triggerClassName="min-h-[4.625rem] w-full rounded-md border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] px-3 py-2 text-center text-white shadow-none hover:bg-[rgba(225,178,122,0.26)] sm:ml-auto sm:min-h-10 sm:w-[8.75rem] sm:px-4 sm:py-0"
            />
          </div>

          <SessionsFiltersForm
            key={filterFormKey}
            carClasses={carClasses}
            cars={cars}
            tracks={tracks}
            filters={filters}
            defaultCarClassId={defaultCarClassId}
            onApply={applyFilters}
            onReset={() => router.push(pathname)}
          />

          {activeFilters.length > 0 ? (
            <div className="hairline-divider border-b px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => clearSingleFilter(filter.key)}
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
            </div>
          ) : null}

          {sessions.length === 0 ? (
            <div className="p-4 lg:p-6">
              <EmptyState
                eyebrow="Sin resultados"
                title="No hemos encontrado sesiones con esos criterios"
                description="Prueba a limpiar alguno de los filtros o crea una sesión nueva desde esta pantalla."
              />
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,2fr)_1.35fr_1.2fr_0.9fr_1.1fr] gap-4 px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:grid">
                <span>Sesión</span>
                <span>Piloto</span>
                <span>Coche</span>
                <span>Mejor vuelta</span>
                <span>Fecha</span>
              </div>

              <div className="divide-y divide-white/8">
                {sessions.map((session) => {
                  const isSelected = session.id === selectedSession?.id;

                  return (
                    <article
                      key={session.id}
                      onClick={() => handleSessionSelect(session.id)}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 transition lg:grid-cols-[minmax(0,2fr)_1.35fr_1.2fr_0.9fr_1.1fr] lg:items-center lg:gap-4 lg:py-4 ${
                        isSelected ? 'bg-white/[0.045]' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="block min-w-0 flex-1 truncate text-base font-medium text-white">
                            {session.name}
                          </p>
                          <SubtleTag>{formatSessionType(session.sessionType)}</SubtleTag>
                        </div>
                        <p className="mt-1 truncate text-sm text-white/52 lg:hidden">
                          {session.driverName} ·{' '}
                          {formatDate(session.sessionDateTime ?? session.importedAt)}
                        </p>
                      </div>

                      <div className="flex items-start justify-end gap-2 lg:hidden">
                        {session.bestLapMs !== null ? <SubtleTag>Con vuelta</SubtleTag> : null}
                      </div>

                      <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 lg:contents">
                        <DataLine
                          label="Piloto"
                          value={session.driverName}
                          muted={session.finishStatus ?? ''}
                        />
                        <DataLine
                          label="Coche"
                          value={session.carName}
                          muted={session.manufacturerName}
                        />
                        <DataLine
                          label="Mejor vuelta"
                          value={formatLapTime(session.bestLapMs)}
                          muted={session.bestLapMs !== null ? '' : 'Sin vuelta válida'}
                        />
                        <DataLine
                          label="Fecha"
                          value={formatDate(session.sessionDateTime ?? session.importedAt)}
                          muted=""
                        />
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
                  href={buildSessionsPageHref(page - 1)}
                  className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/80"
                >
                  ‹
                </Link>
              ) : (
                <span className="rounded-md border border-white/8 px-3 py-2 text-sm text-white/30">
                  ‹
                </span>
              )}
              <span className="px-2 text-sm text-white/70">{page}</span>
              <span className="px-2 text-sm text-white/50">/</span>
              <span className="px-2 text-sm text-white/70">{totalPages}</span>
              {page < totalPages ? (
                <Link
                  href={buildSessionsPageHref(page + 1)}
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
          <SessionInsightsPanel session={selectedSession} />
        </div>
      </div>

      {mobileInsightsOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="Cerrar detalles de sesion"
                onClick={() => setMobileInsightsOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />
              <div className="absolute inset-0 overflow-y-auto p-3 pt-5 sm:pt-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-center">
                  <SessionInsightsPanel
                    session={selectedSession}
                    onClose={() => setMobileInsightsOpen(false)}
                    mobile
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function SessionsFiltersForm({
  carClasses,
  cars,
  tracks,
  filters,
  defaultCarClassId,
  onApply,
  onReset,
}: {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  filters: SessionConsoleFilters;
  defaultCarClassId?: string;
  onApply: (filters: SessionConsoleFilters) => void;
  onReset: () => void;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [carClassId, setCarClassId] = useState(filters.carClassId ?? defaultCarClassId ?? '');
  const [carId, setCarId] = useState(filters.carId ?? '');
  const [trackId, setTrackId] = useState(filters.trackId ?? '');
  const hasMountedRef = useRef(false);

  const filteredCars = useMemo(() => {
    if (!carClassId) {
      return cars;
    }

    return cars.filter((car) => car.carClassId === carClassId);
  }, [carClassId, cars]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    const normalizedCarClassId = carClassId || defaultCarClassId || undefined;
    const normalizedCarId = carId || undefined;
    const normalizedTrackId = trackId || undefined;

    if (
      normalizedCarClassId === (filters.carClassId ?? defaultCarClassId ?? undefined) &&
      normalizedCarId === (filters.carId ?? undefined) &&
      normalizedTrackId === (filters.trackId ?? undefined)
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onApply({
        carClassId: normalizedCarClassId,
        carId: normalizedCarId,
        trackId: normalizedTrackId,
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [
    carClassId,
    carId,
    defaultCarClassId,
    filters.carClassId,
    filters.carId,
    filters.trackId,
    onApply,
    trackId,
  ]);

  function applyImmediate(next: Partial<SessionConsoleFilters>) {
    onApply({
      carClassId: carClassId || defaultCarClassId || undefined,
      carId: carId || undefined,
      trackId: trackId || undefined,
      ...next,
    });
  }

  function resetFilters() {
    setCarClassId(defaultCarClassId ?? '');
    setCarId('');
    setTrackId('');
    onReset();
  }

  return (
    <div className="hairline-divider border-b px-4 py-2.5 lg:px-6">
      <div className="grid gap-1.5 xl:grid-cols-[minmax(160px,0.85fr)_minmax(170px,1fr)_minmax(145px,0.85fr)]">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((value) => !value)}
          className="min-h-9 rounded-[0.8rem] border border-white/8 bg-white/[0.03] px-3 text-sm text-white/80 xl:hidden"
        >
          Filtros
        </button>
        <select
          value={carClassId}
          onChange={(event) => {
            const nextCarClassId = event.target.value;
            const nextCarId = cars.some(
              (car) => car.id === carId && car.carClassId === nextCarClassId,
            )
              ? carId || undefined
              : undefined;
            setCarClassId(nextCarClassId);
            setCarId(nextCarId ?? '');
            applyImmediate({
              carClassId: nextCarClassId || defaultCarClassId || undefined,
              carId: nextCarId,
            });
          }}
          className="input-surface hidden min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none xl:block"
        >
          <option value="">Clase</option>
          {carClasses.map((carClass) => (
            <option key={carClass.id} value={carClass.id}>
              {carClass.name}
            </option>
          ))}
        </select>
        <select
          value={carId}
          onChange={(event) => {
            const nextCarId = event.target.value || undefined;
            setCarId(event.target.value);
            applyImmediate({ carId: nextCarId });
          }}
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
          value={trackId}
          onChange={(event) => {
            const nextTrackId = event.target.value || undefined;
            setTrackId(event.target.value);
            applyImmediate({ trackId: nextTrackId });
          }}
          className="input-surface hidden min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none xl:block"
        >
          <option value="">Circuito</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      {activeFilterSummary(filters) ? (
        <p className="mt-1.5 text-[11px] text-white/42 xl:hidden">{activeFilterSummary(filters)}</p>
      ) : null}

      {mobileFiltersOpen ? (
        <div className="mt-2 rounded-[0.95rem] border border-white/8 bg-white/[0.025] p-3 xl:hidden">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <select
              value={carClassId}
              onChange={(event) => {
                const nextCarClassId = event.target.value;
                setCarClassId(nextCarClassId);
                setCarId('');
                applyImmediate({
                  carClassId: nextCarClassId || defaultCarClassId || undefined,
                  carId: undefined,
                });
              }}
              className="input-surface min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
            >
              <option value="">Clase</option>
              {carClasses.map((carClass) => (
                <option key={carClass.id} value={carClass.id}>
                  {carClass.name}
                </option>
              ))}
            </select>
            <select
              value={carId}
              onChange={(event) => {
                const nextCarId = event.target.value || undefined;
                setCarId(event.target.value);
                applyImmediate({ carId: nextCarId });
              }}
              className="input-surface min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
            >
              <option value="">Coche</option>
              {filteredCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
            <select
              value={trackId}
              onChange={(event) => {
                const nextTrackId = event.target.value || undefined;
                setTrackId(event.target.value);
                applyImmediate({ trackId: nextTrackId });
              }}
              className="input-surface min-h-9 rounded-[0.8rem] border-white/10 px-3 text-[13px] text-white outline-none"
            >
              <option value="">Circuito</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-9 rounded-[0.8rem] border border-white/10 bg-white/[0.03] px-3 text-[13px] text-white/75"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function activeFilterSummary(filters: SessionConsoleFilters) {
  const items = [filters.carId ? 'coche' : null, filters.trackId ? 'circuito' : null].filter(
    Boolean,
  );

  return items.length > 0 ? `Filtros activos: ${items.join(', ')}` : null;
}

function DataLine({ label, value, muted }: { label: string; value: string; muted?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted lg:hidden">
        {label}
      </p>
      <p className="truncate text-[15px] leading-6 text-white lg:text-sm" title={value}>
        {value}
      </p>
      {muted ? (
        <p className="truncate text-xs text-white/50 lg:mt-1 lg:text-sm lg:text-white/55">
          {muted}
        </p>
      ) : null}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/52">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function PositionDeltaLine({ value }: { value: number | null }) {
  const formattedValue = formatPositionDelta(value);
  const valueClassName =
    value === null
      ? 'text-white'
      : value > 0
        ? 'text-emerald-300'
        : value < 0
          ? 'text-[#f3b4aa]'
          : 'text-white';

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/52">Posiciones ganadas</span>
      <span className={`font-medium ${valueClassName}`}>{formattedValue}</span>
    </div>
  );
}

function SubtleTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
      {children}
    </span>
  );
}

function SessionInsightsPanel({
  session,
  onClose,
  mobile = false,
}: {
  session: SessionSummary | null;
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

      {session ? (
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-md border border-white/8 px-4 py-4">
            <p className="line-clamp-2 text-base font-medium leading-6 text-white">
              {session.name}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {session.linkedSetupName ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Setup
                  </span>
                  <span className="truncate text-right text-white/72">
                    {session.linkedSetupName}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Piloto
                </span>
                <span className="truncate text-right text-white/72">{session.driverName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Tipo
                </span>
                <span className="truncate text-right text-white/72">
                  {formatSessionType(session.sessionType)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Coche
                </span>
                <span className="truncate text-right text-white/72">
                  {[session.manufacturerName, session.carName].filter(Boolean).join(' ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Circuito
                </span>
                <span className="truncate text-right text-white/72">{session.trackName}</span>
              </div>
              {session.finishStatus ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Estado
                  </span>
                  <span className="truncate text-right text-white/72">{session.finishStatus}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-white/8 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Resumen
            </p>
            <div className="mt-4 space-y-3">
              <MetricLine label="Mejor vuelta" value={formatLapTime(session.bestLapMs)} />
              <PositionDeltaLine value={session.positionGain} />
              <MetricLine label="Salida" value={session.gridPos ?? 'No definido'} />
              <MetricLine label="Llegada" value={session.finishPos ?? 'No definido'} />
              <MetricLine label="Vueltas" value={session.lapsCompleted ?? 'No definido'} />
              {session.pitstops !== 0 ? (
                <MetricLine label="Pitstops" value={session.pitstops ?? 'No definido'} />
              ) : null}
            </div>
          </div>

          <Link
            href={`${routes.sessions}/${session.id}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-[1.05rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
          >
            Más detalles
          </Link>
        </div>
      ) : (
        <div className="px-4 py-8 text-sm text-muted">
          Selecciona una sesión para ver su resumen, resultado y archivo de origen.
        </div>
      )}
    </aside>
  );
}
