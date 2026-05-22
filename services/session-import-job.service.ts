import { createClient } from '@/lib/supabase/server';
import {
  detectSessionTypeFromXml,
  doesSessionTypeMatchFilter,
  type SessionTypeFilter,
} from '@/lib/utils/session-type';
import {
  deleteSessionImportSource,
  downloadSessionImportSourceXml,
} from '@/services/session-import-storage.service';
import { importSetupSession } from '@/services/setup-session.service';
import type { Database, Json } from '@/types/database.types';

type SessionImportJobRow = Database['public']['Tables']['session_import_jobs']['Row'];
type SessionImportJobInsert = Database['public']['Tables']['session_import_jobs']['Insert'];
type SessionImportJobItemInsert =
  Database['public']['Tables']['session_import_job_items']['Insert'];
type SessionImportJobItemRow = Database['public']['Tables']['session_import_job_items']['Row'];

type CreateSessionImportJobInput = {
  ownerUserId: string;
  sessionTypeFilter: SessionTypeFilter;
  sessions: Array<{
    sessionName: string;
    sourceFileHash: string;
    sourceFileName?: string | null;
    sourceFileSizeBytes?: number | null;
    sourceMimeType?: string | null;
    storageBucket: string;
    storagePath: string;
    driverName: string;
    detectedSessionType?: string | null;
  }>;
};

type ProcessSessionImportJobInput = {
  ownerUserId: string;
  jobId: string;
  chunkSize?: number;
};

type DrainSessionImportJobInput = {
  ownerUserId: string;
  jobId: string;
  chunkSize?: number;
  maxIterations?: number;
};

export type SessionImportJobSummary = {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  sessionTypeFilter: SessionTypeFilter;
  totalCount: number;
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  duplicateCount: number;
  invalidCount: number;
  filteredCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

const sessionImportJobSelect =
  'id, status, session_type_filter, total_count, queued_count, processing_count, completed_count, failed_count, duplicate_count, invalid_count, filtered_count, created_at, started_at, completed_at, notification_status, notification_payload, notified_at';

const invalidImportErrorCodes = new Set([
  'empty_xml',
  'invalid_xml',
  'driver_not_found',
  'missing_storage_source',
]);

const terminalImportErrorCodes = new Set([
  'duplicate_session',
  'empty_xml',
  'invalid_xml',
  'driver_not_found',
  'filtered_session_type',
  'missing_storage_source',
]);

const STALE_SESSION_IMPORT_JOB_THRESHOLD_MS = 15 * 60 * 1000;

function buildNotificationPayload(job: SessionImportJobRow) {
  const title =
    job.status === 'completed'
      ? 'Importacion de sesiones completada'
      : job.status === 'failed'
        ? 'Importacion de sesiones finalizada con errores'
        : 'Importacion de sesiones en progreso';

  return {
    title,
    summary: {
      totalCount: job.total_count,
      completedCount: job.completed_count,
      failedCount: job.failed_count,
      duplicateCount: job.duplicate_count,
      invalidCount: job.invalid_count,
      filteredCount: job.filtered_count,
    },
  } satisfies Json;
}

export function isMissingSessionImportJobsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };

  return (
    candidate.code === 'PGRST205' &&
    typeof candidate.message === 'string' &&
    candidate.message.includes('session_import_jobs')
  );
}

function mapJobRowToSummary(job: SessionImportJobRow): SessionImportJobSummary {
  return {
    id: job.id,
    status: job.status as SessionImportJobSummary['status'],
    sessionTypeFilter: job.session_type_filter as SessionTypeFilter,
    totalCount: job.total_count,
    queuedCount: job.queued_count,
    processingCount: job.processing_count,
    completedCount: job.completed_count,
    failedCount: job.failed_count,
    duplicateCount: job.duplicate_count,
    invalidCount: job.invalid_count,
    filteredCount: job.filtered_count,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  };
}

async function cleanupSessionImportSource(input: {
  storageBucket: string | null;
  storagePath: string | null;
}) {
  if (!input.storageBucket || !input.storagePath) {
    return;
  }

  try {
    await deleteSessionImportSource({
      bucket: input.storageBucket,
      path: input.storagePath,
    });
  } catch (error) {
    console.error('Failed to clean up session import source', {
      bucket: input.storageBucket,
      path: input.storagePath,
      error,
    });
  }
}

