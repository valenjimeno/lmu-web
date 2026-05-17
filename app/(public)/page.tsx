import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants/routes';

const features = [
  ['Tu biblioteca privada', 'Cada coche, circuito y variante en un único lugar.'],
  ['Datos con contexto', 'Métricas, notas y telemetría relacionadas.'],
  ['Filtros potentes', 'Encuentra el setup perfecto en segundos.'],
  ['Diseñado para pilotos', 'Rápido, preciso y hecho para rendir.'],
];

export default function MarketingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[96rem] flex-col gap-3 py-3 sm:gap-4 sm:py-4">
      <section className="app-shell-card overflow-hidden rounded-[1.8rem]">
        <div className="relative min-h-[38rem] px-4 py-4 sm:px-6 lg:min-h-[31rem] lg:px-8 lg:py-6">
          <Image
            src="/images/garage-hero-dark.png"
            alt="Coche de competición oscuro"
            fill
            priority
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,7,0.96)_0%,rgba(4,5,7,0.86)_36%,rgba(4,5,7,0.48)_66%,rgba(4,5,7,0.34)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_22%)]" />

          <div className="relative z-10 flex min-h-[34rem] flex-col">
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-black/28 px-4 py-3 backdrop-blur-sm">
              <div className="logo-stack text-[1.9rem] text-white">
                <div>LMU</div>
                <div className="text-[1.35rem]">WEB</div>
              </div>

              <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
                {['Características', 'Precio', 'Blog', 'Contacto'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-white/80 md:inline">Iniciar sesión</span>
                <Button href={routes.login} asChild className="min-h-11 rounded-md px-5">
                  Acceder al garage
                </Button>
              </div>
            </header>

            <div className="flex flex-1 items-center">
              <div className="max-w-3xl px-2 py-10 sm:px-4 lg:px-8">
                <p className="section-kicker font-semibold">Plataforma privada</p>
                <h1 className="display-title mt-4 max-w-4xl text-[4rem] text-white sm:text-[5.2rem] lg:text-[6.6rem]">
                  Setups que te hacen más rápido.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/70">
                  LMU Web es tu biblioteca privada de configuraciones, notas y datos. Ordena.
                  Analiza. Mejora. Todo en un solo lugar.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button href={routes.login} asChild className="min-h-12 rounded-none px-6">
                    Acceder al garage
                  </Button>
                  <Button
                    href={routes.setups}
                    asChild
                    variant="secondary"
                    className="min-h-12 rounded-none border-white/12 bg-black/22 px-6 text-white hover:bg-white/[0.06]"
                  >
                    Ver características
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-auto grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[1fr_1fr_1fr_1fr_1.2fr]">
              {features.map(([title, copy]) => (
                <div key={title} className="flex gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full border border-[rgba(225,178,122,0.6)]" />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/55">{copy}</p>
                  </div>
                </div>
              ))}

              <div className="border-t border-[rgba(225,178,122,0.4)] pt-2 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="section-kicker font-semibold">Hecho para</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Pilotos y equipos que buscan ventaja en cada detalle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
