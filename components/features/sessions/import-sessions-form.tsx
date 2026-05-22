'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  computeXmlHash,
  extractDriverNamesWithValidLaps,
  findPreferredDriverName,
  type MatchState,
} from '@/components/features/sessions/import-session-client';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { buildSessionImportStoragePath } from '@/lib/utils/session-import-storage';
import {
  detectSessionTypeFromXml,
  doesSessionTypeMatchFilter,
  formatSessionType,
  formatSessionTypeFilter,
  type SessionTypeFilter,
} from '@/lib/utils/session-type';
import type { SessionImportJobSummary } from '@/services/session-import-job.service';

type ImportSessionsFormProps = {
  preferredDriverNames: string[];
  returnTo?: string;
  submitLabel?: string;
  onJobCreated?: (job: SessionImportJobSummary) => void;
};

type SessionImportEntry = {
  id: string;
  file: File;
  sessionName: string;
  sourceFileName: string;
  sourceFileSizeBytes: number;
  sourceMimeType: string | null;
  xmlHash: string;
  availableDriverNames: string[];
  selectedDriverName: string;
  sessionType: string | null;
  matchState: MatchState;
  duplicateReason: 'selected-more-than-once' | null;
};

type UploadedSessionImportSource = {
  sessionName: string;
  sourceFileHash: string;
  sourceFileName: string;
  sourceFileSizeBytes: number;
  sourceMimeType: string | null;
  storageBucket: string;
  storagePath: string;
  driverName: string;
  detectedSessionType: string | null;
};

const sessionTypeFilterOptions: SessionTypeFilter[] = ['all', 'race', 'qualify', 'practice'];
const MAX_JOB_CHUNK_FILES = 24;
const MAX_UPLOAD_CONCURRENCY = 3;

const inputClassName =
  'input-surface w-full rounded-[1rem] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

function ImportSessionsPendingState({
  isSubmitting,
  message,
}: {
  isSubmitting: boolean;
  message: string;
}) {
  if (!isSubmitting) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 px-6 backdrop-blur-md">
      <div className="app-panel-strong w-full max-w-md rounded-[1.75rem] border border-white/10 px-6 py-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(241,196,135,0.22)] bg-[rgba(225,178,122,0.12)]">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[rgba(241,196,135,0.25)] border-t-[#f3d2a6]" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-white">Importando sesiones</h3>
        <p className="mt-2 text-sm leading-6 text-white/72">{message}</p>
      </div>
    </div>
  );
}

function ImportSessionsSubmitButton({
  canSubmit,
  submitLabel,
  isSubmitting,
}: {
  canSubmit: boolean;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full sm:w-auto">
      {isSubmitting ? 'Preparando importacion...' : submitLabel}
    </Button>
  );
}

