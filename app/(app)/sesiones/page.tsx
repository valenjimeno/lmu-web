import { redirect } from 'next/navigation';
import { SessionsConsole } from '@/components/features/sessions/sessions-console';
import { routes } from '@/lib/constants/routes';
import { getAuthenticatedAppContext } from '@/services/profile.service';
import { getRecentSessionImportJobs } from '@/services/session-import-job.service';
import { getSessionPageData } from '@/services/session.service';

type SessionsPageProps = {
  searchParams: Promise<{
    imported?: string;
    deleted?: string;
    error?: string;
    debug?: string;
    sourceSessionSetting?: string;
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
  import_no_valid_laps:
    'El XML no tiene ninguna vuelta válida para el piloto seleccionado, así que no se puede importar.',
  import_duplicate_session:
    'Este XML ya estaba importado como sesión. No se puede subir la misma sesión más de una vez.',
  bulk_import_requires_pro:
    'El plan Lite solo permite importar una sesión cada vez. Pásate a Pro para usar importación masiva.',
  import_failed: 'No hemos podido importar la sesión. Inténtalo de nuevo en unos segundos.',
  delete_session_failed: 'No hemos podido borrar la sesión. Inténtalo de nuevo en unos segundos.',
};

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const [appContext, resolvedSearchParams] = await Promise.all([
    getAuthenticatedAppContext(),
    searchParams,
  ]);

  if (!appContext) {
    redirect(routes.login);
  }

  const importJobs = await getRecentSessionImportJobs(appContext.user.id);

  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? '1', 10) || 1);
  const filters = {
    sourceSessionSetting: resolvedSearchParams.sourceSessionSetting?.trim() || undefined,
    carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
  };
  const {
    sessionSettings,
    carClasses,
    cars,
    tracks,
    sessions,
    totalCount,
    page,
    pageSize,
    resolvedFilters,
    defaultCarClassId,
    defaultSourceSessionSetting,
  } = await getSessionPageData(appContext.user.id, filters, {
    page: currentPage,
    pageSize: SESSIONS_PAGE_SIZE,
  });

  const importedCount = Math.max(
    0,
    Number.parseInt(resolvedSearchParams.imported?.trim() ?? '0', 10) || 0,
  );
  const feedbackMessage = resolvedSearchParams.imported
    ? importedCount === 1
      ? 'Sesión importada correctamente.'
      : `${importedCount} sesiones importadas correctamente.`
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
      sessionSettings={sessionSettings}
      carClasses={carClasses.map((carClass) => ({ id: carClass.id, name: carClass.name }))}
      cars={cars.map((car) => ({ id: car.id, name: car.name, carClassId: car.car_class_id }))}
      tracks={tracks}
      filters={resolvedFilters}
      defaultCarClassId={defaultCarClassId}
      defaultSourceSessionSetting={defaultSourceSessionSetting}
      sessions={sessions}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      feedbackMessage={feedbackMessageWithDebug}
      feedbackTone={feedbackTone}
      preferredDriverName={appContext.preferredDriverName}
      importJobs={importJobs}
      canBulkImportSessions={appContext.entitlements.canBulkImportSessions}
      currentPlan={appContext.entitlements.plan}
    />
  );
}
