'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  createSetupAction,
  duplicateSetupAction,
  importSetupSessionAction,
  updateSetupAction,
} from '@/app/(app)/setups/actions';
import { DeleteSetupDialog } from '@/components/features/setups/delete-setup-dialog';
import { ImportSessionForm } from '@/components/features/setups/import-session-form';
import { RangeField } from '@/components/features/setups/range-field';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { routes } from '@/lib/constants/routes';
import { buildBrakeBiasValues } from '@/lib/utils/brake-bias';
import { formatLapTime, formatSetupVisibility } from '@/lib/utils/setup-formatters';
import type { SetupSummary } from '@/services/setup.service';

type Option = {
  id: string;
  name: string;
};

type CarOption = Option & {
  carClassId: string;
};

type WeatherValue = 'sun' | 'sun-cloud' | 'rain';

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
  duplicateAction?: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    setupId?: string;
    returnTo?: string;
    name?: string;
    carClassId?: string | null;
    carId?: string;
    trackId?: string;
    setupType?: SetupSummary['setupType'];
    visibility?: SetupSummary['visibility'];
    notes?: string | null;
    raceDurationMinutes?: number | null;
    weatherSummary?: string | null;
    brakeBias?: number | null;
    abs?: number | null;
    onboardTc?: number | null;
    tcPowerCut?: number | null;
    tcSlipAngle?: number | null;
    bestLapMs?: number | null;
    preferredDriverNames?: string[];
    importedSessionHashes?: string[];
  };
};

type CreateSetupModalProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
  triggerClassName?: string;
};

type EditSetupModalProps = {
  carClasses: Option[];
  cars: CarOption[];
  tracks: Option[];
  defaultCarClassId?: string;
  importedSessionHashes: string[];
  setup: SetupSummary;
  preferredDriverName?: string;
  triggerClassName?: string;
};

const selectClassName =
  'input-surface w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const textareaClassName =
  'input-surface min-h-28 w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const inputClassName =
  'input-surface w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

const weatherOptions: Array<{ value: WeatherValue; label: string }> = [
  { value: 'sun', label: 'Sol' },
  { value: 'sun-cloud', label: 'Sol y nube' },
  { value: 'rain', label: 'Lluvia' },
];

const visibilityOptions: Array<{
  value: SetupSummary['visibility'];
  label: string;
}> = [
  { value: 'private', label: formatSetupVisibility('private') },
  { value: 'public', label: formatSetupVisibility('public') },
];

