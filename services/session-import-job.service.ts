import { createPerfTrace } from '@/lib/observability/perf';
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

type SessionImportJobCounterDelta = {
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  duplicateCount: number;
  invalidCount: number;
  filteredCount: number;
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
  'id, status, session_type_filter, total_count, queued_count, processing_count, completed_count, failed_count, duplicate_count, invalid_count, filtered_count, created_at, started_at, completed_at, last_activity_at, notification_status, notification_payload, notified_at';

const invalidImportErrorCodes = new Set([
  'empty_xml',
  'invalid_xml',
  'driver_not_found',
  'no_valid_laps',
  'missing_storage_source',
]);

const terminalImportErrorCodes = new Set([
  'duplicate_session',
  'empty_xml',
  'invalid_xml',
  'driver_not_found',
  'no_valid_laps',
  'filtered_session_type',
  'missing_storage_source',
  'retry_exhausted',
]);

const STALE_SESSION_IMPORT_JOB_THRESHOLD_MS = 15 * 60 * 1000;
const MAX_SESSION_IMPORT_ITEM_ATTEMPTS = 3;

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

async function requeueSessionImportJobProcessingItems(ownerUserId: string, jobId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const itemsResult = await supabase
    .from('session_import_job_items')
    .select('id, attempt_count')
    .eq('owner_user_id', ownerUserId)
    .eq('job_id', jobId)
    .eq('status', 'processing');

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const processingItems = (itemsResult.data ?? []) as Array<
    Pick<SessionImportJobItemRow, 'id' | 'attempt_count'>
  >;
  const requeueItemIds = processingItems
    .filter((item) => item.attempt_count < MAX_SESSION_IMPORT_ITEM_ATTEMPTS)
    .map((item) => item.id);
  const exhaustedItemIds = processingItems
    .filter((item) => item.attempt_count >= MAX_SESSION_IMPORT_ITEM_ATTEMPTS)
    .map((item) => item.id);

  if (requeueItemIds.length > 0) {
    const requeueResult = await supabase
      .from('session_import_job_items')
      .update({
        status: 'queued',
        error_code: null,
        error_message: null,
        processed_at: null,
        last_activity_at: now,
      })
      .eq('owner_user_id', ownerUserId)
      .eq('job_id', jobId)
      .in('id', requeueItemIds);

    if (requeueResult.error) {
      throw requeueResult.error;
    }
  }

  if (exhaustedItemIds.length > 0) {
    const exhaustedResult = await supabase
      .from('session_import_job_items')
      .update({
        status: 'failed',
        error_code: 'retry_exhausted',
        error_message: 'The import item exceeded the maximum retry attempts.',
        processed_at: now,
        last_activity_at: now,
      })
      .eq('owner_user_id', ownerUserId)
      .eq('job_id', jobId)
      .in('id', exhaustedItemIds);

    if (exhaustedResult.error) {
      throw exhaustedResult.error;
    }
  }

  const jobResult = await supabase
    .from('session_import_jobs')
    .update({
      status: requeueItemIds.length > 0 ? 'queued' : 'failed',
      last_activity_at: now,
      notification_status: 'pending',
      completed_at: null,
    })
    .eq('owner_user_id', ownerUserId)
    .eq('id', jobId);

  if (jobResult.error) {
    throw jobResult.error;
  }

  return refreshSessionImportJobCounters(ownerUserId, jobId);
}

function isSessionImportJobStale(job: SessionImportJobRow) {
  if (job.status !== 'queued' && job.status !== 'processing') {
    return false;
  }

  const activityTimestamp = Date.parse(job.last_activity_at ?? job.started_at ?? job.created_at);

  if (Number.isNaN(activityTimestamp)) {
    return false;
  }

  return Date.now() - activityTimestamp >= STALE_SESSION_IMPORT_JOB_THRESHOLD_MS;
}

function createEmptySessionImportJobCounterDelta(): SessionImportJobCounterDelta {
  return {
    queuedCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    filteredCount: 0,
  };
}

function applySessionImportJobCounterDelta(
  job: SessionImportJobRow,
  delta: SessionImportJobCounterDelta,
) {
  const queuedCount = Math.max(0, job.queued_count + delta.queuedCount);
  const processingCount = Math.max(0, job.processing_count + delta.processingCount);
  const completedCount = Math.max(0, job.completed_count + delta.completedCount);
  const failedCount = Math.max(0, job.failed_count + delta.failedCount);
  const duplicateCount = Math.max(0, job.duplicate_count + delta.duplicateCount);
  const invalidCount = Math.max(0, job.invalid_count + delta.invalidCount);
  const filteredCount = Math.max(0, job.filtered_count + delta.filteredCount);
  const isFinished = queuedCount === 0 && processingCount === 0;
  const nextStatus: SessionImportJobRow['status'] =
    isFinished && completedCount === 0 && failedCount > 0
      ? 'failed'
      : isFinished
        ? 'completed'
        : completedCount > 0 || processingCount > 0
          ? 'processing'
          : 'queued';
  const startedAt =
    job.started_at ?? (nextStatus === 'processing' || isFinished ? new Date().toISOString() : null);
  const completedAt = isFinished ? new Date().toISOString() : null;

  const updatedJob: SessionImportJobRow = {
    ...job,
    status: nextStatus,
    queued_count: queuedCount,
    processing_count: processingCount,
    completed_count: completedCount,
    failed_count: failedCount,
    duplicate_count: duplicateCount,
    invalid_count: invalidCount,
    filtered_count: filteredCount,
    started_at: startedAt,
    completed_at: completedAt,
    notification_status: isFinished ? 'ready' : 'pending',
  };

  return updatedJob;
}

async function persistSessionImportJobCounters(job: SessionImportJobRow) {
  const supabase = await createClient();
  const updateResult = await supabase
    .from('session_import_jobs')
    .update({
      status: job.status,
      queued_count: job.queued_count,
      processing_count: job.processing_count,
      completed_count: job.completed_count,
      failed_count: job.failed_count,
      duplicate_count: job.duplicate_count,
      invalid_count: job.invalid_count,
      filtered_count: job.filtered_count,
      started_at: job.started_at,
      completed_at: job.completed_at,
      last_activity_at: job.last_activity_at,
      notification_status: job.notification_status,
      notification_payload: buildNotificationPayload(job),
    })
    .eq('owner_user_id', job.owner_user_id)
    .eq('id', job.id)
    .select(sessionImportJobSelect)
    .single();

  if (updateResult.error) {
    throw updateResult.error;
  }

  return updateResult.data as SessionImportJobRow;
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
        : completedCount > 0 || processingCount > 0
          ? 'processing'
          : 'queued';

  const refreshedJob = await persistSessionImportJobCounters({
    ...job,
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
    last_activity_at: new Date().toISOString(),
    notification_status: isFinished ? 'ready' : 'pending',
  });

  return mapJobRowToSummary(refreshedJob);
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
    last_activity_at: new Date().toISOString(),
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
    attempt_count: 0,
    session_name: session.sessionName,
    source_file_name: session.sourceFileName,
    source_file_hash: session.sourceFileHash,
    source_file_size_bytes: session.sourceFileSizeBytes,
    source_mime_type: session.sourceMimeType,
    storage_bucket: session.storageBucket,
    storage_path: session.storagePath,
    last_activity_at: new Date().toISOString(),
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
  const trace = createPerfTrace('processSessionImportJob', {
    ownerUserId: input.ownerUserId,
    jobId: input.jobId,
    chunkSize: input.chunkSize ?? 4,
  });
  const chunkSize = Math.max(1, Math.min(input.chunkSize ?? 4, 10));
  const supabase = await createClient();
  const job = await getSessionImportJobRow(input.ownerUserId, input.jobId);

  if (!job) {
    throw new Error('job_not_found');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    trace.finish({
      skipped: true,
      status: job.status,
      processedCount: 0,
    });
    return {
      job: mapJobRowToSummary(job),
      processedCount: 0,
      hasMoreWork: false,
    };
  }

  const itemsResult = await supabase
    .from('session_import_job_items')
    .select(
      'id, session_name, source_file_name, source_file_hash, storage_bucket, storage_path, driver_name, attempt_count',
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

  trace.log('queued-items-loaded', {
    itemCount: items.length,
    status: job.status,
  });

  if (items.length === 0) {
    const refreshedJob = await refreshSessionImportJobCounters(input.ownerUserId, input.jobId);
    trace.finish({
      processedCount: 0,
      queuedRemaining: refreshedJob.queuedCount,
      status: refreshedJob.status,
      usedReconciliation: true,
    });
    return {
      job: refreshedJob,
      processedCount: 0,
      hasMoreWork: false,
    };
  }

  const itemIds = items.map((item) => item.id);
  const now = new Date().toISOString();
  const counterDelta = createEmptySessionImportJobCounterDelta();

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

  counterDelta.queuedCount -= items.length;
  counterDelta.processingCount += items.length;

  let currentJob = await persistSessionImportJobCounters(
    applySessionImportJobCounterDelta(
      {
        ...job,
        started_at: job.started_at ?? now,
        last_activity_at: now,
      },
      counterDelta,
    ),
  );

  counterDelta.queuedCount = 0;
  counterDelta.processingCount = 0;

  for (const item of items) {
    try {
      const nextAttemptCount = (item.attempt_count ?? 0) + 1;

      if (nextAttemptCount > MAX_SESSION_IMPORT_ITEM_ATTEMPTS) {
        throw new Error('retry_exhausted');
      }

      const claimResult = await supabase
        .from('session_import_job_items')
        .update({
          attempt_count: nextAttemptCount,
          last_activity_at: new Date().toISOString(),
        })
        .eq('owner_user_id', input.ownerUserId)
        .eq('job_id', input.jobId)
        .eq('id', item.id);

      if (claimResult.error) {
        throw claimResult.error;
      }

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
            last_activity_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          })
          .eq('owner_user_id', input.ownerUserId)
          .eq('job_id', input.jobId)
          .eq('id', item.id);

        if (filteredResult.error) {
          throw filteredResult.error;
        }

        counterDelta.processingCount -= 1;
        counterDelta.failedCount += 1;
        counterDelta.filteredCount += 1;

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
          last_activity_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq('owner_user_id', input.ownerUserId)
        .eq('job_id', input.jobId)
        .eq('id', item.id);

      if (completeResult.error) {
        throw completeResult.error;
      }

      counterDelta.processingCount -= 1;
      counterDelta.completedCount += 1;

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
          last_activity_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq('owner_user_id', input.ownerUserId)
        .eq('job_id', input.jobId)
        .eq('id', item.id);

      if (failedResult.error) {
        throw failedResult.error;
      }

      counterDelta.processingCount -= 1;
      counterDelta.failedCount += 1;

      if (errorCode === 'duplicate_session') {
        counterDelta.duplicateCount += 1;
      } else if (errorCode === 'filtered_session_type') {
        counterDelta.filteredCount += 1;
      } else if (invalidImportErrorCodes.has(errorCode)) {
        counterDelta.invalidCount += 1;
      }

      if (terminalImportErrorCodes.has(errorCode)) {
        await cleanupSessionImportSource({
          storageBucket: item.storage_bucket,
          storagePath: item.storage_path,
        });
      }
    }
  }

  currentJob = await persistSessionImportJobCounters(
    applySessionImportJobCounterDelta(currentJob, counterDelta),
  );
  const refreshedJob = mapJobRowToSummary(currentJob);

  trace.finish({
    processedCount: items.length,
    completedDelta: counterDelta.completedCount,
    failedDelta: counterDelta.failedCount,
    duplicateDelta: counterDelta.duplicateCount,
    invalidDelta: counterDelta.invalidCount,
    filteredDelta: counterDelta.filteredCount,
    queuedRemaining: refreshedJob.queuedCount,
    status: refreshedJob.status,
  });

  return {
    job: refreshedJob,
    processedCount: items.length,
    hasMoreWork: refreshedJob.queuedCount > 0,
  };
}

