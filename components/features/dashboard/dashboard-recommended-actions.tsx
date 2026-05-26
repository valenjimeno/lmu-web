import type { DriverOverviewData } from '@/services/dashboard.service';

type DashboardRecommendedActionsProps = {
  actions: DriverOverviewData['recommendedActions'];
};

const toneClasses = {
  positive: 'border-[rgba(143,197,164,0.18)] bg-[rgba(143,197,164,0.08)]',
  warning: 'border-[rgba(242,162,148,0.18)] bg-[rgba(242,162,148,0.08)]',
  neutral: 'border-white/8 bg-white/[0.03]',
} as const;

export function DashboardRecommendedActions({ actions }: DashboardRecommendedActionsProps) {
  return (
    <article className="app-shell-card rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-kicker font-semibold">Next Move</p>
          <h3 className="editorial-title mt-3 text-2xl text-white">Qué haría ahora</h3>
        </div>
        <p className="text-sm text-muted">
          Cierra la lectura en decisiones, no solo en observación.
        </p>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-3">
        {actions.map((action) => (
          <article
            key={action.id}
            className={`rounded-[1.4rem] border p-4 ${toneClasses[action.tone]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {action.label}
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{action.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/78">{action.body}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
