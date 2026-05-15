'use client';

import { useEffect, useState } from 'react';
import { createSetupAction } from '@/app/(app)/setups/actions';
import { RangeField } from '@/components/features/setups/range-field';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type Option = {
  id: string;
  name: string;
};

type CreateSetupModalProps = {
  cars: Option[];
  tracks: Option[];
};

const selectClassName =
  'input-surface w-full rounded-[1.35rem] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20';

const textareaClassName =
  'input-surface min-h-28 w-full rounded-[1.35rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20';

export function CreateSetupModal({ cars, tracks }: CreateSetupModalProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <Button type="button" onClick={() => setIsOpen(true)}>
        Nuevo setup
      </Button>

      {isOpen ? (
        <Modal className="max-w-2xl p-0" title="">
          <div className="relative p-5 sm:p-6">
            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-muted transition hover:text-white"
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
              <p className="section-kicker text-xs font-semibold">Nuevo setup</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Alta rápida en popup
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Crea un setup sin salir de la biblioteca. El flujo está pensado para sentirse ágil y
                cómodo también en móvil.
              </p>
            </div>

            <form action={createSetupAction} className="mt-6 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Nombre</span>
                <input
                  name="name"
                  required
                  placeholder="Ej. Monza carrera 45 min"
                  className={selectClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

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

              <div className="grid gap-4 sm:grid-cols-2">
                <RangeField
                  name="brakeBias"
                  label="Brake Bias"
                  min={0}
                  max={100}
                  step={0.2}
                  defaultValue={54}
                  decimals={1}
                  showRemainingToMax
                />
                <RangeField name="abs" label="ABS" />
                <RangeField name="onboardTc" label="ONBOARD TC" />
                <RangeField name="tcPowerCut" label="TC POWER CUT" />
              </div>

              <RangeField name="tcSlipAngle" label="TC SLIP ANGLE" />

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear setup</Button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
