import type { DriverOverviewData } from '@/services/dashboard.service';

type CleanlinessPanelProps = {
  cleanliness: DriverOverviewData['cleanliness'];
};

function formatRate(value: number | null) {
  return value === null ? 'No definido' : `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null) {
  return value === null
    ? 'No definido'
    : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

export function CleanlinessPanel({ cleanliness }: CleanlinessPanelProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Clean Racing</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Bloque de limpieza</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Si quieres progresar como piloto, no basta con ritmo. Aquí ves cuánto te cuesta cada
            sesión en errores, sanciones y límites de pista.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel-dark rounded-[1.4rem] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Incidentes / sesión
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatDecimal(cleanliness.incidentsPerSession)}
          </p>
        </article>
        <article className="panel-dark rounded-[1.4rem] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Penalizaciones / sesión
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatDecimal(cleanliness.penaltiesPerSession)}
          </p>
        </article>
        <article className="panel-dark rounded-[1.4rem] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Track limits / sesión
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatDecimal(cleanliness.trackLimitsPerSession)}
          </p>
        </article>
        <article className="panel-dark rounded-[1.4rem] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Sesiones limpias
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatRate(cleanliness.cleanSessionRate)}
          </p>
        </article>
      </div>
    </article>
  );
}
