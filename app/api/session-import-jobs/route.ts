import { after } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SessionTypeFilter } from '@/lib/utils/session-type';
import {
  createSessionImportJob,
  getRecentSessionImportJobs,
  isMissingSessionImportJobsTableError,
} from '@/services/session-import-job.service';
import { importSetupSessionsBatch } from '@/services/setup-session.service';

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
      xmlContent?: string;
      sourceFileName?: string | null;
      driverName?: string;
    }>;
    sessionTypeFilter?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];

  try {
    const job = await createSessionImportJob({
      ownerUserId: user.id,
      sessionTypeFilter: resolveSessionTypeFilter(payload.sessionTypeFilter),
      sessions: sessions.map((session) => ({
        sessionName: String(session.sessionName ?? ''),
        xmlContent: String(session.xmlContent ?? ''),
        sourceFileName: session.sourceFileName ? String(session.sourceFileName) : null,
        driverName: String(session.driverName ?? ''),
      })),
    });

    const origin = new URL(request.url).origin;
    const cookieHeader = request.headers.get('cookie') ?? '';

    after(async () => {
      await fetch(`${origin}/api/session-import-jobs/process`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: cookieHeader,
        },
        body: JSON.stringify({ jobId: job.id }),
      });
    });

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    if (isMissingSessionImportJobsTableError(error)) {
      try {
        const sessionTypeFilter = resolveSessionTypeFilter(payload.sessionTypeFilter);
        const normalizedSessions = sessions.map((session) => ({
          sessionName: String(session.sessionName ?? '').trim(),
          xmlContent: String(session.xmlContent ?? '').trim(),
          sourceFileName: session.sourceFileName ? String(session.sourceFileName).trim() : null,
          driverName: String(session.driverName ?? '').trim(),
        }));
        const result = await importSetupSessionsBatch({
          ownerUserId: user.id,
          sessionTypeFilter,
          sessions: normalizedSessions.filter(
            (session) => session.sessionName && session.xmlContent && session.driverName,
          ),
        });

        const now = new Date().toISOString();
        return NextResponse.json(
          {
            job: {
              id: `fallback-${now}`,
              status: 'completed',
              sessionTypeFilter,
              totalCount: normalizedSessions.length,
              queuedCount: 0,
              processingCount: 0,
              completedCount: result.importedCount,
              failedCount: 0,
              duplicateCount: 0,
              invalidCount: 0,
              filteredCount: Math.max(normalizedSessions.length - result.importedCount, 0),
              createdAt: now,
              startedAt: now,
              completedAt: now,
            },
            fallbackMode: 'sync',
          },
          { status: 200 },
        );
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message : 'import_job_fallback_failed';
        return NextResponse.json({ error: fallbackMessage }, { status: 500 });
      }
    }

    const message = error instanceof Error ? error.message : 'import_job_failed';
    const status = message === 'empty_import_job' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
