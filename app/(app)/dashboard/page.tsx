import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <article className="app-hero rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="section-kicker text-xs font-semibold">Garage overview</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Tu biblioteca de setups ya tiene una cabina visual mucho más fuerte.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              El flujo principal ya gira alrededor de crear, explorar y abrir setups con jerarquía
              clara, acciones táctiles y una estética de paddock técnico.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href={routes.setups} asChild>
                Abrir setups
              </Button>
              <Button href={routes.settings} asChild variant="secondary">
                Ajustar perfil
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['Mobile-first', 'Acciones y navegación cómodas con el pulgar'],
              ['High contrast', 'Listados rápidos de escanear en cualquier luz'],
              ['Premium depth', 'Cards con sombras suaves y gradiente técnico'],
            ].map(([title, copy]) => (
              <div key={title} className="app-shell-card rounded-[1.4rem] p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="app-shell-card rounded-[1.8rem] p-5 sm:p-6">
          <p className="section-kicker text-xs font-semibold">Próximos bloques</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <li>Crear setups privados ligados a coche, circuito y fabricante.</li>
            <li>Escanear cards sin depender de tablas ni layouts pesados.</li>
            <li>Preparar la base para favoritos, edición y trabajo por equipo.</li>
          </ul>
        </article>

        <article className="app-shell-card rounded-[1.8rem] p-5 sm:p-6">
          <p className="section-kicker text-xs font-semibold">UX direction</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground">
            {['Headers fuertes', 'Chips táctiles', 'Cards profundas', 'CTA naranja'].map((item) => (
              <div
                key={item}
                className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
