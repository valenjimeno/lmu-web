'use client';

import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type ImportSessionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  setupId?: string;
  importedSessionHashes: string[];
  preferredDriverNames: string[];
  returnTo?: string;
  requireSessionName?: boolean;
  initialSessionName?: string;
  submitLabel?: string;
};

type MatchState = 'idle' | 'matched' | 'needs-selection' | 'invalid';

const inputClassName =
  'input-surface w-full rounded-[1rem] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

function normalizeDriverName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function extractDriverNames(xmlContent: string) {
  const names: string[] = [];
  const driverPattern = /<Driver>([\s\S]*?)<\/Driver>/g;

  for (const match of xmlContent.matchAll(driverPattern)) {
    const nameMatch = match[1]?.match(/<Name>([\s\S]*?)<\/Name>/i);
    const driverName = nameMatch?.[1]?.trim();

    if (driverName) {
      names.push(driverName);
    }
  }

  return names;
}

function findPreferredDriverName(availableDriverNames: string[], preferredDriverNames: string[]) {
  for (const preferredName of preferredDriverNames) {
    const normalizedPreferredName = normalizeDriverName(preferredName);
    const matchedDriverName = availableDriverNames.find(
      (driverName) => normalizeDriverName(driverName) === normalizedPreferredName,
    );

    if (matchedDriverName) {
      return matchedDriverName;
    }
  }

  for (const preferredName of preferredDriverNames) {
    const normalizedPreferredName = normalizeDriverName(preferredName);
    const preferredTokens = normalizedPreferredName.split(' ').filter(Boolean);

    if (preferredTokens.length < 2) {
      continue;
    }

    const matchedDriverName = availableDriverNames.find((driverName) => {
      const normalizedDriverName = normalizeDriverName(driverName);

      return preferredTokens.every((token) => normalizedDriverName.includes(token));
    });

    if (matchedDriverName) {
      return matchedDriverName;
    }
  }

  return '';
}

async function computeXmlHash(xmlContent: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(xmlContent);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function ImportSessionForm({
  action,
  setupId,
  importedSessionHashes,
  preferredDriverNames,
  returnTo,
  requireSessionName = false,
  initialSessionName = '',
  submitLabel = 'Importar sesión',
}: ImportSessionFormProps) {
  const [sessionName, setSessionName] = useState(initialSessionName);
  const [sourceFileName, setSourceFileName] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [availableDriverNames, setAvailableDriverNames] = useState<string[]>([]);
  const [selectedDriverName, setSelectedDriverName] = useState('');
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [isDuplicateSession, setIsDuplicateSession] = useState(false);

  const preferredDriverSummary = useMemo(() => {
    const normalizedNames = preferredDriverNames.filter(Boolean);
    return normalizedNames.length > 0
      ? normalizedNames.join(' · ')
      : 'No hemos podido resolver tu nombre completo desde el perfil.';
  }, [preferredDriverNames]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setSourceFileName('');
      setXmlContent('');
      setAvailableDriverNames([]);
      setSelectedDriverName('');
      setMatchState('idle');
      setIsDuplicateSession(false);
      return;
    }

    const nextXmlContent = await selectedFile.text();
    const nextXmlHash = await computeXmlHash(nextXmlContent);
    const nextDriverNames = extractDriverNames(nextXmlContent);
    const preferredDriverName = findPreferredDriverName(nextDriverNames, preferredDriverNames);
    const duplicateDetected = importedSessionHashes.includes(nextXmlHash);

    setSourceFileName(selectedFile.name);
    setXmlContent(nextXmlContent);
    setAvailableDriverNames(nextDriverNames);
    setIsDuplicateSession(duplicateDetected);

    if (requireSessionName && !sessionName.trim()) {
      setSessionName(selectedFile.name.replace(/\.[^.]+$/, ''));
    }

    if (nextDriverNames.length === 0) {
      setSelectedDriverName('');
      setMatchState('invalid');
      return;
    }

    if (preferredDriverName) {
      setSelectedDriverName(preferredDriverName);
      setMatchState('matched');
      return;
    }

    setSelectedDriverName('');
    setMatchState('needs-selection');
  }

  const canSubmit =
    (!requireSessionName || Boolean(sessionName.trim())) &&
    xmlContent.length > 0 &&
    !isDuplicateSession &&
    ((matchState === 'matched' && Boolean(selectedDriverName)) ||
      (matchState === 'needs-selection' && Boolean(selectedDriverName)));

  return (
    <form action={action} className="space-y-4">
      {setupId ? <input type="hidden" name="setupId" value={setupId} /> : null}
      <input type="hidden" name="sessionName" value={sessionName} />
      <input type="hidden" name="xmlContent" value={xmlContent} />
      <input type="hidden" name="sourceFileName" value={sourceFileName} />
      <input type="hidden" name="driverName" value={selectedDriverName} />
      <input type="hidden" name="returnTo" value={returnTo ?? '/setups'} />

      {requireSessionName ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Nombre de la sesión</span>
          <input
            type="text"
            value={sessionName}
            onChange={(event) => setSessionName(event.target.value)}
            placeholder="Spa 20 min carrera"
            className={inputClassName}
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Fichero XML</span>
        <input
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={handleFileChange}
          className={`${inputClassName} file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(225,178,122,0.18)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#f5d4aa]`}
        />
      </label>

      <p className="text-xs leading-6 text-muted">
        Intentaremos encontrar automáticamente tu piloto usando: {preferredDriverSummary}
      </p>

      {matchState === 'matched' ? (
        <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100">
          Piloto detectado automáticamente: <strong>{selectedDriverName}</strong>
        </div>
      ) : null}

      {isDuplicateSession ? (
        <div className="rounded-[1rem] border border-[#ff6b5730] bg-[#ff6b570a] px-4 py-3 text-sm text-[#f3b4aa]">
          Este XML ya está importado como sesión. No puedes subir el mismo fichero más de una vez.
        </div>
      ) : null}

      {matchState === 'needs-selection' ? (
        <div className="space-y-3 rounded-[1rem] border border-amber-400/20 bg-amber-500/[0.08] px-4 py-4">
          <p className="text-sm text-amber-100">
            No hemos encontrado tu piloto automáticamente en este fichero. Elige qué nombre quieres
            importar.
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Piloto a importar</span>
            <select
              value={selectedDriverName}
              onChange={(event) => setSelectedDriverName(event.target.value)}
              className={inputClassName}
            >
              <option value="">Selecciona un piloto</option>
              {availableDriverNames.map((driverName) => (
                <option key={driverName} value={driverName}>
                  {driverName}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {matchState === 'invalid' ? (
        <div className="rounded-[1rem] border border-[#ff6b5730] bg-[#ff6b570a] px-4 py-3 text-sm text-[#f3b4aa]">
          No hemos podido encontrar pilotos válidos dentro del XML. Revisa el fichero e inténtalo de
          nuevo.
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
