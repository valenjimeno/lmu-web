import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { deriveSessionMetrics } from '@/services/session-metrics';
import type { Database } from '@/types/database.types';

type SetupSessionInsert = Database['public']['Tables']['setup_sessions']['Insert'];
type SetupSessionLapInsert = Database['public']['Tables']['setup_session_laps']['Insert'];
type SetupSessionRow = Database['public']['Tables']['setup_sessions']['Row'];
type SetupSessionLapRow = Database['public']['Tables']['setup_session_laps']['Row'];

type ParsedDriverLap = {
  lapNumber: number;
  runningPosition: number | null;
  elapsedTimeSeconds: number | null;
  lapTimeSeconds: number | null;
  sector1Seconds: number | null;
  sector2Seconds: number | null;
  sector3Seconds: number | null;
  topSpeedKph: number | null;
  fuelRemaining: number | null;
  fuelUsed: number | null;
  virtualEnergyRemaining: number | null;
  virtualEnergyUsed: number | null;
  tireWearFl: number | null;
  tireWearFr: number | null;
  tireWearRl: number | null;
  tireWearRr: number | null;
  frontCompound: string | null;
  rearCompound: string | null;
  tireFlCompound: string | null;
  tireFrCompound: string | null;
  tireRlCompound: string | null;
  tireRrCompound: string | null;
  pitFlag: boolean;
  isValidLap: boolean;
};

type ParsedDriver = {
  name: string;
  carNumber: string | null;
  teamName: string | null;
  carClass: string | null;
  carType: string | null;
  vehFile: string | null;
  vehName: string | null;
  category: string | null;
  upgradeCode: string | null;
  connected: boolean | null;
  serverScored: boolean | null;
  isPlayer: boolean | null;
  gridPos: number | null;
  finishPos: number | null;
  classGridPos: number | null;
  classFinishPos: number | null;
  lapRankIncludingDiscos: number | null;
  lapsCompleted: number | null;
  pitstops: number | null;
  finishStatus: string | null;
  dnfReason: string | null;
  finishTimeSeconds: number | null;
  bestLapSeconds: number | null;
  controlAndAids: string | null;
  controlAndAidsStartLap: number | null;
  controlAndAidsEndLap: number | null;
  laps: ParsedDriverLap[];
};

type ParsedRaceXml = {
  session: Omit<
    SetupSessionInsert,
    'setup_id' | 'owner_user_id' | 'driver_name' | 'source_file_name' | 'source_file_hash'
  >;
  drivers: ParsedDriver[];
  driverNames: string[];
};

type ImportSetupSessionInput = {
  ownerUserId: string;
  setupId?: string | null;
  xmlContent: string;
  driverName: string;
  sessionName?: string | null;
  sourceFileName?: string | null;
};

type DeleteSetupSessionInput = {
  ownerUserId: string;
  sessionId: string;
};

type SetupValidationAggregate = {
  lastValidatedAt: string | null;
  validationSessionsCount: number;
  bestValidatedLapMs: number | null;
  avgFuelUsedPerLap: number | null;
  avgTireDropFront: number | null;
  avgTireDropRear: number | null;
  avgPositionGain: number | null;
  consistencyScore: number | null;
  confidenceScore: number | null;
};

function serializeSupabaseLikeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const candidate = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const payload = {
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      details: typeof candidate.details === 'string' ? candidate.details : undefined,
      hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
    };

    return JSON.stringify(payload);
  }

  return String(error);
}

function extractMissingSchemaColumnName(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };

  if (candidate.code !== 'PGRST204' || typeof candidate.message !== 'string') {
    return null;
  }

  const match = candidate.message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

async function insertSetupSessionWithSchemaFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionInsert: SetupSessionInsert,
) {
  let payload: SetupSessionInsert = { ...sessionInsert };
  const removedColumns: string[] = [];

  while (true) {
    const result = await supabase.from('setup_sessions').insert(payload).select('id').single();

    if (!result.error) {
      return {
        insertedSession: result.data,
        removedColumns,
      };
    }

    const missingColumn = extractMissingSchemaColumnName(result.error);

    if (!missingColumn || !(missingColumn in payload)) {
      throw result.error;
    }

    removedColumns.push(missingColumn);
    const nextPayload = { ...payload } as Record<string, unknown>;
    delete nextPayload[missingColumn];
    payload = nextPayload as SetupSessionInsert;
  }
}

