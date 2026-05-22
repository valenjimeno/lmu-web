import { createPerfTrace } from '@/lib/observability/perf';
import { createClient } from '@/lib/supabase/server';
import { getSetupCatalog, type CarOption } from '@/services/catalog.service';
import { deriveSessionMetrics } from '@/services/session-metrics';
import type { Database } from '@/types/database.types';

type SetupSessionRow = Pick<
  Database['public']['Tables']['setup_sessions']['Row'],
  | 'id'
  | 'setup_id'
  | 'raw_payload'
  | 'driver_name'
  | 'car_class'
  | 'car_type'
  | 'source_file_name'
  | 'source_session_setting'
  | 'imported_at'
  | 'session_datetime'
  | 'session_type'
  | 'track_venue'
  | 'track_course'
  | 'race_time_minutes'
  | 'best_lap_seconds'
  | 'finish_pos'
  | 'grid_pos'
  | 'finish_status'
  | 'laps_completed'
  | 'pitstops'
>;

type SetupSessionDetailRow = Pick<
  Database['public']['Tables']['setup_sessions']['Row'],
  | 'id'
  | 'setup_id'
  | 'raw_payload'
  | 'driver_name'
  | 'car_class'
  | 'car_type'
  | 'source_file_name'
  | 'source_type'
  | 'imported_at'
  | 'session_datetime'
  | 'session_type'
  | 'source_session_setting'
  | 'server_name'
  | 'game_version'
  | 'track_venue'
  | 'track_course'
  | 'track_event'
  | 'track_layout_path'
  | 'track_length_m'
  | 'vehicles_allowed'
  | 'race_time_minutes'
  | 'race_laps'
  | 'damage_mult'
  | 'fuel_mult'
  | 'tire_mult'
  | 'mech_fail_rate'
  | 'driver_name'
  | 'team_name'
  | 'car_number'
  | 'control_and_aids'
  | 'finish_pos'
  | 'grid_pos'
  | 'finish_status'
  | 'laps_completed'
  | 'pitstops'
  | 'best_lap_seconds'
  | 'finish_time_seconds'
  | 'incidents_count'
  | 'penalties_count'
  | 'track_limits_count'
  | 'average_lap_ms'
  | 'optimal_lap_ms'
  | 'lap_consistency_ms'
  | 'best_three_lap_average_ms'
  | 'last_three_lap_average_ms'
  | 'pace_fade_ms'
  | 'valid_lap_count'
  | 'valid_lap_rate'
  | 'average_fuel_used_per_lap'
  | 'fuel_min_per_lap'
  | 'fuel_max_per_lap'
  | 'projected_fuel_20_minutes'
  | 'projected_fuel_30_minutes'
  | 'projected_fuel_45_minutes'
  | 'peak_top_speed_kph'
  | 'tire_drop_front'
  | 'tire_drop_rear'
  | 'tire_drop_front_per_lap'
  | 'tire_drop_rear_per_lap'
  | 'front_rear_wear_ratio'
  | 'left_right_wear_ratio'
  | 'front_compound'
  | 'rear_compound'
  | 'insights'
>;

type SetupSessionLapRow = Pick<
  Database['public']['Tables']['setup_session_laps']['Row'],
  | 'lap_number'
  | 'running_position'
  | 'lap_time_seconds'
  | 'sector_1_seconds'
  | 'sector_2_seconds'
  | 'sector_3_seconds'
  | 'top_speed_kph'
  | 'fuel_remaining'
  | 'fuel_used'
  | 'tire_wear_fl'
  | 'tire_wear_fr'
  | 'tire_wear_rl'
  | 'tire_wear_rr'
  | 'front_compound'
  | 'rear_compound'
  | 'pit_flag'
  | 'is_valid_lap'
>;

type SetupLinkRow = Pick<
  Database['public']['Tables']['setups']['Row'],
  'id' | 'name' | 'car_id' | 'track_id'
>;

