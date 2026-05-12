import { redirect } from 'next/navigation';
import { createSetupAction } from '@/app/(app)/setups/actions';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getSetupPageData } from '@/services/setup.service';

type SetupsPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
};

const selectClassName =
  'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent';

const textareaClassName =
  'min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent';

const errorMessages: Record<string, string> = {
  invalid_setup: 'Completa nombre, coche, circuito y tipo de setup para poder guardarlo.',
  create_failed: 'No hemos podido guardar el setup. Inténtalo de nuevo en unos segundos.',
};

export default async function SetupsPage({ searchParams }: SetupsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) {
    redirect(routes.login);
  }

  const { cars, tracks, setups } = await getSetupPageData(user.id);

  const feedbackMessage = resolvedSearchParams.created
    ? 'Setup creado correctamente y guardado en tu biblioteca privada.'
    : resolvedSearchParams.error
      ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
      : undefined;

  const feedbackTone = resolvedSearchParams.error ? 'text-[#8a3d2f]' : 'text-accent';

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-surface-strong/60 p-6 sm:p-8">
        <p className="text-sm font-medium text-accent">Setups</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Crea y organiza tus setups personalizados.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Esta primera versión te deja guardar setups privados asociados a un coche y un circuito.
          La vista está pensada primero para móvil y lista para crecer hacia edición, favoritos y
          compartición por equipos.
        </p>
      </div>

      {feedbackMessage ? (
        <div
          className={`rounded-2xl border border-border bg-surface px-4 py-3 text-sm ${feedbackTone}`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted">Nuevo setup</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Alta rápida</h3>
            <p className="mt-2 text-sm leading-7 text-muted">
              Guardamos el setup como privado para este usuario. Más adelante podremos sumar
              visibilidad por equipo y campos avanzados.
            </p>
          </div>

          <form action={createSetupAction} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Nombre</span>
              <input
                name="name"
                required
                placeholder="Ej. Monza carrera 45 min"
                className={selectClassName}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Coche</span>
              <select name="carId" required defaultValue="" className={selectClassName}>
                <option value="" disabled>
                  Selecciona un coche
                </option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Circuito</span>
              <select name="trackId" required defaultValue="" className={selectClassName}>
                <option value="" disabled>
                  Selecciona un circuito
                </option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Tipo</span>
              <select name="setupType" defaultValue="fixed" className={selectClassName}>
                <option value="fixed">Fixed</option>
                <option value="open">Open</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Notas</span>
              <textarea
                name="notes"
                placeholder="Pista caliente, presión de neumáticos, sensaciones de frenada..."
                className={textareaClassName}
              />
            </label>

            <Button type="submit" className="w-full">
              Crear setup
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Biblioteca privada</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Tus setups</h3>
            </div>
            <p className="text-sm text-muted">
              {setups.length} {setups.length === 1 ? 'setup guardado' : 'setups guardados'}
            </p>
          </div>

          {setups.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-surface-strong/50 p-8 text-center">
              <div className="max-w-md space-y-3">
                <p className="text-sm font-medium text-accent">Todavía sin setups</p>
                <h4 className="text-2xl font-semibold tracking-tight">
                  Empieza con tu primera configuración
                </h4>
                <p className="text-sm leading-7 text-muted">
                  Crea un setup desde el formulario y aparecerá aquí con su coche, circuito y tipo.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {setups.map((setup) => (
                <article
                  key={setup.id}
                  className="rounded-[1.5rem] border border-border bg-surface-strong/50 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">{setup.name}</h4>
                      <p className="mt-1 text-sm text-muted">
                        {setup.carName} · {setup.trackName}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      <span className="rounded-full border border-border bg-surface px-3 py-1">
                        {setup.setupType}
                      </span>
                      <span className="rounded-full border border-border bg-surface px-3 py-1">
                        {setup.visibility}
                      </span>
                    </div>
                  </div>

                  {setup.notes ? (
                    <p className="mt-4 text-sm leading-7 text-muted">{setup.notes}</p>
                  ) : null}

                  <p className="mt-4 text-xs uppercase tracking-[0.12em] text-muted">
                    Creado el{' '}
                    {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(
                      new Date(setup.createdAt),
                    )}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
