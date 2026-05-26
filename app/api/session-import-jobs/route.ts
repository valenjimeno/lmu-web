import { after } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SessionTypeFilter } from '@/lib/utils/session-type';
import { getUserEntitlements } from '@/services/entitlement.service';
import {
  createSessionImportJob,
  drainSessionImportJob,
  getRecentSessionImportJobs,
  isMissingSessionImportJobsTableError,
} from '@/services/session-import-job.service';

export const maxDuration = 300;

function resolveSessionTypeFilter(value: unknown): SessionTypeFilter {
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

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const jobs = await getRecentSessionImportJobs(user.id);
  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: {
    sessions?: Array<{
      sessionName?: string;
      sourceFileHash?: string;
      sourceFileName?: string | null;
      sourceFileSizeBytes?: number | null;
      sourceMimeType?: string | null;
      storageBucket?: string;
      storagePath?: string;
      driverName?: string;
      detectedSessionType?: string | null;
    }>;
    sessionTypeFilter?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const entitlements = await getUserEntitlements(user.id);

  if (sessions.length > 1 && !entitlements.canBulkImportSessions) {
    return NextResponse.json({ error: 'bulk_import_requires_pro' }, { status: 403 });
  }

  try {
    const job = await createSessionImportJob({
      ownerUserId: user.id,
      sessionTypeFilter: resolveSessionTypeFilter(payload.sessionTypeFilter),
      sessions: sessions.map((session) => ({
        sessionName: String(session.sessionName ?? ''),
        sourceFileHash: String(session.sourceFileHash ?? ''),
        sourceFileName: session.sourceFileName ? String(session.sourceFileName) : null,
        sourceFileSizeBytes:
          typeof session.sourceFileSizeBytes === 'number' ? session.sourceFileSizeBytes : null,
        sourceMimeType: session.sourceMimeType ? String(session.sourceMimeType) : null,
        storageBucket: String(session.storageBucket ?? ''),
        storagePath: String(session.storagePath ?? ''),
        driverName: String(session.driverName ?? ''),
        detectedSessionType: session.detectedSessionType
          ? String(session.detectedSessionType)
          : null,
      })),
    });

    after(async () => {
      await drainSessionImportJob({
        ownerUserId: user.id,
        jobId: job.id,
        chunkSize: 10,
        maxIterations: 25,
      });
    });

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    if (isMissingSessionImportJobsTableError(error)) {
      return NextResponse.json({ error: 'async_import_unavailable' }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'import_job_failed';
    const status = message === 'empty_import_job' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
