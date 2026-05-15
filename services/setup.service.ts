import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type CarClassOption = Pick<Database['public']['Tables']['car_classes']['Row'], 'id' | 'name'>;
type ManufacturerOption = Pick<Database['public']['Tables']['manufacturers']['Row'], 'id' | 'name'>;
type CarOption = Pick<
  Database['public']['Tables']['cars']['Row'],
  'id' | 'name' | 'car_class_id' | 'manufacturer_id'
>;
type TrackOption = Pick<Database['public']['Tables']['tracks']['Row'], 'id' | 'name'>;
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
  | 'brake_bias'
  | 'abs'
  | 'tc'
  | 'tc_power_cut'
  | 'tc_slip_angle'
>;

export type SetupSummary = {
  id: string;
  name: string;
  carClassName: string;
  carName: string;
  manufacturerName: string;
  trackName: string;
  setupType: Database['public']['Enums']['setup_type'];
  visibility: Database['public']['Enums']['setup_visibility'];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  brakeBias: number | null;
  abs: number | null;
  onboardTc: number | null;
  tcPowerCut: number | null;
  tcSlipAngle: number | null;
};

export type SetupFilters = {
  query?: string;
  carId?: string;
  trackId?: string;
  setupType?: Database['public']['Enums']['setup_type'];
  favoriteOnly?: boolean;
};

type GetSetupPageDataOptions = {
  page?: number;
  pageSize?: number;
};

function buildSetupSummary(
  setup: SetupRow,
  carsById: Map<string, CarOption>,
  tracksById: Map<string, string>,
  carClassesById: Map<string, string>,
  manufacturersById: Map<string, string>,
  favoriteSetupIds: Set<string>,
): SetupSummary {
  const car = carsById.get(setup.car_id);

  return {
    id: setup.id,
    name: setup.name,
    carClassName: carClassesById.get(car?.car_class_id ?? '') ?? 'Clase no disponible',
    carName: car?.name ?? 'Coche no disponible',
    manufacturerName:
      manufacturersById.get(car?.manufacturer_id ?? '') ?? 'Fabricante no disponible',
    trackName: tracksById.get(setup.track_id) ?? 'Circuito no disponible',
    setupType: setup.setup_type,
    visibility: setup.visibility,
    isFavorite: favoriteSetupIds.has(setup.id),
    createdAt: setup.created_at,
    updatedAt: setup.updated_at,
    notes: setup.notes,
    brakeBias: setup.brake_bias,
    abs: setup.abs,
    onboardTc: setup.tc,
    tcPowerCut: setup.tc_power_cut,
    tcSlipAngle: setup.tc_slip_angle,
  };
}

export async function getSetupPageData(
  userId: string,
  filters: SetupFilters = {},
  options: GetSetupPageDataOptions = {},
) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 5);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const favoritesResult = await supabase
    .from('setup_favorites')
    .select('setup_id')
    .eq('user_id', userId);

  if (favoritesResult.error) {
    throw favoritesResult.error;
  }

  const favorites = (favoritesResult.data ?? []) as SetupFavoriteRow[];
  const favoriteSetupIds = new Set(favorites.map((favorite) => favorite.setup_id));

  let setupsQuery = supabase
    .from('setups')
    .select(
      'id, name, car_id, track_id, setup_type, visibility, created_at, updated_at, notes, brake_bias, abs, tc, tc_power_cut, tc_slip_angle',
      { count: 'exact' },
    )
    .eq('owner_user_id', userId);

  if (filters.carId) {
    setupsQuery = setupsQuery.eq('car_id', filters.carId);
  }

  if (filters.trackId) {
    setupsQuery = setupsQuery.eq('track_id', filters.trackId);
  }

  if (filters.setupType) {
    setupsQuery = setupsQuery.eq('setup_type', filters.setupType);
  }

  if (filters.query) {
    const escapedQuery = filters.query.replaceAll('%', '\\%').replaceAll(',', '\\,');
    setupsQuery = setupsQuery.or(`name.ilike.%${escapedQuery}%,notes.ilike.%${escapedQuery}%`);
  }

  if (filters.favoriteOnly) {
    const favoriteIds = [...favoriteSetupIds];

    if (favoriteIds.length === 0) {
      const [carClassesResult, manufacturersResult, carsResult, tracksResult] = await Promise.all([
        supabase.from('car_classes').select('id, name').order('name'),
        supabase.from('manufacturers').select('id, name').order('name'),
        supabase.from('cars').select('id, name, car_class_id, manufacturer_id').order('name'),
        supabase.from('tracks').select('id, name').order('name'),
      ]);

      if (carClassesResult.error) {
        throw carClassesResult.error;
      }

      if (manufacturersResult.error) {
        throw manufacturersResult.error;
      }

      if (carsResult.error) {
        throw carsResult.error;
      }

      if (tracksResult.error) {
        throw tracksResult.error;
      }

      return {
        cars: (carsResult.data ?? []) as CarOption[],
        tracks: (tracksResult.data ?? []) as TrackOption[],
        totalCount: 0,
        page,
        pageSize,
        setups: [] as SetupSummary[],
      };
    }

    setupsQuery = setupsQuery.in('id', favoriteIds);
  }

  const [carClassesResult, manufacturersResult, carsResult, tracksResult, setupsResult] =
    await Promise.all([
      supabase.from('car_classes').select('id, name').order('name'),
      supabase.from('manufacturers').select('id, name').order('name'),
      supabase.from('cars').select('id, name, car_class_id, manufacturer_id').order('name'),
      supabase.from('tracks').select('id, name').order('name'),
      setupsQuery.order('created_at', { ascending: false }).range(from, to),
    ]);

  if (carClassesResult.error) {
    throw carClassesResult.error;
  }

  if (manufacturersResult.error) {
    throw manufacturersResult.error;
  }

  if (carsResult.error) {
    throw carsResult.error;
  }

  if (tracksResult.error) {
    throw tracksResult.error;
  }

  if (setupsResult.error) {
    throw setupsResult.error;
  }

  const carClasses = (carClassesResult.data ?? []) as CarClassOption[];
  const manufacturers = (manufacturersResult.data ?? []) as ManufacturerOption[];
  const cars = (carsResult.data ?? []) as CarOption[];
  const tracks = (tracksResult.data ?? []) as TrackOption[];
  const setups = (setupsResult.data ?? []) as SetupRow[];
  const totalCount = setupsResult.count ?? 0;

  const carClassesById = new Map(carClasses.map((carClass) => [carClass.id, carClass.name]));
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));

  return {
    cars,
    tracks,
    totalCount,
    page,
    pageSize,
    setups: setups.map((setup) =>
      buildSetupSummary(
        setup,
        carsById,
        tracksById,
        carClassesById,
        manufacturersById,
        favoriteSetupIds,
      ),
    ),
  };
}

