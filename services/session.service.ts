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
  | 'imported_at'
  | 'session_datetime'
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
  | 'imported_at'
  | 'session_datetime'
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
  importedAt: string;
  sessionDateTime: string | null;
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
  const defaultCarClassId = undefined;
  const selectedCarClassId = carClasses.some((carClass) => carClass.id === filters.carClassId)
    ? filters.carClassId
    : undefined;
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
    importedAt: session.imported_at,
    sessionDateTime: session.session_datetime,
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
  'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_type, imported_at, session_datetime, session_type, server_name, game_version, track_venue, track_course, track_event, track_layout_path, track_length_m, vehicles_allowed, race_time_minutes, race_laps, damage_mult, fuel_mult, tire_mult, mech_fail_rate, team_name, car_number, control_and_aids, finish_pos, grid_pos, finish_status, laps_completed, pitstops, best_lap_seconds, finish_time_seconds, incidents_count, penalties_count, track_limits_count, average_lap_ms, optimal_lap_ms, lap_consistency_ms, best_three_lap_average_ms, last_three_lap_average_ms, pace_fade_ms, valid_lap_count, valid_lap_rate, average_fuel_used_per_lap, fuel_min_per_lap, fuel_max_per_lap, projected_fuel_20_minutes, projected_fuel_30_minutes, projected_fuel_45_minutes, peak_top_speed_kph, tire_drop_front, tire_drop_rear, tire_drop_front_per_lap, tire_drop_rear_per_lap, front_rear_wear_ratio, left_right_wear_ratio, front_compound, rear_compound, insights';