function WeatherIcon({ type }: { type: WeatherValue }) {
  if (type === 'sun') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === 'sun-cloud') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M8 6.5a3.5 3.5 0 1 1 5.3 3" strokeLinecap="round" />
        <path d="M8 3.2v1.6M3.9 7.3l1.2.7M12.1 7.3l-1.2.7" strokeLinecap="round" />
        <path
          d="M7.5 18.5h8a3.5 3.5 0 1 0-.7-6.9A4.8 4.8 0 0 0 5.4 13 2.8 2.8 0 0 0 7.5 18.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M7.5 14.5h8a3.5 3.5 0 1 0-.7-6.9A4.8 4.8 0 0 0 5.4 9 2.8 2.8 0 0 0 7.5 14.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 17.5 8 20M13 17.5 12 20M17 17.5 16 20" strokeLinecap="round" />
    </svg>
  );
}

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
  duplicateAction,
  defaultValues,
}: SetupFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCarClassId, setSelectedCarClassId] = useState(
    defaultValues?.carClassId ?? defaultCarClassId ?? '',
  );
  const [selectedCarId, setSelectedCarId] = useState(defaultValues?.carId ?? '');
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [selectedWeatherSummary, setSelectedWeatherSummary] = useState<WeatherValue>(
    defaultValues?.weatherSummary === 'sun-cloud' || defaultValues?.weatherSummary === 'rain'
      ? defaultValues.weatherSummary
      : 'sun',
  );
  const [selectedVisibility, setSelectedVisibility] = useState<SetupSummary['visibility']>(
    defaultValues?.visibility ?? 'private',
  );

  const filteredCars = useMemo(
    () => cars.filter((car) => !selectedCarClassId || car.carClassId === selectedCarClassId),
    [cars, selectedCarClassId],
  );

  function openModal() {
    setIsDuplicateMode(false);
    setSelectedCarClassId(defaultValues?.carClassId ?? defaultCarClassId ?? '');
    setSelectedCarId(defaultValues?.carId ?? '');
    setSelectedWeatherSummary(
      defaultValues?.weatherSummary === 'sun-cloud' || defaultValues?.weatherSummary === 'rain'
        ? defaultValues.weatherSummary
        : 'sun',
    );
    setSelectedVisibility(defaultValues?.visibility ?? 'private');
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
        <Modal className="max-w-2xl xl:max-w-4xl p-0" title="">
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
              <p className="section-kicker font-semibold">
                {isDuplicateMode ? 'Duplicar setup' : titleKicker}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {isDuplicateMode ? 'Crear copia del setup' : title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {isDuplicateMode
                  ? 'Usa este setup como base, retoca los campos que quieras y solo crearemos la copia cuando la guardes.'
                  : description}
              </p>
            </div>

            <form
              key={isDuplicateMode ? 'duplicate' : 'default'}
              action={isDuplicateMode ? (duplicateAction ?? action) : action}
              className="mt-6 space-y-5"
            >
              {defaultValues?.setupId && !isDuplicateMode ? (
                <input type="hidden" name="setupId" value={defaultValues.setupId} />
              ) : null}
              {defaultValues?.setupId && isDuplicateMode ? (
                <input type="hidden" name="sourceSetupId" value={defaultValues.setupId} />
              ) : null}
              {defaultValues?.returnTo ? (
                <input type="hidden" name="returnTo" value={defaultValues.returnTo} />
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Nombre</span>
                <input
                  name="name"
                  required
                  defaultValue={
                    isDuplicateMode
                      ? `${defaultValues?.name ?? 'Nuevo setup'} (copia)`
                      : (defaultValues?.name ?? '')
                  }
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

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">Visibilidad</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {visibilityOptions.map((option) => {
                    const isSelected = selectedVisibility === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-[1.25rem] border px-4 py-4 transition ${
                          isSelected
                            ? 'border-[rgba(241,196,135,0.42)] bg-[rgba(225,178,122,0.14)] text-white'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => setSelectedVisibility(option.value)}
                          className="sr-only"
                        />
                        <div className="text-center text-sm font-semibold">{option.label}</div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Minutos de carrera</span>
                <input
                  type="number"
                  name="raceDurationMinutes"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  defaultValue={defaultValues?.raceDurationMinutes ?? ''}
                  placeholder="Ej. 45"
                  className={inputClassName}
                />
                <p className="text-xs text-muted">
                  Opcional. Introduce la duración prevista de la carrera en minutos.
                </p>
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">Clima</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {weatherOptions.map((option) => {
                    const isSelected = selectedWeatherSummary === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-[1.25rem] border px-4 py-4 transition ${
                          isSelected
                            ? 'border-[rgba(241,196,135,0.42)] bg-[rgba(225,178,122,0.14)] text-white'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="weatherSummary"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => setSelectedWeatherSummary(option.value)}
                          aria-label={option.label}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-center text-center">
                          <WeatherIcon type={option.value} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

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
                  value={defaultValues?.brakeBias ?? 52}
                  defaultValue={52}
                  decimals={1}
                  showRemainingToMax
                  allowedValues={buildBrakeBiasValues()}
                />
                <RangeField
                  name="abs"
                  label="ABS"
                  min={0}
                  max={9}
                  value={defaultValues?.abs ?? 5}
                />
                <RangeField
                  name="onboardTc"
                  label="ONBOARD TC"
                  min={0}
                  max={11}
                  value={defaultValues?.onboardTc ?? 5}
                />
                <RangeField
                  name="tcPowerCut"
                  label="TC POWER CUT"
                  min={0}
                  max={11}
                  value={defaultValues?.tcPowerCut ?? 5}
                />
              </div>
              <RangeField
                name="tcSlipAngle"
                label="TC SLIP ANGLE"
                min={0}
                max={11}
                value={defaultValues?.tcSlipAngle ?? 5}
              />

              {defaultValues?.setupId && !isDuplicateMode ? (
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
                {duplicateAction && defaultValues?.setupId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsDuplicateMode((value) => !value)}
                  >
                    {isDuplicateMode ? 'Volver a edición' : 'Duplicar setup'}
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{isDuplicateMode ? 'Guardar copia' : submitLabel}</Button>
              </div>
            </form>

            {defaultValues?.setupId && !isDuplicateMode ? (
              <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Importar sesión XML</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Vincula una sesión real a este setup. Si no encontramos tu piloto automáticamente,
                  podrás elegir el nombre a importar.
                </p>
                <div className="mt-4">
                  <ImportSessionForm
                    action={importSetupSessionAction}
                    setupId={defaultValues.setupId}
                    importedSessionHashes={defaultValues.importedSessionHashes ?? []}
                    preferredDriverNames={defaultValues.preferredDriverNames ?? []}
                    returnTo={defaultValues.returnTo ?? routes.setups}
                  />
                </div>
              </section>
            ) : null}
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
  triggerClassName,
}: CreateSetupModalProps) {
  return (
    <SetupFormModal
      carClasses={carClasses}
      cars={cars}
      tracks={tracks}
      defaultCarClassId={defaultCarClassId}
      titleKicker="Nuevo setup"
      title="Crear una configuración nueva"
      description="Añade coche, pista, tipo, visibilidad y notas sin salir de la biblioteca. El formulario mantiene una lectura clara también en móvil."
      submitLabel="Crear setup"
      action={createSetupAction}
      trigger={
        <Button
          type="button"
          className={
            triggerClassName ??
            'min-h-10 rounded-md border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] px-4 text-white shadow-none hover:bg-[rgba(225,178,122,0.26)]'
          }
        >
          <span className="text-xs leading-none sm:text-sm">Nuevo setup</span>
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
  importedSessionHashes,
  setup,
  preferredDriverName,
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
      duplicateAction={duplicateSetupAction}
      defaultValues={{
        setupId: setup.id,
        returnTo: routes.setups,
        name: setup.name,
        carClassId: setup.carClassId,
        carId: setup.carId,
        trackId: setup.trackId,
        setupType: setup.setupType,
        visibility: setup.visibility,
        notes: setup.notes,
        raceDurationMinutes: setup.raceDurationMinutes,
        weatherSummary: setup.weatherSummary,
        brakeBias: setup.brakeBias,
        abs: setup.abs,
        onboardTc: setup.onboardTc,
        tcPowerCut: setup.tcPowerCut,
        tcSlipAngle: setup.tcSlipAngle,
        bestLapMs: setup.bestLapMs,
        importedSessionHashes,
        preferredDriverNames: preferredDriverName ? [preferredDriverName] : [],
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
