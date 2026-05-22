import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { drainSessionImportJob } from '@/services/session-import-job.service';

export const maxDuration = 300;

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
    const message = error instanceof Error ? error.message : 'processing_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
