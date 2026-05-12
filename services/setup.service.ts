import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type CarOption = Pick<Database['public']['Tables']['cars']['Row'], 'id' | 'name'>;
type TrackOption = Pick<Database['public']['Tables']['tracks']['Row'], 'id' | 'name'>;
type SetupRow = Pick<
  Database['public']['Tables']['setups']['Row'],
  'id' | 'name' | 'car_id' | 'track_id' | 'setup_type' | 'visibility' | 'created_at' | 'notes'
>;

export type SetupSummary = {
  id: string;
  name: string;
  carName: string;
  trackName: string;
  setupType: Database['public']['Enums']['setup_type'];
  visibility: Database['public']['Enums']['setup_visibility'];
  createdAt: string;
  notes: string | null;
};

export async function getSetupPageData(userId: string) {
  const supabase = await createClient();

  const [carsResult, tracksResult, setupsResult] = await Promise.all([
    supabase.from('cars').select('id, name').order('name'),
    supabase.from('tracks').select('id, name').order('name'),
    supabase
      .from('setups')
      .select('id, name, car_id, track_id, setup_type, visibility, created_at, notes')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (carsResult.error) {
    throw carsResult.error;
  }

  if (tracksResult.error) {
    throw tracksResult.error;
  }

  if (setupsResult.error) {
    throw setupsResult.error;
  }

  const cars = (carsResult.data ?? []) as CarOption[];
  const tracks = (tracksResult.data ?? []) as TrackOption[];
  const setups = (setupsResult.data ?? []) as SetupRow[];

  const carsById = new Map(cars.map((car) => [car.id, car.name]));
  const tracksById = new Map(tracks.map((track) => [track.id, track.name]));

  return {
    cars,
    tracks,
    setups: setups.map((setup) => ({
      id: setup.id,
      name: setup.name,
      carName: carsById.get(setup.car_id) ?? 'Coche no disponible',
      trackName: tracksById.get(setup.track_id) ?? 'Circuito no disponible',
      setupType: setup.setup_type,
      visibility: setup.visibility,
      createdAt: setup.created_at,
      notes: setup.notes,
    })),
  };
}

type CreateSetupInput = {
  ownerUserId: string;
  name: string;
  carId: string;
  trackId: string;
  setupType: Database['public']['Enums']['setup_type'];
  notes?: string;
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
    visibility: 'private',
  });

  if (error) {
    throw error;
  }
}
