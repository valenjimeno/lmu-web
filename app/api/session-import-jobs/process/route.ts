import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import {
  drainSessionImportJob,
  recoverSessionImportJob,
} from '@/services/session-import-job.service';

export const maxDuration = 300;

function serializeRouteError(error: unknown) {
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

    return {
      code: typeof candidate.code === 'string' ? candidate.code : null,
      message: typeof candidate.message === 'string' ? candidate.message : 'processing_failed',
      details: typeof candidate.details === 'string' ? candidate.details : null,
      hint: typeof candidate.hint === 'string' ? candidate.hint : null,
    };
  }

  return {
    code: null,
    message: String(error),
    details: null,
    hint: null,
  };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: {
    jobId?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const jobId = String(payload.jobId ?? '').trim();

  if (!jobId) {
    return NextResponse.json({ error: 'missing_job_id' }, { status: 400 });
  }

  try {
    const result = await drainSessionImportJob({
      ownerUserId: user.id,
      jobId,
      chunkSize: 10,
      maxIterations: 25,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('session import job processing failed', {
      jobId,
      ownerUserId: user.id,
      error: serializeRouteError(error),
    });

    try {
      await recoverSessionImportJob({
        ownerUserId: user.id,
        jobId,
      });
    } catch (recoveryError) {
      console.error('session import job recovery failed', {
        jobId,
        ownerUserId: user.id,
        recoveryError,
      });
    }

    const serializedError = serializeRouteError(error);
    const message = typeof serializedError === 'string' ? serializedError : serializedError.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
