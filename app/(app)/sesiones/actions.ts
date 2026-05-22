'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import {
  deleteSetupSession,
  importSetupSession,
  importSetupSessionsBatch,
} from '@/services/setup-session.service';
import type { SessionTypeFilter } from '@/lib/utils/session-type';

function resolveSafeSessionsReturnTo(value: FormDataEntryValue | null) {
  const returnTo = String(value ?? '').trim();

  if (!returnTo.startsWith(routes.sessions)) {
    return routes.sessions;
  }

  return returnTo;
}

export async function deleteSessionAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const sessionId = String(formData.get('sessionId') ?? '').trim();
  const returnTo = resolveSafeSessionsReturnTo(formData.get('returnTo'));

  if (!sessionId) {
    redirect(`${returnTo}?error=delete_session_failed`);
  }

  try {
    const result = await deleteSetupSession({
      ownerUserId: user.id,
      sessionId,
    });

    revalidatePath(routes.sessions);
    revalidatePath(routes.setups);
    if (result.setupId) {
      revalidatePath(`${routes.setups}/${result.setupId}`);
    }
  } catch {
    redirect(`${returnTo}?error=delete_session_failed`);
  }

  redirect(`${returnTo}?deleted=1`);
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

    const payload = {
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      details: typeof candidate.details === 'string' ? candidate.details : undefined,
      hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
    };

    return JSON.stringify(payload);
  }

  return String(error);
}

function resolveSessionTypeFilter(value: FormDataEntryValue | null): SessionTypeFilter {
  const normalizedValue = String(value ?? 'all')
    .trim()
    .toLocaleLowerCase();

  if (
    normalizedValue === 'all' ||
    normalizedValue === 'race' ||
    normalizedValue === 'qualify' ||
    normalizedValue === 'practice'
  ) {
    return normalizedValue;
  }

  return 'all';
}

export async function createSessionAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const sessionsPayload = String(formData.get('sessionsPayload') ?? '').trim();
  const sessionName = String(formData.get('sessionName') ?? '').trim();
  const xmlContent = String(formData.get('xmlContent') ?? '').trim();
  const driverName = String(formData.get('driverName') ?? '').trim();
  const sourceFileName = String(formData.get('sourceFileName') ?? '').trim();
  const returnTo = resolveSafeSessionsReturnTo(formData.get('returnTo'));
  const sessionTypeFilter = resolveSessionTypeFilter(formData.get('sessionTypeFilter'));

  if (sessionsPayload) {
    let parsedSessions: Array<{
      sessionName?: string;
      xmlContent?: string;
      driverName?: string;
      sourceFileName?: string;
    }>;

    try {
      const candidate = JSON.parse(sessionsPayload);
      parsedSessions = Array.isArray(candidate) ? candidate : [];
    } catch {
      redirect(`${returnTo}?error=import_invalid_xml`);
    }

    const normalizedSessions = parsedSessions
      .map((session) => ({
        sessionName: String(session.sessionName ?? '').trim(),
        xmlContent: String(session.xmlContent ?? '').trim(),
        driverName: String(session.driverName ?? '').trim(),
        sourceFileName: String(session.sourceFileName ?? '').trim(),
      }))
      .filter((session) => session.xmlContent && session.sessionName && session.driverName);

    if (normalizedSessions.length === 0) {
      redirect(`${returnTo}?error=import_invalid_xml`);
    }

    try {
      const result = await importSetupSessionsBatch({
        ownerUserId: user.id,
        sessionTypeFilter,
        sessions: normalizedSessions,
      });

      revalidatePath(routes.sessions);
      redirect(`${returnTo}?imported=${result.importedCount}`);
    } catch (error) {
      const serializedError = serializeImportError(error);

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
  }

  if (!sessionName || !xmlContent) {
    redirect(`${returnTo}?error=import_invalid_xml`);
  }

  if (!driverName) {
    redirect(`${returnTo}?error=import_driver_not_found`);
  }

  try {
    await importSetupSession({
      ownerUserId: user.id,
      xmlContent,
      driverName,
      sessionName,
      sourceFileName,
    });
  } catch (error) {
    const serializedError = serializeImportError(error);

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

  revalidatePath(routes.sessions);
  redirect(`${returnTo}?imported=1`);
}
