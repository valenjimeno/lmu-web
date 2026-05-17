'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import {
  createSetup,
  deleteSetup,
  toggleSetupFavorite,
  updateSetup,
} from '@/services/setup.service';
import type { Database } from '@/types/database.types';

const allowedSetupTypes = new Set<Database['public']['Enums']['setup_type']>(['fixed', 'open']);

function parseNullableNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 'invalid';
  }

  return parsed;
}

function parseNullableLapTime(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(\d+):([0-5]\d):(\d{3})$/);

  if (!match) {
    return 'invalid';
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const milliseconds = Number(match[3]);

  return minutes * 60000 + seconds * 1000 + milliseconds;
}

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
  const brakeBias = parseNullableNumber(formData.get('brakeBias'));
  const abs = parseNullableNumber(formData.get('abs'));
  const onboardTc = parseNullableNumber(formData.get('onboardTc'));
  const tcPowerCut = parseNullableNumber(formData.get('tcPowerCut'));
  const tcSlipAngle = parseNullableNumber(formData.get('tcSlipAngle'));
  const bestLapMs = parseNullableLapTime(formData.get('bestLap'));

  if (!name || !carId || !trackId || !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open')) {
    redirect(`${routes.setups}?error=invalid_setup`);
  }

  if (
    brakeBias === 'invalid' ||
    abs === 'invalid' ||
    onboardTc === 'invalid' ||
    tcPowerCut === 'invalid' ||
    tcSlipAngle === 'invalid' ||
    bestLapMs === 'invalid'
  ) {
    redirect(`${routes.setups}?error=invalid_setup_values`);
  }

  try {
    await createSetup({
      ownerUserId: user.id,
      name,
      carId,
      trackId,
      setupType: rawSetupType as Database['public']['Enums']['setup_type'],
      notes,
      brakeBias,
      abs,
      onboardTc,
      tcPowerCut,
      tcSlipAngle,
      bestLapMs,
    });
  } catch {
    redirect(`${routes.setups}?error=create_failed`);
  }

  revalidatePath(routes.setups);
  redirect(`${routes.setups}?created=1`);
}

export async function updateSetupAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const setupId = String(formData.get('setupId') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const carId = String(formData.get('carId') ?? '').trim();
  const trackId = String(formData.get('trackId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const rawSetupType = String(formData.get('setupType') ?? '').trim();
  const brakeBias = parseNullableNumber(formData.get('brakeBias'));
  const abs = parseNullableNumber(formData.get('abs'));
  const onboardTc = parseNullableNumber(formData.get('onboardTc'));
  const tcPowerCut = parseNullableNumber(formData.get('tcPowerCut'));
  const tcSlipAngle = parseNullableNumber(formData.get('tcSlipAngle'));
  const bestLapMs = parseNullableLapTime(formData.get('bestLap'));

  if (
    !setupId ||
    !name ||
    !carId ||
    !trackId ||
    !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open')
  ) {
    redirect(`${routes.setups}/${setupId}?error=invalid_setup`);
  }

  if (
    brakeBias === 'invalid' ||
    abs === 'invalid' ||
    onboardTc === 'invalid' ||
    tcPowerCut === 'invalid' ||
    tcSlipAngle === 'invalid' ||
    bestLapMs === 'invalid'
  ) {
    redirect(`${routes.setups}/${setupId}?error=invalid_setup_values`);
  }

  try {
    await updateSetup({
      ownerUserId: user.id,
      setupId,
      name,
      carId,
      trackId,
      setupType: rawSetupType as Database['public']['Enums']['setup_type'],
      notes,
      brakeBias,
      abs,
      onboardTc,
      tcPowerCut,
      tcSlipAngle,
      bestLapMs,
    });
  } catch {
    redirect(`${routes.setups}/${setupId}?error=update_failed`);
  }

  revalidatePath(routes.setups);
  revalidatePath(`${routes.setups}/${setupId}`);
  redirect(
    returnTo && returnTo.startsWith(routes.setups)
      ? `${returnTo}?saved=1`
      : `${routes.setups}/${setupId}?saved=1`,
  );
}

export async function deleteSetupAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const setupId = String(formData.get('setupId') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? '').trim();
  const confirmText = String(formData.get('confirmDeleteText') ?? '')
    .trim()
    .toUpperCase();
  const confirmChecked = formData.get('confirmDeleteCheckbox') === 'on';

  if (!setupId || !confirmChecked || confirmText !== 'ELIMINAR') {
    redirect(
      returnTo && returnTo.startsWith(routes.setups)
        ? `${returnTo}?error=delete_confirmation_required`
        : `${routes.setups}/${setupId}?edit=1&error=delete_confirmation_required`,
    );
  }

  try {
    await deleteSetup({
      ownerUserId: user.id,
      setupId,
    });
  } catch {
    redirect(
      returnTo && returnTo.startsWith(routes.setups)
        ? `${returnTo}?error=delete_failed`
        : `${routes.setups}/${setupId}?edit=1&error=delete_failed`,
    );
  }

  revalidatePath(routes.setups);
  redirect(
    returnTo && returnTo.startsWith(routes.setups)
      ? `${returnTo}?deleted=1`
      : `${routes.setups}?deleted=1`,
  );
}

export async function toggleSetupFavoriteAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const setupId = String(formData.get('setupId') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? '').trim();
  const makeFavorite = String(formData.get('makeFavorite') ?? '').trim() === '1';

  if (!setupId) {
    redirect(routes.setups);
  }

  try {
    await toggleSetupFavorite({
      userId: user.id,
      setupId,
      makeFavorite,
    });
  } catch {
    redirect(returnTo && returnTo.startsWith(routes.setups) ? returnTo : routes.setups);
  }

  revalidatePath(routes.setups);
  revalidatePath(`${routes.setups}/${setupId}`);
  redirect(returnTo && returnTo.startsWith(routes.setups) ? returnTo : routes.setups);
}