function normalizeDriverName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function findDriverByPreferredName(drivers: ParsedDriver[], preferredName: string) {
  const normalizedPreferredName = normalizeDriverName(preferredName);

  const exactMatch = drivers.find(
    (driver) => normalizeDriverName(driver.name) === normalizedPreferredName,
  );

  if (exactMatch) {
    return exactMatch;
  }

  const preferredTokens = normalizedPreferredName.split(' ').filter(Boolean);

  if (preferredTokens.length < 2) {
    return null;
  }

  return (
    drivers.find((driver) => {
      const normalizedDriverName = normalizeDriverName(driver.name);
      return preferredTokens.every((token) => normalizedDriverName.includes(token));
    }) ?? null
  );
}

function extractTagContent(source: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = source.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractTagAttribute(source: string, tagName: string, attributeName: string) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'i');
  const match = source.match(pattern);

  if (!match) {
    return null;
  }

  const attributes = parseAttributes(match[1] ?? '');
  return attributes[attributeName] ?? null;
}

function parseAttributes(source: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([A-Za-z0-9_]+)="([^"]*)"/g;

  for (const match of source.matchAll(pattern)) {
    const [, key, value] = match;
    if (!key) {
      continue;
    }

    attributes[key] = value ?? '';
  }

  return attributes;
}

function parseNullableNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseNullableBoolean(value: string | null) {
  if (value === null) {
    return null;
  }

  if (value === '1') {
    return true;
  }

  if (value === '0') {
    return false;
  }

  return null;
}

function parseRaceDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).toISOString();
}

function countDriverEvents(xmlContent: string, driverName: string) {
  const escapedDriverName = driverName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const incidentPattern = new RegExp(`>${escapedDriverName}\\([^)]*\\) reported contact`, 'g');
  const penaltyPattern = new RegExp(
    `<Penalty\\b[^>]*Driver="${escapedDriverName.replace(/"/g, '\\"')}"`,
    'g',
  );
  const trackLimitsPattern = new RegExp(
    `<TrackLimits\\b[^>]*Driver="${escapedDriverName.replace(/"/g, '\\"')}"`,
    'g',
  );

  return {
    incidentsCount: [...xmlContent.matchAll(incidentPattern)].length,
    penaltiesCount: [...xmlContent.matchAll(penaltyPattern)].length,
    trackLimitsCount: [...xmlContent.matchAll(trackLimitsPattern)].length,
  };
}

function parseLapBlock(block: string): ParsedDriverLap[] {
  const laps: ParsedDriverLap[] = [];
  const lapPattern = /<Lap\b([^>]*)>([\s\S]*?)<\/Lap>/g;

  for (const match of block.matchAll(lapPattern)) {
    const attributes = parseAttributes(match[1] ?? '');
    const lapText = (match[2] ?? '').trim();
    const lapTimeSeconds = lapText && lapText !== '--.----' ? parseNullableNumber(lapText) : null;

    laps.push({
      lapNumber: Number(attributes.num ?? 0),
      runningPosition: parseNullableInteger(attributes.p ?? null),
      elapsedTimeSeconds: parseNullableNumber(attributes.et ?? null),
      lapTimeSeconds,
      sector1Seconds: parseNullableNumber(attributes.s1 ?? null),
      sector2Seconds: parseNullableNumber(attributes.s2 ?? null),
      sector3Seconds: parseNullableNumber(attributes.s3 ?? null),
      topSpeedKph: parseNullableNumber(attributes.topspeed ?? null),
      fuelRemaining: parseNullableNumber(attributes.fuel ?? null),
      fuelUsed: parseNullableNumber(attributes.fuelUsed ?? null),
      virtualEnergyRemaining: parseNullableNumber(attributes.ve ?? null),
      virtualEnergyUsed: parseNullableNumber(attributes.veUsed ?? null),
      tireWearFl: parseNullableNumber(attributes.twfl ?? null),
      tireWearFr: parseNullableNumber(attributes.twfr ?? null),
      tireWearRl: parseNullableNumber(attributes.twrl ?? null),
      tireWearRr: parseNullableNumber(attributes.twrr ?? null),
      frontCompound: attributes.fcompound?.trim() || null,
      rearCompound: attributes.rcompound?.trim() || null,
      tireFlCompound: attributes.FL?.trim() || null,
      tireFrCompound: attributes.FR?.trim() || null,
      tireRlCompound: attributes.RL?.trim() || null,
      tireRrCompound: attributes.RR?.trim() || null,
      pitFlag: attributes.pit === '1',
      isValidLap: lapTimeSeconds !== null,
    });
  }

  return laps.filter((lap) => lap.lapNumber > 0);
}

