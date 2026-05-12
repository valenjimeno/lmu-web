'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="••••••••" />
      </div>
      <Button type="button" className="w-full">
        Conectar Supabase Auth
      </Button>
    </form>
  );
}