export async function drainSessionImportJob(input: DrainSessionImportJobInput) {
  const trace = createPerfTrace('drainSessionImportJob', {
    ownerUserId: input.ownerUserId,
    jobId: input.jobId,
    chunkSize: input.chunkSize ?? 4,
    maxIterations: input.maxIterations ?? 25,
  });
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
      trace.finish({
        iterations: iteration + 1,
        processedCount: lastResult.processedCount,
        finalStatus: lastResult.job.status,
        queuedRemaining: lastResult.job.queuedCount,
      });
      return lastResult;
    }
  }

  trace.finish({
    iterations: maxIterations,
    processedCount: lastResult?.processedCount ?? 0,
    finalStatus: lastResult?.job.status ?? null,
    queuedRemaining: lastResult?.job.queuedCount ?? null,
    maxIterationsReached: true,
  });

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

            if (currentJob.processing_count > 0) {
              await requeueSessionImportJobProcessingItems(ownerUserId, currentJob.id);
              return (await getSessionImportJobRow(ownerUserId, currentJob.id)) ?? currentJob;
            }

            await markSessionImportJobAsAbandoned(ownerUserId, currentJob.id);
            return (await getSessionImportJobRow(ownerUserId, currentJob.id)) ?? currentJob;
          })
        : job,
    ),
  );

  return refreshedJobs.filter(Boolean).map((job) => mapJobRowToSummary(job as SessionImportJobRow));
}

export async function recoverSessionImportJob(input: { ownerUserId: string; jobId: string }) {
  return requeueSessionImportJobProcessingItems(input.ownerUserId, input.jobId);
}
