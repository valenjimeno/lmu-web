import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-server';
import type { Database } from '@/types/database.types';

export type CarClassOption = Pick<
  Database['public']['Tables']['car_classes']['Row'],
  'id' | 'name' | 'slug'
>;
export type ManufacturerOption = Pick<
  Database['public']['Tables']['manufacturers']['Row'],
  'id' | 'name'
>;
export type CarOption = Pick<
  Database['public']['Tables']['cars']['Row'],
  'id' | 'name' | 'car_class_id' | 'manufacturer_id'
>;
export type TrackOption = Pick<Database['public']['Tables']['tracks']['Row'], 'id' | 'name'>;

export type SetupCatalog = {
  carClasses: CarClassOption[];
  manufacturers: ManufacturerOption[];
  cars: CarOption[];
  tracks: TrackOption[];
};

export const SETUP_CATALOG_TAG = 'setup-catalog';

export async function getSetupCatalog(): Promise<SetupCatalog> {
  'use cache';
  cacheLife('hours');
  cacheTag(SETUP_CATALOG_TAG);

  const supabase = createPublicClient();

  const [carClassesResult, manufacturersResult, carsResult, tracksResult] = await Promise.all([
    supabase.from('car_classes').select('id, name, slug').order('name'),
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
    carClasses: (carClassesResult.data ?? []) as CarClassOption[],
    manufacturers: (manufacturersResult.data ?? []) as ManufacturerOption[],
    cars: (carsResult.data ?? []) as CarOption[],
    tracks: (tracksResult.data ?? []) as TrackOption[],
  };
}

export function revalidateSetupCatalog() {
  revalidateTag(SETUP_CATALOG_TAG, 'max');
}
