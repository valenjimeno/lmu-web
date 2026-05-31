import { createClient } from '@/lib/supabase/server';
import { getSetupCatalog } from '@/services/catalog.service';

export type SetupSessionLinkOption = {
  id: string;
  name: string;
  sessionLabel: string;
  setupId: string | null;
  driverName: string;
  carId: string | null;
  carName: string;
  trackId: string | null;
  trackName: string;
  bestLapMs: number | null;
  importedAt: string;
  sessionDateTime: string | null;
  sourceSessionSetting: string | null;
};

type SetupLinkRow = {
  id: string;
  name: string;
  car_id: string;
  track_id: string;
};

type SetupSessionLinkRow = {
  id: string;
  setup_id: string | null;
  raw_payload: unknown;
  driver_name: string | null;
  car_class: string | null;
  car_type: string | null;
  source_file_name: string | null;
  source_session_setting: string | null;
  imported_at: string;
  session_datetime: string | null;
  track_venue: string | null;
  track_course: string | null;
  best_lap_seconds: number | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function normalizeCompactText(value: string | null | undefined) {
  return normalizeText(value).replace(/\s+/g, '');
}

function buildTextCandidates(...values: Array<string | null | undefined>) {
  const candidates = new Set<string>();

  for (const value of values) {
    const rawValue = value?.trim().toLocaleLowerCase() ?? '';
    const normalizedValue = normalizeText(value);

    if (rawValue) {
      candidates.add(rawValue);
      candidates.add(rawValue.replace(/\s+/g, ''));
    }

    if (!normalizedValue) {
      continue;
    }

    candidates.add(normalizedValue);
    candidates.add(normalizeCompactText(value));
  }

  return Array.from(candidates);
}

function buildTrackCandidates(...values: Array<string | null | undefined>) {
  const genericTrackTokens = new Set([
    'autodromo',
    'autodrome',
    'circuit',
    'de',
    'di',
    'do',
    'international',
    'motor',
    'park',
    'road',
    'speedway',
    'the',
    'track',
  ]);
  const candidates = new Set(buildTextCandidates(...values));

  for (const value of values) {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      continue;
    }

    const tokens = normalizedValue
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !genericTrackTokens.has(token));

    for (const token of tokens) {
      candidates.add(token);
    }
  }

  return Array.from(candidates);
}

function buildCarCandidates(...values: Array<string | null | undefined>) {
  const genericCarTokens = new Set([
    'auto',
    'car',
    'cars',
    'competition',
    'evo',
    'gt3',
    'gtp',
    'hypercar',
    'lmdh',
    'lmgt3',
    'prototype',
    'racing',
    'team',
  ]);
  const candidates = new Set(buildTextCandidates(...values));

  for (const value of values) {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      continue;
    }

    const tokens = normalizedValue
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !genericCarTokens.has(token));

    for (const token of tokens) {
      candidates.add(token);
    }
  }

  return Array.from(candidates);
}

function matchesCandidateText(
  value: string | null | undefined,
  candidates: string[],
  minimumSubstringLength = 6,
) {
  const normalizedValue = normalizeText(value);
  const compactNormalizedValue = normalizeCompactText(value);

  if (!normalizedValue || !compactNormalizedValue) {
    return false;
  }

  return candidates.some((candidate) => {
    const compactCandidate = candidate.replace(/\s+/g, '');

    return (
      candidate === normalizedValue ||
      compactCandidate === compactNormalizedValue ||
      (candidate.length >= minimumSubstringLength && normalizedValue.includes(candidate)) ||
      (normalizedValue.length >= minimumSubstringLength && candidate.includes(normalizedValue)) ||
      (compactCandidate.length >= minimumSubstringLength &&
        compactNormalizedValue.includes(compactCandidate)) ||
      (compactNormalizedValue.length >= minimumSubstringLength &&
        compactCandidate.includes(compactNormalizedValue))
    );
  });
}

function getSessionName(session: SetupSessionLinkRow) {
  const rawPayload =
    session.raw_payload && typeof session.raw_payload === 'object' ? session.raw_payload : null;
  const sessionNameFromPayload =
    rawPayload && 'sessionName' in rawPayload && typeof rawPayload.sessionName === 'string'
      ? rawPayload.sessionName.trim()
      : '';
  const fallbackFileName =
    session.source_file_name?.trim().replace(/\.[^.]+$/, '') ||
    session.source_file_name?.trim() ||
    'Sesión sin nombre';

  return sessionNameFromPayload || fallbackFileName;
}

