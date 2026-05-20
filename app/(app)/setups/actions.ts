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
import { importSetupSession } from '@/services/setup-session.service';
import type { Database } from '@/types/database.types';

const allowedSetupTypes = new Set<Database['public']['Enums']['setup_type']>(['fixed', 'open']);
const allowedVisibilities = new Set<Database['public']['Enums']['setup_visibility']>([
  'private',
  'team',
  'public',
]);
const allowedWeatherSummaries = new Set(['sun', 'sun-cloud', 'rain']);

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

function parseNullablePositiveInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
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

function resolveSafeSetupsReturnTo(value: FormDataEntryValue | null) {
  const returnTo = String(value ?? '').trim();

  if (!returnTo.startsWith(routes.setups)) {
    return routes.setups;
  }

  return returnTo;
}

function serializeImportError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const candidate = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts = [
      typeof candidate.code === 'string' ? candidate.code : null,
      typeof candidate.message === 'string' ? candidate.message : null,
      typeof candidate.details === 'string' ? candidate.details : null,
      typeof candidate.hint === 'string' ? candidate.hint : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(' | ').slice(0, 240);
    }
  }

  return 'unknown_import_error';
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
  const rawVisibility = String(formData.get('visibility') ?? 'private').trim();
  const rawWeatherSummary = String(formData.get('weatherSummary') ?? 'sun').trim();
  const raceDurationMinutes = parseNullablePositiveInteger(formData.get('raceDurationMinutes'));
  const brakeBias = parseNullableNumber(formData.get('brakeBias'));
  const abs = parseNullableNumber(formData.get('abs'));
  const onboardTc = parseNullableNumber(formData.get('onboardTc'));
  const tcPowerCut = parseNullableNumber(formData.get('tcPowerCut'));
  const tcSlipAngle = parseNullableNumber(formData.get('tcSlipAngle'));
  const bestLapMs = parseNullableLapTime(formData.get('bestLap'));

  if (
    !name ||
    !carId ||
    !trackId ||
    !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open') ||
    !allowedVisibilities.has(rawVisibility as Database['public']['Enums']['setup_visibility'])
  ) {
    redirect(`${routes.setups}?error=invalid_setup`);
  }

  if (!allowedWeatherSummaries.has(rawWeatherSummary)) {
    redirect(`${routes.setups}?error=invalid_setup`);
  }

  if (
    raceDurationMinutes === 'invalid' ||
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
      visibility: rawVisibility as Database['public']['Enums']['setup_visibility'],
      notes,
      raceDurationMinutes,
      weatherSummary: rawWeatherSummary,
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
  const rawVisibility = String(formData.get('visibility') ?? 'private').trim();
  const rawWeatherSummary = String(formData.get('weatherSummary') ?? 'sun').trim();
  const raceDurationMinutes = parseNullablePositiveInteger(formData.get('raceDurationMinutes'));
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
    !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open') ||
    !allowedVisibilities.has(rawVisibility as Database['public']['Enums']['setup_visibility']) ||
    !allowedWeatherSummaries.has(rawWeatherSummary)
  ) {
    redirect(`${routes.setups}/${setupId}?error=invalid_setup`);
  }

  if (
    raceDurationMinutes === 'invalid' ||
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
      visibility: rawVisibility as Database['public']['Enums']['setup_visibility'],
      notes,
      raceDurationMinutes,
      weatherSummary: rawWeatherSummary,
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

export async function duplicateSetupAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const name = String(formData.get('name') ?? '').trim();
  const carId = String(formData.get('carId') ?? '').trim();
  const trackId = String(formData.get('trackId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const rawSetupType = String(formData.get('setupType') ?? '').trim();
  const rawVisibility = String(formData.get('visibility') ?? 'private').trim();
  const rawWeatherSummary = String(formData.get('weatherSummary') ?? 'sun').trim();
  const raceDurationMinutes = parseNullablePositiveInteger(formData.get('raceDurationMinutes'));
  const brakeBias = parseNullableNumber(formData.get('brakeBias'));
  const abs = parseNullableNumber(formData.get('abs'));
  const onboardTc = parseNullableNumber(formData.get('onboardTc'));
  const tcPowerCut = parseNullableNumber(formData.get('tcPowerCut'));
  const tcSlipAngle = parseNullableNumber(formData.get('tcSlipAngle'));
  const bestLapMs = parseNullableLapTime(formData.get('bestLap'));
  const sourceSetupId = String(formData.get('sourceSetupId') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? '').trim();

  if (
    !sourceSetupId ||
    !name ||
    !carId ||
    !trackId ||
    !allowedSetupTypes.has(rawSetupType as 'fixed' | 'open') ||
    !allowedVisibilities.has(rawVisibility as Database['public']['Enums']['setup_visibility']) ||
    !allowedWeatherSummaries.has(rawWeatherSummary)
  ) {
    redirect(
      returnTo && returnTo.startsWith(routes.setups)
        ? `${returnTo}?error=invalid_setup`
        : `${routes.setups}?error=invalid_setup`,
    );
  }

  if (
    raceDurationMinutes === 'invalid' ||
    brakeBias === 'invalid' ||
    abs === 'invalid' ||
    onboardTc === 'invalid' ||
    tcPowerCut === 'invalid' ||
    tcSlipAngle === 'invalid' ||
    bestLapMs === 'invalid'
  ) {
    redirect(
      returnTo && returnTo.startsWith(routes.setups)
        ? `${returnTo}?error=invalid_setup_values`
        : `${routes.setups}?error=invalid_setup_values`,
    );
  }

  let duplicatedSetupId = '';

  try {
    duplicatedSetupId = await createSetup({
      ownerUserId: user.id,
      name,
      carId,
      trackId,
      setupType: rawSetupType as Database['public']['Enums']['setup_type'],
      visibility: rawVisibility as Database['public']['Enums']['setup_visibility'],
      notes,
      raceDurationMinutes,
      weatherSummary: rawWeatherSummary,
      brakeBias,
      abs,
      onboardTc,
      tcPowerCut,
      tcSlipAngle,
      bestLapMs,
    });
  } catch {
    redirect(
      returnTo && returnTo.startsWith(routes.setups)
        ? `${returnTo}?error=duplicate_failed`
        : `${routes.setups}?error=duplicate_failed`,
    );
  }

  revalidatePath(routes.setups);
  revalidatePath(`${routes.setups}/${sourceSetupId}`);
  revalidatePath(`${routes.setups}/${duplicatedSetupId}`);
  redirect(
    returnTo && returnTo.startsWith(routes.setups)
      ? `${returnTo}?duplicated=1`
      : `${routes.setups}?duplicated=1`,
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

export async function importSetupSessionAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const setupId = String(formData.get('setupId') ?? '').trim();
  const xmlContent = String(formData.get('xmlContent') ?? '').trim();
  const driverName = String(formData.get('driverName') ?? '').trim();
  const sourceFileName = String(formData.get('sourceFileName') ?? '').trim();
  const returnTo = resolveSafeSetupsReturnTo(formData.get('returnTo'));

  if (!setupId || !xmlContent) {
    redirect(`${returnTo}?error=import_invalid_xml`);
  }

  if (!driverName) {
    redirect(`${returnTo}?error=import_driver_not_found`);
  }

  try {
    await importSetupSession({
      ownerUserId: user.id,
      setupId,
      xmlContent,
      driverName,
      sourceFileName,
    });
  } catch (error) {
    const serializedError = serializeImportError(error);

    console.error('importSetupSessionAction failed', {
      setupId,
      driverName,
      sourceFileName: sourceFileName || null,
      error: serializedError,
    });

    if (error instanceof Error) {
      if (error.message === 'empty_xml' || error.message === 'invalid_xml') {
        redirect(`${returnTo}?error=import_invalid_xml`);
      }

      if (error.message === 'driver_not_found') {
        redirect(`${returnTo}?error=import_driver_not_found`);
      }

      if (error.message === 'duplicate_session') {
        redirect(`${returnTo}?error=import_duplicate_session`);
      }
    }

    redirect(`${returnTo}?error=import_failed&debug=${encodeURIComponent(serializedError)}`);
  }

  revalidatePath(routes.setups);
  revalidatePath(`${routes.setups}/${setupId}`);
  revalidatePath(routes.sessions);
  redirect(`${returnTo}?imported=1`);
}
