import { cn } from '@/lib/utils/cn';

type SetupBadgeProps = {
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'success';
  className?: string;
};

type SetupEmblemProps = {
  label: string;
  value: string;
  className?: string;
};

type SetupMetricCardProps = {
  label: string;
  value: string;
  className?: string;
};

type SetupMetricPillProps = {
  label: string;
  value: string;
  className?: string;
};

export function SetupBadge({ children, tone = 'default', className }: SetupBadgeProps) {
  const tones = {
    default: 'border-white/10 bg-white/[0.04] text-[#c3cad4]',
    accent: 'border-[rgba(215,170,109,0.2)] bg-[rgba(215,170,109,0.11)] text-[#f1d19d]',
    success: 'border-[rgba(138,199,161,0.22)] bg-[rgba(138,199,161,0.12)] text-[#ccead5]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SetupEmblem({ label, value, className }: SetupEmblemProps) {
  return (
    <div
      className={cn(
        'rounded-[1.35rem] border border-white/8 bg-white/[0.035] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SetupMetricCard({ label, value, className }: SetupMetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.35rem] border border-white/8 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  );
}

export function SetupMetricPill({ label, value, className }: SetupMetricPillProps) {
  return (
    <div
      className={cn(
        'rounded-[1.1rem] border border-white/8 bg-white/[0.035] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function getBrandMark(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('');
}
