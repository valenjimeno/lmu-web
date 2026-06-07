import { login } from '@/app/(public)/login/actions';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

type LoginFormProps = {
  errorMessage?: string;
  redirectTo?: string;
  redirectToFieldName?: string;
};

export function LoginForm({
  errorMessage,
  redirectTo,
  redirectToFieldName = 'redirectTo',
}: LoginFormProps) {
  return (
    <form action={login} className="space-y-4">
      <input type="hidden" name={redirectToFieldName} value={redirectTo} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      {errorMessage ? (
        <p className="rounded-[1.3rem] border border-[rgba(244,154,141,0.22)] bg-[rgba(244,154,141,0.08)] px-4 py-3 text-sm text-[#f3b4aa]">
          {errorMessage}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Iniciando sesión..." className="w-full">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
