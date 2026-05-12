import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
      <section className="grid gap-10 rounded-[2rem] border border-border bg-surface/90 p-10 shadow-[0_24px_80px_rgba(75,59,31,0.08)] backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-14">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-4 py-1 text-sm font-medium text-accent">
            Infraestructura base lista para evolucionar la app iOS a web
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
              Next.js, Supabase y Vercel con una base mantenible desde el día uno.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted md:text-lg">
              Esta home es solo un placeholder técnico. La app de negocio empezará sobre una
              arquitectura preparada para SSR, Auth, Storage y despliegues por entorno.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={routes.login} asChild>
              Entrar
            </Button>
            <Button href={routes.dashboard} asChild variant="secondary">
              Ver shell privada
            </Button>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-border bg-surface-strong p-6">
          <div>
            <p className="text-sm font-medium text-muted">Capas definidas</p>
            <p className="mt-2 text-lg font-semibold">UI, hooks, services y Supabase SSR</p>
          </div>
          <ul className="space-y-3 text-sm text-muted">
            <li>App Router con route groups para separar zona pública y autenticada.</li>
            <li>Clientes de Supabase aislados para browser, server y proxy.</li>
            <li>Pipeline local y CI listos para evitar regresiones tempranas.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