export async function getSetupSessionLinkOptions(
  userId: string,
): Promise<SetupSessionLinkOption[]> {
  const supabase = await createClient();
  const { cars, tracks } = await getSetupCatalog();

  const [setupsResult, sessionsResult] = await Promise.all([
    supabase.from('setups').select('id, name, car_id, track_id').eq('owner_user_id', userId),
    supabase
      .from('setup_sessions')
      .select(
        'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_session_setting, imported_at, session_datetime, track_venue, track_course, best_lap_seconds',
      )
      .eq('owner_user_id', userId)
      .order('session_datetime', { ascending: false, nullsFirst: false })
      .order('imported_at', { ascending: false }),
  ]);

  if (setupsResult.error) {
    throw setupsResult.error;
  }

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const setups = (setupsResult.data ?? []) as SetupLinkRow[];
  const sessions = (sessionsResult.data ?? []) as SetupSessionLinkRow[];
  const setupsById = new Map(setups.map((setup) => [setup.id, setup]));

  return sessions.map((session) => {
    const linkedSetup = session.setup_id ? setupsById.get(session.setup_id) : undefined;
    const matchedCar = linkedSetup
      ? (cars.find((car) => car.id === linkedSetup.car_id) ?? null)
      : (cars.find((car) =>
          matchesCandidateText(session.car_type, buildCarCandidates(car.name, car.slug)),
        ) ?? null);
    const matchedTrack = linkedSetup
      ? (tracks.find((track) => track.id === linkedSetup.track_id) ?? null)
      : (tracks.find((track) =>
          matchesCandidateText(
            session.track_venue ?? session.track_course,
            buildTrackCandidates(track.name, track.slug, track.official_name, track.city),
          ),
        ) ?? null);

    return {
      id: session.id,
      name: linkedSetup?.name ?? getSessionName(session),
      sessionLabel: getSessionName(session),
      setupId: session.setup_id,
      driverName: session.driver_name?.trim() || 'Piloto no disponible',
      carId: linkedSetup?.car_id ?? matchedCar?.id ?? null,
      carName: linkedSetup
        ? (matchedCar?.name ?? session.car_type?.trim() ?? 'Coche no disponible')
        : (session.car_type?.trim() ?? matchedCar?.name ?? 'Coche no disponible'),
      trackId: linkedSetup?.track_id ?? matchedTrack?.id ?? null,
      trackName: linkedSetup
        ? (matchedTrack?.name ??
          session.track_venue?.trim() ??
          session.track_course?.trim() ??
          'Circuito no disponible')
        : (session.track_venue?.trim() ??
          session.track_course?.trim() ??
          matchedTrack?.name ??
          'Circuito no disponible'),
      bestLapMs:
        session.best_lap_seconds !== null ? Math.round(session.best_lap_seconds * 1000) : null,
      importedAt: session.imported_at,
      sessionDateTime: session.session_datetime,
      sourceSessionSetting: session.source_session_setting,
    };
  });
}

type SyncSetupSessionLinksInput = {
  ownerUserId: string;
  setupId: string;
  sessionIds: string[];
};

export async function syncSetupSessionLinks(input: SyncSetupSessionLinksInput) {
  const supabase = await createClient();
  const normalizedSessionIds = Array.from(
    new Set(input.sessionIds.map((sessionId) => sessionId.trim()).filter(Boolean)),
  );

  const currentLinksResult = await supabase
    .from('setup_sessions')
    .select('id')
    .eq('owner_user_id', input.ownerUserId)
    .eq('setup_id', input.setupId);

  if (currentLinksResult.error) {
    throw currentLinksResult.error;
  }

  const currentLinkedIds = new Set((currentLinksResult.data ?? []).map((row) => row.id));
  const nextLinkedIds = new Set(normalizedSessionIds);

  const sessionRowsToLink =
    normalizedSessionIds.length > 0
      ? await supabase
          .from('setup_sessions')
          .select('id, setup_id')
          .eq('owner_user_id', input.ownerUserId)
          .in('id', normalizedSessionIds)
      : { data: [], error: null };

  if (sessionRowsToLink.error) {
    throw sessionRowsToLink.error;
  }

  if ((sessionRowsToLink.data ?? []).length !== normalizedSessionIds.length) {
    throw new Error('invalid_session_links');
  }

  const hasForeignLinkedSession = (sessionRowsToLink.data ?? []).some(
    (row) => row.setup_id && row.setup_id !== input.setupId,
  );

  if (hasForeignLinkedSession) {
    throw new Error('invalid_session_links');
  }

  const sessionIdsToLink = normalizedSessionIds.filter(
    (sessionId) => !currentLinkedIds.has(sessionId),
  );
  const sessionIdsToUnlink = [...currentLinkedIds].filter(
    (sessionId) => !nextLinkedIds.has(sessionId),
  );

  if (sessionIdsToLink.length > 0) {
    const { error } = await supabase
      .from('setup_sessions')
      .update({ setup_id: input.setupId })
      .eq('owner_user_id', input.ownerUserId)
      .in('id', sessionIdsToLink)
      .or(`setup_id.is.null,setup_id.eq.${input.setupId}`);

    if (error) {
      throw error;
    }
  }

  if (sessionIdsToUnlink.length > 0) {
    const { error } = await supabase
      .from('setup_sessions')
      .update({ setup_id: null })
      .eq('owner_user_id', input.ownerUserId)
      .eq('setup_id', input.setupId)
      .in('id', sessionIdsToUnlink);

    if (error) {
      throw error;
    }
  }
}
