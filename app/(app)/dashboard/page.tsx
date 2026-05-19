import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

const modules = [
  ['Setup library', 'Listados con una estructura más operativa y menos genérica.'],
  ['Insight panels', 'Métricas y contexto en una columna lateral bien separada.'],
  ['Responsive shell', 'Rail, barra superior y contenido principal con mejor escala.'],
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <article className="app-hero rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="section-kicker font-semibold">Overview</p>
            <h2 className="display-title mt-4 text-[3.4rem] text-white sm:text-[4.4rem]">
              Dark product architecture for setups.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              El rediseño parte de una idea simple: dejar de tratar la app como una colección de
              bloques aislados y construir un workspace con zonas reconocibles y mejor lectura.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href={routes.setups} asChild>
                Ir a setups
              </Button>
              <Button href={routes.profile} asChild variant="secondary">
                Abrir perfil
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {modules.map(([title, copy]) => (
              <article
                key={title}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4"
              >
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="app-shell-card rounded-[2rem] p-6">
          <p className="section-kicker font-semibold">Principio</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            La estructura manda sobre el decorado
          </h3>
          <p className="mt-4 text-sm leading-7 text-muted">
            Landing, login y shell privado comparten un lenguaje nuevo: títulos más expresivos,
            paneles oscuros con tensión visual, rail lateral y una columna de contenido mucho más
            definida.
          </p>
        </article>

        <article className="app-shell-card rounded-[2rem] p-6">
          <p className="section-kicker font-semibold">Outcome</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {['Rail lateral', 'Control bar', 'Insight panel', 'Hybrid rows'].map((item) => (
              <div
                key={item}
                className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4 text-sm font-semibold text-white"
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
