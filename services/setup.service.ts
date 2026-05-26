import { createClient } from '@/lib/supabase/server';
import { getSetupCatalog, type CarOption } from '@/services/catalog.service';
import type { Database } from '@/types/database.types';
type ProfileOption = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'display_name' | 'email'
>;
type SetupFavoriteRow = Pick<Database['public']['Tables']['setup_favorites']['Row'], 'setup_id'>;
type SetupRow = Pick<
  Database['public']['Tables']['setups']['Row'],
  | 'id'
  | 'name'
  | 'car_id'
  | 'track_id'
  | 'setup_type'
  | 'visibility'
  | 'created_at'
  | 'updated_at'
  | 'notes'
  | 'race_duration_minutes'
  | 'weather_summary'
  | 'brake_bias'
  | 'abs'
  | 'tc'
  | 'tc_power_cut'
  | 'tc_slip_angle'
  | 'best_lap_ms'
>;

export type SetupSummary = {
  id: string;
  name: string;
  carId: string;
  trackId: string;
  carClassId: string | null;
  carClassName: string;
  carName: string;
  manufacturerName: string;
  trackName: string;
  ownerDisplayName: string;
  setupType: Database['public']['Enums']['setup_type'];
  visibility: Database['public']['Enums']['setup_visibility'];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  raceDurationMinutes: number | null;
  weatherSummary: string | null;
  brakeBias: number | null;
  abs: number | null;
  onboardTc: number | null;
  tcPowerCut: number | null;
  tcSlipAngle: number | null;
  bestLapMs: number | null;
};

export type SetupFilters = {
  query?: string;
  carClassId?: string;
  carId?: string;
  trackId?: string;
  setupType?: Database['public']['Enums']['setup_type'];
  favoriteOnly?: boolean;
};

export type SetupComparisonFilters = Pick<
  SetupFilters,
  'carClassId' | 'carId' | 'trackId' | 'setupType'
>;

type GetSetupPageDataOptions = {
  page?: number;
  pageSize?: number;
};

