import { Button } from '@/components/ui/button';
import type { DashboardFilters, DriverOverviewData } from '@/services/dashboard.service';

type DashboardFiltersProps = {
  filters: DriverOverviewData['resolvedFilters'];
  options: DriverOverviewData['filterOptions'];
};

function isOptionSelected<T extends { id: string }>(options: T[], value: string | undefined) {
  return value ? options.some((option) => option.id === value) : false;
}

export function DashboardFilters({ filters, options }: DashboardFiltersProps) {
  const carsForSelectedClass = filters.carClassId
    ? options.cars.filter((car) => car.carClassId === filters.carClassId)
    : options.cars;
  const selectedCarId = isOptionSelected(carsForSelectedClass, filters.carId) ? filters.carId : '';
  const selectedTrackId = isOptionSelected(options.tracks, filters.trackId) ? filters.trackId : '';
  const selectedClassId = isOptionSelected(options.carClasses, filters.carClassId)
    ? filters.carClassId
    : '';

  return (
    <form className="app-shell-card rounded-[1.8rem] p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-kicker font-semibold">Scope</p>
            <h3 className="editorial-title mt-2 text-2xl text-white">Filtra la lectura</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Cambia coche, pista, origen o ventana temporal para mirar si tu mejora es real o sólo
              depende del contexto.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="secondary">
              Aplicar filtros
            </Button>
            <Button asChild href="/dashboard" variant="ghost">
              Limpiar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Tipo de sesión
            </span>
            <select
              name="sourceSessionSetting"
              defaultValue={filters.sourceSessionSetting}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            >
              {options.sessionSettings.map((setting) => (
                <option key={setting.id} value={setting.id}>
                  {setting.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Clase
            </span>
            <select
              name="carClassId"
              defaultValue={selectedClassId}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            >
              <option value="">Todas</option>
              {options.carClasses.map((carClass) => (
                <option key={carClass.id} value={carClass.id}>
                  {carClass.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Coche
            </span>
            <select
              name="carId"
              defaultValue={selectedCarId}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            >
              <option value="">Todos</option>
              {carsForSelectedClass.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Circuito
            </span>
            <select
              name="trackId"
              defaultValue={selectedTrackId}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            >
              <option value="">Todos</option>
              {options.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Desde
            </span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom ?? ''}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Hasta
            </span>
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ''}
              className="input-surface min-h-11 w-full rounded-[1rem] px-4 text-sm text-white outline-none"
            />
          </label>
        </div>
      </div>
    </form>
  );
}