type SessionIdentityRow = Pick<
  SetupSessionRow,
  | 'id'
  | 'setup_id'
  | 'raw_payload'
  | 'driver_name'
  | 'car_type'
  | 'source_file_name'
  | 'source_session_setting'
  | 'imported_at'
  | 'session_datetime'
  | 'session_type'
  | 'track_venue'
  | 'track_course'
  | 'race_time_minutes'
  | 'best_lap_seconds'
  | 'finish_pos'
  | 'grid_pos'
  | 'finish_status'
  | 'laps_completed'
  | 'pitstops'
>;

export type SessionSummary = {
  id: string;
  name: string;
  setupId: string | null;
  linkedSetupName: string | null;
  carId: string | null;
  carClassId: string | null;
  carName: string;
  manufacturerName: string;
  trackId: string | null;
  trackName: string;
  trackVenue: string | null;
  driverName: string;
  sourceFileName: string | null;
  sourceSessionSetting: string | null;
  importedAt: string;
  sessionDateTime: string | null;
  sessionType: string | null;
  raceDurationMinutes: number | null;
  bestLapMs: number | null;
  gridPos: number | null;
  finishPos: number | null;
  positionGain: number | null;
  finishStatus: string | null;
  lapsCompleted: number | null;
  pitstops: number | null;
};

export type SessionDetail = SessionSummary & {
  sourceCarClass: string | null;
  sessionType: string | null;
  serverName: string | null;
  gameVersion: string | null;
  sourceType: string;
  sourceSessionSetting: string | null;
  trackCourse: string | null;
  trackEvent: string | null;
  trackLayoutPath: string | null;
  trackLengthM: number | null;
  vehiclesAllowed: string | null;
  raceLaps: number | null;
  damageMult: number | null;
  fuelMult: number | null;
  tireMult: number | null;
  mechFailRate: number | null;
  teamName: string | null;
  carNumber: string | null;
  controlAndAids: string | null;
  finishTimeSeconds: number | null;
  incidentsCount: number;
  penaltiesCount: number;
  trackLimitsCount: number;
  averageLapMs: number | null;
  optimalLapMs: number | null;
  lapConsistencyMs: number | null;
  bestThreeLapAverageMs: number | null;
  lastThreeLapAverageMs: number | null;
  paceFadeMs: number | null;
  validLapRate: number | null;
  averageFuelUsedPerLap: number | null;
  fuelMinPerLap: number | null;
  fuelMaxPerLap: number | null;
  projectedFuel20Minutes: number | null;
  projectedFuel30Minutes: number | null;
  projectedFuel45Minutes: number | null;
  peakTopSpeedKph: number | null;
  tireDropFront: number | null;
  tireDropRear: number | null;
  tireDropFrontPerLap: number | null;
  tireDropRearPerLap: number | null;
  frontRearWearRatio: number | null;
  leftRightWearRatio: number | null;
  validLapCount: number;
  insights: string[];
  compounds: {
    front: string | null;
    rear: string | null;
  };
  laps: Array<{
    lapNumber: number;
    runningPosition: number | null;
    lapTimeMs: number | null;
    sector1Ms: number | null;
    sector2Ms: number | null;
    sector3Ms: number | null;
    topSpeedKph: number | null;
    fuelRemaining: number | null;
    fuelUsed: number | null;
    tireWearFl: number | null;
    tireWearFr: number | null;
    tireWearRl: number | null;
    tireWearRr: number | null;
    frontCompound: string | null;
    rearCompound: string | null;
    pitFlag: boolean;
    isValidLap: boolean;
  }>;
};

export type SessionFilters = {
  sourceSessionSetting?: string;
  carClassId?: string;
  carId?: string;
  trackId?: string;
};

type GetSessionPageDataOptions = {
  page?: number;
  pageSize?: number;
};

function resolveSessionCatalogFilters(
  carClasses: Awaited<ReturnType<typeof getSetupCatalog>>['carClasses'],
  cars: Awaited<ReturnType<typeof getSetupCatalog>>['cars'],
  filters: Pick<SessionFilters, 'carClassId' | 'carId'>,
) {
  const defaultCarClassId =
    carClasses.find((carClass) => carClass.slug.toLowerCase() === 'lmgt3')?.id ?? carClasses[0]?.id;
  const selectedCarClassId = carClasses.some((carClass) => carClass.id === filters.carClassId)
    ? filters.carClassId
    : defaultCarClassId;
  const carsForSelectedClass = selectedCarClassId
    ? cars.filter((car) => car.car_class_id === selectedCarClassId)
    : cars;
  const carsForSelectedClassIds = new Set(carsForSelectedClass.map((car) => car.id));
  const selectedCarId =
    filters.carId && carsForSelectedClassIds.has(filters.carId) ? filters.carId : undefined;

  return {
    defaultCarClassId,
    selectedCarClassId,
    carsForSelectedClass,
    selectedCarId,
  };
}

