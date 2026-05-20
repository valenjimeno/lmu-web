export default function LoadingSessionDetail() {
  return (
    <section className="space-y-6">
      <div className="panel-dark rounded-[1.75rem] p-5 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="h-10 w-2/3 rounded bg-white/10" />
          <div className="h-5 w-1/2 rounded bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="h-16 rounded-[1rem] bg-white/10" />
            <div className="h-16 rounded-[1rem] bg-white/10" />
            <div className="h-16 rounded-[1rem] bg-white/10" />
            <div className="h-16 rounded-[1rem] bg-white/10" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
        <div className="space-y-6">
          <div className="panel-dark h-72 animate-pulse rounded-[1.6rem] bg-white/[0.04]" />
          <div className="panel-dark h-80 animate-pulse rounded-[1.6rem] bg-white/[0.04]" />
        </div>
        <aside className="panel-dark h-96 animate-pulse rounded-[1.6rem] bg-white/[0.04]" />
      </div>
    </section>
  );
}
