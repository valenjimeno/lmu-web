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
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full rounded-[2rem] border border-border bg-surface p-8 shadow-[0_24px_80px_rgba(75,59,31,0.08)]">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-accent">Acceso</p>
          <h1 className="text-3xl font-semibold tracking-tight">Inicio de sesión</h1>
          <p className="text-sm leading-7 text-muted">
            Accede con tu email y password de Supabase Auth. Si la sesión ya existe, esta ruta te
            lleva directamente a la zona privada donde empezaremos por el flujo de setups.
          </p>
        </div>
        <LoginForm errorMessage={errorMessage} />
      </div>
    </main>
  );
}
