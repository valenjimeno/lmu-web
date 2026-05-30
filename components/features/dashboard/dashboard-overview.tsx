import type {
  DashboardMode,
  DashboardTrendMetric,
  DashboardTrendRange,
  DriverOverviewData,
} from '@/services/dashboard.service';
import { DashboardCarFitPanel } from '@/components/features/dashboard/dashboard-car-fit-panel';
import { DashboardDiagnosticsGrid } from '@/components/features/dashboard/dashboard-diagnostics-grid';
import { DashboardExecutiveSummary } from '@/components/features/dashboard/dashboard-executive-summary';
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
  mode: DashboardMode;
  metric: DashboardTrendMetric;
  range: DashboardTrendRange;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

function DashboardSection({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 px-1 sm:px-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="section-kicker font-semibold">{kicker}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

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
          <DashboardSection
            kicker="Snapshot"
            title="Lectura rapida del piloto"
            description="Primero una foto compacta del rendimiento general para detectar rápido si el problema es velocidad, consistencia o conversión en carrera."
          >
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <PilotSummaryPanel pilotSummary={data.pilotSummary} />
              <DashboardInsights insights={data.insights} />
            </div>
            <KpiGrid items={data.kpis} />
          </DashboardSection>

          <DashboardSection
            kicker="Momentum"
            title="Tendencia y comparativa reciente"
            description="Aquí importa si la curva mejora de verdad y si las últimas sesiones están por encima o por debajo de tu base habitual."
          >
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
          </DashboardSection>

          <DashboardSection
            kicker="Prioridades"
            title="Donde insistir y donde proteger"
            description="La vista ejecutiva termina en prioridades claras: qué circuitos ya rentan, cuáles te están drenando y qué coches están funcionando mejor."
          >
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
                title="Coches mas efectivos"
                kicker="Car Ranking"
                items={data.topCars}
                minimumSessions={data.rankingThreshold}
              />
            </div>
          </DashboardSection>
        </>
      ) : null}

      {isContextualMode ? (
        <>
          <DashboardSection
            kicker="Fit"
            title="Que coche encaja mejor aqui"
            description="Antes de tocar setup, conviene validar si el combo base acompana. Esta capa te dice qué coche encaja mejor en este contexto y por qué."
          >
            <DashboardCarFitPanel carFit={data.carFit} />
          </DashboardSection>

          <DashboardSection
            kicker="Diagnostico"
            title="Que te frena exactamente"
            description="Desglosa el contexto en ritmo, stint, ejecucion y limpieza para separar si el margen está en el coche, en la vuelta o en la carrera."
          >
            <DashboardDiagnosticsGrid diagnostics={data.contextDiagnostics} />
          </DashboardSection>

          <DashboardSection
            kicker="Validacion"
            title="Senal reciente del contexto"
            description="Despues del diagnostico, mira si el combo viene mejorando y si tus ultimas sesiones estan realmente moviendo la aguja."
          >
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
          </DashboardSection>

          <DashboardSection
            kicker="Riesgo"
            title="Coste de empujar mas"
            description="La lectura final contrasta estabilidad y errores para que la mejora no sea solo una vuelta buena, sino algo repetible."
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <CleanlinessPanel cleanliness={data.cleanliness} />
              <DashboardInsights insights={data.insights} />
            </div>
          </DashboardSection>
        </>
      ) : null}
    </section>
  );
}
