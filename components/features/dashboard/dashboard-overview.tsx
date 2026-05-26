import type {
  DashboardMode,
  DashboardTrendMetric,
  DashboardTrendRange,
  DriverOverviewData,
} from '@/services/dashboard.service';
import { DashboardCarFitPanel } from '@/components/features/dashboard/dashboard-car-fit-panel';
import { DashboardComparePanel } from '@/components/features/dashboard/dashboard-compare-panel';
import { DashboardDiagnosticsGrid } from '@/components/features/dashboard/dashboard-diagnostics-grid';
import { DashboardExecutiveSummary } from '@/components/features/dashboard/dashboard-executive-summary';
import { DashboardFilters } from '@/components/features/dashboard/dashboard-filters';
import { CleanlinessPanel } from '@/components/features/dashboard/cleanliness-panel';
import { DashboardInsights } from '@/components/features/dashboard/dashboard-insights';
import { DashboardRecommendedActions } from '@/components/features/dashboard/dashboard-recommended-actions';
import { PerformanceTrendChart } from '@/components/features/dashboard/performance-trend-chart';
import { PilotSummaryPanel } from '@/components/features/dashboard/pilot-summary-panel';
import { RecentVsBaseline } from '@/components/features/dashboard/recent-vs-baseline';
import { TrackRankings } from '@/components/features/dashboard/track-rankings';

type DashboardOverviewProps = {
  data: DriverOverviewData;
  mode: DashboardMode;
  metric: DashboardTrendMetric;
  range: DashboardTrendRange;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

export function DashboardOverview({
  data,
  mode,
  metric,
  range,
  basePath,
  searchParams,
}: DashboardOverviewProps) {
  const isGlobalMode = mode === 'global';
  const isContextualMode = mode === 'contextual';
  const isCompareMode = mode === 'compare';
  const filtersKey = [
    mode,
    data.resolvedFilters.sourceSessionSetting,
    data.resolvedFilters.carClassId ?? '',
    data.resolvedFilters.trackId ?? '',
    data.resolvedFilters.carId ?? '',
    data.resolvedFilters.dateFrom ?? '',
    data.resolvedFilters.dateTo ?? '',
  ].join(':');

  return (
    <section className="space-y-6">
      <DashboardFilters
        key={filtersKey}
        filters={data.resolvedFilters}
        options={data.filterOptions}
        summary={data.contextSummary}
        mode={mode}
        basePath={basePath}
        searchParams={searchParams}
      />
      <DashboardExecutiveSummary summary={data.contextSummary} hero={data.hero} items={data.kpis} />

      {isGlobalMode ? (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <TrackRankings
              title="Mejores circuitos"
              kicker="Track Ranking"
              items={data.topTracks}
              minimumSessions={data.rankingThreshold}
            />
            <TrackRankings
              title="Circuitos a vigilar"
              kicker="Review Queue"
              items={data.weakTracks}
              minimumSessions={data.rankingThreshold}
            />
            <TrackRankings
              title="Coches más efectivos"
              kicker="Car Ranking"
              items={data.topCars}
              minimumSessions={data.rankingThreshold}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PerformanceTrendChart
              trends={data.trends}
              metric={metric}
              range={range}
              basePath={basePath}
              searchParams={searchParams}
            />
            <RecentVsBaseline data={data.recentVsBaseline} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PilotSummaryPanel pilotSummary={data.pilotSummary} />
            <DashboardInsights insights={data.insights} />
          </div>
        </>
      ) : null}

      {isContextualMode ? (
        <>
          <DashboardCarFitPanel carFit={data.carFit} />
          <DashboardDiagnosticsGrid diagnostics={data.contextDiagnostics} />
          <div className="grid gap-6 xl:grid-cols-2">
            <PerformanceTrendChart
              trends={data.trends}
              metric={metric}
              range={range}
              basePath={basePath}
              searchParams={searchParams}
            />
            <RecentVsBaseline data={data.recentVsBaseline} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <CleanlinessPanel cleanliness={data.cleanliness} />
            <DashboardInsights insights={data.insights} />
          </div>

          <DashboardRecommendedActions actions={data.recommendedActions} />
        </>
      ) : null}

      {isCompareMode ? (
        <>
          <DashboardComparePanel carFit={data.carFit} />
          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardCarFitPanel carFit={data.carFit} />
            <RecentVsBaseline data={data.recentVsBaseline} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <PerformanceTrendChart
              trends={data.trends}
              metric={metric}
              range={range}
              basePath={basePath}
              searchParams={searchParams}
            />
            <DashboardRecommendedActions actions={data.recommendedActions} />
          </div>
        </>
      ) : null}
    </section>
  );
}
