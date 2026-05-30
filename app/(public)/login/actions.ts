'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { authRedirectParam, resolvePostLoginRedirect } from '@/lib/supabase/auth';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = resolvePostLoginRedirect(
    String(formData.get(authRedirectParam) ?? '').trim() || null,
  );

  if (!email || !password) {
    redirect(
      `${routes.login}?error=missing_credentials&${authRedirectParam}=${encodeURIComponent(redirectTo)}`,
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `${routes.login}?error=invalid_credentials&${authRedirectParam}=${encodeURIComponent(redirectTo)}`,
    );
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}
