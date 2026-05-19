import { redirect } from 'next/navigation';
import { SetupsConsole } from '@/components/features/setups/setups-console';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getSetupPageData } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

type SetupsPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    query?: string;
    carClassId?: string;
    carId?: string;
    trackId?: string;
    setupType?: Database['public']['Enums']['setup_type'];
    favoriteOnly?: string;
    page?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_setup: 'Completa nombre, coche, circuito, tipo y visibilidad para poder guardarlo.',
  invalid_setup_values:
    'Brake Bias, ABS y los controles de tracción deben ser números válidos o quedarse vacíos.',
  create_failed: 'No hemos podido guardar el setup. Inténtalo de nuevo en unos segundos.',
};

const SETUPS_PAGE_SIZE = 6;

export default async function SetupsPage({ searchParams }: SetupsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) {
    redirect(routes.login);
  }

  const filters = {
    query: resolvedSearchParams.query?.trim() || undefined,
    carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
    setupType:
      resolvedSearchParams.setupType === 'fixed' || resolvedSearchParams.setupType === 'open'
        ? resolvedSearchParams.setupType
        : undefined,
    favoriteOnly: resolvedSearchParams.favoriteOnly === '1',
  };
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? '1', 10) || 1);

  const {
    carClasses,
    cars,
    tracks,
    setups,
    totalCount,
    page,
    pageSize,
    resolvedFilters,
    defaultCarClassId,
  } = await getSetupPageData(user.id, filters, {
    page: currentPage,
    pageSize: SETUPS_PAGE_SIZE,
  });

  const feedbackMessage = resolvedSearchParams.created
    ? 'Setup creado correctamente.'
    : resolvedSearchParams.deleted
      ? 'Setup eliminado correctamente de tu biblioteca.'
      : resolvedSearchParams.error
        ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
        : undefined;
  const feedbackTone = resolvedSearchParams.error ? 'text-[#f3b4aa]' : 'text-[#edd1a3]';

  return (
    <SetupsConsole
      carClasses={carClasses.map((carClass) => ({ id: carClass.id, name: carClass.name }))}
      cars={cars.map((car) => ({ id: car.id, name: car.name, carClassId: car.car_class_id }))}
      tracks={tracks}
      filters={resolvedFilters}
      defaultCarClassId={defaultCarClassId}
      setups={setups}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      feedbackMessage={feedbackMessage}
      feedbackTone={feedbackTone}
    />
  );
}
