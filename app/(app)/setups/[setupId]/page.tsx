import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import {
  duplicateSetupAction,
  importSetupSessionAction,
  updateSetupAction,
} from '@/app/(app)/setups/actions';
import { DeleteSetupDialog } from '@/components/features/setups/delete-setup-dialog';
import { FavoriteToggleButton } from '@/components/features/setups/favorite-toggle-button';
import { ImportSessionForm } from '@/components/features/setups/import-session-form';
import { RangeField } from '@/components/features/setups/range-field';
import {
  getBrandMark,
  SetupBadge,
  SetupEmblem,
  SetupMetricCard,
} from '@/components/features/setups/setup-ui';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';
import {
  formatBrakeBiasSplit,
  formatDate,
  formatLapTime,
  formatMetricValue,
  formatSetupVisibility,
} from '@/lib/utils/setup-formatters';
import { buildBrakeBiasValues } from '@/lib/utils/brake-bias';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getProfilePageData } from '@/services/profile.service';
import { getSetupDetail } from '@/services/setup.service';
import LoadingSetupDetail from './loading';

type SetupDetailPageProps = {
  params: Promise<{
    setupId: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    duplicate?: string;
    duplicated?: string;
    imported?: string;
    saved?: string;
    error?: string;
  }>;
};

const selectClassName =
  'input-surface min-h-11 w-full rounded-[0.95rem] border-white/10 px-4 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const textareaClassName =
  'input-surface min-h-32 w-full rounded-[0.95rem] border-white/10 px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const errorMessages: Record<string, string> = {
  invalid_setup: 'Necesitamos un nombre valido, un tipo correcto y una visibilidad valida.',
  invalid_setup_values: 'Brake Bias, ABS y los controles de traccion deben ser numeros validos.',
  update_failed: 'No hemos podido guardar los cambios. Intentalo de nuevo en unos segundos.',
  duplicate_failed: 'No hemos podido crear la copia. Intentalo de nuevo en unos segundos.',
  import_invalid_xml: 'No hemos podido leer el XML. Revisa el fichero e inténtalo de nuevo.',
  import_driver_not_found:
    'No hemos encontrado el piloto seleccionado en el XML. Elige otro nombre del listado.',
  import_duplicate_session:
    'Este XML ya estaba importado para este setup. Si quieres reimportarlo, usa otro fichero.',
  import_failed: 'No hemos podido importar la sesión. Inténtalo de nuevo en unos segundos.',
  delete_confirmation_required:
    'Para borrar el setup tienes que marcar la confirmacion y escribir ELIMINAR.',
  delete_failed: 'No hemos podido borrar el setup. Intentalo de nuevo en unos segundos.',
};

