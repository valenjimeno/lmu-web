'use client';

import { useEffect, useState } from 'react';
import { deleteSetupAction } from '@/app/(app)/setups/actions';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type DeleteSetupDialogProps = {
  setupId: string;
  setupName: string;
};

export function DeleteSetupDialog({ setupId, setupName }: DeleteSetupDialogProps) {
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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-full border border-[#ff6b5738] bg-[#7b2f26] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
      >
        Eliminar setup
      </button>

      {isOpen ? (
        <Modal className="max-w-xl p-0" title="">
          <div className="relative p-5 sm:p-6">
            <button
              type="button"
              aria-label="Cerrar confirmacion de borrado"
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb7aa]">
                Confirmar borrado
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                ¿Eliminar este setup?
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Vas a borrar <span className="font-semibold text-foreground">{setupName}</span>.
                Esta acción es irreversible y el setup desaparecerá de tu biblioteca.
              </p>
            </div>

            <form action={deleteSetupAction} className="mt-6 space-y-4">
              <input type="hidden" name="setupId" value={setupId} />
              <input type="hidden" name="confirmDeleteText" value="ELIMINAR" />
              <input type="hidden" name="confirmDeleteCheckbox" value="on" />

              <div className="rounded-[1.35rem] border border-[#ff6b5733] bg-[#ff6b5710] px-4 py-3 text-sm text-[#ffb7aa]">
                Esta confirmación borrará el setup inmediatamente.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-[#ff6b5738] bg-[#7b2f26] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Sí, eliminar setup
                </button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
