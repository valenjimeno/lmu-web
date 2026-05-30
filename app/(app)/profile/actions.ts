'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

function normalizeNullableText(value: FormDataEntryValue | null, maxLength: number) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function resolveSafeReturnTo(value: FormDataEntryValue | null) {
  const returnTo = String(value ?? '').trim();

  if (!returnTo.startsWith('/')) {
    return routes.setups;
  }

  if (returnTo.startsWith(routes.login)) {
    return routes.setups;
  }

  return returnTo;
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const supabase = await createClient();
  const nickname = normalizeNullableText(formData.get('nickname'), 80);
  const firstName = normalizeNullableText(formData.get('firstName'), 80);
  const lastName = normalizeNullableText(formData.get('lastName'), 120);

  if (!firstName || !lastName || !nickname) {
    redirect(`${routes.profile}?error=missing_required_fields`);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: nickname,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
    })
    .eq('id', user.id);

  if (error) {
    throw error;
  }

  revalidatePath(routes.profile);
  revalidatePath(routes.setups);
  revalidatePath('/', 'layout');
  redirect(`${routes.profile}?success=profile_updated`);
}

export async function completeRequiredProfileAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const supabase = await createClient();
  const nickname = normalizeNullableText(formData.get('nickname'), 80);
  const firstName = normalizeNullableText(formData.get('firstName'), 80);
  const lastName = normalizeNullableText(formData.get('lastName'), 120);
  const returnTo = resolveSafeReturnTo(formData.get('returnTo'));

  if (!firstName || !lastName || !nickname) {
    redirect(returnTo);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: nickname,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
    })
    .eq('id', user.id);

  if (error) {
    throw error;
  }

  revalidatePath('/', 'layout');
  revalidatePath(routes.profile);
  revalidatePath(routes.setups);
  redirect(returnTo);
}
