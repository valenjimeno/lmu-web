'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { routes } from '@/lib/constants/routes';
import {
  formatBrakeBiasSplit,
  formatDate,
  formatLapTime,
  formatMetricValue,
  formatRaceDurationMinutes,
  formatSetupVisibility,
  formatWeatherSummary,
} from '@/lib/utils/setup-formatters';
import type { SetupSummary } from '@/services/setup.service';

type SetupQuickPreviewModalProps = {
  setup: SetupSummary;
};

function ReadOnlyField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="input-surface mt-2 rounded-[1.1rem] px-4 py-3 text-sm text-white/82">
        {value}
      </div>
    </div>
  );
}

export function SetupQuickPreviewModal({ setup }: SetupQuickPreviewModalProps) {
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
        className="inline-flex items-center self-start rounded-full border border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.12)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f0cca0] leading-none transition hover:bg-[rgba(225,178,122,0.18)]"
        style={{ fontSize: '11px', lineHeight: 1 }}
      >
        <span className="text-white/64">Setup&nbsp;</span>
        <span>{setup.name}</span>
      </button>

      {isOpen ? (
        <Modal className="max-w-2xl xl:max-w-4xl p-0" title="">
          <div className="relative p-5 sm:p-6">
            <button
              type="button"
              aria-label="Cerrar vista rápida"
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
              <p className="section-kicker font-semibold">Setup asociado</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {setup.name}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Resumen rápido del setup vinculado a esta sesión. Los campos se muestran en modo
                lectura para que puedas revisar la configuración sin salir de aquí.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Clase" value={setup.carClassName} />
                <ReadOnlyField label="Coche" value={`${setup.manufacturerName} ${setup.carName}`} />
              </div>

              <ReadOnlyField label="Circuito" value={setup.trackName} />

              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Tipo" value={setup.setupType.toUpperCase()} />
                <ReadOnlyField
                  label="Visibilidad"
                  value={formatSetupVisibility(setup.visibility)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyField
                  label="Duración carrera"
                  value={formatRaceDurationMinutes(setup.raceDurationMinutes)}
                />
                <ReadOnlyField
                  label="Fuel recomendado"
                  value={
                    setup.recommendedFuelPercent === null
                      ? 'No definido'
                      : `${setup.recommendedFuelPercent}%`
                  }
                />
                <ReadOnlyField label="Clima" value={formatWeatherSummary(setup.weatherSummary)} />
                <ReadOnlyField label="Best lap" value={formatLapTime(setup.bestLapMs)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyField label="Brake Bias" value={formatBrakeBiasSplit(setup.brakeBias)} />
                <ReadOnlyField label="ABS" value={formatMetricValue(setup.abs)} />
                <ReadOnlyField label="Onboard TC" value={formatMetricValue(setup.onboardTc)} />
                <ReadOnlyField label="TC Power Cut" value={formatMetricValue(setup.tcPowerCut)} />
              </div>

              <ReadOnlyField
                label="TC Slip Angle"
                value={formatMetricValue(setup.tcSlipAngle)}
                className="max-w-sm"
              />

              <ReadOnlyField label="Notas" value={setup.notes?.trim() || 'Sin notas'} />

              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Última edición" value={formatDate(setup.updatedAt)} />
                <ReadOnlyField label="Propietario" value={setup.ownerDisplayName} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cerrar
                </Button>
                <Button href={`${routes.setups}/${setup.id}`} asChild>
                  Abrir detalle completo
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
