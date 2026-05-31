'use client';

import { useEffect, useState } from 'react';
import { ImportSessionsForm } from '@/components/features/sessions/import-sessions-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { routes } from '@/lib/constants/routes';
import type { SessionImportJobSummary } from '@/services/session-import-job.service';
import type { LatestImportedSessionReference } from '@/services/session.service';

type CreateSessionModalProps = {
  preferredDriverName?: string;
  latestImportedSessionReference: LatestImportedSessionReference | null;
  triggerClassName?: string;
  onJobCreated?: (job: SessionImportJobSummary) => void;
  canBulkImportSessions: boolean;
  currentPlan: 'lite' | 'pro';
};

export function CreateSessionModal({
  preferredDriverName,
  latestImportedSessionReference,
  triggerClassName,
  onJobCreated,
  canBulkImportSessions,
  currentPlan,
}: CreateSessionModalProps) {
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
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ??
          'min-h-10 rounded-md border-[rgba(225,178,122,0.3)] bg-[rgba(225,178,122,0.18)] px-4 text-white shadow-none hover:bg-[rgba(225,178,122,0.26)]'
        }
      >
        <span className="text-xs leading-none sm:text-sm">Nueva sesión</span>
      </Button>

      {isOpen ? (
        <Modal className="max-w-xl p-0" title="">
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
              <p className="section-kicker font-semibold">Nueva sesión</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Importar sesiones XML
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {canBulkImportSessions
                  ? 'Selecciona varios XML de resultados en una sola vez y guarda cada sesión con su propio nombre. Si no encontramos tu piloto automáticamente, podrás elegirlo antes de importar.'
                  : `Tu plan ${currentPlan === 'lite' ? 'Lite' : 'actual'} permite importar una sola sesión por vez. Si no encontramos tu piloto automáticamente, podrás elegirlo antes de importar.`}
              </p>
            </div>

            <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <ImportSessionsForm
                preferredDriverNames={preferredDriverName ? [preferredDriverName] : []}
                latestImportedSessionReference={latestImportedSessionReference}
                returnTo={routes.sessions}
                submitLabel="Importar sesiones"
                canBulkImportSessions={canBulkImportSessions}
                currentPlan={currentPlan}
                onJobCreated={(job) => {
                  onJobCreated?.(job);
                  setIsOpen(false);
                }}
              />
            </section>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
