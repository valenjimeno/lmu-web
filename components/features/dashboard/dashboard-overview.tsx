import type {
  DashboardTrendMetric,
  DashboardTrendRange,
  DriverOverviewData,
} from '@/services/dashboard.service';
import { DashboardFilters } from '@/components/features/dashboard/dashboard-filters';
import { CleanlinessPanel } from '@/components/features/dashboard/cleanliness-panel';
import { DashboardInsights } from '@/components/features/dashboard/dashboard-insights';
import { KpiGrid } from '@/components/features/dashboard/kpi-grid';
import { PerformanceTrendChart } from '@/components/features/dashboard/performance-trend-chart';
import { PilotSummaryPanel } from '@/components/features/dashboard/pilot-summary-panel';
import { RecentVsBaseline } from '@/components/features/dashboard/recent-vs-baseline';
import { TrackRankings } from '@/components/features/dashboard/track-rankings';

type DashboardOverviewProps = {
  data: DriverOverviewData;
  metric: DashboardTrendMetric;
  range: DashboardTrendRange;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

export function DashboardOverview({
  data,
  metric,
  range,
  basePath,
  searchParams,
}: DashboardOverviewProps) {
  return (
    <section className="space-y-6">
      <article className="app-hero hero-grid rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8">
          <div>
            <p className="section-kicker font-semibold">Driver Overview</p>
            <h2 className="display-title mt-4 text-[3rem] text-white sm:text-[4.1rem]">
              Tu carrera convertida en señales útiles.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {data.hero.driverLabel} · {data.hero.totalSessions} sesiones dentro del filtro actual.{' '}
              Aquí no sólo ves resultados: ves si el progreso viene por ritmo, por consistencia o
              por mejor ejecución de carrera.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="accent-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                {data.hero.dateRangeLabel}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                Fuente: {data.resolvedFilters.sourceSessionSetting}
              </div>
            </div>
          </div>
        </div>
      </article>

      <PilotSummaryPanel pilotSummary={data.pilotSummary} />
      <DashboardFilters filters={data.resolvedFilters} options={data.filterOptions} />
      <KpiGrid items={data.kpis} />
      <PerformanceTrendChart
        trends={data.trends}
        metric={metric}
        range={range}
        basePath={basePath}
        searchParams={searchParams}
      />
      <RecentVsBaseline data={data.recentVsBaseline} />
      <CleanlinessPanel cleanliness={data.cleanliness} />

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

      <DashboardInsights insights={data.insights} />
    </section>
  );
}