async function getSessionImportJobRow(ownerUserId: string, jobId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from('session_import_jobs')
    .select(sessionImportJobSelect)
    .eq('owner_user_id', ownerUserId)
    .eq('id', jobId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return (result.data as SessionImportJobRow | null) ?? null;
}

async function markSessionImportJobAsAbandoned(ownerUserId: string, jobId: string) {
  const supabase = await createClient();
  const processedAt = new Date().toISOString();

  const itemsResult = await supabase
    .from('session_import_job_items')
    .update({
      status: 'failed',
      error_code: 'job_abandoned',
      error_message: 'The import job was marked as abandoned after staying active for too long.',
      processed_at: processedAt,
    })
    .eq('owner_user_id', ownerUserId)
    .eq('job_id', jobId)
    .in('status', ['queued', 'processing']);

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  return refreshSessionImportJobCounters(ownerUserId, jobId);
}

function isSessionImportJobStale(job: SessionImportJobRow) {
  if (job.status !== 'queued' && job.status !== 'processing') {
    return false;
  }

  const activityTimestamp = Date.parse(job.started_at ?? job.created_at);

  if (Number.isNaN(activityTimestamp)) {
    return false;
  }

  return Date.now() - activityTimestamp >= STALE_SESSION_IMPORT_JOB_THRESHOLD_MS;
}

async function refreshSessionImportJobCounters(ownerUserId: string, jobId: string) {
  const supabase = await createClient();
  const [jobResult, itemsResult] = await Promise.all([
    supabase
      .from('session_import_jobs')
      .select(sessionImportJobSelect)
      .eq('owner_user_id', ownerUserId)
      .eq('id', jobId)
      .single(),
    supabase
      .from('session_import_job_items')
      .select('status, error_code')
      .eq('owner_user_id', ownerUserId)
      .eq('job_id', jobId),
  ]);

  if (jobResult.error) {
    throw jobResult.error;
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const job = jobResult.data as SessionImportJobRow;
  const items = (itemsResult.data ?? []) as Array<
    Pick<SessionImportJobItemRow, 'status' | 'error_code'>
  >;

  let queuedCount = 0;
  let processingCount = 0;
  let completedCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;
  let invalidCount = Math.max(job.total_count - items.length, 0);
  let filteredCount = 0;

  for (const item of items) {
    if (item.status === 'queued') {
      queuedCount += 1;
      continue;
    }

    if (item.status === 'processing') {
      processingCount += 1;
      continue;
    }

    if (item.status === 'completed') {
      completedCount += 1;
      continue;
    }

    if (item.error_code === 'duplicate_session') {
      duplicateCount += 1;
      continue;
    }

    if (item.error_code === 'filtered_session_type') {
      filteredCount += 1;
      continue;
    }

    if (item.error_code && invalidImportErrorCodes.has(item.error_code)) {
      invalidCount += 1;
      continue;
    }

    failedCount += 1;
  }

  const isFinished = queuedCount === 0 && processingCount === 0;
  const nextStatus: SessionImportJobRow['status'] =
    isFinished && completedCount === 0 && failedCount > 0
      ? 'failed'
      : isFinished
        ? 'completed'
        : completedCount > 0
          ? 'processing'
          : 'queued';

  const updatedValues: SessionImportJobInsert = {
    owner_user_id: ownerUserId,
    status: nextStatus,
    queued_count: queuedCount,
    processing_count: processingCount,
    completed_count: completedCount,
    failed_count: failedCount,
    duplicate_count: duplicateCount,
    invalid_count: invalidCount,
    filtered_count: filteredCount,
    started_at:
      job.started_at ??
      (nextStatus === 'processing' || isFinished ? new Date().toISOString() : null),
    completed_at: isFinished ? new Date().toISOString() : null,
    notification_status: isFinished ? 'ready' : 'pending',
  };

  const updateResult = await supabase
    .from('session_import_jobs')
    .update(updatedValues)
    .eq('owner_user_id', ownerUserId)
    .eq('id', jobId)
    .select(sessionImportJobSelect)
    .single();

  if (updateResult.error) {
    throw updateResult.error;
  }

  const refreshedJob = updateResult.data as SessionImportJobRow;
  const payloadUpdate = await supabase
    .from('session_import_jobs')
    .update({
      notification_payload: buildNotificationPayload(refreshedJob),
    })
    .eq('owner_user_id', ownerUserId)
    .eq('id', jobId)
    .select(sessionImportJobSelect)
    .single();

  if (payloadUpdate.error) {
    throw payloadUpdate.error;
  }

  return mapJobRowToSummary(payloadUpdate.data as SessionImportJobRow);
}

export async function createSessionImportJob(input: CreateSessionImportJobInput) {
  const normalizedSessions = input.sessions.map((session) => ({
    sessionName: session.sessionName.trim(),
    sourceFileHash: session.sourceFileHash.trim(),
    sourceFileName: session.sourceFileName?.trim() || null,
    sourceFileSizeBytes:
      typeof session.sourceFileSizeBytes === 'number' &&
      Number.isFinite(session.sourceFileSizeBytes)
        ? Math.max(0, Math.round(session.sourceFileSizeBytes))
        : null,
    sourceMimeType: session.sourceMimeType?.trim() || null,
    storageBucket: session.storageBucket.trim(),
    storagePath: session.storagePath.trim(),
    driverName: session.driverName.trim(),
    detectedSessionType: session.detectedSessionType?.trim() || null,
  }));

  const validSessions = normalizedSessions.filter(
    (session) =>
      session.sessionName &&
      session.sourceFileHash &&
      session.storageBucket &&
      session.storagePath &&
      session.driverName,
  );

  if (validSessions.length === 0) {
    throw new Error('empty_import_job');
  }

  const supabase = await createClient();
  const jobInsert: SessionImportJobInsert = {
    owner_user_id: input.ownerUserId,
    status: 'queued',
    session_type_filter: input.sessionTypeFilter,
    total_count: validSessions.length,
    queued_count: validSessions.length,
    processing_count: 0,
    completed_count: 0,
    failed_count: 0,
    duplicate_count: 0,
    invalid_count: 0,
    filtered_count: 0,
    notification_status: 'pending',
    notification_payload: {
      title: 'Importacion de sesiones en cola',
      summary: {
        totalCount: validSessions.length,
      },
    },
  };

  const jobResult = await supabase
    .from('session_import_jobs')
    .insert(jobInsert)
    .select(sessionImportJobSelect)
    .single();

  if (jobResult.error) {
    throw jobResult.error;
  }

  const job = jobResult.data as SessionImportJobRow;
  const itemInserts: SessionImportJobItemInsert[] = validSessions.map((session) => ({
    job_id: job.id,
    owner_user_id: input.ownerUserId,
    status: 'queued',
    session_name: session.sessionName,
    source_file_name: session.sourceFileName,
    source_file_hash: session.sourceFileHash,
    source_file_size_bytes: session.sourceFileSizeBytes,
    source_mime_type: session.sourceMimeType,
    storage_bucket: session.storageBucket,
    storage_path: session.storagePath,
    xml_content: null,
    driver_name: session.driverName,
    detected_session_type: session.detectedSessionType,
  }));

  const itemResult = await supabase.from('session_import_job_items').insert(itemInserts);

  if (itemResult.error) {
    throw itemResult.error;
  }

  return mapJobRowToSummary(job);
}

export async function processSessionImportJob(input: ProcessSessionImportJobInput) {
  const chunkSize = Math.max(1, Math.min(input.chunkSize ?? 4, 10));
  const supabase = await createClient();
  const job = await getSessionImportJobRow(input.ownerUserId, input.jobId);

  if (!job) {
    throw new Error('job_not_found');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return {
      job: mapJobRowToSummary(job),
      processedCount: 0,
      hasMoreWork: false,
    };
  }

  const itemsResult = await supabase
    .from('session_import_job_items')
    .select(
      'id, session_name, source_file_name, source_file_hash, storage_bucket, storage_path, driver_name',
    )
    .eq('owner_user_id', input.ownerUserId)
    .eq('job_id', input.jobId)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(chunkSize);

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const items = itemsResult.data ?? [];

  if (items.length === 0) {
    const refreshedJob = await refreshSessionImportJobCounters(input.ownerUserId, input.jobId);
    return {
      job: refreshedJob,
      processedCount: 0,
      hasMoreWork: false,
    };
  }

  const itemIds = items.map((item) => item.id);
  const now = new Date().toISOString();

  const markProcessingResult = await supabase
    .from('session_import_job_items')
    .update({
      status: 'processing',
    })
    .eq('owner_user_id', input.ownerUserId)
    .eq('job_id', input.jobId)
    .in('id', itemIds);

  if (markProcessingResult.error) {
    throw markProcessingResult.error;
  }

  await supabase
    .from('session_import_jobs')
    .update({
      status: 'processing',
      started_at: job.started_at ?? now,
    })
    .eq('owner_user_id', input.ownerUserId)
    .eq('id', input.jobId);

  for (const item of items) {
    try {
      if (!item.storage_bucket || !item.storage_path) {
        throw new Error('missing_storage_source');
      }

      const xmlContent = await downloadSessionImportSourceXml({
        bucket: item.storage_bucket,
        path: item.storage_path,
      });
      const detectedSessionType = detectSessionTypeFromXml(xmlContent);

      if (
        !doesSessionTypeMatchFilter(
          detectedSessionType,
          job.session_type_filter as SessionTypeFilter,
        )
      ) {
        const filteredResult = await supabase
          .from('session_import_job_items')
          .update({
            status: 'failed',
            error_code: 'filtered_session_type',
            error_message: 'The XML session type does not match the job filter.',
            processed_at: new Date().toISOString(),
          })
          .eq('owner_user_id', input.ownerUserId)
          .eq('job_id', input.jobId)
          .eq('id', item.id);

        if (filteredResult.error) {
          throw filteredResult.error;
        }

        await cleanupSessionImportSource({
          storageBucket: item.storage_bucket,
          storagePath: item.storage_path,
        });

        continue;
      }

      const importResult = await importSetupSession({
        ownerUserId: input.ownerUserId,
        xmlContent,
        driverName: item.driver_name,
        sessionName: item.session_name,
        sourceFileName: item.source_file_name,
      });

      const completeResult = await supabase
        .from('session_import_job_items')
        .update({
          status: 'completed',
          imported_session_id: importResult.sessionId,
          error_code: null,
          error_message: null,
          processed_at: new Date().toISOString(),
        })
        .eq('owner_user_id', input.ownerUserId)
        .eq('job_id', input.jobId)
        .eq('id', item.id);

      if (completeResult.error) {
        throw completeResult.error;
      }

      await cleanupSessionImportSource({
        storageBucket: item.storage_bucket,
        storagePath: item.storage_path,
      });
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'import_failed';
      const errorMessage = error instanceof Error ? error.message : String(error);

      const failedResult = await supabase
        .from('session_import_job_items')
        .update({
          status: 'failed',
          error_code: errorCode,
          error_message: errorMessage.slice(0, 500),
          processed_at: new Date().toISOString(),
        })
        .eq('owner_user_id', input.ownerUserId)
        .eq('job_id', input.jobId)
        .eq('id', item.id);

      if (failedResult.error) {
        throw failedResult.error;
      }

      if (terminalImportErrorCodes.has(errorCode)) {
        await cleanupSessionImportSource({
          storageBucket: item.storage_bucket,
          storagePath: item.storage_path,
        });
      }
    }
  }

  const refreshedJob = await refreshSessionImportJobCounters(input.ownerUserId, input.jobId);

  return {
    job: refreshedJob,
    processedCount: items.length,
    hasMoreWork: refreshedJob.queuedCount > 0,
  };
}

export async function drainSessionImportJob(input: DrainSessionImportJobInput) {
  const maxIterations = Math.max(1, Math.min(input.maxIterations ?? 25, 100));
  let lastResult: {
    job: SessionImportJobSummary;
    processedCount: number;
    hasMoreWork: boolean;
  } | null = null;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    lastResult = await processSessionImportJob({
      ownerUserId: input.ownerUserId,
      jobId: input.jobId,
      chunkSize: input.chunkSize,
    });

    if (!lastResult.hasMoreWork) {
      return lastResult;
    }
  }

  return lastResult;
}

export async function getRecentSessionImportJobs(ownerUserId: string, limit = 6) {
  const supabase = await createClient();
  const result = await supabase
    .from('session_import_jobs')
    .select(sessionImportJobSelect)
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (result.error) {
    if (isMissingSessionImportJobsTableError(result.error)) {
      return [];
    }

    throw result.error;
  }

  const jobs = ((result.data ?? []) as SessionImportJobRow[]).slice();
  const refreshedJobs = await Promise.all(
    jobs.map(async (job) =>
      isSessionImportJobStale(job)
        ? getSessionImportJobRow(ownerUserId, job.id).then(async (currentJob) => {
            if (!currentJob || !isSessionImportJobStale(currentJob)) {
              return currentJob ?? job;
            }

            await markSessionImportJobAsAbandoned(ownerUserId, currentJob.id);
            return (await getSessionImportJobRow(ownerUserId, currentJob.id)) ?? currentJob;
          })
        : job,
    ),
  );

  return refreshedJobs.filter(Boolean).map((job) => mapJobRowToSummary(job as SessionImportJobRow));
}