function parseControlAndAids(block: string) {
  const pattern = /<ControlAndAids\b([^>]*)>([\s\S]*?)<\/ControlAndAids>/i;
  const match = block.match(pattern);

  if (!match) {
    return {
      controlAndAids: null,
      controlAndAidsStartLap: null,
      controlAndAidsEndLap: null,
    };
  }

  const attributes = parseAttributes(match[1] ?? '');

  return {
    controlAndAids: (match[2] ?? '').trim() || null,
    controlAndAidsStartLap: parseNullableInteger(attributes.startLap ?? null),
    controlAndAidsEndLap: parseNullableInteger(attributes.endLap ?? null),
  };
}

function parseDriverBlock(block: string): ParsedDriver | null {
  const name = extractTagContent(block, 'Name');

  if (!name) {
    return null;
  }

  const controlAndAids = parseControlAndAids(block);

  return {
    name,
    carNumber: extractTagContent(block, 'CarNumber'),
    teamName: extractTagContent(block, 'TeamName'),
    carClass: extractTagContent(block, 'CarClass'),
    carType: extractTagContent(block, 'CarType'),
    vehFile: extractTagContent(block, 'VehFile'),
    vehName: extractTagContent(block, 'VehName'),
    category: extractTagContent(block, 'Category'),
    upgradeCode: extractTagContent(block, 'UpgradeCode'),
    connected: parseNullableBoolean(extractTagContent(block, 'Connected')),
    serverScored: parseNullableBoolean(extractTagContent(block, 'ServerScored')),
    isPlayer: parseNullableBoolean(extractTagContent(block, 'isPlayer')),
    gridPos: parseNullableInteger(extractTagContent(block, 'GridPos')),
    finishPos: parseNullableInteger(extractTagContent(block, 'Position')),
    classGridPos: parseNullableInteger(extractTagContent(block, 'ClassGridPos')),
    classFinishPos: parseNullableInteger(extractTagContent(block, 'ClassPosition')),
    lapRankIncludingDiscos: parseNullableInteger(
      extractTagContent(block, 'LapRankIncludingDiscos'),
    ),
    lapsCompleted: parseNullableInteger(extractTagContent(block, 'Laps')),
    pitstops: parseNullableInteger(extractTagContent(block, 'Pitstops')),
    finishStatus: extractTagContent(block, 'FinishStatus'),
    dnfReason: extractTagContent(block, 'DNFReason'),
    finishTimeSeconds: parseNullableNumber(extractTagContent(block, 'FinishTime')),
    bestLapSeconds: parseNullableNumber(extractTagContent(block, 'BestLapTime')),
    controlAndAids: controlAndAids.controlAndAids,
    controlAndAidsStartLap: controlAndAids.controlAndAidsStartLap,
    controlAndAidsEndLap: controlAndAids.controlAndAidsEndLap,
    laps: parseLapBlock(block),
  };
}

export function extractDriverNamesFromRaceXml(xmlContent: string) {
  const driverNames: string[] = [];
  const driverPattern = /<Driver>([\s\S]*?)<\/Driver>/g;

  for (const match of xmlContent.matchAll(driverPattern)) {
    const driverName = extractTagContent(match[1] ?? '', 'Name');

    if (driverName) {
      driverNames.push(driverName);
    }
  }

  return driverNames;
}

