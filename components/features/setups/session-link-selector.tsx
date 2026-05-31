'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate, formatLapTime } from '@/lib/utils/setup-formatters';
import type { SetupSessionLinkOption } from '@/services/setup-session-link.service';

type SessionLinkSelectorProps = {
  sessions: SetupSessionLinkOption[];
  currentSetupId?: string;
  selectedCarId?: string;
  selectedTrackId?: string;
  initialSelectedSessionIds?: string[];
  inputName?: string;
};

export function SessionLinkSelector({
  sessions,
  currentSetupId,
  selectedCarId,
  selectedTrackId,
  initialSelectedSessionIds = [],
  inputName = 'linkedSessionIds',
}: SessionLinkSelectorProps) {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(initialSelectedSessionIds);
  const persistedSessionIds = useMemo(
    () => new Set(initialSelectedSessionIds),
    [initialSelectedSessionIds],
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const eligibleSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.setupId === null || session.setupId === currentSetupId)
        .filter((session) => {
          if (!selectedCarId || !selectedTrackId) {
            return true;
          }

          return session.carId === selectedCarId && session.trackId === selectedTrackId;
        }),
    [currentSetupId, selectedCarId, selectedTrackId, sessions],
  );

  const orderedSessions = useMemo(
    () =>
      [...eligibleSessions].sort((left, right) => {
        return (
          Date.parse(right.sessionDateTime ?? right.importedAt) -
          Date.parse(left.sessionDateTime ?? left.importedAt)
        );
      }),
    [eligibleSessions],
  );
  const selectedSessions = useMemo(
    () => orderedSessions.filter((session) => persistedSessionIds.has(session.id)).slice(0, 3),
    [orderedSessions, persistedSessionIds],
  );

  function toggleSession(sessionId: string) {
    setSelectedSessionIds((currentSelectedIds) =>
      currentSelectedIds.includes(sessionId)
        ? currentSelectedIds.filter((id) => id !== sessionId)
        : [...currentSelectedIds, sessionId],
    );
  }

  return (
    <section className="space-y-3 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Sesiones asociadas</p>
          <p className="text-xs leading-6 text-muted">
            Solo mostramos sesiones con la misma combinación de coche y circuito.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsPickerOpen((value) => !value)}
          className="min-h-10 self-start rounded-[0.9rem] px-4 text-sm"
        >
          {isPickerOpen ? 'Ocultar selector' : 'Asociar sesión'}
        </Button>
      </div>

      {selectedSessionIds.map((sessionId) => (
        <input key={sessionId} type="hidden" name={inputName} value={sessionId} />
      ))}

      {selectedSessions.length > 0 ? (
        <div className="space-y-2 rounded-[1rem] border border-white/8 bg-black/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Ya asociadas
          </p>
          {selectedSessions.map((session) => (
            <div key={session.id} className="space-y-1">
              <p className="text-sm text-white/80">{session.sessionLabel}</p>
              <p className="text-xs text-muted">
                {session.driverName} · {session.carName} · {session.trackName}
              </p>
            </div>
          ))}
          {selectedSessionIds.length > selectedSessions.length ? (
            <p className="text-xs text-muted">
              {selectedSessionIds.length - selectedSessions.length} sesiones más asociadas.
            </p>
          ) : null}
        </div>
      ) : null}

      {isPickerOpen ? (
        orderedSessions.length > 0 ? (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {orderedSessions.map((session) => {
              const isSelected = selectedSessionIds.includes(session.id);
              const isPersisted = persistedSessionIds.has(session.id);

              return (
                <label
                  key={session.id}
                  className={`flex cursor-pointer gap-3 rounded-[1rem] border p-3 transition ${
                    isSelected
                      ? 'border-[rgba(241,196,135,0.38)] bg-[rgba(225,178,122,0.12)]'
                      : 'border-white/10 bg-black/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSession(session.id)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-[#e1b27a] focus:ring-[#e1b27a]"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{session.name}</p>
                      {isSelected && !isPersisted ? (
                        <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                          Pendiente
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">
                      {session.driverName} · {session.carName} · {session.trackName}
                    </p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted">
                      <span>Importada {formatDate(session.importedAt)}</span>
                      {session.bestLapMs ? (
                        <span>Best {formatLapTime(session.bestLapMs)}</span>
                      ) : null}
                      {session.sourceSessionSetting ? (
                        <span>{session.sourceSessionSetting}</span>
                      ) : null}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="rounded-[1rem] border border-dashed border-white/10 px-4 py-3 text-sm text-muted">
            No tienes sesiones con la misma combinación de coche y circuito para asociar desde aquí.
          </p>
        )
      ) : null}
    </section>
  );
}
