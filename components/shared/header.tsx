export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-5">
      <div>
        <p className="text-sm font-medium text-muted">LMU Web</p>
        <h1 className="text-lg font-semibold tracking-tight">Workspace privado</h1>
      </div>
      <div className="rounded-full border border-border bg-surface-strong px-4 py-2 text-sm text-muted">
        Supabase SSR Ready
      </div>
    </header>
  );
}
