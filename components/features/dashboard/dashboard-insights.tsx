import type { DashboardInsight } from '@/services/dashboard.service';

type DashboardInsightsProps = {
  insights: DashboardInsight[];
};

const tones = {
  positive: 'border-[rgba(143,197,164,0.18)] bg-[rgba(143,197,164,0.08)] text-[#d4eadb]',
  warning: 'border-[rgba(242,162,148,0.18)] bg-[rgba(242,162,148,0.08)] text-[#f3c1b8]',
  neutral: 'border-white/8 bg-white/[0.03] text-white/82',
} as const;

export function DashboardInsights({ insights }: DashboardInsightsProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker font-semibold">Insights</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Lectura rápida del momento</h3>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Reglas automáticas</p>
      </div>

      <div className="mt-6 grid gap-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={`rounded-[1.4rem] border p-4 ${tones[insight.tone]}`}
          >
            <p className="text-sm font-semibold text-white">{insight.title}</p>
            <p className="mt-2 text-sm leading-6">{insight.body}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
