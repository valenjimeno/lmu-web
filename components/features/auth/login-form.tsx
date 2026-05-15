import { login } from '@/app/(public)/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginFormProps = {
  errorMessage?: string;
};

export function LoginForm({ errorMessage }: LoginFormProps) {
  return (
    <form action={login} className="space-y-4">
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
        <p className="rounded-[1.3rem] border border-[#ff6b5733] bg-[#ff6b5712] px-4 py-3 text-sm text-[#ffb7aa]">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" className="w-full">
        Iniciar sesión
      </Button>
    </form>
  );
}
