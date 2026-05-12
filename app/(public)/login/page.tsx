import { LoginForm } from '@/components/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full rounded-[2rem] border border-border bg-surface p-8 shadow-[0_24px_80px_rgba(75,59,31,0.08)]">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-accent">Acceso</p>
          <h1 className="text-3xl font-semibold tracking-tight">Inicio de sesión</h1>
          <p className="text-sm leading-7 text-muted">
            Pantalla placeholder para dejar el flujo público preparado antes de implementar Auth
            real con Supabase.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