function buildSetupSearchQuery(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .map((term) => term.replaceAll(/[':&|!()<>*]/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
}

function resolveSetupCatalogFilters(
  carClasses: Awaited<ReturnType<typeof getSetupCatalog>>['carClasses'],
  cars: Awaited<ReturnType<typeof getSetupCatalog>>['cars'],
  filters: Pick<SetupFilters, 'carClassId' | 'carId'>,
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

function buildSetupSummary(
  setup: SetupRow,
  carsById: Map<string, CarOption>,
  tracksById: Map<string, string>,
  carClassesById: Map<string, string>,
  manufacturersById: Map<string, string>,
  favoriteSetupIds: Set<string>,
  ownerDisplayName: string,
): SetupSummary {
  const car = carsById.get(setup.car_id);

  return {
    id: setup.id,
    name: setup.name,
    carId: setup.car_id,
    trackId: setup.track_id,
    carClassId: car?.car_class_id ?? null,
    carClassName: carClassesById.get(car?.car_class_id ?? '') ?? 'Clase no disponible',
    carName: car?.name ?? 'Coche no disponible',
    manufacturerName:
      manufacturersById.get(car?.manufacturer_id ?? '') ?? 'Fabricante no disponible',
    trackName: tracksById.get(setup.track_id) ?? 'Circuito no disponible',
    ownerDisplayName,
    setupType: setup.setup_type,
    visibility: setup.visibility,
    isFavorite: favoriteSetupIds.has(setup.id),
    createdAt: setup.created_at,
    updatedAt: setup.updated_at,
    notes: setup.notes,
    raceDurationMinutes: setup.race_duration_minutes,
    weatherSummary: setup.weather_summary,
    brakeBias: setup.brake_bias,
    abs: setup.abs,
    onboardTc: setup.tc,
    tcPowerCut: setup.tc_power_cut,
    tcSlipAngle: setup.tc_slip_angle,
    bestLapMs: setup.best_lap_ms,
  };
}

export async function getSetupPageData(
  userId: string,
  filters: SetupFilters = {},
  options: GetSetupPageDataOptions = {},
) {
  const supabase = await createClient();
  const { carClasses, manufacturers, cars, tracks } = await getSetupCatalog();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 5);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { defaultCarClassId, selectedCarClassId, carsForSelectedClass, selectedCarId } =
    resolveSetupCatalogFilters(carClasses, cars, filters);

  const [favoritesResult, profileResult] = await Promise.all([
    supabase.from('setup_favorites').select('setup_id').eq('user_id', userId),
    supabase.from('profiles').select('display_name, email').eq('id', userId).maybeSingle(),
  ]);

  if (favoritesResult.error) {
    throw favoritesResult.error;
  }

  if (profileResult.error) {
    throw profileResult.error;
  }

  const favorites = (favoritesResult.data ?? []) as SetupFavoriteRow[];
  const favoriteSetupIds = new Set(favorites.map((favorite) => favorite.setup_id));
  const profile = profileResult.data as ProfileOption | null;
  const ownerDisplayName = profile?.display_name?.trim() || profile?.email?.trim() || 'Usuario';

  let setupsQuery = supabase
    .from('setups')
    .select(
      'id, name, car_id, track_id, setup_type, visibility, created_at, updated_at, notes, race_duration_minutes, weather_summary, brake_bias, abs, tc, tc_power_cut, tc_slip_angle, best_lap_ms',
      { count: 'exact' },
    )
    .eq('owner_user_id', userId);

  if (selectedCarClassId) {
    const scopedCarIds = carsForSelectedClass.map((car) => car.id);

    if (scopedCarIds.length === 0) {
      return {
        carClasses,
        cars,
        tracks,
        totalCount: 0,
        page,
        pageSize,
        resolvedFilters: {
          ...filters,
          carClassId: selectedCarClassId,
          carId: undefined,
        },
        defaultCarClassId,
        setups: [] as SetupSummary[],
      };
    }

    setupsQuery = setupsQuery.in('car_id', scopedCarIds);
  }

  if (selectedCarId) {
    setupsQuery = setupsQuery.eq('car_id', selectedCarId);
  }

  if (filters.trackId) {
    setupsQuery = setupsQuery.eq('track_id', filters.trackId);
  }

  if (filters.setupType) {
    setupsQuery = setupsQuery.eq('setup_type', filters.setupType);
  }

  if (filters.query) {
    const searchQuery = buildSetupSearchQuery(filters.query);

    if (searchQuery) {
      setupsQuery = setupsQuery.textSearch('search_document', searchQuery, {
        config: 'simple',
        type: 'websearch',
      });
    }
  }

  if (filters.favoriteOnly) {
    const favoriteIds = [...favoriteSetupIds];

    if (favoriteIds.length === 0) {
      return {
        carClasses,
        cars,
        tracks,
        totalCount: 0,
        page,
        pageSize,
        resolvedFilters: {
          ...filters,
          carClassId: selectedCarClassId,
          carId: selectedCarId,
        },
        defaultCarClassId,
        setups: [] as SetupSummary[],
      };
    }

    setupsQuery = setupsQuery.in('id', favoriteIds);
  }

  const {
    data: setupsData,
    error: setupsError,
    count,
  } = await setupsQuery.order('created_at', { ascending: false }).range(from, to);

  if (setupsError) {
    throw setupsError;
  }

  const setups = (setupsData ?? []) as SetupRow[];
  const totalCount = count ?? 0;

  const carClassesById = new Map(carClasses.map((carClass) => [carClass.id, carClass.name]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));

  return {
    carClasses,
    cars,
    tracks,
    totalCount,
    page,
    pageSize,
    resolvedFilters: {
      ...filters,
      carClassId: selectedCarClassId,
      carId: selectedCarId,
    },
    defaultCarClassId,
    setups: setups.map((setup) =>
      buildSetupSummary(
        setup,
        carsById,
        tracksById,
        carClassesById,
        manufacturersById,
        favoriteSetupIds,
        ownerDisplayName,
      ),
    ),
  };
}

export async function getSetupComparisonData(userId: string, filters: SetupComparisonFilters = {}) {
  const supabase = await createClient();
  const { carClasses, manufacturers, cars, tracks } = await getSetupCatalog();
  const { defaultCarClassId, selectedCarClassId, carsForSelectedClass, selectedCarId } =
    resolveSetupCatalogFilters(carClasses, cars, filters);

  const profileResult = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profile = profileResult.data as ProfileOption | null;
  const ownerDisplayName = profile?.display_name?.trim() || profile?.email?.trim() || 'Usuario';

  let setupsQuery = supabase
    .from('setups')
    .select(
      'id, name, car_id, track_id, setup_type, visibility, created_at, updated_at, notes, race_duration_minutes, weather_summary, brake_bias, abs, tc, tc_power_cut, tc_slip_angle, best_lap_ms',
    )
    .eq('owner_user_id', userId)
    .not('best_lap_ms', 'is', null);

  if (selectedCarClassId) {
    const scopedCarIds = carsForSelectedClass.map((car) => car.id);

    if (scopedCarIds.length === 0) {
      return {
        carClasses,
        cars,
        tracks,
        defaultCarClassId,
        resolvedFilters: {
          ...filters,
          carClassId: selectedCarClassId,
          carId: undefined,
        },
        setups: [] as SetupSummary[],
      };
    }

    setupsQuery = setupsQuery.in('car_id', scopedCarIds);
  }

  if (selectedCarId) {
    setupsQuery = setupsQuery.eq('car_id', selectedCarId);
  }

  if (filters.trackId) {
    setupsQuery = setupsQuery.eq('track_id', filters.trackId);
  }

  if (filters.setupType) {
    setupsQuery = setupsQuery.eq('setup_type', filters.setupType);
  }

  const { data: setupsData, error: setupsError } = await setupsQuery
    .order('best_lap_ms', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (setupsError) {
    throw setupsError;
  }

  const carClassesById = new Map(carClasses.map((carClass) => [carClass.id, carClass.name]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));

  return {
    carClasses,
    cars,
    tracks,
    defaultCarClassId,
    resolvedFilters: {
      ...filters,
      carClassId: selectedCarClassId,
      carId: selectedCarId,
    },
    setups: ((setupsData ?? []) as SetupRow[]).map((setup) =>
      buildSetupSummary(
        setup,
        carsById,
        tracksById,
        carClassesById,
        manufacturersById,
        new Set<string>(),
        ownerDisplayName,
      ),
    ),
  };
}

export async function getSetupDetail(userId: string, setupId: string) {
  const supabase = await createClient();
  const { carClasses, manufacturers, cars, tracks } = await getSetupCatalog();

  const [profileResult, setupResult, favoriteResult] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', userId).maybeSingle(),
    supabase
      .from('setups')
      .select(
        'id, name, car_id, track_id, setup_type, visibility, created_at, updated_at, notes, race_duration_minutes, weather_summary, brake_bias, abs, tc, tc_power_cut, tc_slip_angle, best_lap_ms',
      )
      .eq('owner_user_id', userId)
      .eq('id', setupId)
      .maybeSingle(),
    supabase
      .from('setup_favorites')
      .select('setup_id')
      .eq('user_id', userId)
      .eq('setup_id', setupId),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (setupResult.error) {
    throw setupResult.error;
  }

  if (favoriteResult.error) {
    throw favoriteResult.error;
  }

  if (!setupResult.data) {
    return null;
  }

  const profile = (profileResult.data ?? null) as ProfileOption | null;
  const favorites = (favoriteResult.data ?? []) as SetupFavoriteRow[];
  const ownerDisplayName = profile?.display_name?.trim() || profile?.email?.trim() || 'Usuario';

  const carClassesById = new Map(carClasses.map((carClass) => [carClass.id, carClass.name]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));
  const favoriteSetupIds = new Set(favorites.map((favorite) => favorite.setup_id));

  return buildSetupSummary(
    setupResult.data as SetupRow,
    carsById,
    tracksById,
    carClassesById,
    manufacturersById,
    favoriteSetupIds,
    ownerDisplayName,
  );
}

type CreateSetupInput = {
  ownerUserId: string;
  name: string;
  carId: string;
  trackId: string;
  setupType: Database['public']['Enums']['setup_type'];
  visibility: Database['public']['Enums']['setup_visibility'];
  notes?: string;
  raceDurationMinutes?: number | null;
  weatherSummary?: string | null;
  brakeBias?: number | null;
  abs?: number | null;
  onboardTc?: number | null;
  tcPowerCut?: number | null;
  tcSlipAngle?: number | null;
  bestLapMs?: number | null;
};

type UpdateSetupInput = {
  ownerUserId: string;
  setupId: string;
  name: string;
  carId: string;
  trackId: string;
  setupType: Database['public']['Enums']['setup_type'];
  visibility: Database['public']['Enums']['setup_visibility'];
  notes?: string;
  raceDurationMinutes?: number | null;
  weatherSummary?: string | null;
  brakeBias?: number | null;
  abs?: number | null;
  onboardTc?: number | null;
  tcPowerCut?: number | null;
  tcSlipAngle?: number | null;
  bestLapMs?: number | null;
};

type DeleteSetupInput = {
  ownerUserId: string;
  setupId: string;
};

export async function createSetup(input: CreateSetupInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('setups')
    .insert({
      owner_user_id: input.ownerUserId,
      car_id: input.carId,
      track_id: input.trackId,
      name: input.name,
      setup_type: input.setupType,
      visibility: input.visibility,
      notes: input.notes ? input.notes : null,
      race_duration_minutes: input.raceDurationMinutes ?? null,
      weather_summary: input.weatherSummary ? input.weatherSummary : null,
      brake_bias: input.brakeBias ?? null,
      abs: input.abs ?? null,
      tc: input.onboardTc ?? null,
      tc_power_cut: input.tcPowerCut ?? null,
      tc_slip_angle: input.tcSlipAngle ?? null,
      best_lap_ms: input.bestLapMs ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateSetup(input: UpdateSetupInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('setups')
    .update({
      name: input.name,
      car_id: input.carId,
      track_id: input.trackId,
      setup_type: input.setupType,
      visibility: input.visibility,
      notes: input.notes ? input.notes : null,
      race_duration_minutes: input.raceDurationMinutes ?? null,
      weather_summary: input.weatherSummary ? input.weatherSummary : null,
      brake_bias: input.brakeBias ?? null,
      abs: input.abs ?? null,
      tc: input.onboardTc ?? null,
      tc_power_cut: input.tcPowerCut ?? null,
      tc_slip_angle: input.tcSlipAngle ?? null,
      best_lap_ms: input.bestLapMs ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.setupId)
    .eq('owner_user_id', input.ownerUserId);

  if (error) {
    throw error;
  }
}

export async function deleteSetup(input: DeleteSetupInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('setups')
    .delete()
    .eq('id', input.setupId)
    .eq('owner_user_id', input.ownerUserId);

  if (error) {
    throw error;
  }
}

type ToggleSetupFavoriteInput = {
  userId: string;
  setupId: string;
  makeFavorite: boolean;
};

export async function toggleSetupFavorite(input: ToggleSetupFavoriteInput) {
  const supabase = await createClient();

  if (input.makeFavorite) {
    const { error } = await supabase.from('setup_favorites').upsert(
      {
        user_id: input.userId,
        setup_id: input.setupId,
      },
      {
        onConflict: 'user_id,setup_id',
      },
    );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from('setup_favorites')
    .delete()
    .eq('user_id', input.userId)
    .eq('setup_id', input.setupId);

  if (error) {
    throw error;
  }
}