function buildSessionSummary(
  session: SessionIdentityRow,
  setup: SetupLinkRow | undefined,
  carsById: Map<string, CarOption>,
  tracksById: Map<string, string>,
  manufacturersById: Map<string, string>,
): SessionSummary {
  const car = setup ? carsById.get(setup.car_id) : undefined;
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
  const inferredCarName = session.car_type?.trim() || 'Coche no disponible';
  const inferredTrackName =
    session.track_venue?.trim() || session.track_course?.trim() || 'Circuito no disponible';

  return {
    id: session.id,
    name: setup?.name ?? (sessionNameFromPayload || fallbackFileName),
    setupId: session.setup_id,
    linkedSetupName: setup?.name ?? null,
    carId: car?.id ?? setup?.car_id ?? null,
    carClassId: car?.car_class_id ?? null,
    carName: car?.name ?? inferredCarName,
    manufacturerName: manufacturersById.get(car?.manufacturer_id ?? '') ?? '',
    trackId: setup?.track_id ?? null,
    trackName: setup ? (tracksById.get(setup.track_id) ?? inferredTrackName) : inferredTrackName,
    trackVenue: session.track_venue,
    driverName: session.driver_name?.trim() || 'Piloto no disponible',
    sourceFileName: session.source_file_name,
    sourceSessionSetting: session.source_session_setting,
    importedAt: session.imported_at,
    sessionDateTime: session.session_datetime,
    sessionType: session.session_type,
    raceDurationMinutes: session.race_time_minutes,
    bestLapMs:
      session.best_lap_seconds !== null ? Math.round(session.best_lap_seconds * 1000) : null,
    gridPos: session.grid_pos,
    finishPos: session.finish_pos,
    positionGain:
      session.grid_pos !== null && session.finish_pos !== null
        ? session.grid_pos - session.finish_pos
        : null,
    finishStatus: session.finish_status,
    lapsCompleted: session.laps_completed,
    pitstops: session.pitstops,
  };
}

function buildSessionIdentity(
  session: Pick<SessionIdentityRow, keyof SessionIdentityRow>,
  setup: SetupLinkRow | undefined,
  carsById: Map<string, CarOption>,
  tracksById: Map<string, string>,
  manufacturersById: Map<string, string>,
) {
  return buildSessionSummary(session, setup, carsById, tracksById, manufacturersById);
}

const setupSessionDetailSelectWithMetrics =
  'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_type, imported_at, session_datetime, session_type, source_session_setting, server_name, game_version, track_venue, track_course, track_event, track_layout_path, track_length_m, vehicles_allowed, race_time_minutes, race_laps, damage_mult, fuel_mult, tire_mult, mech_fail_rate, team_name, car_number, control_and_aids, finish_pos, grid_pos, finish_status, laps_completed, pitstops, best_lap_seconds, finish_time_seconds, incidents_count, penalties_count, track_limits_count, average_lap_ms, optimal_lap_ms, lap_consistency_ms, best_three_lap_average_ms, last_three_lap_average_ms, pace_fade_ms, valid_lap_count, valid_lap_rate, average_fuel_used_per_lap, fuel_min_per_lap, fuel_max_per_lap, projected_fuel_20_minutes, projected_fuel_30_minutes, projected_fuel_45_minutes, peak_top_speed_kph, tire_drop_front, tire_drop_rear, tire_drop_front_per_lap, tire_drop_rear_per_lap, front_rear_wear_ratio, left_right_wear_ratio, front_compound, rear_compound, insights';

