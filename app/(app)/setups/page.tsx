import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CollapsibleFilters } from '@/components/features/setups/collapsible-filters';
import { CreateSetupModal } from '@/components/features/setups/create-setup-modal';
import { FavoriteToggleButton } from '@/components/features/setups/favorite-toggle-button';
import {
  getBrandMark,
  SetupBadge,
  SetupEmblem,
  SetupMetricPill,
} from '@/components/features/setups/setup-ui';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import { formatBrakeBiasSplit, formatDate, formatMetricValue } from '@/lib/utils/setup-formatters';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getSetupPageData } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

type SetupsPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    query?: string;
    carId?: string;
    trackId?: string;
    setupType?: Database['public']['Enums']['setup_type'];
    favoriteOnly?: string;
    page?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_setup: 'Completa nombre, coche, circuito y tipo de setup para poder guardarlo.',
  invalid_setup_values:
    'Brake Bias, ABS y los controles de tracción deben ser números válidos o quedarse vacíos.',
  create_failed: 'No hemos podido guardar el setup. Inténtalo de nuevo en unos segundos.',
};

const SETUPS_PAGE_SIZE = 5;

export default async function SetupsPage({ searchParams }: SetupsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) {
    redirect(routes.login);
  }

  const filters = {
    query: resolvedSearchParams.query?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
    setupType:
      resolvedSearchParams.setupType === 'fixed' || resolvedSearchParams.setupType === 'open'
        ? resolvedSearchParams.setupType
        : undefined,
    favoriteOnly: resolvedSearchParams.favoriteOnly === '1',
  };
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? '1', 10) || 1);

  const hasActiveFilters = Boolean(
    filters.query || filters.carId || filters.trackId || filters.setupType,
  );
  const activeFilterCount = [
    filters.query,
    filters.carId,
    filters.trackId,
    filters.setupType,
    filters.favoriteOnly,
  ].filter(Boolean).length;

  const { cars, tracks, setups, totalCount, page, pageSize } = await getSetupPageData(
    user.id,
    filters,
    {
      page: currentPage,
      pageSize: SETUPS_PAGE_SIZE,
    },
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalCount);

  const feedbackMessage = resolvedSearchParams.created
    ? 'Setup creado correctamente y guardado en tu biblioteca privada.'
    : resolvedSearchParams.deleted
      ? 'Setup eliminado correctamente de tu biblioteca.'
      : resolvedSearchParams.error
        ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
        : undefined;

  const feedbackTone = resolvedSearchParams.error ? 'text-[#ffb7aa]' : 'text-[#ffcf9e]';

  function buildSetupsPageHref(nextPage: number) {
    const params = new URLSearchParams();

    if (filters.query) {
      params.set('query', filters.query);
    }

    if (filters.carId) {
      params.set('carId', filters.carId);
    }

    if (filters.trackId) {
      params.set('trackId', filters.trackId);
    }

    if (filters.setupType) {
      params.set('setupType', filters.setupType);
    }

    if (filters.favoriteOnly) {
      params.set('favoriteOnly', '1');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    }

    const query = params.toString();
    return query ? `${routes.setups}?${query}` : routes.setups;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3 px-1">
        <p className="section-kicker text-xs font-semibold">Setup garage</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Tus setups</h2>
      </div>

      {feedbackMessage ? (
        <div
          className={`rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-3 text-sm ${feedbackTone}`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <CollapsibleFilters
        cars={cars}
        tracks={tracks}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
      />

      <div className="grid gap-6">
        <section className="app-shell-card rounded-[2rem] p-5 sm:p-6">
          <div className="hairline-divider flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker text-xs font-semibold">Biblioteca privada</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Tus setups</h3>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <p className="text-sm text-muted">
                {totalCount} {totalCount === 1 ? 'setup guardado' : 'setups guardados'}
              </p>
              <CreateSetupModal cars={cars} tracks={tracks} />
            </div>
          </div>

          {setups.length === 0 ? (
            <div className="mt-5 flex min-h-64 items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-white/4 p-8 text-center">
              <div className="max-w-md space-y-3">
                <p className="text-sm font-medium text-[#ffbc7e]">
                  {hasActiveFilters ? 'Sin resultados con estos filtros' : 'Todavía sin setups'}
                </p>
                <h4 className="text-2xl font-semibold tracking-tight text-white">
                  {hasActiveFilters
                    ? 'Prueba a ampliar la búsqueda'
                    : 'Empieza con tu primera configuración'}
                </h4>
                <p className="text-sm leading-7 text-muted">
                  {hasActiveFilters
                    ? 'Cambia coche, circuito, tipo o texto para encontrar setups compatibles.'
                    : 'Crea un setup desde el formulario y aparecerá aquí con su coche, circuito y tipo.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {setups.map((setup) => (
                <article
                  key={setup.id}
                  className="group app-shell-card block rounded-[1.55rem] p-4 transition duration-200 hover:bg-white/8 hover:ring-2 hover:ring-[#ff8a3db3] hover:ring-offset-0 hover:shadow-[0_20px_44px_rgba(255,98,31,0.12)] focus:outline-none focus:ring-2 focus:ring-accent/40 sm:p-4.5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] border border-white/10 bg-black/25 text-sm font-semibold text-white">
                          {getBrandMark(setup.manufacturerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <SetupBadge tone="accent">{setup.setupType}</SetupBadge>
                            <SetupBadge>{setup.visibility}</SetupBadge>
                            <SetupBadge>{setup.carClassName}</SetupBadge>
                            {setup.isFavorite ? (
                              <SetupBadge tone="success">Favorite</SetupBadge>
                            ) : null}
                          </div>
                          <Link
                            href={`${routes.setups}/${setup.id}`}
                            className="mt-2 block line-clamp-1 text-lg font-semibold tracking-tight text-white transition group-hover:text-[#ffd6b4]"
                          >
                            {setup.name}
                          </Link>
                          <p className="mt-1 line-clamp-1 text-sm text-muted">
                            {setup.manufacturerName} · {setup.carName} · {setup.trackName}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <FavoriteToggleButton
                          setupId={setup.id}
                          isFavorite={setup.isFavorite}
                          returnTo={buildSetupsPageHref(page)}
                        />
                        <Link
                          href={`${routes.setups}/${setup.id}`}
                          className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-white/14 hover:text-white"
                        >
                          Abrir
                        </Link>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <SetupEmblem label="Fabricante" value={setup.manufacturerName} />
                      <SetupEmblem label="Track" value={setup.trackName} />
                      <div className="rounded-[1.15rem] border border-white/8 bg-white/4 px-3 py-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
                          Actualizado
                        </p>
                        <p className="mt-1 whitespace-nowrap text-sm font-semibold text-foreground">
                          {formatDate(setup.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {setup.notes ? (
                      <p className="line-clamp-2 text-sm leading-6 text-muted">{setup.notes}</p>
                    ) : null}

                    <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                      <SetupMetricPill
                        label="Brake Bias"
                        value={formatBrakeBiasSplit(setup.brakeBias)}
                      />
                      <SetupMetricPill label="ABS" value={formatMetricValue(setup.abs)} />
                      <SetupMetricPill
                        label="ONBOARD TC"
                        value={formatMetricValue(setup.onboardTc)}
                      />
                      <SetupMetricPill
                        label="TC POWER CUT"
                        value={formatMetricValue(setup.tcPowerCut)}
                      />
                      <SetupMetricPill
                        label="TC SLIP ANGLE"
                        value={formatMetricValue(setup.tcSlipAngle)}
                      />
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalCount > pageSize ? (
            <div className="hairline-divider mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Mostrando {pageStart}-{pageEnd} de {totalCount}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button href={buildSetupsPageHref(page - 1)} asChild variant="secondary">
                    Anterior
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="pointer-events-none opacity-45"
                  >
                    Anterior
                  </Button>
                )}

                {page < totalPages ? (
                  <Button href={buildSetupsPageHref(page + 1)} asChild>
                    Siguiente
                  </Button>
                ) : (
                  <Button type="button" className="pointer-events-none opacity-45">
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
