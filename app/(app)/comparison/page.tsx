import { redirect } from 'next/navigation';
import { SetupComparisonConsole } from '@/components/features/setups/setup-comparison-console';
import { routes } from '@/lib/constants/routes';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import { getSetupComparisonData } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

type ComparisonPageProps = {
  searchParams: Promise<{
    carClassId?: string;
    carId?: string;
    trackId?: string;
    setupType?: Database['public']['Enums']['setup_type'];
  }>;
};

export default async function ComparisonPage({ searchParams }: ComparisonPageProps) {
  const [appContext, resolvedSearchParams] = await Promise.all([
    getAuthenticatedAppContext(),
    searchParams,
  ]);

  if (!appContext) {
    redirect(routes.login);
  }

  const filters = {
    carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
    setupType:
      resolvedSearchParams.setupType === 'fixed' || resolvedSearchParams.setupType === 'open'
        ? resolvedSearchParams.setupType
        : undefined,
  };

  const { carClasses, cars, tracks, setups, defaultCarClassId, resolvedFilters } =
    await getSetupComparisonData(appContext.user.id, filters);
  const comparisonKey = JSON.stringify(resolvedFilters);

  return (
    <SetupComparisonConsole
      key={comparisonKey}
      carClasses={carClasses.map((carClass) => ({ id: carClass.id, name: carClass.name }))}
      cars={cars.map((car) => ({ id: car.id, name: car.name, carClassId: car.car_class_id }))}
      tracks={tracks}
      filters={resolvedFilters}
      defaultCarClassId={defaultCarClassId}
      setups={setups}
    />
  );
}