export default function SetupDetailPage({ params, searchParams }: SetupDetailPageProps) {
  return (
    <Suspense fallback={<LoadingSetupDetail />}>
      <SetupDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SetupDetailContent({ params, searchParams }: SetupDetailPageProps) {
  const [user, resolvedParams, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    params,
    searchParams,
  ]);

  if (!user) {
    redirect(routes.login);
  }

  const [setup, profilePageData] = await Promise.all([
    getSetupDetail(user.id, resolvedParams.setupId),
    getProfilePageData(user.id),
  ]);

  if (!setup) {
    notFound();
  }

  const isDuplicateMode = resolvedSearchParams.duplicate === '1';
  const isEditMode = resolvedSearchParams.edit === '1' || isDuplicateMode;

  const feedbackMessage = resolvedSearchParams.duplicated
    ? 'Copia creada correctamente. Ya puedes seguir afinando este setup sin tocar el original.'
    : resolvedSearchParams.imported
      ? 'Sesión importada correctamente. Ya puedes usarla para validar y enriquecer este setup.'
      : resolvedSearchParams.saved
        ? 'Cambios guardados correctamente. La fecha de modificacion se ha actualizado.'
        : resolvedSearchParams.error
          ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
          : undefined;

  const feedbackTone = resolvedSearchParams.error ? 'text-[#f3b4aa]' : 'text-[#edd1a3]';
  const detailPath = `${routes.setups}/${setup.id}`;
  const favoriteReturnTo = isEditMode ? `${detailPath}?edit=1` : detailPath;
  const preferredDriverNames = [
    profilePageData.profile?.firstName && profilePageData.profile?.lastName
      ? `${profilePageData.profile.firstName} ${profilePageData.profile.lastName}`
      : null,
    profilePageData.profile?.nickname ?? null,
    setup.ownerDisplayName,
  ].filter((value): value is string => Boolean(value?.trim()));

  return (
    <section className="space-y-6">
      <div className="panel-dark rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <Link href={routes.setups} className="text-sm font-semibold text-[#edd1a3]">
              Volver a setups
            </Link>
            <div className="flex items-start gap-4">
              <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.03] text-lg font-semibold text-white">
                {getBrandMark(setup.manufacturerName)}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                  Workspace del setup
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {setup.name}
                </h2>
                <p className="text-sm leading-7 text-muted">
                  {setup.carClassName} · {setup.manufacturerName} {setup.carName} ·{' '}
                  {setup.trackName}
                </p>
                <div className="flex flex-wrap gap-2">
                  <SetupBadge tone="accent">{setup.setupType}</SetupBadge>
                  <SetupBadge>{formatSetupVisibility(setup.visibility)}</SetupBadge>
                  <SetupBadge>{setup.carClassName}</SetupBadge>
                  <SetupBadge>{setup.manufacturerName}</SetupBadge>
                  {setup.isFavorite ? <SetupBadge tone="success">Favorite</SetupBadge> : null}
                </div>
                <div className="grid gap-2 pt-1 sm:grid-cols-3">
                  <SetupEmblem label="Última edición" value={formatDate(setup.updatedAt)} />
                  <SetupEmblem label="Circuito" value={setup.trackName} />
                  <SetupEmblem
                    label="Ajuste principal"
                    value={`BB ${formatBrakeBiasSplit(setup.brakeBias)}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isEditMode ? (
              <Button href={detailPath} asChild variant="secondary">
                {isDuplicateMode ? 'Cancelar duplicado' : 'Cancelar edición'}
              </Button>
            ) : (
              <Button href={`${detailPath}?edit=1`} asChild>
                Editar setup
              </Button>
            )}
            <Button href={routes.setups} asChild variant="secondary">
              Volver a la biblioteca
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
        <section className="space-y-6">
          {feedbackMessage ? (
            <div
              className={`rounded-[1.4rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm ${feedbackTone}`}
            >
              {feedbackMessage}
            </div>
          ) : null}

          {!isEditMode ? (
            <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                  Importación
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-white">
                  Importar sesión XML
                </h3>
                <p className="max-w-2xl text-sm leading-7 text-muted">
                  Sube un XML de resultados para vincular una sesión real a este setup. Si no
                  encontramos tu piloto automáticamente, te dejaremos elegir qué nombre importar.
                </p>
              </div>

              <div className="mt-6">
                <ImportSessionForm
                  action={importSetupSessionAction}
                  setupId={setup.id}
                  importedSessionHashes={[]}
                  preferredDriverNames={preferredDriverNames}
                />
              </div>
            </section>
          ) : null}

          {isEditMode ? (
            <form
              action={isDuplicateMode ? duplicateSetupAction : updateSetupAction}
              className="space-y-6"
            >
              <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
                {isDuplicateMode ? (
                  <input type="hidden" name="sourceSetupId" value={setup.id} />
                ) : (
                  <input type="hidden" name="setupId" value={setup.id} />
                )}
                <input type="hidden" name="carId" value={setup.carId} />
                <input type="hidden" name="trackId" value={setup.trackId} />
                <input
                  type="hidden"
                  name="raceDurationMinutes"
                  value={setup.raceDurationMinutes ?? ''}
                />
                <input type="hidden" name="weatherSummary" value={setup.weatherSummary ?? 'sun'} />

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                      {isDuplicateMode ? 'Duplicado' : 'Edición'}
                    </p>
                    <h3 className="text-2xl font-semibold tracking-tight text-white">
                      {isDuplicateMode ? 'Crear copia del setup' : 'Resumen del setup'}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-muted">
                      {isDuplicateMode
                        ? 'Partimos de este setup como base. Ajusta lo que necesites y solo guardaremos un setup nuevo cuando confirmes la copia.'
                        : 'Ajusta el nombre, el tipo y el contexto general antes de entrar a los controles del coche.'}
                    </p>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    {isDuplicateMode ? 'Guardar copia' : 'Guardar cambios'}
                  </Button>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="space-y-5">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-foreground">Nombre</span>
                      <input
                        name="name"
                        required
                        defaultValue={isDuplicateMode ? `${setup.name} (copia)` : setup.name}
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
                      <span className="text-sm font-medium text-foreground">Visibilidad</span>
                      <select
                        name="visibility"
                        defaultValue={setup.visibility}
                        className={selectClassName}
                      >
                        <option value="private">{formatSetupVisibility('private')}</option>
                        <option value="public">{formatSetupVisibility('public')}</option>
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-foreground">Notas</span>
                      <textarea
                        name="notes"
                        defaultValue={setup.notes ?? ''}
                        placeholder="Añade ajustes, sensaciones o condiciones de pista..."
                        className={textareaClassName}
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-foreground">Personal Best</span>
                      <input
                        name="bestLap"
                        inputMode="numeric"
                        defaultValue={
                          setup.bestLapMs !== null ? formatLapTime(setup.bestLapMs) : ''
                        }
                        placeholder="01:41:352"
                        className={selectClassName}
                      />
                    </label>
                  </div>

                  <div className="space-y-2 rounded-[1.1rem] border border-white/8 bg-white/[0.025] p-3">
                    <SetupEmblem label="Coche" value={setup.carName} />
                    <SetupEmblem label="Circuito" value={setup.trackName} />
                    <SetupEmblem
                      label="Visibilidad"
                      value={formatSetupVisibility(setup.visibility)}
                    />
                  </div>
                </div>
              </section>

              <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                    Controles principales
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    Ajustes para aplicar en pista
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-muted">
                    Estos son los controles que más conviene revisar rápido antes de salir del
                    garage.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <RangeField
                    name="brakeBias"
                    label="Brake Bias"
                    min={0}
                    max={100}
                    value={setup.brakeBias ?? 52}
                    defaultValue={52}
                    decimals={1}
                    showRemainingToMax
                    allowedValues={buildBrakeBiasValues()}
                  />
                  <RangeField name="abs" label="ABS" min={0} max={9} value={setup.abs ?? 5} />
                  <RangeField
                    name="onboardTc"
                    label="ONBOARD TC"
                    min={0}
                    max={11}
                    value={setup.onboardTc ?? 5}
                  />
                  <RangeField
                    name="tcPowerCut"
                    label="TC POWER CUT"
                    min={0}
                    max={11}
                    value={setup.tcPowerCut ?? 5}
                  />
                  <div className="xl:col-span-2">
                    <RangeField
                      name="tcSlipAngle"
                      label="TC SLIP ANGLE"
                      min={0}
                      max={11}
                      value={setup.tcSlipAngle ?? 5}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-[rgba(244,154,141,0.22)] bg-[rgba(244,154,141,0.08)] p-4 sm:p-5">
                <p className="text-sm font-semibold text-[#f3b4aa]">Eliminar setup</p>
                <p className="mt-2 text-sm leading-7 text-[#e4b8b1]">
                  Esta acción es irreversible. Si decides continuar, te pediremos confirmación en un
                  popup antes de borrar el setup.
                </p>
                <div className="mt-4">
                  <DeleteSetupDialog setupId={setup.id} setupName={setup.name} />
                </div>
              </section>
            </form>
          ) : (
            <>
              <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                    Resumen
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    Contexto general del setup
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-muted">
                    Aquí vive la lectura rápida: para qué coche es, en qué circuito se usa y qué
                    sensaciones o notas conviene recordar antes de cargarlo.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <SetupEmblem label="Coche" value={`${setup.manufacturerName} ${setup.carName}`} />
                  <SetupEmblem label="Circuito" value={setup.trackName} />
                  <SetupEmblem label="Clase" value={setup.carClassName} />
                  <SetupEmblem
                    label="Visibilidad"
                    value={formatSetupVisibility(setup.visibility)}
                  />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Notas del setup
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {setup.notes ?? 'Este setup todavía no tiene notas añadidas.'}
                  </p>
                </div>
              </section>

              <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                    Ajustes clave
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    Lo principal para implementarlo
                  </h3>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <SetupMetricCard
                    label="Brake Bias"
                    value={formatBrakeBiasSplit(setup.brakeBias)}
                    className="sm:col-span-2 xl:col-span-1"
                  />
                  <SetupMetricCard label="ABS" value={formatMetricValue(setup.abs)} />
                  <SetupMetricCard label="ONBOARD TC" value={formatMetricValue(setup.onboardTc)} />
                  <SetupMetricCard
                    label="TC POWER CUT"
                    value={formatMetricValue(setup.tcPowerCut)}
                  />
                  <SetupMetricCard
                    label="TC SLIP ANGLE"
                    value={formatMetricValue(setup.tcSlipAngle)}
                    className="sm:col-span-2 xl:col-span-2"
                  />
                </dl>
              </section>
            </>
          )}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
                  Acciones
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  Gestiona este setup
                </h3>
              </div>
              <FavoriteToggleButton
                setupId={setup.id}
                isFavorite={setup.isFavorite}
                returnTo={favoriteReturnTo}
              />
            </div>

            <div className="mt-5 grid gap-3">
              {isEditMode ? (
                <Button href={detailPath} asChild variant="secondary" className="w-full">
                  Ver detalle
                </Button>
              ) : (
                <>
                  <Button href={`${detailPath}?edit=1`} asChild className="w-full">
                    Editar setup
                  </Button>
                  <Button
                    href={`${detailPath}?duplicate=1`}
                    asChild
                    variant="secondary"
                    className="w-full"
                  >
                    Duplicar setup
                  </Button>
                </>
              )}
              {isEditMode && !isDuplicateMode ? (
                <Button
                  href={`${detailPath}?duplicate=1`}
                  asChild
                  variant="secondary"
                  className="w-full"
                >
                  Duplicar setup
                </Button>
              ) : null}
              <Button href={routes.setups} asChild variant="secondary" className="w-full">
                Volver a todos los setups
              </Button>
            </div>
          </section>

          <section className="panel-dark rounded-[1.6rem] p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
              Ficha
            </p>
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
