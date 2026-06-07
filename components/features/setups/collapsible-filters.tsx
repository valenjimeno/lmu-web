'use client';

import { useMemo, useState } from 'react';
import Form from 'next/form';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { routes } from '@/lib/constants/routes';
import { getTrackDisplayName } from '@/lib/utils/track-display';
import type { TrackOption } from '@/services/catalog.service';
import type { Database } from '@/types/database.types';

type Option = {
  id: string;
  name: string;
};

type CollapsibleFiltersProps = {
  cars: Option[];
  tracks: TrackOption[];
  filters: {
    query?: string;
    carId?: string;
    trackId?: string;
    setupType?: Database['public']['Enums']['setup_type'];
    favoriteOnly?: boolean;
  };
  hasActiveFilters: boolean;
  activeFilterCount: number;
};

export function CollapsibleFilters({
  cars,
  tracks,
  filters,
  hasActiveFilters,
  activeFilterCount,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  const filtersFormKey = useMemo(
    () =>
      JSON.stringify({
        query: filters.query ?? '',
        carId: filters.carId ?? '',
        trackId: filters.trackId ?? '',
        setupType: filters.setupType ?? '',
        favoriteOnly: filters.favoriteOnly ? '1' : '',
      }),
    [filters],
  );

  return (
    <section className="app-shell-card rounded-[1.8rem] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={isOpen}
        aria-controls="setups-filters-panel"
      >
        <div>
          <p className="section-kicker font-semibold">Filtros</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
            Control de búsqueda
          </h3>
          <p className="mt-1 text-sm text-muted">
            Busca, acota por coche y circuito o deja solo los setups destacados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
              hasActiveFilters
                ? 'border-[rgba(215,170,109,0.2)] bg-[rgba(215,170,109,0.11)] text-[#f1d19d]'
                : 'border-white/10 bg-white/[0.04] text-muted'
            }`}
          >
            {hasActiveFilters ? `${activeFilterCount} activos` : 'Sin filtros'}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted">
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>

      {isOpen ? (
        <Form
          action={routes.setups}
          key={filtersFormKey}
          id="setups-filters-panel"
          className="mt-5 space-y-3"
        >
          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.9fr_0.9fr_0.7fr_auto_auto] lg:items-end">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Buscar
              </span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Nombre o notas"
                className="input-surface w-full rounded-[1.2rem] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Coche
              </span>
              <select
                name="carId"
                defaultValue={filters.carId ?? ''}
                className="input-surface w-full rounded-[1.2rem] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]"
              >
                <option value="">Todos los coches</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Circuito
              </span>
              <select
                name="trackId"
                defaultValue={filters.trackId ?? ''}
                className="input-surface w-full rounded-[1.2rem] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]"
              >
                <option value="">Todos los circuitos</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {getTrackDisplayName(track)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Tipo
              </span>
              <select
                name="setupType"
                defaultValue={filters.setupType ?? ''}
                className="input-surface w-full rounded-[1.2rem] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]"
              >
                <option value="">Todos</option>
                <option value="fixed">Fixed</option>
                <option value="open">Open</option>
              </select>
            </label>

            <label className="flex min-h-12 items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                name="favoriteOnly"
                value="1"
                defaultChecked={filters.favoriteOnly}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-[var(--accent)]"
              />
              <span>Solo favoritos</span>
            </label>

            <div className="flex gap-2 lg:justify-end">
              <SubmitButton pendingLabel="Aplicando..." className="flex-1 px-4 lg:flex-none">
                Aplicar
              </SubmitButton>
              {hasActiveFilters ? (
                <Button
                  href={routes.setups}
                  asChild
                  variant="secondary"
                  className="flex-1 px-4 lg:flex-none"
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>
        </Form>
      ) : null}
    </section>
  );
}
