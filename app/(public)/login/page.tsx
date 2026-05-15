import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/features/auth/login-form';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_credentials: 'Las credenciales no son correctas.',
  missing_credentials: 'Necesitamos email y password para iniciar sesión.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(routes.setups);
  }

  const errorMessage = resolvedSearchParams.error
    ? (errorMessages[resolvedSearchParams.error] ?? 'No hemos podido iniciar la sesión.')
    : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center py-8">
      <div className="app-shell-card w-full rounded-[2rem] p-8 sm:p-9">
        <div className="mb-8 space-y-3">
          <p className="section-kicker text-xs font-semibold">Acceso privado</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Inicia sesión</h1>
          <p className="text-sm leading-7 text-muted">
            Entra a tu garage personal para crear, filtrar y revisar setups con una experiencia
            optimizada primero para móvil.
          </p>
        </div>
        <div className="mb-6 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffbc7e]">
            Apex-inspired flow
          </p>
          <p className="mt-2 text-sm text-muted">
            Pantallas oscuras, bloques claros y acciones primarias muy visibles para sentirse como
            una app nativa moderna.
          </p>
        </div>
        <LoginForm errorMessage={errorMessage} />
      </div>
    </main>
  );
}
