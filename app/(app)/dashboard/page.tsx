import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/components/features/dashboard/dashboard-overview';
import { routes } from '@/lib/constants/routes';
import {
  type DashboardMode,
  getDriverOverviewData,
  type DashboardTrendMetric,
  type DashboardTrendRange,
} from '@/services/dashboard.service';
import { getAuthenticatedAppContext } from '@/services/profile.service';

type DashboardPageProps = {
  searchParams: Promise<{
    sourceSessionSetting?: string;
    carClassId?: string;
    carId?: string;
    trackId?: string;
    dateFrom?: string;
    dateTo?: string;
    mode?: string;
    metric?: string;
    range?: string;
  }>;
};

const allowedMetrics = new Set<DashboardTrendMetric>([
  'bestLapMs',
  'averageLapMs',
  'lapConsistencyMs',
  'finishPos',
  'positionGain',
  'validLapRate',
  'incidentsCount',
]);

const allowedRanges = new Set<DashboardTrendRange>(['10', '30', 'all']);
const allowedModes = new Set<DashboardMode>(['global', 'contextual']);

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [appContext, resolvedSearchParams] = await Promise.all([
    getAuthenticatedAppContext(),
    searchParams,
  ]);

  if (!appContext) {
    redirect(routes.login);
  }

  const driverLabel =
    appContext.preferredDriverName ??
    appContext.profile?.nickname?.trim() ??
    appContext.user.email?.trim() ??
    'Piloto';
  const metric = allowedMetrics.has(resolvedSearchParams.metric as DashboardTrendMetric)
    ? (resolvedSearchParams.metric as DashboardTrendMetric)
    : 'bestLapMs';
  const range = allowedRanges.has(resolvedSearchParams.range as DashboardTrendRange)
    ? (resolvedSearchParams.range as DashboardTrendRange)
    : '30';
  const mode = allowedModes.has(resolvedSearchParams.mode as DashboardMode)
    ? (resolvedSearchParams.mode as DashboardMode)
    : 'contextual';
  const data = await getDriverOverviewData(appContext.user.id, driverLabel, {
    sourceSessionSetting: resolvedSearchParams.sourceSessionSetting?.trim() || undefined,
    carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
    carId: resolvedSearchParams.carId?.trim() || undefined,
    trackId: resolvedSearchParams.trackId?.trim() || undefined,
    dateFrom: resolvedSearchParams.dateFrom?.trim() || undefined,
    dateTo: resolvedSearchParams.dateTo?.trim() || undefined,
  });

  return (
    <DashboardOverview
      data={data}
      mode={mode}
      metric={metric}
      range={range}
      basePath={routes.dashboard}
      searchParams={{
        sourceSessionSetting: resolvedSearchParams.sourceSessionSetting?.trim() || undefined,
        carClassId: resolvedSearchParams.carClassId?.trim() || undefined,
        carId: resolvedSearchParams.carId?.trim() || undefined,
        trackId: resolvedSearchParams.trackId?.trim() || undefined,
        dateFrom: resolvedSearchParams.dateFrom?.trim() || undefined,
        dateTo: resolvedSearchParams.dateTo?.trim() || undefined,
        mode,
        metric,
        range,
      }}
    />
  );
}