const setupSessionDetailSelectLegacy =
  'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, source_type, imported_at, session_datetime, session_type, server_name, game_version, track_venue, track_course, track_event, track_layout_path, track_length_m, vehicles_allowed, race_time_minutes, race_laps, damage_mult, fuel_mult, tire_mult, mech_fail_rate, team_name, car_number, control_and_aids, finish_pos, grid_pos, finish_status, laps_completed, pitstops, best_lap_seconds, finish_time_seconds, incidents_count, penalties_count, track_limits_count';

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
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
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

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDeviation(values: number[]) {
  if (values.length < 2) {
    return null;
  }

  const mean = average(values);

  if (mean === null) {
    return null;
  }

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateTireDrop(laps: SetupSessionLapRow[]) {
  const validStintLaps = laps.filter((lap) => lap.is_valid_lap && !lap.pit_flag);

  if (validStintLaps.length < 2) {
    return { front: null, rear: null };
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

function calculateOptimalLapMs(laps: SetupSessionLapRow[]) {
  const sector1Values = laps
    .map((lap) => lap.sector_1_seconds)
    .filter((value): value is number => value !== null && value > 0);
  const sector2Values = laps
    .map((lap) => lap.sector_2_seconds)
    .filter((value): value is number => value !== null && value > 0);
  const sector3Values = laps
    .map((lap) => lap.sector_3_seconds)
    .filter((value): value is number => value !== null && value > 0);

  if (sector1Values.length === 0 || sector2Values.length === 0 || sector3Values.length === 0) {
    return null;
  }

  return Math.round(
    (Math.min(...sector1Values) + Math.min(...sector2Values) + Math.min(...sector3Values)) * 1000,
  );
}

function calculateRollingAverage(values: number[], windowSize: number, mode: 'best' | 'last') {
  if (values.length < windowSize) {
    return null;
  }

  const windowAverages: number[] = [];

  for (let index = 0; index <= values.length - windowSize; index += 1) {
    const window = values.slice(index, index + windowSize);
    const windowAverage = average(window);

    if (windowAverage !== null) {
      windowAverages.push(windowAverage);
    }
  }

  if (windowAverages.length === 0) {
    return null;
  }

  return mode === 'best' ? Math.min(...windowAverages) : windowAverages[windowAverages.length - 1];
}

function calculateValidLapRate(laps: SetupSessionLapRow[]) {
  const timedLaps = laps.filter((lap) => !lap.pit_flag && lap.lap_time_seconds !== null);

  if (timedLaps.length === 0) {
    return null;
  }

  const validTimedLaps = timedLaps.filter((lap) => lap.is_valid_lap);
  return validTimedLaps.length / timedLaps.length;
}

function calculateFuelProjection(
  averageFuelUsedPerLap: number | null,
  averageLapMs: number | null,
  minutes: number,
) {
  if (averageFuelUsedPerLap === null || averageLapMs === null || averageLapMs <= 0) {
    return null;
  }

  const projectedLapCount = (minutes * 60_000) / averageLapMs;
  return averageFuelUsedPerLap * projectedLapCount;
}

function calculateWearProfile(laps: SetupSessionLapRow[]) {
  const validStintLaps = laps.filter((lap) => lap.is_valid_lap && !lap.pit_flag);

  if (validStintLaps.length < 2) {
    return {
      frontDropPerLap: null,
      rearDropPerLap: null,
      frontRearWearRatio: null,
      leftRightWearRatio: null,
    };
  }

  const firstLap = validStintLaps[0];
  const lastLap = validStintLaps[validStintLaps.length - 1];
  const lapCount = validStintLaps.length - 1;
  const frontLeftDrop =
    firstLap.tire_wear_fl !== null && lastLap.tire_wear_fl !== null
      ? firstLap.tire_wear_fl - lastLap.tire_wear_fl
      : null;
  const frontRightDrop =
    firstLap.tire_wear_fr !== null && lastLap.tire_wear_fr !== null
      ? firstLap.tire_wear_fr - lastLap.tire_wear_fr
      : null;
  const rearLeftDrop =
    firstLap.tire_wear_rl !== null && lastLap.tire_wear_rl !== null
      ? firstLap.tire_wear_rl - lastLap.tire_wear_rl
      : null;
  const rearRightDrop =
    firstLap.tire_wear_rr !== null && lastLap.tire_wear_rr !== null
      ? firstLap.tire_wear_rr - lastLap.tire_wear_rr
      : null;
  const leftDrop =
    frontLeftDrop !== null && rearLeftDrop !== null ? (frontLeftDrop + rearLeftDrop) / 2 : null;
  const rightDrop =
    frontRightDrop !== null && rearRightDrop !== null ? (frontRightDrop + rearRightDrop) / 2 : null;
  const tireDrop = calculateTireDrop(validStintLaps);

  return {
    frontDropPerLap: tireDrop.front !== null && lapCount > 0 ? tireDrop.front / lapCount : null,
    rearDropPerLap: tireDrop.rear !== null && lapCount > 0 ? tireDrop.rear / lapCount : null,
    frontRearWearRatio:
      tireDrop.front !== null && tireDrop.rear !== null && tireDrop.rear > 0
        ? tireDrop.front / tireDrop.rear
        : null,
    leftRightWearRatio:
      rightDrop !== null && leftDrop !== null && leftDrop > 0 ? rightDrop / leftDrop : null,
  };
}

function buildSessionInsights({
  positionGain,
  finishPos,
  validLapRate,
  paceFadeMs,
  frontRearWearRatio,
  leftRightWearRatio,
  fuelMinPerLap,
  fuelMaxPerLap,
}: {
  positionGain: number | null;
  finishPos: number | null;
  validLapRate: number | null;
  paceFadeMs: number | null;
  frontRearWearRatio: number | null;
  leftRightWearRatio: number | null;
  fuelMinPerLap: number | null;
  fuelMaxPerLap: number | null;
}) {
  const insights: string[] = [];

  if (positionGain !== null && positionGain > 0) {
    insights.push(
      `Buena ejecución de carrera: ganó ${positionGain} posiciones${finishPos ? ` y acabó P${finishPos}` : ''}.`,
    );
  }

  if (validLapRate !== null) {
    if (validLapRate >= 0.9) {
      insights.push('Stint limpio: casi todas las vueltas cronometradas fueron válidas.');
    } else if (validLapRate < 0.75) {
      insights.push('Hubo bastantes vueltas no válidas o de transición; hay margen de limpieza.');
    }
  }

  if (paceFadeMs !== null) {
    if (paceFadeMs > 1500) {
      insights.push(
        'El ritmo cae al final del stint; el coche sufre más con desgaste o combustible.',
      );
    } else if (paceFadeMs < -500) {
      insights.push(
        'El stint va a mejor con el paso de las vueltas; el coche crece cuando baja peso.',
      );
    } else {
      insights.push('Ritmo bastante estable entre el inicio y el final del stint.');
    }
  }

  if (frontRearWearRatio !== null) {
    if (frontRearWearRatio > 1.12) {
      insights.push('La degradación se concentra en el eje delantero.');
    } else if (frontRearWearRatio < 0.9) {
      insights.push('La degradación se concentra más en el eje trasero.');
    }
  }

  if (leftRightWearRatio !== null) {
    if (leftRightWearRatio > 1.08) {
      insights.push('El lado derecho trabaja más que el izquierdo en este stint.');
    } else if (leftRightWearRatio < 0.92) {
      insights.push('El lado izquierdo está soportando más carga que el derecho.');
    }
  }

  if (
    fuelMinPerLap !== null &&
    fuelMaxPerLap !== null &&
    fuelMaxPerLap > 0 &&
    fuelMaxPerLap - fuelMinPerLap <= 0.004
  ) {
    insights.push('El consumo es muy estable vuelta a vuelta.');
  }

  return insights.slice(0, 5);
}

export async function getSessionPageData(
  userId: string,
  filters: SessionFilters = {},
  options: GetSessionPageDataOptions = {},
) {
  const supabase = await createClient();
  const { carClasses, manufacturers, cars, tracks } = await getSetupCatalog();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);

  const { defaultCarClassId, selectedCarClassId, carsForSelectedClass, selectedCarId } =
    resolveSessionCatalogFilters(carClasses, cars, filters);
  const selectedTrackId = tracks.some((track) => track.id === filters.trackId)
    ? filters.trackId
    : undefined;
  const selectedCarClassName =
    carClasses.find((carClass) => carClass.id === selectedCarClassId)?.name ?? null;
  const selectedCarName = cars.find((car) => car.id === selectedCarId)?.name ?? null;
  const selectedTrackName = tracks.find((track) => track.id === selectedTrackId)?.name ?? null;

  let setupsQuery = supabase
    .from('setups')
    .select('id, name, car_id, track_id')
    .eq('owner_user_id', userId);

  if (selectedCarClassId) {
    const scopedCarIds = carsForSelectedClass.map((car) => car.id);

    if (scopedCarIds.length === 0) {
      return {
        carClasses,
        cars,
        tracks,
        sessions: [] as SessionSummary[],
        totalCount: 0,
        page: 1,
        pageSize,
        resolvedFilters: {
          carClassId: selectedCarClassId,
          carId: undefined,
          trackId: selectedTrackId,
        },
        defaultCarClassId,
      };
    }

    setupsQuery = setupsQuery.in('car_id', scopedCarIds);
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

  const scopedSetups = (setupsResult.data ?? []) as SetupLinkRow[];
  const setupsById = new Map(scopedSetups.map((setup) => [setup.id, setup]));
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));
  const normalizedSelectedCarClassName = normalizeText(selectedCarClassName);
  const normalizedSelectedCarName = normalizeText(selectedCarName);
  const normalizedSelectedTrackName = normalizeText(selectedTrackName);

  let standaloneSessionsQuery = supabase
    .from('setup_sessions')
    .select(
      'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, imported_at, session_datetime, track_venue, track_course, race_time_minutes, best_lap_seconds, finish_pos, grid_pos, finish_status, laps_completed, pitstops',
    )
    .eq('owner_user_id', userId)
    .is('setup_id', null)
    .order('imported_at', { ascending: false });

  if (selectedCarName) {
    standaloneSessionsQuery = standaloneSessionsQuery.eq('car_type', selectedCarName);
  }

  if (selectedTrackName) {
    standaloneSessionsQuery = standaloneSessionsQuery.or(
      `track_venue.eq.${selectedTrackName},track_course.eq.${selectedTrackName}`,
    );
  }

  const linkedSessionsPromise =
    scopedSetups.length > 0
      ? supabase
          .from('setup_sessions')
          .select(
            'id, setup_id, raw_payload, driver_name, car_class, car_type, source_file_name, imported_at, session_datetime, track_venue, track_course, race_time_minutes, best_lap_seconds, finish_pos, grid_pos, finish_status, laps_completed, pitstops',
          )
          .eq('owner_user_id', userId)
          .in(
            'setup_id',
            scopedSetups.map((setup) => setup.id),
          )
          .order('imported_at', { ascending: false })
      : Promise.resolve({ data: [] as SetupSessionRow[], error: null });

  const [linkedSessionsResult, standaloneSessionsResult] = await Promise.all([
    linkedSessionsPromise,
    standaloneSessionsQuery,
  ]);

  if (linkedSessionsResult.error) {
    throw linkedSessionsResult.error;
  }

  if (standaloneSessionsResult.error) {
    throw standaloneSessionsResult.error;
  }

  const rawSessions = [
    ...((linkedSessionsResult.data ?? []) as SetupSessionRow[]),
    ...((standaloneSessionsResult.data ?? []) as SetupSessionRow[]),
  ].sort((left, right) => Date.parse(right.imported_at) - Date.parse(left.imported_at));
  const rawSessionsById = new Map(rawSessions.map((session) => [session.id, session]));
  const filteredSessions = rawSessions
    .map((session) =>
      buildSessionSummary(
        session,
        session.setup_id ? setupsById.get(session.setup_id) : undefined,
        carsById,
        tracksById,
        manufacturersById,
      ),
    )
    .filter((session) => {
      if (selectedCarClassId) {
        const sessionCarClassName = canonicalizeSessionClass(
          session.carClassId
            ? carClasses.find((carClass) => carClass.id === session.carClassId)?.name
            : null,
        );
        const inferredSessionCarClassName = canonicalizeSessionClass(
          rawSessionsById.get(session.id)?.car_class,
        );

        if (
          session.carClassId !== selectedCarClassId &&
          inferredSessionCarClassName !==
            canonicalizeSessionClass(normalizedSelectedCarClassName) &&
          sessionCarClassName !== canonicalizeSessionClass(normalizedSelectedCarClassName)
        ) {
          return false;
        }
      }

      if (selectedCarId) {
        const normalizedSessionCarName = normalizeText(session.carName);

        if (
          session.carId !== selectedCarId &&
          normalizedSessionCarName !== normalizedSelectedCarName
        ) {
          return false;
        }
      }

      if (selectedTrackId) {
        const normalizedSessionTrackName = normalizeText(session.trackName);

        if (
          session.trackId !== selectedTrackId &&
          normalizedSessionTrackName !== normalizedSelectedTrackName
        ) {
          return false;
        }
      }

      return true;
    });

  const totalCount = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  return {
    carClasses,
    cars,
    tracks,
    sessions: filteredSessions.slice(from, to),
    totalCount,
    page: safePage,
    pageSize,
    resolvedFilters: {
      carClassId: selectedCarClassId,
      carId: selectedCarId,
      trackId: selectedTrackId,
    },
    defaultCarClassId,
  };
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

  const [lapsResult, linkedSetupResult] = await Promise.all([
    supabase
      .from('setup_session_laps')
      .select(
        'lap_number, running_position, lap_time_seconds, sector_1_seconds, sector_2_seconds, sector_3_seconds, top_speed_kph, fuel_remaining, fuel_used, tire_wear_fl, tire_wear_fr, tire_wear_rl, tire_wear_rr, front_compound, rear_compound, pit_flag, is_valid_lap',
      )
      .eq('session_id', sessionId)
      .order('lap_number', { ascending: true }),
    supabase.from('setups').select('id, name, car_id, track_id').eq('owner_user_id', userId),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (lapsResult.error) {
    throw lapsResult.error;
  }

  if (linkedSetupResult.error) {
    throw linkedSetupResult.error;
  }

  if (!sessionResult.data) {
    return null;
  }

  const session = sessionResult.data as SetupSessionDetailRow;
  const laps = (lapsResult.data ?? []) as SetupSessionLapRow[];
  const linkedSetups = (linkedSetupResult.data ?? []) as SetupLinkRow[];
  const setup = session.setup_id
    ? linkedSetups.find((candidate) => candidate.id === session.setup_id)
    : undefined;
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

  return {
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
}
