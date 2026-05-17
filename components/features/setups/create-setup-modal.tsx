'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createSetupAction, updateSetupAction } from '@/app/(app)/setups/actions';
import { DeleteSetupDialog } from '@/components/features/setups/delete-setup-dialog';
import { RangeField } from '@/components/features/setups/range-field';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { routes } from '@/lib/constants/routes';
import { formatLapTime } from '@/lib/utils/setup-formatters';
import type { SetupSummary } from '@/services/setup.service';

type Option = {
  id: string;
  name: string;
};

type CarOption = Option & {
  carClassId: string;
};

type SetupFormModalProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
  titleKicker: string;
  title: string;
  description: string;
  submitLabel: string;
  trigger: ReactNode;
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    setupId?: string;
    returnTo?: string;
    name?: string;
    carClassId?: string | null;
    carId?: string;
    trackId?: string;
    setupType?: SetupSummary['setupType'];
    notes?: string | null;
    brakeBias?: number | null;
    abs?: number | null;
    onboardTc?: number | null;
    tcPowerCut?: number | null;
    tcSlipAngle?: number | null;
    bestLapMs?: number | null;
  };
};

type CreateSetupModalProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
};

type EditSetupModalProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
  setup: SetupSummary;
  triggerClassName?: string;
};

const selectClassName =
  'input-surface w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const textareaClassName =
  'input-surface min-h-28 w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const inputClassName =
  'input-surface w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

