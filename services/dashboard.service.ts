import { createPerfTrace } from '@/lib/observability/perf';
import { createClient } from '@/lib/supabase/server';
import { getSetupCatalog, type CarOption, type TrackOption } from '@/services/catalog.service';
import type { Database } from '@/types/database.types';

type SetupSessionRow = Pick<
  Database['public']['Tables']['setup_sessions']['Row'],
  | 'id'
  | 'setup_id'
  | 'imported_at'
  | 'session_datetime'
  | 'session_type'
  | 'source_session_setting'
  | 'track_venue'
  | 'track_course'
  | 'car_class'
  | 'car_type'
  | 'best_lap_seconds'
  | 'average_lap_ms'
  | 'lap_consistency_ms'
  | 'finish_pos'
  | 'grid_pos'
  | 'valid_lap_rate'
  | 'incidents_count'
  | 'penalties_count'
  | 'track_limits_count'
>;

type SetupLinkRow = Pick<
  Database['public']['Tables']['setups']['Row'],
  'id' | 'name' | 'car_id' | 'track_id'
>;

export type DashboardFilters = {
  sourceSessionSetting?: string;
  carClassId?: string;
  carId?: string;
  trackId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type DashboardTrendMetric =
  | 'bestLapMs'
  | 'averageLapMs'
  | 'lapConsistencyMs'
  | 'finishPos'
  | 'positionGain'
  | 'validLapRate'
  | 'incidentsCount';

export type DashboardTrendRange = '10' | '30' | 'all';

export type DashboardKpi = {
  label: string;
  value: number | null;
  format: 'count' | 'lapTime' | 'position' | 'percent' | 'decimal';
  description: string;
};

export type TrendPoint = {
  sessionId: string;
  sessionDate: string;
  trackName: string;
  carName: string;
  bestLapMs: number | null;
  averageLapMs: number | null;
  lapConsistencyMs: number | null;
  finishPos: number | null;
  positionGain: number | null;
  validLapRate: number | null;
  incidentsCount: number;
};

export type RecentVsBaselineMetric = {
  key: string;
  label: string;
  recentValue: number | null;
  baselineValue: number | null;
  delta: number | null;
  direction: 'better' | 'worse' | 'neutral';
  format: DashboardKpi['format'];
};

export type DashboardRankingItem = {
  label: string;
  sessions: number;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  bestLapMs: number | null;
  lapConsistencyMs: number | null;
  averageFinishPos: number | null;
  averagePositionGain: number | null;
  averageIncidents: number | null;
  averageValidLapRate: number | null;
  averagePenalties: number | null;
  averageTrackLimits: number | null;
};

export type DashboardInsight = {
  id: string;
  tone: 'positive' | 'warning' | 'neutral';
  title: string;
  body: string;
};

export type DriverOverviewData = {
  filters: DashboardFilters;
  resolvedFilters: Required<Pick<DashboardFilters, 'sourceSessionSetting'>> &
    Pick<DashboardFilters, 'carClassId' | 'carId' | 'trackId' | 'dateFrom' | 'dateTo'>;
  filterOptions: {
    sessionSettings: Array<{ id: string; name: string }>;
    carClasses: Array<{ id: string; name: string }>;
    cars: Array<{ id: string; name: string; carClassId: string }>;
    tracks: Array<{ id: string; name: string }>;
    defaultCarClassId?: string;
    defaultSourceSessionSetting: string;
  };
  hero: {
    driverLabel: string;
    totalSessions: number;
    dateRangeLabel: string;
  };
  pilotSummary: {
    totalSessions: number;
    averagePositionGain: number | null;
    averageFinishPosition: number | null;
    incidentsPerSession: number | null;
    wins: number;
    winsRate: number | null;
    podiums: number;
    podiumsRate: number | null;
    top5s: number;
    top5sRate: number | null;
    top10s: number;
    top10sRate: number | null;
  };
  rankingThreshold: number;
  kpis: DashboardKpi[];
  cleanliness: {
    incidentsPerSession: number | null;
    penaltiesPerSession: number | null;
    trackLimitsPerSession: number | null;
    cleanSessionRate: number | null;
  };
  trends: TrendPoint[];
  recentVsBaseline: {
    recentWindowSize: number;
    baselineWindowSize: number;
    metrics: RecentVsBaselineMetric[];
  };
  topTracks: DashboardRankingItem[];
  weakTracks: DashboardRankingItem[];
  topCars: DashboardRankingItem[];
  insights: DashboardInsight[];
};

type SessionSummary = {
  id: string;
  carId: string | null;
  carClassId: string | null;
  carName: string;
  trackId: string | null;
  trackName: string;
  sessionDate: string;
  sourceSessionSetting: string | null;
  bestLapMs: number | null;
  averageLapMs: number | null;
  lapConsistencyMs: number | null;
  finishPos: number | null;
  positionGain: number | null;
  validLapRate: number | null;
  incidentsCount: number;
  penaltiesCount: number;
  trackLimitsCount: number;
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

function normalizeSessionSetting(value: string | null | undefined) {
  return normalizeText(value);
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

function escapePostgrestLikeValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function applyTextCandidateFilter<
  Query extends {
    or(filters: string): Query;
  },
>(query: Query, columns: string[], candidates: string[]) {
  const normalizedCandidates = Array.from(
    new Set(
      candidates
        .map((candidate) => candidate.trim().toLocaleLowerCase())
        .filter((candidate) => candidate.length > 0),
    ),
  );

  if (normalizedCandidates.length === 0) {
    return query;
  }

  const filters = normalizedCandidates.flatMap((candidate) => {
    const escapedCandidate = escapePostgrestLikeValue(candidate);
    return columns.map((column) => `${column}.ilike.%${escapedCandidate}%`);
  });

  return query.or(filters.join(','));
}

function applyStandaloneSessionClassFilter<
  Query extends {
    eq(column: string, value: string): Query;
    in(column: string, values: string[]): Query;
  },
>(query: Query, carClassName: string | null) {
  const normalizedClass = canonicalizeSessionClass(carClassName);

  if (!normalizedClass) {
    return query;
  }

  if (normalizedClass === 'lmgt3') {
    return query.in('car_class', ['LMGT3', 'GT3']);
  }

  if (normalizedClass === 'hypercar') {
    return query.in('car_class', ['Hypercar', 'LMDh', 'GTP']);
  }

  return query.eq('car_class', carClassName ?? normalizedClass);
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

function average(values: Array<number | null | undefined>) {
  const definedValues = values.filter((value): value is number => typeof value === 'number');

  if (definedValues.length === 0) {
    return null;
  }

  return definedValues.reduce((sum, value) => sum + value, 0) / definedValues.length;
}

function roundTo(value: number | null, decimals: number) {
  if (value === null) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function parseDateInput(value: string | undefined, endOfDay = false) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveSessionCatalogFilters(
  carClasses: Awaited<ReturnType<typeof getSetupCatalog>>['carClasses'],
  cars: Awaited<ReturnType<typeof getSetupCatalog>>['cars'],
  filters: Pick<DashboardFilters, 'carClassId' | 'carId'>,
) {
  const defaultCarClassId =
    carClasses.find((carClass) => carClass.slug.toLowerCase() === 'lmgt3')?.id ?? carClasses[0]?.id;
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
  session: SetupSessionRow,
  setup: SetupLinkRow | undefined,
  carsById: Map<string, CarOption>,
  tracksById: Map<string, TrackOption>,
): SessionSummary {
  const car = setup ? carsById.get(setup.car_id) : undefined;
  const track = setup ? tracksById.get(setup.track_id) : undefined;
  const inferredCarName = session.car_type?.trim() || 'Coche no disponible';
  const inferredTrackName =
    session.track_venue?.trim() || session.track_course?.trim() || 'Circuito no disponible';

  return {
    id: session.id,
    carId: car?.id ?? setup?.car_id ?? null,
    carClassId: car?.car_class_id ?? null,
    carName: car?.name ?? inferredCarName,
    trackId: track?.id ?? setup?.track_id ?? null,
    trackName: track?.name ?? inferredTrackName,
    sessionDate: session.session_datetime ?? session.imported_at,
    sourceSessionSetting: session.source_session_setting,
    bestLapMs:
      session.best_lap_seconds !== null ? Math.round(session.best_lap_seconds * 1000) : null,
    averageLapMs: session.average_lap_ms,
    lapConsistencyMs:
      session.lap_consistency_ms !== null ? Number(session.lap_consistency_ms) : null,
    finishPos: session.finish_pos,
    positionGain:
      session.grid_pos !== null && session.finish_pos !== null
        ? session.grid_pos - session.finish_pos
        : null,
    validLapRate: session.valid_lap_rate !== null ? Number(session.valid_lap_rate) : null,
    incidentsCount: session.incidents_count,
    penaltiesCount: session.penalties_count,
    trackLimitsCount: session.track_limits_count,
  };
}

function scoreRankingEntry(entry: {
  lapConsistencyMs: number | null;
  averageFinishPos: number | null;
  averagePositionGain: number | null;
  averageIncidents: number | null;
  averageValidLapRate: number | null;
  averagePenalties: number | null;
  averageTrackLimits: number | null;
  sessions: number;
}) {
  let score = 50;

  if (entry.lapConsistencyMs !== null) {
    score += Math.max(0, 3000 - entry.lapConsistencyMs) / 180;
  }

  if (entry.averageFinishPos !== null) {
    score += Math.max(0, 25 - entry.averageFinishPos) * 1.6;
  }

  if (entry.averagePositionGain !== null) {
    score += Math.max(-8, Math.min(8, entry.averagePositionGain)) * 2.1;
  }

  if (entry.averageIncidents !== null) {
    score -= Math.min(12, entry.averageIncidents * 2.8);
  }

  if (entry.averagePenalties !== null) {
    score -= Math.min(8, entry.averagePenalties * 3.4);
  }

  if (entry.averageTrackLimits !== null) {
    score -= Math.min(8, entry.averageTrackLimits * 0.9);
  }

  if (entry.averageValidLapRate !== null) {
    score += Math.max(-6, Math.min(10, (entry.averageValidLapRate - 0.85) * 35));
  }

  score += Math.min(8, entry.sessions) * 1.1;

  return roundTo(score, 1) ?? 0;
}

function getConfidenceLevel(sessionCount: number) {
  if (sessionCount >= 8) {
    return 'high' as const;
  }

  if (sessionCount >= 5) {
    return 'medium' as const;
  }

  return 'low' as const;
}

function buildRankingItems(
  sessions: SessionSummary[],
  groupBy: 'track' | 'car',
  minimumSessions: number,
): DashboardRankingItem[] {
  const groups = new Map<string, SessionSummary[]>();

  for (const session of sessions) {
    const key = groupBy === 'track' ? session.trackName : session.carName;

    if (!key || key === 'Circuito no disponible' || key === 'Coche no disponible') {
      continue;
    }

    const current = groups.get(key) ?? [];
    current.push(session);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => {
      const entry = {
        label,
        sessions: items.length,
        bestLapMs: average(items.map((item) => item.bestLapMs)),
        lapConsistencyMs: average(items.map((item) => item.lapConsistencyMs)),
        averageFinishPos: average(items.map((item) => item.finishPos)),
        averagePositionGain: average(items.map((item) => item.positionGain)),
        averageIncidents: average(items.map((item) => item.incidentsCount)),
        averageValidLapRate: average(items.map((item) => item.validLapRate)),
        averagePenalties: average(items.map((item) => item.penaltiesCount)),
        averageTrackLimits: average(items.map((item) => item.trackLimitsCount)),
      };

      return {
        ...entry,
        score: scoreRankingEntry(entry),
        confidence: getConfidenceLevel(entry.sessions),
      };
    })
    .filter((item) => item.sessions >= minimumSessions)
    .sort((left, right) => right.score - left.score);
}

function formatDateRangeLabel(sessions: SessionSummary[]) {
  if (sessions.length === 0) {
    return 'Sin sesiones todavía';
  }

  const oldest = sessions[sessions.length - 1]?.sessionDate;
  const latest = sessions[0]?.sessionDate;

  if (!oldest || !latest) {
    return 'Datos listos para analizar';
  }

  const formatter = new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formatter.format(new Date(oldest))} - ${formatter.format(new Date(latest))}`;
}

function compareMetric(
  recentValue: number | null,
  baselineValue: number | null,
  betterWhenLower: boolean,
) {
  if (recentValue === null || baselineValue === null) {
    return {
      delta: null,
      direction: 'neutral' as const,
    };
  }

  const delta = recentValue - baselineValue;

  if (Math.abs(delta) < 0.0001) {
    return {
      delta: 0,
      direction: 'neutral' as const,
    };
  }

  const improved = betterWhenLower ? delta < 0 : delta > 0;

  return {
    delta,
    direction: improved ? ('better' as const) : ('worse' as const),
  };
}

function buildRecentVsBaseline(trends: TrendPoint[]) {
  const recentWindowSize = Math.min(10, trends.length);
  const recent = trends.slice(0, recentWindowSize);
  const baseline = trends.slice(recentWindowSize);
  const baselinePool = baseline.length > 0 ? baseline : trends;
  const baselineWindowSize = baselinePool.length;

  const metrics: Array<{
    key: string;
    label: string;
    recentValue: number | null;
    baselineValue: number | null;
    betterWhenLower: boolean;
    format: DashboardKpi['format'];
  }> = [
    {
      key: 'bestLapMs',
      label: 'Ritmo rápido',
      recentValue: average(recent.map((item) => item.bestLapMs)),
      baselineValue: average(baselinePool.map((item) => item.bestLapMs)),
      betterWhenLower: true,
      format: 'lapTime',
    },
    {
      key: 'lapConsistencyMs',
      label: 'Consistencia',
      recentValue: average(recent.map((item) => item.lapConsistencyMs)),
      baselineValue: average(baselinePool.map((item) => item.lapConsistencyMs)),
      betterWhenLower: true,
      format: 'lapTime',
    },
    {
      key: 'validLapRate',
      label: 'Vueltas válidas',
      recentValue: average(recent.map((item) => item.validLapRate)),
      baselineValue: average(baselinePool.map((item) => item.validLapRate)),
      betterWhenLower: false,
      format: 'percent',
    },
    {
      key: 'incidentsCount',
      label: 'Incidentes',
      recentValue: average(recent.map((item) => item.incidentsCount)),
      baselineValue: average(baselinePool.map((item) => item.incidentsCount)),
      betterWhenLower: true,
      format: 'decimal',
    },
    {
      key: 'positionGain',
      label: 'Posiciones ganadas',
      recentValue: average(recent.map((item) => item.positionGain)),
      baselineValue: average(baselinePool.map((item) => item.positionGain)),
      betterWhenLower: false,
      format: 'position',
    },
  ];

  return {
    recentWindowSize,
    baselineWindowSize,
    metrics: metrics.map((metric) => {
      const comparison = compareMetric(
        metric.recentValue,
        metric.baselineValue,
        metric.betterWhenLower,
      );

      return {
        key: metric.key,
        label: metric.label,
        recentValue: roundTo(metric.recentValue, metric.format === 'percent' ? 4 : 1),
        baselineValue: roundTo(metric.baselineValue, metric.format === 'percent' ? 4 : 1),
        delta: roundTo(comparison.delta, metric.format === 'percent' ? 4 : 1),
        direction: comparison.direction,
        format: metric.format,
      };
    }),
  };
}

function buildInsights(
  trends: TrendPoint[],
  cleanliness: DriverOverviewData['cleanliness'],
  recentVsBaseline: DriverOverviewData['recentVsBaseline'],
  topTracks: DashboardRankingItem[],
  topCars: DashboardRankingItem[],
) {
  const insights: DashboardInsight[] = [];
  const metricByKey = new Map(recentVsBaseline.metrics.map((metric) => [metric.key, metric]));
  const bestLapMetric = metricByKey.get('bestLapMs');
  const consistencyMetric = metricByKey.get('lapConsistencyMs');
  const positionGainMetric = metricByKey.get('positionGain');
  const incidentsMetric = metricByKey.get('incidentsCount');
  const validLapMetric = metricByKey.get('validLapRate');

  if (bestLapMetric?.direction === 'better') {
    insights.push({
      id: 'pace-up',
      tone: 'positive',
      title: 'Tu ritmo reciente está subiendo',
      body: 'Las últimas sesiones están marcando mejores vueltas que tu referencia histórica. Hay progreso real, no sólo un pico aislado.',
    });
  }

  if (consistencyMetric?.direction === 'better') {
    insights.push({
      id: 'consistency-up',
      tone: 'positive',
      title: 'La consistencia acompaña a la velocidad',
      body: 'No sólo estás yendo más rápido: también estás cerrando tandas más estables. Eso suele trasladarse mejor a carrera.',
    });
  }

  if (positionGainMetric?.direction === 'better' && bestLapMetric?.direction !== 'better') {
    insights.push({
      id: 'racecraft-up',
      tone: 'neutral',
      title: 'Tu mejora reciente viene del racecraft',
      body: 'Aunque el ritmo puro no haya dado el mayor salto, sí estás convirtiendo mejor las sesiones en posiciones ganadas.',
    });
  }

  if (incidentsMetric?.direction === 'worse') {
    insights.push({
      id: 'incidents-up',
      tone: 'warning',
      title: 'La velocidad está costando limpieza',
      body: 'Tus últimas sesiones traen más incidentes que la base histórica. Merece la pena revisar dónde estás asumiendo demasiado riesgo.',
    });
  }

  if (validLapMetric?.direction === 'worse') {
    insights.push({
      id: 'validity-down',
      tone: 'warning',
      title: 'La tasa de vueltas válidas ha bajado',
      body: 'Puede ser señal de que estás forzando en exceso o de que el margen del setup es demasiado estrecho en stint.',
    });
  }

  if (cleanliness.cleanSessionRate !== null && cleanliness.cleanSessionRate >= 0.65) {
    insights.push({
      id: 'clean-sessions',
      tone: 'positive',
      title: 'Estás cerrando muchas sesiones limpias',
      body: 'Una buena parte de tus tandas termina sin incidentes, penalizaciones ni track limits. Esa base te hace mucho más fiable en carrera.',
    });
  }

  if (cleanliness.penaltiesPerSession !== null && cleanliness.penaltiesPerSession > 0.6) {
    insights.push({
      id: 'penalties-up',
      tone: 'warning',
      title: 'Las penalizaciones están costando demasiado',
      body: 'Ahora mismo el cuello de botella no parece ser sólo el ritmo. Hay margen claro en disciplina y gestión del riesgo.',
    });
  }

  if (topTracks[0]) {
    insights.push({
      id: 'top-track',
      tone: 'neutral',
      title: `Ahora mismo tu circuito fuerte es ${topTracks[0].label}`,
      body: 'Es tu combinación más sólida entre ritmo, consistencia, resultado y limpieza con la muestra actual.',
    });
  }

  if (topCars[0]) {
    insights.push({
      id: 'top-car',
      tone: 'neutral',
      title: `${topCars[0].label} es tu coche más eficiente`,
      body: 'No necesariamente es el más espectacular a una vuelta, pero sí el que te está dando el mejor equilibrio competitivo.',
    });
  }

  if (insights.length === 0 && trends.length > 0) {
    insights.push({
      id: 'warming-up',
      tone: 'neutral',
      title: 'La base ya está lista para generar patrones',
      body: 'Con unas cuantas sesiones más aparecerán tendencias más fiables en ritmo, consistencia y ejecución de carrera.',
    });
  }

  return insights.slice(0, 5);
}

export async function getDriverOverviewData(
  userId: string,
  driverLabel: string,
  filters: DashboardFilters = {},
) {
  const trace = createPerfTrace('getDriverOverviewData', {
    userId,
    filters,
    driverLabel,
  });
  const supabase = await createClient();
  const { carClasses, cars, tracks } = await getSetupCatalog();
  const defaultSourceSessionSetting = 'Multiplayer';
  const allSourceSessionSetting = 'Todos';
  const rankingThreshold = 3;

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
    allSourceSessionSetting,
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
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;

  let setupsQuery = supabase
    .from('setups')
    .select('id, car_id, track_id')
    .eq('owner_user_id', userId);

  if (selectedCarClassId) {
    const scopedCarIds = carsForSelectedClass.map((car) => car.id);
    setupsQuery =
      scopedCarIds.length > 0
        ? setupsQuery.in('car_id', scopedCarIds)
        : setupsQuery.in('car_id', ['00000000-0000-0000-0000-000000000000']);
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
  const scopedSetupIds = scopedSetups.map((setup) => setup.id);
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const normalizedSelectedCarClassName = normalizeText(selectedCarClassName);
  const normalizedSelectedCarName = normalizeText(selectedCar?.name);
  const normalizedSelectedTrackName = normalizeText(selectedTrack?.name);
  const normalizedSelectedSourceSessionSetting =
    normalizeSessionSetting(selectedSourceSessionSetting) ===
    normalizeSessionSetting(allSourceSessionSetting)
      ? ''
      : normalizeSessionSetting(selectedSourceSessionSetting);
  const selectedCarCandidates = buildTextCandidates(
    selectedCar?.name,
    selectedCar?.slug,
    selectedCar?.name,
  );
  const selectedTrackCandidates = buildTextCandidates(
    selectedTrack?.name,
    selectedTrack?.slug,
    selectedTrack?.official_name,
    selectedTrack?.city,
  );
  const dateFrom = parseDateInput(filters.dateFrom);
  const dateTo = parseDateInput(filters.dateTo, true);

  let linkedSessionsQuery = supabase
    .from('setup_sessions')
    .select(
      'id, setup_id, imported_at, session_datetime, session_type, source_session_setting, track_venue, track_course, car_class, car_type, best_lap_seconds, average_lap_ms, lap_consistency_ms, finish_pos, grid_pos, valid_lap_rate, incidents_count, penalties_count, track_limits_count',
    )
    .eq('owner_user_id', userId)
    .not('setup_id', 'is', null)
    .order('session_datetime', { ascending: false, nullsFirst: false })
    .order('imported_at', { ascending: false });

  linkedSessionsQuery =
    scopedSetupIds.length > 0
      ? linkedSessionsQuery.in('setup_id', scopedSetupIds)
      : linkedSessionsQuery.in('setup_id', ['00000000-0000-0000-0000-000000000000']);

  let standaloneSessionsQuery = supabase
    .from('setup_sessions')
    .select(
      'id, setup_id, imported_at, session_datetime, session_type, source_session_setting, track_venue, track_course, car_class, car_type, best_lap_seconds, average_lap_ms, lap_consistency_ms, finish_pos, grid_pos, valid_lap_rate, incidents_count, penalties_count, track_limits_count',
    )
    .eq('owner_user_id', userId)
    .is('setup_id', null)
    .order('session_datetime', { ascending: false, nullsFirst: false })
    .order('imported_at', { ascending: false });

  if (selectedSourceSessionSetting) {
    linkedSessionsQuery = linkedSessionsQuery.eq(
      'source_session_setting',
      selectedSourceSessionSetting,
    );
    standaloneSessionsQuery = standaloneSessionsQuery.eq(
      'source_session_setting',
      selectedSourceSessionSetting,
    );
  }

  if (selectedCarClassId) {
    standaloneSessionsQuery = applyStandaloneSessionClassFilter(
      standaloneSessionsQuery,
      selectedCarClassName,
    );
  }

  if (selectedCarId) {
    standaloneSessionsQuery = applyTextCandidateFilter(
      standaloneSessionsQuery,
      ['car_type'],
      selectedCarCandidates,
    );
  }

  if (selectedTrackId) {
    standaloneSessionsQuery = applyTextCandidateFilter(
      standaloneSessionsQuery,
      ['track_venue', 'track_course'],
      selectedTrackCandidates,
    );
  }

  const [linkedSessionsResult, standaloneSessionsResult] = await Promise.all([
    linkedSessionsQuery,
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
  ];

  const filteredSessions = rawSessions
    .map((rawSession) => ({
      rawSession,
      session: buildSessionSummary(
        rawSession,
        rawSession.setup_id ? setupsById.get(rawSession.setup_id) : undefined,
        carsById,
        tracksById,
      ),
    }))
    .filter(({ session, rawSession }) => {
      if (
        normalizedSelectedSourceSessionSetting &&
        normalizeSessionSetting(session.sourceSessionSetting) !==
          normalizedSelectedSourceSessionSetting
      ) {
        return false;
      }

      if (selectedCarClassId) {
        const sessionCarClassName = canonicalizeSessionClass(
          session.carClassId
            ? carClasses.find((carClass) => carClass.id === session.carClassId)?.name
            : null,
        );
        const inferredSessionCarClassName = canonicalizeSessionClass(rawSession.car_class);

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
          normalizedSessionCarName !== normalizedSelectedCarName &&
          !matchesCandidateText(session.carName, selectedCarCandidates) &&
          !matchesCandidateText(rawSession.car_type, selectedCarCandidates)
        ) {
          return false;
        }
      }

      if (selectedTrackId) {
        const normalizedSessionTrackName = normalizeText(session.trackName);

        if (
          session.trackId !== selectedTrackId &&
          normalizedSessionTrackName !== normalizedSelectedTrackName &&
          !matchesCandidateText(session.trackName, selectedTrackCandidates) &&
          !matchesCandidateText(rawSession.track_venue, selectedTrackCandidates) &&
          !matchesCandidateText(rawSession.track_course, selectedTrackCandidates)
        ) {
          return false;
        }
      }

      const sessionTimestamp = Date.parse(session.sessionDate);

      if (Number.isNaN(sessionTimestamp)) {
        return false;
      }

      if (dateFrom && sessionTimestamp < dateFrom.getTime()) {
        return false;
      }

      if (dateTo && sessionTimestamp > dateTo.getTime()) {
        return false;
      }

      return true;
    })
    .map(({ session }) => session)
    .sort((left, right) => Date.parse(right.sessionDate) - Date.parse(left.sessionDate));

  const trends: TrendPoint[] = filteredSessions.map((session) => ({
    sessionId: session.id,
    sessionDate: session.sessionDate,
    trackName: session.trackName,
    carName: session.carName,
    bestLapMs: session.bestLapMs,
    averageLapMs: session.averageLapMs,
    lapConsistencyMs: session.lapConsistencyMs,
    finishPos: session.finishPos,
    positionGain: session.positionGain,
    validLapRate: session.validLapRate,
    incidentsCount: session.incidentsCount,
  }));

  const kpis: DashboardKpi[] = [
    {
      label: 'Sesiones',
      value: filteredSessions.length,
      format: 'count',
      description: 'Base activa del análisis actual',
    },
    {
      label: 'Mejor vuelta',
      value: (() => {
        const bestLaps = trends
          .map((item) => item.bestLapMs)
          .filter((value): value is number => typeof value === 'number');
        return bestLaps.length > 0 ? Math.min(...bestLaps) : null;
      })(),
      format: 'lapTime',
      description: 'Pico de ritmo dentro del filtro',
    },
    {
      label: 'Consistencia media',
      value: roundTo(average(trends.map((item) => item.lapConsistencyMs)), 1),
      format: 'lapTime',
      description: 'Cuánto se abre tu ritmo entre vueltas',
    },
    {
      label: 'Posiciones ganadas',
      value: roundTo(average(trends.map((item) => item.positionGain)), 1),
      format: 'position',
      description: 'Ejecución media de carrera',
    },
    {
      label: 'Vueltas válidas',
      value: roundTo(average(trends.map((item) => item.validLapRate)), 4),
      format: 'percent',
      description: 'Control y limpieza sobre el stint',
    },
    {
      label: 'Incidentes / sesión',
      value: roundTo(average(trends.map((item) => item.incidentsCount)), 1),
      format: 'decimal',
      description: 'Riesgo que estás pagando por tanda',
    },
  ];

  const recentVsBaseline = buildRecentVsBaseline(trends);
  const finishedSessions = filteredSessions.filter((item) => item.finishPos !== null);
  const pilotSummary = {
    totalSessions: filteredSessions.length,
    averagePositionGain: roundTo(average(filteredSessions.map((item) => item.positionGain)), 1),
    averageFinishPosition: roundTo(average(finishedSessions.map((item) => item.finishPos)), 1),
    incidentsPerSession: roundTo(average(filteredSessions.map((item) => item.incidentsCount)), 1),
    wins: finishedSessions.filter((item) => item.finishPos === 1).length,
    winsRate:
      finishedSessions.length > 0
        ? roundTo(
            finishedSessions.filter((item) => item.finishPos === 1).length /
              finishedSessions.length,
            4,
          )
        : null,
    podiums: finishedSessions.filter((item) => (item.finishPos ?? 999) <= 3).length,
    podiumsRate:
      finishedSessions.length > 0
        ? roundTo(
            finishedSessions.filter((item) => (item.finishPos ?? 999) <= 3).length /
              finishedSessions.length,
            4,
          )
        : null,
    top5s: finishedSessions.filter((item) => (item.finishPos ?? 999) <= 5).length,
    top5sRate:
      finishedSessions.length > 0
        ? roundTo(
            finishedSessions.filter((item) => (item.finishPos ?? 999) <= 5).length /
              finishedSessions.length,
            4,
          )
        : null,
    top10s: finishedSessions.filter((item) => (item.finishPos ?? 999) <= 10).length,
    top10sRate:
      finishedSessions.length > 0
        ? roundTo(
            finishedSessions.filter((item) => (item.finishPos ?? 999) <= 10).length /
              finishedSessions.length,
            4,
          )
        : null,
  };
  const cleanliness = {
    incidentsPerSession: roundTo(average(filteredSessions.map((item) => item.incidentsCount)), 1),
    penaltiesPerSession: roundTo(average(filteredSessions.map((item) => item.penaltiesCount)), 1),
    trackLimitsPerSession: roundTo(
      average(filteredSessions.map((item) => item.trackLimitsCount)),
      1,
    ),
    cleanSessionRate: roundTo(
      average(
        filteredSessions.map((item) =>
          item.incidentsCount === 0 && item.penaltiesCount === 0 && item.trackLimitsCount === 0
            ? 1
            : 0,
        ),
      ),
      4,
    ),
  };
  const trackRankings = buildRankingItems(filteredSessions, 'track', rankingThreshold);
  const carRankings = buildRankingItems(filteredSessions, 'car', rankingThreshold);
  const topTracks = trackRankings.slice(0, 4);
  const weakTracks = [...trackRankings].slice(-4).reverse();
  const topCars = carRankings.slice(0, 4);
  const insights = buildInsights(trends, cleanliness, recentVsBaseline, topTracks, topCars);

  const response = {
    filters,
    resolvedFilters: {
      sourceSessionSetting: selectedSourceSessionSetting,
      carClassId: selectedCarClassId,
      carId: selectedCarId,
      trackId: selectedTrackId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    filterOptions: {
      sessionSettings,
      carClasses: carClasses.map((carClass) => ({ id: carClass.id, name: carClass.name })),
      cars: cars.map((car) => ({ id: car.id, name: car.name, carClassId: car.car_class_id })),
      tracks: tracks.map((track) => ({ id: track.id, name: track.name })),
      defaultCarClassId,
      defaultSourceSessionSetting,
    },
    hero: {
      driverLabel,
      totalSessions: filteredSessions.length,
      dateRangeLabel: formatDateRangeLabel(filteredSessions),
    },
    pilotSummary,
    rankingThreshold,
    kpis,
    cleanliness,
    trends,
    recentVsBaseline,
    topTracks,
    weakTracks,
    topCars,
    insights,
  } satisfies DriverOverviewData;

  trace.finish({
    linkedRows: linkedSessionsResult.data?.length ?? 0,
    standaloneRows: standaloneSessionsResult.data?.length ?? 0,
    mergedRows: rawSessions.length,
    filteredRows: filteredSessions.length,
    trendRows: trends.length,
    topTrackCandidates: trackRankings.length,
    topCarCandidates: carRankings.length,
  });

  return response;
}