export async function getSetupDetail(userId: string, setupId: string) {
  const supabase = await createClient();

  const [
    carClassesResult,
    manufacturersResult,
    carsResult,
    tracksResult,
    setupResult,
    favoriteResult,
  ] = await Promise.all([
    supabase.from('car_classes').select('id, name').order('name'),
    supabase.from('manufacturers').select('id, name').order('name'),
    supabase.from('cars').select('id, name, car_class_id, manufacturer_id').order('name'),
    supabase.from('tracks').select('id, name').order('name'),
    supabase
      .from('setups')
      .select(
        'id, name, car_id, track_id, setup_type, visibility, created_at, updated_at, notes, brake_bias, abs, tc, tc_power_cut, tc_slip_angle',
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

  if (carClassesResult.error) {
    throw carClassesResult.error;
  }

  if (manufacturersResult.error) {
    throw manufacturersResult.error;
  }

  if (carsResult.error) {
    throw carsResult.error;
  }

  if (tracksResult.error) {
    throw tracksResult.error;
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

  const carClasses = (carClassesResult.data ?? []) as CarClassOption[];
  const manufacturers = (manufacturersResult.data ?? []) as ManufacturerOption[];
  const cars = (carsResult.data ?? []) as CarOption[];
  const tracks = (tracksResult.data ?? []) as TrackOption[];
  const favorites = (favoriteResult.data ?? []) as SetupFavoriteRow[];

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
  );
}

type CreateSetupInput = {
  ownerUserId: string;
  name: string;
  carId: string;
  trackId: string;
  setupType: Database['public']['Enums']['setup_type'];
  notes?: string;
  brakeBias?: number | null;
  abs?: number | null;
  onboardTc?: number | null;
  tcPowerCut?: number | null;
  tcSlipAngle?: number | null;
};

type UpdateSetupInput = {
  ownerUserId: string;
  setupId: string;
  name: string;
  setupType: Database['public']['Enums']['setup_type'];
  notes?: string;
  brakeBias?: number | null;
  abs?: number | null;
  onboardTc?: number | null;
  tcPowerCut?: number | null;
  tcSlipAngle?: number | null;
};

type DeleteSetupInput = {
  ownerUserId: string;
  setupId: string;
};

export async function createSetup(input: CreateSetupInput) {
  const supabase = await createClient();

  const { error } = await supabase.from('setups').insert({
    owner_user_id: input.ownerUserId,
    car_id: input.carId,
    track_id: input.trackId,
    name: input.name,
    setup_type: input.setupType,
    notes: input.notes ? input.notes : null,
    brake_bias: input.brakeBias ?? null,
    abs: input.abs ?? null,
    tc: input.onboardTc ?? null,
    tc_power_cut: input.tcPowerCut ?? null,
    tc_slip_angle: input.tcSlipAngle ?? null,
    visibility: 'private',
  });

  if (error) {
    throw error;
  }
}

export async function updateSetup(input: UpdateSetupInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('setups')
    .update({
      name: input.name,
      setup_type: input.setupType,
      notes: input.notes ? input.notes : null,
      brake_bias: input.brakeBias ?? null,
      abs: input.abs ?? null,
      tc: input.onboardTc ?? null,
      tc_power_cut: input.tcPowerCut ?? null,
      tc_slip_angle: input.tcSlipAngle ?? null,
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
