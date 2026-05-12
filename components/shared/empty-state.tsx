type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <section className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-border bg-surface-strong/60 p-8 text-center">
      <div className="max-w-xl space-y-3">
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm leading-7 text-muted">{description}</p>
      </div>
    </section>
  );
}