const setupSessionDetailSelectLegacy =
  'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_type, imported_at, session_datetime, session_type, source_session_setting, server_name, game_version, track_venue, track_course, track_event, track_layout_path, track_length_m, vehicles_allowed, race_time_minutes, race_laps, damage_mult, fuel_mult, tire_mult, mech_fail_rate, team_name, car_number, control_and_aids, finish_pos, grid_pos, finish_status, laps_completed, pitstops, best_lap_seconds, finish_time_seconds, incidents_count, penalties_count, track_limits_count';

function isMissingSchemaColumnError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === 'PGRST204'
  );
}

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

function canonicalizeSessionClass(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (normalized === 'gt3' || normalized === 'lmgt3') {
    return 'lmgt3';
  }

  if (normalized === 'hypercar' || normalized === 'lmdh' || normalized === 'gtp') {
    return 'hypercar';
  }

  return normalized;
}

function buildTextCandidates(...values: Array<string | null | undefined>) {
  const candidates = new Set<string>();

  for (const value of values) {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      continue;
    }

    candidates.add(normalizedValue);
    candidates.add(normalizeCompactText(value));
  }

  return Array.from(candidates);
}

function _matchesCandidateText(
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

function normalizeSessionSetting(value: string | null | undefined) {
  return normalizeText(value);
}

function applyStandaloneSessionClassFilter<
  TQuery extends {
    or: (filters: string) => TQuery;
    ilike: (column: string, pattern: string) => TQuery;
  },
>(query: TQuery, selectedCarClassName: string | null) {
  const canonicalClass = canonicalizeSessionClass(selectedCarClassName);

  if (canonicalClass === 'lmgt3') {
    return query.or('car_class.ilike.%LMGT3%,car_class.ilike.%GT3%');
  }

  if (canonicalClass === 'hypercar') {
    return query.or('car_class.ilike.%Hypercar%,car_class.ilike.%LMDH%,car_class.ilike.%GTP%');
  }

  if (selectedCarClassName?.trim()) {
    return query.ilike('car_class', `%${selectedCarClassName.trim()}%`);
  }

  return query;
}

function applyTextCandidateFilter<TQuery extends { or: (filters: string) => TQuery }>(
  query: TQuery,
  columns: string[],
  candidates: string[],
) {
  const normalizedCandidates = Array.from(
    new Set(
      candidates.map((candidate) => candidate.trim()).filter((candidate) => candidate.length > 0),
    ),
  );

  if (normalizedCandidates.length === 0 || columns.length === 0) {
    return query;
  }

  const clauses: string[] = [];

  for (const column of columns) {
    for (const candidate of normalizedCandidates) {
      clauses.push(`${column}.ilike.%${candidate}%`);
    }
  }

  return clauses.length > 0 ? query.or(clauses.join(',')) : query;
}

export async function getSessionPageData(
  userId: string,
  filters: SessionFilters = {},
  options: GetSessionPageDataOptions = {},
) {
  const trace = createPerfTrace('getSessionPageData', {
    userId,
    filters,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 10,
  });
  const supabase = await createClient();
  const { carClasses, manufacturers, cars, tracks } = await getSetupCatalog();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const defaultSourceSessionSetting = 'Multiplayer';

  const { defaultCarClassId, selectedCarClassId, carsForSelectedClass, selectedCarId } =
    resolveSessionCatalogFilters(carClasses, cars, filters);
  const selectedTrackId = tracks.some((track) => track.id === filters.trackId)
    ? filters.trackId
    : undefined;
  const sessionSettingsResult = await supabase
    .from('setup_sessions')
    .select('source_session_setting')
    .eq('owner_user_id', userId)
    .not('source_session_setting', 'is', null);

  if (sessionSettingsResult.error) {
    throw sessionSettingsResult.error;
  }

  trace.log('session-settings-loaded', {
    discoveredRows: sessionSettingsResult.data?.length ?? 0,
  });

  const discoveredSessionSettings = Array.from(
    new Set(
      (sessionSettingsResult.data ?? [])
        .map((row) => row.source_session_setting?.trim() ?? '')
        .filter((value) => value.length > 0),
    ),
  );
  const sessionSettings = [
    defaultSourceSessionSetting,
    ...discoveredSessionSettings.filter(
      (value) =>
        normalizeSessionSetting(value) !== normalizeSessionSetting(defaultSourceSessionSetting),
    ),
  ].map((value) => ({ id: value, name: value }));
  const selectedSourceSessionSetting =
    sessionSettings.find(
      (setting) =>
        normalizeSessionSetting(setting.id) ===
        normalizeSessionSetting(filters.sourceSessionSetting),
    )?.id ?? defaultSourceSessionSetting;
  const selectedCarClassName =
    carClasses.find((carClass) => carClass.id === selectedCarClassId)?.name ?? null;
  const selectedCar = cars.find((car) => car.id === selectedCarId) ?? null;
  const selectedCarName = selectedCar?.name ?? null;
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;
  const selectedTrackName = selectedTrack?.name ?? null;
  const selectedSourceSessionSettingNormalized = selectedSourceSessionSetting.trim();
  const requestedItemCount = Math.max(page * pageSize, pageSize);

  let setupsQuery = supabase
    .from('setups')
    .select('id, name, car_id, track_id')
    .eq('owner_user_id', userId);

  if (selectedCarClassId) {
    const scopedCarIds = carsForSelectedClass.map((car) => car.id);

    if (scopedCarIds.length > 0) {
      setupsQuery = setupsQuery.in('car_id', scopedCarIds);
    } else {
      setupsQuery = setupsQuery.in('car_id', ['00000000-0000-0000-0000-000000000000']);
    }
  }

  if (selectedCarId) {
    setupsQuery = setupsQuery.eq('car_id', selectedCarId);
  }

  if (selectedTrackId) {
    setupsQuery = setupsQuery.eq('track_id', selectedTrackId);
  }

  const setupsResult = await setupsQuery;

  if (setupsResult.error) {
    throw setupsResult.error;
  }

  trace.log('scoped-setups-loaded', {
    setupRows: setupsResult.data?.length ?? 0,
    selectedCarClassId,
    selectedCarId,
    selectedTrackId,
  });

  const scopedSetups = (setupsResult.data ?? []) as SetupLinkRow[];
  const setupsById = new Map(scopedSetups.map((setup) => [setup.id, setup]));
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));
  const selectedCarCandidates = buildTextCandidates(
    selectedCar?.name,
    selectedCar?.slug,
    selectedCarName,
  );
  const selectedTrackCandidates = buildTextCandidates(
    selectedTrack?.name,
    selectedTrack?.slug,
    selectedTrack?.official_name,
    selectedTrack?.city,
    selectedTrackName,
  );
  const sessionListSelect =
    'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_session_setting, imported_at, session_datetime, session_type, track_venue, track_course, race_time_minutes, best_lap_seconds, finish_pos, grid_pos, finish_status, laps_completed, pitstops';
  let linkedSessionsCountQuery = supabase
    .from('setup_sessions')
    .select('id', { count: 'planned', head: true })
    .eq('owner_user_id', userId)
    .eq('source_session_setting', selectedSourceSessionSettingNormalized);
  let linkedSessionsDataQuery = supabase
    .from('setup_sessions')
    .select(sessionListSelect)
    .eq('owner_user_id', userId)
    .eq('source_session_setting', selectedSourceSessionSettingNormalized);

  if (scopedSetups.length > 0) {
    const scopedSetupIds = scopedSetups.map((setup) => setup.id);
    linkedSessionsCountQuery = linkedSessionsCountQuery.in('setup_id', scopedSetupIds);
    linkedSessionsDataQuery = linkedSessionsDataQuery.in('setup_id', scopedSetupIds);
  } else {
    linkedSessionsCountQuery = linkedSessionsCountQuery.in('setup_id', [
      '00000000-0000-0000-0000-000000000000',
    ]);
    linkedSessionsDataQuery = linkedSessionsDataQuery.in('setup_id', [
      '00000000-0000-0000-0000-000000000000',
    ]);
  }

  let standaloneSessionsCountQuery = supabase
    .from('setup_sessions')
    .select('id', { count: 'planned', head: true })
    .eq('owner_user_id', userId)
    .eq('source_session_setting', selectedSourceSessionSettingNormalized)
    .is('setup_id', null);
  let standaloneSessionsDataQuery = supabase
    .from('setup_sessions')
    .select(sessionListSelect)
    .eq('owner_user_id', userId)
    .eq('source_session_setting', selectedSourceSessionSettingNormalized)
    .is('setup_id', null);

  if (selectedCarClassId) {
    standaloneSessionsCountQuery = applyStandaloneSessionClassFilter(
      standaloneSessionsCountQuery,
      selectedCarClassName,
    );
    standaloneSessionsDataQuery = applyStandaloneSessionClassFilter(
      standaloneSessionsDataQuery,
      selectedCarClassName,
    );
  }

  if (selectedCarId) {
    standaloneSessionsCountQuery = applyTextCandidateFilter(
      standaloneSessionsCountQuery,
      ['car_type'],
      selectedCarCandidates,
    );
    standaloneSessionsDataQuery = applyTextCandidateFilter(
      standaloneSessionsDataQuery,
      ['car_type'],
      selectedCarCandidates,
    );
  }

  if (selectedTrackId) {
    standaloneSessionsCountQuery = applyTextCandidateFilter(
      standaloneSessionsCountQuery,
      ['track_venue', 'track_course'],
      selectedTrackCandidates,
    );
    standaloneSessionsDataQuery = applyTextCandidateFilter(
      standaloneSessionsDataQuery,
      ['track_venue', 'track_course'],
      selectedTrackCandidates,
    );
  }

  const [
    linkedSessionsCountResult,
    standaloneSessionsCountResult,
    linkedSessionsResult,
    standaloneSessionsResult,
  ] = await Promise.all([
    linkedSessionsCountQuery,
    standaloneSessionsCountQuery,
    linkedSessionsDataQuery
      .order('session_datetime', { ascending: false, nullsFirst: false })
      .order('imported_at', { ascending: false })
      .range(0, requestedItemCount - 1),
    standaloneSessionsDataQuery
      .order('session_datetime', { ascending: false, nullsFirst: false })
      .order('imported_at', { ascending: false })
      .range(0, requestedItemCount - 1),
  ]);

  if (linkedSessionsCountResult.error) {
    throw linkedSessionsCountResult.error;
  }

  if (standaloneSessionsCountResult.error) {
    throw standaloneSessionsCountResult.error;
  }

  if (linkedSessionsResult.error) {
    throw linkedSessionsResult.error;
  }

  if (standaloneSessionsResult.error) {
    throw standaloneSessionsResult.error;
  }

  const rawSessions = [
    ...((linkedSessionsResult.data ?? []) as SetupSessionRow[]),
    ...((standaloneSessionsResult.data ?? []) as SetupSessionRow[]),
  ].sort((left, right) => {
    const rightTimestamp = Date.parse(right.session_datetime ?? right.imported_at);
    const leftTimestamp = Date.parse(left.session_datetime ?? left.imported_at);

    return rightTimestamp - leftTimestamp;
  });
  const totalCount =
    (linkedSessionsCountResult.count ?? 0) + (standaloneSessionsCountResult.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  const response = {
    carClasses,
    cars,
    tracks,
    sessionSettings,
    sessions: rawSessions
      .slice(from, to)
      .map((session) =>
        buildSessionSummary(
          session,
          session.setup_id ? setupsById.get(session.setup_id) : undefined,
          carsById,
          tracksById,
          manufacturersById,
        ),
      ),
    totalCount,
    page: safePage,
    pageSize,
    resolvedFilters: {
      sourceSessionSetting: selectedSourceSessionSetting,
      carClassId: selectedCarClassId,
      carId: selectedCarId,
      trackId: selectedTrackId,
    },
    defaultCarClassId,
    defaultSourceSessionSetting,
  };

  trace.finish({
    linkedRows: linkedSessionsResult.data?.length ?? 0,
    standaloneRows: standaloneSessionsResult.data?.length ?? 0,
    mergedRows: rawSessions.length,
    totalCount,
    returnedRows: response.sessions.length,
    safePage,
    requestedItemCount,
  });

  return response;
}

