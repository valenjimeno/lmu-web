import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center py-8 sm:py-12">
      <section className="app-hero overflow-hidden rounded-[2.2rem] p-6 sm:p-8 md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <span className="accent-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
              Premium setup library
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
                Una experiencia web con ADN de app nativa y estética de garage de competición.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                LMU Web evoluciona hacia una biblioteca de setups mobile-first, oscura, rápida y muy
                escaneable, inspirada en el lenguaje visual de ApexSetup en iPhone.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href={routes.login} asChild>
                Entrar al garage
              </Button>
              <Button href={routes.dashboard} asChild variant="secondary">
                Ver preview privada
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="app-shell-card rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-kicker text-xs font-semibold">Cockpit</p>
                  <p className="mt-2 text-xl font-semibold text-white">Shell de producto</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-muted">
                  iPhone-first
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted">
                <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
                  Headers oscuros con acento naranja
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
                  Cards táctiles para setups, filtros y detalle
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
                  Navegación pensada para pulgar y lectura rápida
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Fixed', 'Open', 'Favorite'].map((label) => (
                <div
                  key={label}
                  className="rounded-[1.3rem] border border-white/8 bg-white/5 px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
