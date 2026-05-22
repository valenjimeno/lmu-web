import { after } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { processSessionImportJob } from '@/services/session-import-job.service';

export const maxDuration = 60;

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
    const result = await processSessionImportJob({
      ownerUserId: user.id,
      jobId,
    });

    if (result.hasMoreWork) {
      const origin = new URL(request.url).origin;
      const cookieHeader = request.headers.get('cookie') ?? '';

      after(async () => {
        await fetch(`${origin}/api/session-import-jobs/process`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: cookieHeader,
          },
          body: JSON.stringify({ jobId }),
        });
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'processing_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
