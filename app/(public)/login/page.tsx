import { Suspense } from 'react';
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

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(routes.setups);
  }

  const errorMessage = resolvedSearchParams.error
    ? (errorMessages[resolvedSearchParams.error] ?? 'No hemos podido iniciar la sesión.')
    : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center py-8">
      <section className="panel-dark w-full max-w-xl rounded-[1.9rem] p-8 sm:p-10">
        <div className="space-y-3">
          <div className="logo-stack text-[1.5rem] text-white">
            <div>LMU</div>
            <div className="text-[1rem]">WEB</div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1b27a]">
            Acceso privado
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Inicia sesión
          </h1>
        </div>

        <div className="mt-8 rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-5 sm:p-6">
          <LoginForm errorMessage={errorMessage} />
        </div>
      </section>
    </main>
  );
}

function LoginPageSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center py-8">
      <section className="panel-dark w-full max-w-xl rounded-[1.9rem] p-8 sm:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-24 rounded bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/10" />
          <div className="h-12 w-56 rounded bg-white/10" />
        </div>

        <div className="mt-8 rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-5 sm:p-6">
          <div className="space-y-4">
            <div className="h-11 rounded-[0.95rem] bg-white/10" />
            <div className="h-11 rounded-[0.95rem] bg-white/10" />
            <div className="h-11 rounded-[0.95rem] bg-white/10" />
          </div>
        </div>
      </section>
    </main>
  );
}
