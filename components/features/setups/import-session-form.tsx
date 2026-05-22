'use client';

import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  extractDriverNamesWithValidLaps,
  findPreferredDriverName,
  type MatchState,
} from '@/components/features/sessions/import-session-client';
import { Button } from '@/components/ui/button';
import { detectSessionTypeFromXml, formatSessionType } from '@/lib/utils/session-type';

type ImportSessionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  setupId?: string;
  preferredDriverNames: string[];
  returnTo?: string;
  requireSessionName?: boolean;
  initialSessionName?: string;
  submitLabel?: string;
};

const inputClassName =
  'input-surface w-full rounded-[1rem] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]';

export function ImportSessionForm({
  action,
  setupId,
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
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<MatchState>('idle');

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
      setSessionType(null);
      setMatchState('idle');
      return;
    }

    const nextXmlContent = await selectedFile.text();
    const nextDriverNames = extractDriverNamesWithValidLaps(nextXmlContent);
    const nextSessionType = detectSessionTypeFromXml(nextXmlContent);
    const preferredDriverName = findPreferredDriverName(nextDriverNames, preferredDriverNames);

    setSourceFileName(selectedFile.name);
    setXmlContent(nextXmlContent);
    setAvailableDriverNames(nextDriverNames);
    setSessionType(nextSessionType);

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

      {xmlContent ? (
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
          Tipo de sesión detectado: <strong>{formatSessionType(sessionType)}</strong>
        </div>
      ) : null}

      {matchState === 'matched' ? (
        <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100">
          Piloto detectado automáticamente: <strong>{selectedDriverName}</strong>
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
