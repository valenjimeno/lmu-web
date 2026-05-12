import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

export default function DashboardPage() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-[2rem] border border-border bg-surface-strong/60 p-6 sm:p-8">
        <p className="text-sm font-medium text-accent">Resumen</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          La primera funcionalidad ya gira alrededor de tus setups.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Desde el menú privado puedes entrar en <strong>Setups</strong>, crear configuraciones
          personalizadas y ver tu biblioteca privada. Hemos dejado el shell listo para seguir
          creciendo desde móvil hacia escritorio.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href={routes.setups} asChild>
            Ir a setups
          </Button>
          <Button href={routes.settings} asChild variant="secondary">
            Completar perfil
          </Button>
        </div>
      </article>

      <article className="rounded-[2rem] border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-muted">Siguiente paso</p>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
          <li>Crear setups privados ligados a coche y circuito.</li>
          <li>Navegar cómodamente desde móvil con accesos rápidos arriba.</li>
          <li>Preparar la base para favoritos, edición y setups compartidos por equipo.</li>
        </ul>
      </article>
    </section>
  );
}
