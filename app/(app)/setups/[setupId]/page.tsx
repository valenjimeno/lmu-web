import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { updateSetupAction } from '@/app/(app)/setups/actions';
import { DeleteSetupDialog } from '@/components/features/setups/delete-setup-dialog';
import { RangeField } from '@/components/features/setups/range-field';
import {
  getBrandMark,
  SetupBadge,
  SetupEmblem,
  SetupMetricCard,
} from '@/components/features/setups/setup-ui';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import { formatBrakeBiasSplit, formatDate, formatMetricValue } from '@/lib/utils/setup-formatters';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getSetupDetail } from '@/services/setup.service';

type SetupDetailPageProps = {
  params: Promise<{
    setupId: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    saved?: string;
    error?: string;
  }>;
};

const selectClassName =
  'input-surface w-full rounded-[1.35rem] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20';

const textareaClassName =
  'input-surface min-h-32 w-full rounded-[1.35rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20';

const errorMessages: Record<string, string> = {
  invalid_setup: 'Necesitamos un nombre valido y un tipo correcto para guardar el setup.',
  invalid_setup_values: 'Brake Bias, ABS y los controles de traccion deben ser numeros validos.',
  update_failed: 'No hemos podido guardar los cambios. Intentalo de nuevo en unos segundos.',
  delete_confirmation_required:
    'Para borrar el setup tienes que marcar la confirmacion y escribir ELIMINAR.',
  delete_failed: 'No hemos podido borrar el setup. Intentalo de nuevo en unos segundos.',
};

export default async function SetupDetailPage({ params, searchParams }: SetupDetailPageProps) {
  const [user, resolvedParams, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    params,
    searchParams,
  ]);

  if (!user) {
    redirect(routes.login);
  }

  const setup = await getSetupDetail(user.id, resolvedParams.setupId);

  if (!setup) {
    notFound();
  }

  const isEditMode = resolvedSearchParams.edit === '1';

  const feedbackMessage = resolvedSearchParams.saved
    ? 'Cambios guardados correctamente. La fecha de modificacion se ha actualizado.'
    : resolvedSearchParams.error
      ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
      : undefined;

  const feedbackTone = resolvedSearchParams.error ? 'text-[#ffb7aa]' : 'text-[#ffcf9e]';

  return (
    <section className="space-y-6">
      <div className="app-hero rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link href={routes.setups} className="text-sm font-semibold text-[#ffbc7e]">
              Volver a setups
            </Link>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-black/25 text-lg font-semibold text-white">
                {getBrandMark(setup.manufacturerName)}
              </div>
              <div>
                <p className="section-kicker text-xs font-semibold">Detalle del setup</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {setup.name}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                  {setup.carClassName} · {setup.carName} · {setup.trackName}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SetupBadge tone="accent">{setup.setupType}</SetupBadge>
                  <SetupBadge>{setup.visibility}</SetupBadge>
                  <SetupBadge>{setup.carClassName}</SetupBadge>
                  <SetupBadge>{setup.manufacturerName}</SetupBadge>
                  {setup.isFavorite ? <SetupBadge tone="success">Favorite</SetupBadge> : null}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isEditMode ? (
              <Button href={`${routes.setups}/${setup.id}`} asChild variant="secondary">
                Cancelar edición
              </Button>
            ) : (
              <Button href={`${routes.setups}/${setup.id}?edit=1`} asChild>
                Editar setup
              </Button>
            )}
            <Button href={routes.setups} asChild variant="secondary">
              Volver a la biblioteca
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="app-shell-card rounded-[2rem] p-5 sm:p-6">
          {feedbackMessage ? (
            <div
              className={`mb-6 rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-3 text-sm ${feedbackTone}`}
            >
              {feedbackMessage}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <SetupEmblem label="Fabricante" value={setup.manufacturerName} />
            <SetupEmblem label="Track" value={setup.trackName} />
          </div>

          {isEditMode ? (
            <div className="mt-6 space-y-6">
              <form action={updateSetupAction} className="space-y-5">
                <input type="hidden" name="setupId" value={setup.id} />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Nombre</span>
                  <input
                    name="name"
                    required
                    defaultValue={setup.name}
                    className={selectClassName}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select
                    name="setupType"
                    defaultValue={setup.setupType}
                    className={selectClassName}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="open">Open</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Notas</span>
                  <textarea
                    name="notes"
                    defaultValue={setup.notes ?? ''}
                    placeholder="Anade ajustes, sensaciones o condiciones de pista..."
                    className={textareaClassName}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeField
                    name="brakeBias"
                    label="Brake Bias"
                    min={0}
                    max={100}
                    step={0.2}
                    value={setup.brakeBias ?? 54}
                    defaultValue={54}
                    decimals={1}
                    showRemainingToMax
                  />
                  <RangeField name="abs" label="ABS" value={setup.abs ?? 5} />
                  <RangeField name="onboardTc" label="ONBOARD TC" value={setup.onboardTc ?? 5} />
                  <RangeField
                    name="tcPowerCut"
                    label="TC POWER CUT"
                    value={setup.tcPowerCut ?? 5}
                  />
                </div>

                <RangeField
                  name="tcSlipAngle"
                  label="TC SLIP ANGLE"
                  value={setup.tcSlipAngle ?? 5}
                />

                <Button type="submit" className="w-full sm:w-auto">
                  Guardar cambios
                </Button>
              </form>

              <section className="rounded-[1.6rem] border border-[#ff6b5733] bg-[#ff6b5710] p-4 sm:p-5">
                <p className="text-sm font-semibold text-[#ffb7aa]">Eliminar setup</p>
                <p className="mt-2 text-sm leading-7 text-[#ffb7aa]">
                  Esta acción es irreversible. Si decides continuar, te pediremos confirmación en un
                  popup antes de borrar el setup.
                </p>
                <div className="mt-4">
                  <DeleteSetupDialog setupId={setup.id} setupName={setup.name} />
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <SetupMetricCard label="Brake Bias" value={formatBrakeBiasSplit(setup.brakeBias)} />
                <SetupMetricCard label="ABS" value={formatMetricValue(setup.abs)} />
                <SetupMetricCard label="ONBOARD TC" value={formatMetricValue(setup.onboardTc)} />
                <SetupMetricCard label="TC POWER CUT" value={formatMetricValue(setup.tcPowerCut)} />
                <SetupMetricCard
                  label="TC SLIP ANGLE"
                  value={formatMetricValue(setup.tcSlipAngle)}
                  className="sm:col-span-2"
                />
              </dl>

              <section className="rounded-[1.35rem] border border-white/8 bg-white/4 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Notas del setup
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {setup.notes ?? 'Este setup todavía no tiene notas añadidas.'}
                </p>
              </section>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="app-shell-card rounded-[2rem] p-5 sm:p-6">
            <p className="section-kicker text-xs font-semibold">Ficha</p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Clase del coche
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{setup.carClassName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Fabricante
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {setup.manufacturerName}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Modelo
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{setup.carName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Circuito
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{setup.trackName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Fecha de creacion
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(setup.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Fecha de modificacion
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(setup.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  );
}