function SetupFormModal({
  carClasses,
  cars,
  tracks,
  defaultCarClassId,
  titleKicker,
  title,
  description,
  submitLabel,
  trigger,
  action,
  defaultValues,
}: SetupFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCarClassId, setSelectedCarClassId] = useState(
    defaultValues?.carClassId ?? defaultCarClassId ?? '',
  );
  const [selectedCarId, setSelectedCarId] = useState(defaultValues?.carId ?? '');

  const filteredCars = useMemo(
    () => cars.filter((car) => !selectedCarClassId || car.carClassId === selectedCarClassId),
    [cars, selectedCarClassId],
  );

  function openModal() {
    setSelectedCarClassId(defaultValues?.carClassId ?? defaultCarClassId ?? '');
    setSelectedCarId(defaultValues?.carId ?? '');
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <span onClick={openModal}>{trigger}</span>

      {isOpen ? (
        <Modal className="max-w-2xl p-0" title="">
          <div className="relative p-5 sm:p-6">
            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted transition hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>

            <div className="pr-12">
              <p className="section-kicker font-semibold">{titleKicker}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
            </div>

            <form action={action} className="mt-6 space-y-5">
              {defaultValues?.setupId ? (
                <input type="hidden" name="setupId" value={defaultValues.setupId} />
              ) : null}
              {defaultValues?.returnTo ? (
                <input type="hidden" name="returnTo" value={defaultValues.returnTo} />
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Nombre</span>
                <input
                  name="name"
                  required
                  defaultValue={defaultValues?.name ?? ''}
                  placeholder="Ej. Monza carrera 45 min"
                  className={selectClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Clase</span>
                  <select
                    name="carClassId"
                    value={selectedCarClassId}
                    onChange={(event) => {
                      setSelectedCarClassId(event.target.value);
                      setSelectedCarId('');
                    }}
                    className={selectClassName}
                  >
                    {carClasses.map((carClass) => (
                      <option key={carClass.id} value={carClass.id}>
                        {carClass.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Coche</span>
                  <select
                    name="carId"
                    required
                    value={selectedCarId}
                    onChange={(event) => setSelectedCarId(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="" disabled>
                      Selecciona un coche
                    </option>
                    {filteredCars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Circuito</span>
                <select
                  name="trackId"
                  required
                  defaultValue={defaultValues?.trackId ?? ''}
                  className={selectClassName}
                >
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
                <select
                  name="setupType"
                  defaultValue={defaultValues?.setupType ?? 'fixed'}
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
                  defaultValue={defaultValues?.notes ?? ''}
                  placeholder="Pista caliente, presión de neumáticos, sensaciones de frenada..."
                  className={textareaClassName}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Personal Best</span>
                <input
                  name="bestLap"
                  inputMode="numeric"
                  defaultValue={
                    defaultValues?.bestLapMs !== null && defaultValues?.bestLapMs !== undefined
                      ? formatLapTime(defaultValues.bestLapMs)
                      : ''
                  }
                  placeholder="mm:ss:mmm  Ej. 01:41:352"
                  className={inputClassName}
                />
                <p className="text-xs text-muted">
                  Opcional. Usa `:` entre minutos, segundos y milésimas.
                </p>
              </label>

              <div className="space-y-4">
                <RangeField
                  name="brakeBias"
                  label="Brake Bias"
                  min={0}
                  max={100}
                  step={0.2}
                  value={defaultValues?.brakeBias ?? 54}
                  defaultValue={54}
                  decimals={1}
                  showRemainingToMax
                />
                <RangeField name="abs" label="ABS" value={defaultValues?.abs ?? 5} />
                <RangeField
                  name="onboardTc"
                  label="ONBOARD TC"
                  value={defaultValues?.onboardTc ?? 5}
                />
                <RangeField
                  name="tcPowerCut"
                  label="TC POWER CUT"
                  value={defaultValues?.tcPowerCut ?? 5}
                />
              </div>
              <RangeField
                name="tcSlipAngle"
                label="TC SLIP ANGLE"
                value={defaultValues?.tcSlipAngle ?? 5}
              />

              {defaultValues?.setupId ? (
                <section className="rounded-[1.35rem] border border-[#ff6b5730] bg-[#ff6b570a] p-4">
                  <p className="text-sm font-semibold text-[#f3b4aa]">Eliminar setup</p>
                  <p className="mt-2 text-sm leading-6 text-[#e4b8b1]">
                    Si ya no necesitas esta configuración, puedes borrarla desde aquí. Te pediremos
                    confirmación antes de hacerlo.
                  </p>
                  <div className="mt-4">
                    <DeleteSetupDialog
                      setupId={defaultValues.setupId}
                      setupName={defaultValues.name ?? 'este setup'}
                      returnTo={defaultValues.returnTo}
                    />
                  </div>
                </section>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{submitLabel}</Button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export function CreateSetupModal({
  carClasses,
  cars,
  tracks,
  defaultCarClassId,
}: CreateSetupModalProps) {
  return (
    <SetupFormModal
      carClasses={carClasses}
      cars={cars}
      tracks={tracks}
      defaultCarClassId={defaultCarClassId}
      titleKicker="Nuevo setup"
      title="Crear una configuración nueva"
      description="Añade coche, pista, tipo y notas sin salir de la biblioteca. El formulario mantiene una lectura clara también en móvil."
      submitLabel="Crear setup"
      action={createSetupAction}
      trigger={
        <Button
          type="button"
          className="min-h-10 rounded-md border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] px-4 text-white shadow-none hover:bg-[rgba(225,178,122,0.26)]"
        >
          Nuevo setup
        </Button>
      }
    />
  );
}

export function EditSetupModal({
  carClasses,
  cars,
  tracks,
  defaultCarClassId,
  setup,
  triggerClassName,
}: EditSetupModalProps) {
  return (
    <SetupFormModal
      carClasses={carClasses}
      cars={cars}
      tracks={tracks}
      defaultCarClassId={defaultCarClassId}
      titleKicker="Editar setup"
      title="Actualizar configuración"
      description="Modifica los valores actuales sin salir de la biblioteca. Al guardar, la fecha de modificación se actualiza automáticamente."
      submitLabel="Guardar cambios"
      action={updateSetupAction}
      defaultValues={{
        setupId: setup.id,
        returnTo: routes.setups,
        name: setup.name,
        carClassId: setup.carClassId,
        carId: setup.carId,
        trackId: setup.trackId,
        setupType: setup.setupType,
        notes: setup.notes,
        brakeBias: setup.brakeBias,
        abs: setup.abs,
        onboardTc: setup.onboardTc,
        tcPowerCut: setup.tcPowerCut,
        tcSlipAngle: setup.tcSlipAngle,
        bestLapMs: setup.bestLapMs,
      }}
      trigger={
        <button
          type="button"
          className={
            triggerClassName ??
            'inline-flex min-h-11 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]'
          }
        >
          Editar
        </button>
      }
    />
  );
}