function ImportSessionsFormBody({
  sessionTypeFilter,
  setSessionTypeFilter,
  preferredDriverSummary,
  entries,
  handleFileChange,
  handleDriverChange,
  canSubmit,
  submitLabel,
  isSubmitting,
}: {
  sessionTypeFilter: SessionTypeFilter;
  setSessionTypeFilter: (value: SessionTypeFilter) => void;
  preferredDriverSummary: string;
  entries: SessionImportEntry[];
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  handleDriverChange: (entryId: string, value: string) => void;
  canSubmit: boolean;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  const autoMatchedCount = entries.filter((entry) => entry.matchState === 'matched').length;
  const needsSelectionEntries = entries.filter((entry) => entry.matchState === 'needs-selection');
  const duplicateCount = entries.filter((entry) => entry.duplicateReason !== null).length;
  const sessionTypeCounts = entries.reduce((counts, entry) => {
    const key = entry.sessionType ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return (
    <fieldset
      className="space-y-4 disabled:pointer-events-none disabled:opacity-75"
      disabled={isSubmitting}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Tipo de sesión a importar</span>
        <select
          value={sessionTypeFilter}
          onChange={(event) => setSessionTypeFilter(event.target.value as SessionTypeFilter)}
          className={inputClassName}
        >
          {sessionTypeFilterOptions.map((option) => (
            <option key={option} value={option}>
              {formatSessionTypeFilter(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Ficheros XML</span>
        <input
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          onChange={handleFileChange}
          className={`${inputClassName} file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(225,178,122,0.18)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#f5d4aa]`}
        />
      </label>

      <p className="text-xs leading-6 text-muted">
        Puedes seleccionar varios XML de una vez. Intentaremos encontrar automáticamente tu piloto
        usando: {preferredDriverSummary}
      </p>

      {entries.length > 0 ? (
        <div className="space-y-3 rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/78">
              {entries.length} XML preparados
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-1 text-xs text-emerald-100">
              {autoMatchedCount} con piloto detectado
            </span>
            {needsSelectionEntries.length > 0 ? (
              <span className="rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1 text-xs text-amber-100">
                {needsSelectionEntries.length} requieren elección de piloto
              </span>
            ) : null}
            {duplicateCount > 0 ? (
              <span className="rounded-full border border-[#ff6b5730] bg-[#ff6b570a] px-3 py-1 text-xs text-[#f3b4aa]">
                {duplicateCount} duplicados bloqueados
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm text-white/72 sm:grid-cols-2">
            {Array.from(sessionTypeCounts.entries()).map(([sessionType, count]) => (
              <p key={sessionType}>
                {count} {formatSessionType(sessionType)}
              </p>
            ))}
          </div>
          <p className="text-xs leading-6 text-muted">
            La selección se gestiona como lote completo. Si quieres cambiar los ficheros, vuelve a
            abrir el selector y elige el conjunto definitivo.
          </p>
        </div>
      ) : null}

      {entries.some((entry) => entry.duplicateReason === 'selected-more-than-once') ? (
        <div className="rounded-[1rem] border border-[#ff6b5730] bg-[#ff6b570a] px-4 py-3 text-sm text-[#f3b4aa]">
          Has seleccionado el mismo XML más de una vez dentro del lote. Vuelve a abrir el selector y
          deja solo una copia de cada fichero.
        </div>
      ) : null}

      {needsSelectionEntries.length > 0 ? (
        <div className="space-y-3 rounded-[1rem] border border-amber-400/20 bg-amber-500/[0.08] p-4">
          <p className="text-sm text-amber-100">
            Hay {needsSelectionEntries.length} fichero
            {needsSelectionEntries.length === 1 ? '' : 's'} en los que no hemos podido encontrar tu
            piloto automáticamente. Solo mostramos esos casos para que completes la selección.
          </p>

          {needsSelectionEntries.map((entry) => (
            <label key={entry.id} className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                {entry.sourceFileName} · {formatSessionType(entry.sessionType)}
              </span>
              <select
                value={entry.selectedDriverName}
                onChange={(event) => handleDriverChange(entry.id, event.target.value)}
                className={inputClassName}
              >
                <option value="">Selecciona un piloto</option>
                {entry.availableDriverNames.map((driverName) => (
                  <option key={driverName} value={driverName}>
                    {driverName}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}

      <ImportSessionsSubmitButton
        canSubmit={canSubmit}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
      />
    </fieldset>
  );
}

function buildEntryId(fileName: string, hash: string, index: number) {
  return `${fileName}:${hash}:${index}`;
}

function getDefaultSessionName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || fileName;
}

function chunkEntries<T>(entries: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < entries.length; index += chunkSize) {
    chunks.push(entries.slice(index, index + chunkSize));
  }

  return chunks;
}

function applyDuplicateFlags(entries: SessionImportEntry[]): SessionImportEntry[] {
  const hashCounts = new Map<string, number>();

  for (const entry of entries) {
    hashCounts.set(entry.xmlHash, (hashCounts.get(entry.xmlHash) ?? 0) + 1);
  }

  return entries.map((entry) => {
    const isRepeatedInSelection = (hashCounts.get(entry.xmlHash) ?? 0) > 1;

    return {
      ...entry,
      duplicateReason: isRepeatedInSelection ? 'selected-more-than-once' : null,
    };
  });
}

async function buildImportEntry(
  file: File,
  index: number,
  preferredDriverNames: string[],
): Promise<SessionImportEntry> {
  const xmlContent = await file.text();
  const xmlHash = await computeXmlHash(xmlContent);
  const availableDriverNames = extractDriverNamesWithValidLaps(xmlContent);
  const preferredDriverName = findPreferredDriverName(availableDriverNames, preferredDriverNames);

  let selectedDriverName = '';
  let matchState: MatchState = 'invalid';

  if (availableDriverNames.length > 0) {
    if (preferredDriverName) {
      selectedDriverName = preferredDriverName;
      matchState = 'matched';
    } else {
      matchState = 'needs-selection';
    }
  }

  return {
    id: buildEntryId(file.name, xmlHash, index),
    file,
    sessionName: getDefaultSessionName(file.name),
    sourceFileName: file.name,
    sourceFileSizeBytes: file.size,
    sourceMimeType: file.type || null,
    xmlHash,
    availableDriverNames,
    selectedDriverName,
    sessionType: detectSessionTypeFromXml(xmlContent),
    matchState,
    duplicateReason: null,
  };
}

async function removeUploadedSources(uploadedSources: UploadedSessionImportSource[]) {
  if (uploadedSources.length === 0) {
    return;
  }

  const supabase = createClient();
  const sourcesByBucket = new Map<string, string[]>();

  for (const source of uploadedSources) {
    const bucketPaths = sourcesByBucket.get(source.storageBucket) ?? [];
    bucketPaths.push(source.storagePath);
    sourcesByBucket.set(source.storageBucket, bucketPaths);
  }

  await Promise.all(
    Array.from(sourcesByBucket.entries()).map(async ([bucket, paths]) => {
      await supabase.storage.from(bucket).remove(paths);
    }),
  );
}

export function ImportSessionsForm({
  preferredDriverNames,
  returnTo,
  submitLabel = 'Importar sesiones',
  onJobCreated,
}: ImportSessionsFormProps) {
  const [allEntries, setAllEntries] = useState<SessionImportEntry[]>([]);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<SessionTypeFilter>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState(
    'Estamos preparando la importación en segundo plano.',
  );

  const entries = useMemo(
    () =>
      applyDuplicateFlags(
        allEntries.filter(
          (entry) =>
            entry.matchState !== 'invalid' &&
            doesSessionTypeMatchFilter(entry.sessionType, sessionTypeFilter),
        ),
      ),
    [allEntries, sessionTypeFilter],
  );

  const preferredDriverSummary = useMemo(() => {
    const normalizedNames = preferredDriverNames.filter(Boolean);
    return normalizedNames.length > 0
      ? normalizedNames.join(' · ')
      : 'No hemos podido resolver tu nombre completo desde el perfil.';
  }, [preferredDriverNames]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      setAllEntries([]);
      return;
    }

    const builtEntries = await Promise.all(
      selectedFiles.map((file, index) => buildImportEntry(file, index, preferredDriverNames)),
    );

    setAllEntries(builtEntries);
  }

  function handleDriverChange(entryId: string, value: string) {
    setAllEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              selectedDriverName: value,
            }
          : entry,
      ),
    );
  }

  const invalidEntriesCount = entries.filter((entry) => entry.matchState === 'invalid').length;
  const duplicateEntriesCount = entries.filter((entry) => entry.duplicateReason !== null).length;

  const canSubmit =
    entries.length > 0 &&
    invalidEntriesCount === 0 &&
    duplicateEntriesCount === 0 &&
    entries.every(
      (entry) =>
        entry.sessionName.trim().length > 0 &&
        ((entry.matchState === 'matched' && entry.selectedDriverName.trim().length > 0) ||
          (entry.matchState === 'needs-selection' && entry.selectedDriverName.trim().length > 0)),
    );

  async function uploadEntriesToStorage(
    sourceEntries: SessionImportEntry[],
    ownerUserId: string,
  ): Promise<UploadedSessionImportSource[]> {
    const supabase = createClient();
    const uploadedSources: UploadedSessionImportSource[] = [];

    for (const batch of chunkEntries(sourceEntries, MAX_UPLOAD_CONCURRENCY)) {
      const uploadedBatch = await Promise.all(
        batch.map(async (entry) => {
          const storageTarget = buildSessionImportStoragePath({
            ownerUserId,
            fileName: entry.sourceFileName,
            sourceFileHash: entry.xmlHash,
            uploadId: crypto.randomUUID(),
          });
          const uploadResult = await supabase.storage
            .from(storageTarget.bucket)
            .upload(storageTarget.path, entry.file, {
              contentType: entry.sourceMimeType ?? 'application/xml',
              upsert: false,
            });

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          return {
            sessionName: entry.sessionName.trim(),
            sourceFileHash: entry.xmlHash,
            sourceFileName: entry.sourceFileName,
            sourceFileSizeBytes: entry.sourceFileSizeBytes,
            sourceMimeType: entry.sourceMimeType,
            storageBucket: storageTarget.bucket,
            storagePath: storageTarget.path,
            driverName: entry.selectedDriverName.trim(),
            detectedSessionType: entry.sessionType,
          } satisfies UploadedSessionImportSource;
        }),
      );

      uploadedSources.push(...uploadedBatch);
      setPendingMessage(
        `Hemos subido ${uploadedSources.length} de ${sourceEntries.length} XML al almacenamiento seguro. Ahora seguiremos en segundo plano.`,
      );
    }

    return uploadedSources;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setPendingMessage('Subiendo XML al almacenamiento seguro para procesarlos totalmente en back.');

    const supabase = createClient();
    const uploadedSources: UploadedSessionImportSource[] = [];
    const committedSourceKeys = new Set<string>();

    try {
      const userResult = await supabase.auth.getUser();
      const ownerUserId = userResult.data.user?.id;

      if (!ownerUserId) {
        throw new Error('unauthorized');
      }

      uploadedSources.push(...(await uploadEntriesToStorage(entries, ownerUserId)));
      setPendingMessage('Creando la cola de importación para que el backend procese los XML.');

      const jobChunks = chunkEntries(uploadedSources, MAX_JOB_CHUNK_FILES);

      for (let index = 0; index < jobChunks.length; index += 1) {
        const chunk = jobChunks[index];
        setPendingMessage(
          `Encolando lote ${index + 1} de ${jobChunks.length}. Después la importación continuará en segundo plano sin depender de esta pestaña.`,
        );

        const response = await fetch('/api/session-import-jobs', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sessionTypeFilter,
            sessions: chunk,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          job?: SessionImportJobSummary;
        };

        if (!response.ok || !payload.job) {
          throw new Error(payload.error ?? 'import_job_failed');
        }

        for (const source of chunk) {
          committedSourceKeys.add(`${source.storageBucket}:${source.storagePath}`);
        }

        onJobCreated?.(payload.job);
      }

      setAllEntries([]);
    } catch (error) {
      await removeUploadedSources(
        uploadedSources.filter(
          (source) => !committedSourceKeys.has(`${source.storageBucket}:${source.storagePath}`),
        ),
      );
      const code = error instanceof Error ? error.message : 'import_job_failed';
      setSubmitError(
        code === 'unauthorized'
          ? 'Tu sesión ha caducado. Recarga la página e inténtalo de nuevo.'
          : code === 'async_import_unavailable'
            ? 'La cola de importación no está disponible todavía en este entorno. La base está preparada para funcionar totalmente en segundo plano, pero aquí aún no podemos activarla.'
            : code === 'empty_import_job'
              ? 'No hay XML válidos para encolar con el filtro actual.'
              : 'No hemos podido dejar todos los XML preparados en segundo plano. No se ha iniciado la importación y hemos limpiado los ficheros temporales subidos.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      <ImportSessionsPendingState isSubmitting={isSubmitting} message={pendingMessage} />
      <input type="hidden" name="returnTo" value={returnTo ?? '/sesiones'} />
      {submitError ? (
        <div className="rounded-[1rem] border border-[#ff6b5730] bg-[#ff6b570a] px-4 py-3 text-sm text-[#f3b4aa]">
          {submitError}
        </div>
      ) : null}
      <ImportSessionsFormBody
        sessionTypeFilter={sessionTypeFilter}
        setSessionTypeFilter={setSessionTypeFilter}
        preferredDriverSummary={preferredDriverSummary}
        entries={entries}
        handleFileChange={handleFileChange}
        handleDriverChange={handleDriverChange}
        canSubmit={canSubmit}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