export async function getImportedSessionHashes(userId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from('setup_sessions')
    .select('source_file_hash')
    .eq('owner_user_id', userId)
    .not('source_file_hash', 'is', null);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? [])
    .map((session) => session.source_file_hash)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export async function getSessionDetail(userId: string, sessionId: string) {
  const trace = createPerfTrace('getSessionDetail', { userId, sessionId });
  const supabase = await createClient();
  const { manufacturers, cars, tracks } = await getSetupCatalog();

  let sessionResult = await supabase
    .from('setup_sessions')
    .select(setupSessionDetailSelectWithMetrics)
    .eq('owner_user_id', userId)
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionResult.error && isMissingSchemaColumnError(sessionResult.error)) {
    sessionResult = await supabase
      .from('setup_sessions')
      .select(setupSessionDetailSelectLegacy)
      .eq('owner_user_id', userId)
      .eq('id', sessionId)
      .maybeSingle();
  }

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (!sessionResult.data) {
    trace.finish({ found: false });
    return null;
  }

  const [lapsResult, linkedSetupResult] = await Promise.all([
    supabase
      .from('setup_session_laps')
      .select(
        'lap_number, running_position, lap_time_seconds, sector_1_seconds, sector_2_seconds, sector_3_seconds, top_speed_kph, fuel_remaining, fuel_used, tire_wear_fl, tire_wear_fr, tire_wear_rl, tire_wear_rr, front_compound, rear_compound, pit_flag, is_valid_lap',
      )
      .eq('session_id', sessionId)
      .order('lap_number', { ascending: true }),
    sessionResult.data.setup_id
      ? supabase
          .from('setups')
          .select('id, name, car_id, track_id')
          .eq('owner_user_id', userId)
          .eq('id', sessionResult.data.setup_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (lapsResult.error) {
    throw lapsResult.error;
  }

  if (linkedSetupResult.error) {
    throw linkedSetupResult.error;
  }

  const session = sessionResult.data as SetupSessionDetailRow;
  const laps = (lapsResult.data ?? []) as SetupSessionLapRow[];
  const setup = linkedSetupResult.data ? (linkedSetupResult.data as SetupLinkRow) : undefined;
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));
  const identity = buildSessionIdentity(session, setup, carsById, tracksById, manufacturersById);
  const validLaps = laps.filter(
    (lap) => lap.is_valid_lap && !lap.pit_flag && lap.lap_time_seconds !== null,
  );
  const derivedMetrics = deriveSessionMetrics(
    laps.map((lap) => ({
      lapTimeSeconds: lap.lap_time_seconds,
      sector1Seconds: lap.sector_1_seconds,
      sector2Seconds: lap.sector_2_seconds,
      sector3Seconds: lap.sector_3_seconds,
      topSpeedKph: lap.top_speed_kph,
      fuelUsed: lap.fuel_used,
      tireWearFl: lap.tire_wear_fl,
      tireWearFr: lap.tire_wear_fr,
      tireWearRl: lap.tire_wear_rl,
      tireWearRr: lap.tire_wear_rr,
      frontCompound: lap.front_compound,
      rearCompound: lap.rear_compound,
      pitFlag: lap.pit_flag,
      isValidLap: lap.is_valid_lap,
    })),
    {
      positionGain: identity.positionGain,
      finishPos: identity.finishPos,
    },
  );

  const detail = {
    ...identity,
    sessionType: session.session_type,
    serverName: session.server_name,
    gameVersion: session.game_version,
    sourceType: session.source_type,
    trackCourse: session.track_course,
    trackEvent: session.track_event,
    trackLayoutPath: session.track_layout_path,
    trackLengthM: session.track_length_m,
    vehiclesAllowed: session.vehicles_allowed,
    raceLaps: session.race_laps,
    damageMult: session.damage_mult,
    fuelMult: session.fuel_mult,
    tireMult: session.tire_mult,
    mechFailRate: session.mech_fail_rate,
    teamName: session.team_name,
    carNumber: session.car_number,
    controlAndAids: session.control_and_aids,
    finishTimeSeconds: session.finish_time_seconds,
    incidentsCount: session.incidents_count,
    penaltiesCount: session.penalties_count,
    trackLimitsCount: session.track_limits_count,
    averageLapMs: session.average_lap_ms ?? derivedMetrics.averageLapMs,
    optimalLapMs: session.optimal_lap_ms ?? derivedMetrics.optimalLapMs,
    lapConsistencyMs: session.lap_consistency_ms ?? derivedMetrics.lapConsistencyMs,
    bestThreeLapAverageMs:
      session.best_three_lap_average_ms ?? derivedMetrics.bestThreeLapAverageMs,
    lastThreeLapAverageMs:
      session.last_three_lap_average_ms ?? derivedMetrics.lastThreeLapAverageMs,
    paceFadeMs: session.pace_fade_ms ?? derivedMetrics.paceFadeMs,
    validLapRate: session.valid_lap_rate ?? derivedMetrics.validLapRate,
    averageFuelUsedPerLap:
      session.average_fuel_used_per_lap ?? derivedMetrics.averageFuelUsedPerLap,
    fuelMinPerLap: session.fuel_min_per_lap ?? derivedMetrics.fuelMinPerLap,
    fuelMaxPerLap: session.fuel_max_per_lap ?? derivedMetrics.fuelMaxPerLap,
    projectedFuel20Minutes:
      session.projected_fuel_20_minutes ?? derivedMetrics.projectedFuel20Minutes,
    projectedFuel30Minutes:
      session.projected_fuel_30_minutes ?? derivedMetrics.projectedFuel30Minutes,
    projectedFuel45Minutes:
      session.projected_fuel_45_minutes ?? derivedMetrics.projectedFuel45Minutes,
    peakTopSpeedKph: session.peak_top_speed_kph ?? derivedMetrics.peakTopSpeedKph,
    tireDropFront: session.tire_drop_front ?? derivedMetrics.tireDropFront,
    tireDropRear: session.tire_drop_rear ?? derivedMetrics.tireDropRear,
    tireDropFrontPerLap: session.tire_drop_front_per_lap ?? derivedMetrics.tireDropFrontPerLap,
    tireDropRearPerLap: session.tire_drop_rear_per_lap ?? derivedMetrics.tireDropRearPerLap,
    frontRearWearRatio: session.front_rear_wear_ratio ?? derivedMetrics.frontRearWearRatio,
    leftRightWearRatio: session.left_right_wear_ratio ?? derivedMetrics.leftRightWearRatio,
    validLapCount: session.valid_lap_count ?? validLaps.length,
    insights:
      Array.isArray(session.insights) && session.insights.every((item) => typeof item === 'string')
        ? session.insights
        : derivedMetrics.insights,
    sourceCarClass: session.car_class,
    compounds: {
      front: session.front_compound ?? derivedMetrics.compounds.front,
      rear: session.rear_compound ?? derivedMetrics.compounds.rear,
    },
    laps: laps.map((lap) => ({
      lapNumber: lap.lap_number,
      runningPosition: lap.running_position,
      lapTimeMs: lap.lap_time_seconds !== null ? Math.round(lap.lap_time_seconds * 1000) : null,
      sector1Ms: lap.sector_1_seconds !== null ? Math.round(lap.sector_1_seconds * 1000) : null,
      sector2Ms: lap.sector_2_seconds !== null ? Math.round(lap.sector_2_seconds * 1000) : null,
      sector3Ms: lap.sector_3_seconds !== null ? Math.round(lap.sector_3_seconds * 1000) : null,
      topSpeedKph: lap.top_speed_kph,
      fuelRemaining: lap.fuel_remaining,
      fuelUsed: lap.fuel_used,
      tireWearFl: lap.tire_wear_fl,
      tireWearFr: lap.tire_wear_fr,
      tireWearRl: lap.tire_wear_rl,
      tireWearRr: lap.tire_wear_rr,
      frontCompound: lap.front_compound,
      rearCompound: lap.rear_compound,
      pitFlag: lap.pit_flag,
      isValidLap: lap.is_valid_lap,
    })),
  } satisfies SessionDetail;

  trace.finish({
    found: true,
    lapRows: laps.length,
    validLapRows: validLaps.length,
    hasSetup: Boolean(setup),
  });

  return detail;
}
