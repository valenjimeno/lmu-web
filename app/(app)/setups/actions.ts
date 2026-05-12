'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createSetup } from '@/services/setup.service';
import type { Database } from '@/types/database.types';

const allowedSetupTypes = new Set<Database['public']['Enums']['setup_type']>(['fixed', 'open']);

export async function createSetupAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const name = String(formData.get('name') ?? '').trim();
  const carId = String(formData.get('carId') ?? '').trim();
  const trackId = String(formData.get('trackId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const rawSetupType = String(formData.get('setupType') ?? '').trim();

  if (!name || !carId || !trackId || !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open')) {
    redirect(`${routes.setups}?error=invalid_setup`);
  }

  try {
    await createSetup({
      ownerUserId: user.id,
      name,
      carId,
      trackId,
      setupType: rawSetupType as Database['public']['Enums']['setup_type'],
      notes,
    });
  } catch {
    redirect(`${routes.setups}?error=create_failed`);
  }

  revalidatePath(routes.setups);
  redirect(`${routes.setups}?created=1`);
}
