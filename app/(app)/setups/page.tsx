import { redirect } from 'next/navigation';
import { SetupsConsole } from '@/components/features/setups/setups-console';
import { routes } from '@/lib/constants/routes';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import { getSetupSessionLinkOptions } from '@/services/setup-session-link.service';
import { getSetupPageData } from '@/services/setup.service';
import { getUserTeams } from '@/services/team.service';
import type { Database } from '@/types/database.types';

type SetupsPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    imported?: string;
    error?: string;
    debug?: string;
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
  import_invalid_xml: 'No hemos podido leer el XML. Revisa el fichero e inténtalo de nuevo.',
  import_driver_not_found:
    'No hemos encontrado el piloto seleccionado en el XML. Elige otro nombre del listado.',
  import_no_valid_laps:
    'El XML no tiene ninguna vuelta válida para el piloto seleccionado, así que no se puede importar.',
  import_duplicate_session:
    'Este XML ya estaba importado como sesión. No se puede subir la misma sesión más de una vez.',
  import_failed: 'No hemos podido importar la sesión. Inténtalo de nuevo en unos segundos.',
  team_visibility_requires_active_team:
    'Para guardar un setup de equipo necesitas tener un equipo activo seleccionado.',
  invalid_session_links:
    'No hemos podido asociar una o varias sesiones. Revisa la selección e inténtalo de nuevo.',
};

const SETUPS_PAGE_SIZE = 6;

export default async function SetupsPage({ searchParams }: SetupsPageProps) {
  const [appContext, resolvedSearchParams] = await Promise.all([
    getAuthenticatedAppContext(),
    searchParams,
  ]);

  if (!appContext) {
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
  } = await getSetupPageData(appContext.user.id, filters, {
    page: currentPage,
    pageSize: SETUPS_PAGE_SIZE,
  });
  const [teams, availableSessionLinks] = await Promise.all([
    getUserTeams(appContext.user.id),
    getSetupSessionLinkOptions(appContext.user.id),
  ]);
  const activeTeam = teams.find((team) => team.id === appContext.profile?.activeTeamId) ?? null;

  const feedbackMessage = resolvedSearchParams.created
    ? 'Setup creado correctamente.'
    : resolvedSearchParams.deleted
      ? 'Setup eliminado correctamente de tu biblioteca.'
      : resolvedSearchParams.imported
        ? 'Sesión importada correctamente.'
        : resolvedSearchParams.error
          ? (errorMessages[resolvedSearchParams.error] ?? 'Ha ocurrido un error inesperado.')
          : undefined;
  const feedbackTone = resolvedSearchParams.error ? 'text-[#f3b4aa]' : 'text-[#edd1a3]';
  const debugSuffix = resolvedSearchParams.debug?.trim()
    ? ` Detalle: ${resolvedSearchParams.debug.trim()}`
    : '';
  const feedbackMessageWithDebug =
    feedbackMessage && resolvedSearchParams.error
      ? `${feedbackMessage}${debugSuffix}`
      : feedbackMessage;

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
      feedbackMessage={feedbackMessageWithDebug}
      feedbackTone={feedbackTone}
      preferredDriverName={appContext.preferredDriverName}
      availableSessionLinks={availableSessionLinks}
      activeTeam={
        activeTeam ? { id: activeTeam.id, name: activeTeam.name, slug: activeTeam.slug } : null
      }
    />
  );
}
