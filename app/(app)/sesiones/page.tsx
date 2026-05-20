import { redirect } from 'next/navigation';
import { SessionsConsole } from '@/components/features/sessions/sessions-console';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getProfilePageData } from '@/services/profile.service';
import { getImportedSessionHashes, getSessionPageData } from '@/services/session.service';

type SessionsPageProps = {
  searchParams: Promise<{
    imported?: string;
    deleted?: string;
    error?: string;
    debug?: string;
    carClassId?: string;
    carId?: string;
    trackId?: string;
    page?: string;
  }>;
};

const SESSIONS_PAGE_SIZE = 8;

const errorMessages: Record<string, string> = {
  import_invalid_xml: 'No hemos podido leer el XML. Revisa el fichero e inténtalo de nuevo.',
  import_driver_not_found:
    'No hemos encontrado el piloto seleccionado en el XML. Elige otro nombre del listado.',
  import_duplicate_session:
    'Este XML ya estaba importado como sesión. No se puede subir la misma sesión más de una vez.',
  import_failed: 'No hemos podido importar la sesión. Inténtalo de nuevo en unos segundos.',
  delete_session_failed: 'No hemos podido borrar la sesión. Inténtalo de nuevo en unos segundos.',
};

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) {
    redirect(routes.login);
  }

  const [profilePageData, importedSessionHashes] = await Promise.all([
    getProfilePageData(user.id),
    getImportedSessionHashes(user.id),
  ]);
  const splitProfileFullName =
    profilePageData.profile?.firstName?.trim() && profilePageData.profile?.lastName?.trim()
      ? `${profilePageData.profile.firstName.trim()} ${profilePageData.profile.lastName.trim()}`
      : undefined;
  const storedProfileFullName = profilePageData.profile?.fullName?.trim() || undefined;
  const metadataFullName =
    typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()
        ? user.user_metadata.name.trim()
        : undefined;
  const preferredDriverName = splitProfileFullName ?? storedProfileFullName ?? metadataFullName;

  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? '1', 10) || 1);
  const filters = {
    carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
  };
  const {
    carClasses,
    cars,
    tracks,
    sessions,
    totalCount,
    page,
    pageSize,
    resolvedFilters,
    defaultCarClassId,
  } = await getSessionPageData(user.id, filters, {
    page: currentPage,
    pageSize: SESSIONS_PAGE_SIZE,
  });

  const feedbackMessage = resolvedSearchParams.imported
    ? 'Sesión importada correctamente.'
    : resolvedSearchParams.deleted
      ? 'Sesión eliminada correctamente.'
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
    <SessionsConsole
      carClasses={carClasses.map((carClass) => ({ id: carClass.id, name: carClass.name }))}
      cars={cars.map((car) => ({ id: car.id, name: car.name, carClassId: car.car_class_id }))}
      tracks={tracks}
      filters={resolvedFilters}
      defaultCarClassId={defaultCarClassId}
      sessions={sessions}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      feedbackMessage={feedbackMessageWithDebug}
      feedbackTone={feedbackTone}
      importedSessionHashes={importedSessionHashes}
      preferredDriverName={preferredDriverName}
    />
  );
}