function parseRaceXml(xmlContent: string): ParsedRaceXml {
  const normalizedXml = xmlContent.trim();

  if (!normalizedXml.includes('<RaceResults>') || !normalizedXml.includes('<Driver>')) {
    throw new Error('invalid_xml');
  }

  const driverPattern = /<Driver>([\s\S]*?)<\/Driver>/g;
  const drivers = [...normalizedXml.matchAll(driverPattern)]
    .map((match) => parseDriverBlock(match[1] ?? ''))
    .filter((driver): driver is ParsedDriver => driver !== null);

  if (drivers.length === 0) {
    throw new Error('invalid_xml');
  }

  return {
    session: {
      source_type: 'rfactor_xml',
      imported_at: new Date().toISOString(),
      session_datetime: parseRaceDateTime(extractTagContent(normalizedXml, 'TimeString')),
      session_type: extractTagContent(normalizedXml, 'Setting'),
      server_name: extractTagContent(normalizedXml, 'ServerName'),
      game_version: extractTagContent(normalizedXml, 'GameVersion'),
      track_venue: extractTagContent(normalizedXml, 'TrackVenue'),
      track_course: extractTagContent(normalizedXml, 'TrackCourse'),
      track_event: extractTagContent(normalizedXml, 'TrackEvent'),
      track_layout_path: extractTagContent(normalizedXml, 'TrackData'),
      track_length_m: parseNullableNumber(extractTagContent(normalizedXml, 'TrackLength')),
      vehicles_allowed: extractTagContent(normalizedXml, 'VehiclesAllowed'),
      race_time_minutes: parseNullableInteger(extractTagContent(normalizedXml, 'RaceTime')),
      race_laps: parseNullableInteger(extractTagContent(normalizedXml, 'RaceLaps')),
      damage_mult: parseNullableNumber(extractTagContent(normalizedXml, 'DamageMult')),
      fuel_mult: parseNullableNumber(extractTagContent(normalizedXml, 'FuelMult')),
      tire_mult: parseNullableNumber(extractTagContent(normalizedXml, 'TireMult')),
      mech_fail_rate: parseNullableNumber(extractTagContent(normalizedXml, 'MechFailRate')),
      parc_ferme: parseNullableInteger(extractTagContent(normalizedXml, 'ParcFerme')),
      fixed_setups: parseNullableBoolean(extractTagContent(normalizedXml, 'FixedSetups')),
      fixed_upgrades: parseNullableBoolean(extractTagContent(normalizedXml, 'FixedUpgrades')),
      tire_warmers: parseNullableBoolean(extractTagContent(normalizedXml, 'TireWarmers')),
      free_settings: parseNullableInteger(extractTagContent(normalizedXml, 'FreeSettings')),
      raw_payload: {
        raceDateTime: extractTagContent(normalizedXml, 'TimeString'),
        clientFuelVisible: extractTagContent(normalizedXml, 'ClientFuelVisible'),
        connectionType: extractTagContent(normalizedXml, 'ConnectionType'),
        connectionUpload: extractTagAttribute(normalizedXml, 'ConnectionType', 'upload'),
        connectionDownload: extractTagAttribute(normalizedXml, 'ConnectionType', 'download'),
      },
    },
    drivers,
    driverNames: drivers.map((driver) => driver.name),
  };
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateLapTimeStdDevMs(
  laps: Array<Pick<SetupSessionLapRow, 'lap_time_seconds' | 'pit_flag' | 'is_valid_lap'>>,
) {
  const lapTimesMs = laps
    .filter((lap) => lap.is_valid_lap && !lap.pit_flag && lap.lap_time_seconds !== null)
    .map((lap) => lap.lap_time_seconds! * 1000);

  if (lapTimesMs.length < 2) {
    return null;
  }

  const mean = lapTimesMs.reduce((sum, value) => sum + value, 0) / lapTimesMs.length;
  const variance =
    lapTimesMs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lapTimesMs.length;

  return Math.sqrt(variance);
}

function calculateTireDrop(
  laps: Array<
    Pick<
      SetupSessionLapRow,
      | 'is_valid_lap'
      | 'pit_flag'
      | 'tire_wear_fl'
      | 'tire_wear_fr'
      | 'tire_wear_rl'
      | 'tire_wear_rr'
    >
  >,
) {
  const validStintLaps = laps.filter((lap) => lap.is_valid_lap && !lap.pit_flag);

  if (validStintLaps.length < 2) {
    return {
      front: null,
      rear: null,
    };
  }

  const firstLap = validStintLaps[0];
  const lastLap = validStintLaps[validStintLaps.length - 1];

  const firstFront =
    firstLap.tire_wear_fl !== null && firstLap.tire_wear_fr !== null
      ? (firstLap.tire_wear_fl + firstLap.tire_wear_fr) / 2
      : null;
  const lastFront =
    lastLap.tire_wear_fl !== null && lastLap.tire_wear_fr !== null
      ? (lastLap.tire_wear_fl + lastLap.tire_wear_fr) / 2
      : null;

  const firstRear =
    firstLap.tire_wear_rl !== null && firstLap.tire_wear_rr !== null
      ? (firstLap.tire_wear_rl + firstLap.tire_wear_rr) / 2
      : null;
  const lastRear =
    lastLap.tire_wear_rl !== null && lastLap.tire_wear_rr !== null
      ? (lastLap.tire_wear_rl + lastLap.tire_wear_rr) / 2
      : null;

  return {
    front: firstFront !== null && lastFront !== null ? firstFront - lastFront : null,
    rear: firstRear !== null && lastRear !== null ? firstRear - lastRear : null,
  };
}

async function calculateSetupValidationAggregate(
  setupId: string,
): Promise<SetupValidationAggregate> {
  const supabase = await createClient();
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('setup_sessions')
    .select(
      'id, imported_at, session_datetime, best_lap_seconds, grid_pos, finish_pos, finish_status',
    )
    .eq('setup_id', setupId)
    .order('imported_at', { ascending: false });

  if (sessionsError) {
    throw sessionsError;
  }

  const sessions = (sessionsData ?? []) as Array<
    Pick<
      SetupSessionRow,
      | 'id'
      | 'imported_at'
      | 'session_datetime'
      | 'best_lap_seconds'
      | 'grid_pos'
      | 'finish_pos'
      | 'finish_status'
    >
  >;

  if (sessions.length === 0) {
    return {
      lastValidatedAt: null,
      validationSessionsCount: 0,
      bestValidatedLapMs: null,
      avgFuelUsedPerLap: null,
      avgTireDropFront: null,
      avgTireDropRear: null,
      avgPositionGain: null,
      consistencyScore: null,
      confidenceScore: null,
    };
  }

  const sessionIds = sessions.map((session) => session.id);
  const { data: lapsData, error: lapsError } = await supabase
    .from('setup_session_laps')
    .select(
      'session_id, lap_time_seconds, pit_flag, is_valid_lap, fuel_used, tire_wear_fl, tire_wear_fr, tire_wear_rl, tire_wear_rr',
    )
    .in('session_id', sessionIds)
    .order('lap_number', { ascending: true });

  if (lapsError) {
    throw lapsError;
  }

  const laps = (lapsData ?? []) as Array<
    Pick<
      SetupSessionLapRow,
      | 'session_id'
      | 'lap_time_seconds'
      | 'pit_flag'
      | 'is_valid_lap'
      | 'fuel_used'
      | 'tire_wear_fl'
      | 'tire_wear_fr'
      | 'tire_wear_rl'
      | 'tire_wear_rr'
    >
  >;

  const lapsBySessionId = new Map<string, typeof laps>();

  for (const lap of laps) {
    const existing = lapsBySessionId.get(lap.session_id) ?? [];
    existing.push(lap);
    lapsBySessionId.set(lap.session_id, existing);
  }

  const bestValidatedLapMs = sessions
    .map((session) =>
      session.best_lap_seconds !== null ? Math.round(session.best_lap_seconds * 1000) : null,
    )
    .filter((value): value is number => value !== null)
    .reduce<number | null>((best, value) => (best === null || value < best ? value : best), null);

  const lastValidatedAt = sessions.reduce<string | null>((latest, session) => {
    const candidate = session.session_datetime ?? session.imported_at;

    if (!latest) {
      return candidate;
    }

    return Date.parse(candidate) > Date.parse(latest) ? candidate : latest;
  }, null);

  const positionGains = sessions
    .map((session) =>
      session.grid_pos !== null && session.finish_pos !== null
        ? session.grid_pos - session.finish_pos
        : null,
    )
    .filter((value): value is number => value !== null);

  const validFuelUsages = laps
    .filter(
      (lap) => lap.is_valid_lap && !lap.pit_flag && lap.fuel_used !== null && lap.fuel_used > 0,
    )
    .map((lap) => lap.fuel_used!);

  const tireDrops = sessionIds
    .map((sessionId) => calculateTireDrop(lapsBySessionId.get(sessionId) ?? []))
    .filter((drop) => drop.front !== null || drop.rear !== null);
  const frontDrops = tireDrops
    .map((drop) => drop.front)
    .filter((value): value is number => value !== null);
  const rearDrops = tireDrops
    .map((drop) => drop.rear)
    .filter((value): value is number => value !== null);

  const consistencyValues = sessionIds
    .map((sessionId) => calculateLapTimeStdDevMs(lapsBySessionId.get(sessionId) ?? []))
    .filter((value): value is number => value !== null);

  const averageStdDevMs = average(consistencyValues);

  const finishedNormallyCount = sessions.filter(
    (session) => session.finish_status === 'Finished Normally',
  ).length;
  const validLapCount = laps.filter((lap) => lap.is_valid_lap && !lap.pit_flag).length;

  return {
    lastValidatedAt,
    validationSessionsCount: sessions.length,
    bestValidatedLapMs,
    avgFuelUsedPerLap:
      validFuelUsages.length > 0
        ? roundTo(
            validFuelUsages.reduce((sum, value) => sum + value, 0) / validFuelUsages.length,
            4,
          )
        : null,
    avgTireDropFront: frontDrops.length > 0 ? roundTo(average(frontDrops) ?? 0, 4) : null,
    avgTireDropRear: rearDrops.length > 0 ? roundTo(average(rearDrops) ?? 0, 4) : null,
    avgPositionGain:
      positionGains.length > 0
        ? roundTo(positionGains.reduce((sum, value) => sum + value, 0) / positionGains.length, 2)
        : null,
    consistencyScore:
      averageStdDevMs !== null ? roundTo(Math.max(0, 100 - averageStdDevMs / 10), 2) : null,
    confidenceScore: roundTo(
      Math.min(100, sessions.length * 15 + validLapCount * 2 + finishedNormallyCount * 10),
      2,
    ),
  };
}

async function updateSetupValidationAggregate(setupId: string) {
  const supabase = await createClient();
  const aggregate = await calculateSetupValidationAggregate(setupId);

  const { error } = await supabase
    .from('setups')
    .update({
      last_validated_at: aggregate.lastValidatedAt,
      validation_sessions_count: aggregate.validationSessionsCount,
      best_validated_lap_ms: aggregate.bestValidatedLapMs,
      avg_fuel_used_per_lap: aggregate.avgFuelUsedPerLap,
      avg_tire_drop_front: aggregate.avgTireDropFront,
      avg_tire_drop_rear: aggregate.avgTireDropRear,
      avg_position_gain: aggregate.avgPositionGain,
      consistency_score: aggregate.consistencyScore,
      confidence_score: aggregate.confidenceScore,
    })
    .eq('id', setupId);

  if (error) {
    throw error;
  }
}

function normalizeSessionName(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function getFallbackSessionName(sourceFileName: string | null | undefined) {
  const normalizedFileName = sourceFileName?.trim() ?? '';

  if (!normalizedFileName) {
    return null;
  }

  return normalizedFileName.replace(/\.[^.]+$/, '').trim() || normalizedFileName;
}

export async function importSetupSession(input: ImportSetupSessionInput) {
  const xmlContent = input.xmlContent.trim();

  if (!xmlContent) {
    throw new Error('empty_xml');
  }

  const parsedXml = parseRaceXml(xmlContent);
  const selectedDriver = findDriverByPreferredName(parsedXml.drivers, input.driverName);

  if (!selectedDriver) {
    throw new Error('driver_not_found');
  }

  const eventCounts = countDriverEvents(xmlContent, selectedDriver.name);
  const sourceFileHash = createHash('sha256').update(xmlContent).digest('hex');
  const normalizedSessionName =
    normalizeSessionName(input.sessionName) ?? getFallbackSessionName(input.sourceFileName);
  const supabase = await createClient();
  const duplicateSessionResult = await supabase
    .from('setup_sessions')
    .select('id')
    .eq('owner_user_id', input.ownerUserId)
    .eq('source_file_hash', sourceFileHash)
    .limit(1)
    .maybeSingle();

  if (duplicateSessionResult.error) {
    throw duplicateSessionResult.error;
  }

  if (duplicateSessionResult.data?.id) {
    throw new Error('duplicate_session');
  }

  const baseRawPayload =
    parsedXml.session.raw_payload && typeof parsedXml.session.raw_payload === 'object'
      ? parsedXml.session.raw_payload
      : {};

  const sessionInsert: SetupSessionInsert = {
    ...parsedXml.session,
    setup_id: input.setupId ?? null,
    owner_user_id: input.ownerUserId,
    source_file_name: input.sourceFileName?.trim() || null,
    source_file_hash: sourceFileHash,
    driver_name: selectedDriver.name,
    car_number: selectedDriver.carNumber,
    team_name: selectedDriver.teamName,
    car_class: selectedDriver.carClass,
    car_type: selectedDriver.carType,
    veh_file: selectedDriver.vehFile,
    veh_name: selectedDriver.vehName,
    category: selectedDriver.category,
    upgrade_code: selectedDriver.upgradeCode,
    connected: selectedDriver.connected,
    server_scored: selectedDriver.serverScored,
    is_player: selectedDriver.isPlayer,
    grid_pos: selectedDriver.gridPos,
    finish_pos: selectedDriver.finishPos,
    class_grid_pos: selectedDriver.classGridPos,
    class_finish_pos: selectedDriver.classFinishPos,
    lap_rank_including_discos: selectedDriver.lapRankIncludingDiscos,
    laps_completed: selectedDriver.lapsCompleted,
    pitstops: selectedDriver.pitstops,
    finish_status: selectedDriver.finishStatus,
    dnf_reason: selectedDriver.dnfReason,
    finish_time_seconds: selectedDriver.finishTimeSeconds,
    best_lap_seconds: selectedDriver.bestLapSeconds,
    incidents_count: eventCounts.incidentsCount,
    penalties_count: eventCounts.penaltiesCount,
    track_limits_count: eventCounts.trackLimitsCount,
    control_and_aids: selectedDriver.controlAndAids,
    control_and_aids_start_lap: selectedDriver.controlAndAidsStartLap,
    control_and_aids_end_lap: selectedDriver.controlAndAidsEndLap,
    raw_payload: {
      ...baseRawPayload,
      sessionName: normalizedSessionName,
      selectedDriverName: selectedDriver.name,
      availableDriverNames: parsedXml.driverNames,
    },
  };
  const derivedMetrics = deriveSessionMetrics(
    selectedDriver.laps.map((lap) => ({
      lapTimeSeconds: lap.lapTimeSeconds,
      sector1Seconds: lap.sector1Seconds,
      sector2Seconds: lap.sector2Seconds,
      sector3Seconds: lap.sector3Seconds,
      topSpeedKph: lap.topSpeedKph,
      fuelUsed: lap.fuelUsed,
      tireWearFl: lap.tireWearFl,
      tireWearFr: lap.tireWearFr,
      tireWearRl: lap.tireWearRl,
      tireWearRr: lap.tireWearRr,
      frontCompound: lap.frontCompound,
      rearCompound: lap.rearCompound,
      pitFlag: lap.pitFlag,
      isValidLap: lap.isValidLap,
    })),
    {
      positionGain:
        selectedDriver.gridPos !== null && selectedDriver.finishPos !== null
          ? selectedDriver.gridPos - selectedDriver.finishPos
          : null,
      finishPos: selectedDriver.finishPos,
    },
  );
  const enrichedSessionInsert: SetupSessionInsert = {
    ...sessionInsert,
    average_lap_ms: derivedMetrics.averageLapMs,
    optimal_lap_ms: derivedMetrics.optimalLapMs,
    lap_consistency_ms: derivedMetrics.lapConsistencyMs,
    best_three_lap_average_ms: derivedMetrics.bestThreeLapAverageMs,
    last_three_lap_average_ms: derivedMetrics.lastThreeLapAverageMs,
    pace_fade_ms: derivedMetrics.paceFadeMs,
    valid_lap_count: derivedMetrics.validLapCount,
    valid_lap_rate: derivedMetrics.validLapRate,
    average_fuel_used_per_lap: derivedMetrics.averageFuelUsedPerLap,
    fuel_min_per_lap: derivedMetrics.fuelMinPerLap,
    fuel_max_per_lap: derivedMetrics.fuelMaxPerLap,
    projected_fuel_20_minutes: derivedMetrics.projectedFuel20Minutes,
    projected_fuel_30_minutes: derivedMetrics.projectedFuel30Minutes,
    projected_fuel_45_minutes: derivedMetrics.projectedFuel45Minutes,
    peak_top_speed_kph: derivedMetrics.peakTopSpeedKph,
    tire_drop_front: derivedMetrics.tireDropFront,
    tire_drop_rear: derivedMetrics.tireDropRear,
    tire_drop_front_per_lap: derivedMetrics.tireDropFrontPerLap,
    tire_drop_rear_per_lap: derivedMetrics.tireDropRearPerLap,
    front_rear_wear_ratio: derivedMetrics.frontRearWearRatio,
    left_right_wear_ratio: derivedMetrics.leftRightWearRatio,
    front_compound: derivedMetrics.compounds.front,
    rear_compound: derivedMetrics.compounds.rear,
    insights: derivedMetrics.insights,
  };
  let insertedSession: { id: string };

  try {
    const result = await insertSetupSessionWithSchemaFallback(supabase, enrichedSessionInsert);
    insertedSession = result.insertedSession;

    if (result.removedColumns.length > 0) {
      console.warn('setup session inserted with schema fallback', {
        setupId: input.setupId ?? null,
        driverName: selectedDriver.name,
        removedColumns: result.removedColumns,
      });
    }
  } catch (error) {
    console.error('setup session insert failed', {
      setupId: input.setupId ?? null,
      driverName: selectedDriver.name,
      sourceFileName: input.sourceFileName ?? null,
      error: serializeSupabaseLikeError(error),
    });

    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new Error('duplicate_session');
    }

    throw error;
  }

  const lapInserts: SetupSessionLapInsert[] = selectedDriver.laps.map((lap) => ({
    session_id: insertedSession.id,
    lap_number: lap.lapNumber,
    running_position: lap.runningPosition,
    elapsed_time_seconds: lap.elapsedTimeSeconds,
    lap_time_seconds: lap.lapTimeSeconds,
    sector_1_seconds: lap.sector1Seconds,
    sector_2_seconds: lap.sector2Seconds,
    sector_3_seconds: lap.sector3Seconds,
    top_speed_kph: lap.topSpeedKph,
    fuel_remaining: lap.fuelRemaining,
    fuel_used: lap.fuelUsed,
    virtual_energy_remaining: lap.virtualEnergyRemaining,
    virtual_energy_used: lap.virtualEnergyUsed,
    tire_wear_fl: lap.tireWearFl,
    tire_wear_fr: lap.tireWearFr,
    tire_wear_rl: lap.tireWearRl,
    tire_wear_rr: lap.tireWearRr,
    front_compound: lap.frontCompound,
    rear_compound: lap.rearCompound,
    tire_fl_compound: lap.tireFlCompound,
    tire_fr_compound: lap.tireFrCompound,
    tire_rl_compound: lap.tireRlCompound,
    tire_rr_compound: lap.tireRrCompound,
    pit_flag: lap.pitFlag,
    is_valid_lap: lap.isValidLap,
  }));

  if (lapInserts.length > 0) {
    const { error: lapsError } = await supabase.from('setup_session_laps').insert(lapInserts);

    if (lapsError) {
      console.error('setup session laps insert failed', {
        setupId: input.setupId ?? null,
        sessionId: insertedSession.id,
        driverName: selectedDriver.name,
        lapCount: lapInserts.length,
        error: serializeSupabaseLikeError(lapsError),
      });
      await supabase.from('setup_sessions').delete().eq('id', insertedSession.id);
      throw lapsError;
    }
  }

  if (input.setupId) {
    try {
      await updateSetupValidationAggregate(input.setupId);
    } catch (error) {
      console.error('setup validation aggregate update failed', {
        setupId: input.setupId,
        sessionId: insertedSession.id,
        driverName: selectedDriver.name,
        error: serializeSupabaseLikeError(error),
      });
      await supabase.from('setup_session_laps').delete().eq('session_id', insertedSession.id);
      await supabase.from('setup_sessions').delete().eq('id', insertedSession.id);
      throw error;
    }
  }

  return {
    sessionId: insertedSession.id,
    sessionName: normalizedSessionName,
    driverName: selectedDriver.name,
    availableDriverNames: parsedXml.driverNames,
  };
}

export async function deleteSetupSession(input: DeleteSetupSessionInput) {
  const supabase = await createClient();
  const sessionResult = await supabase
    .from('setup_sessions')
    .select('id, setup_id')
    .eq('id', input.sessionId)
    .eq('owner_user_id', input.ownerUserId)
    .maybeSingle();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  const session = sessionResult.data;

  if (!session) {
    throw new Error('session_not_found');
  }

  const { error: deleteError } = await supabase
    .from('setup_sessions')
    .delete()
    .eq('id', input.sessionId)
    .eq('owner_user_id', input.ownerUserId);

  if (deleteError) {
    throw deleteError;
  }

  if (session.setup_id) {
    await updateSetupValidationAggregate(session.setup_id);
  }

  return {
    setupId: session.setup_id,
    sessionId: session.id,
  };
}
