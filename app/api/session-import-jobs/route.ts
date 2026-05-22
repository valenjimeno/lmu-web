import { after } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SessionTypeFilter } from '@/lib/utils/session-type';
import {
  createSessionImportJob,
  getRecentSessionImportJobs,
} from '@/services/session-import-job.service';

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
    const message = error instanceof Error ? error.message : 'import_job_failed';
    const status = message === 'empty_import_job' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
