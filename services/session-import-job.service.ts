import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import {
  detectSessionTypeFromXml,
  doesSessionTypeMatchFilter,
  type SessionTypeFilter,
} from '@/lib/utils/session-type';
import { importSetupSession } from '@/services/setup-session.service';
import type { Database } from '@/types/database.types';

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
    xmlContent: string;
    sourceFileName?: string | null;
    driverName: string;
  }>;
};

type ProcessSessionImportJobInput = {
  ownerUserId: string;
  jobId: string;
  chunkSize?: number;
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
  'id, status, session_type_filter, total_count, queued_count, processing_count, completed_count, failed_count, duplicate_count, invalid_count, filtered_count, created_at, started_at, completed_at';

const invalidImportErrorCodes = new Set(['empty_xml', 'invalid_xml', 'driver_not_found']);

function computeSourceFileHash(xmlContent: string) {
  return createHash('sha256').update(xmlContent).digest('hex');
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
  const baseInvalidCount = Math.max(job.total_count - items.length - job.filtered_count, 0);

  let queuedCount = 0;
  let processingCount = 0;
  let completedCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;
  let invalidCount = baseInvalidCount;

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

  const updateResult = await supabase
    .from('session_import_jobs')
    .update({
      status: nextStatus,
      queued_count: queuedCount,
      processing_count: processingCount,
      completed_count: completedCount,
      failed_count: failedCount,
      duplicate_count: duplicateCount,
      invalid_count: invalidCount,
      started_at:
        job.started_at ??
        (nextStatus === 'processing' || isFinished ? new Date().toISOString() : null),
      completed_at: isFinished ? new Date().toISOString() : null,
    })
    .eq('owner_user_id', ownerUserId)
    .eq('id', jobId)
    .select(sessionImportJobSelect)
    .single();

  if (updateResult.error) {
    throw updateResult.error;
  }

  return mapJobRowToSummary(updateResult.data as SessionImportJobRow);
}

export async function createSessionImportJob(input: CreateSessionImportJobInput) {
  const normalizedSessions = input.sessions.map((session) => ({
    sessionName: session.sessionName.trim(),
    xmlContent: session.xmlContent.trim(),
    sourceFileName: session.sourceFileName?.trim() || null,
    driverName: session.driverName.trim(),
  }));

  const totalCount = normalizedSessions.length;
  const validSessions = normalizedSessions.filter(
    (session) =>
      session.sessionName &&
      session.xmlContent &&
      session.driverName &&
      doesSessionTypeMatchFilter(
        detectSessionTypeFromXml(session.xmlContent),
        input.sessionTypeFilter,
      ),
  );

  const filteredCount = normalizedSessions.filter(
    (session) =>
      session.xmlContent &&
      session.driverName &&
      session.sessionName &&
      !doesSessionTypeMatchFilter(
        detectSessionTypeFromXml(session.xmlContent),
        input.sessionTypeFilter,
      ),
  ).length;
  const invalidCount = totalCount - validSessions.length - filteredCount;

  if (validSessions.length === 0) {
    throw new Error('empty_import_job');
  }

  const supabase = await createClient();
  const jobInsert: SessionImportJobInsert = {
    owner_user_id: input.ownerUserId,
    status: 'queued',
    session_type_filter: input.sessionTypeFilter,
    total_count: totalCount,
    queued_count: validSessions.length,
    processing_count: 0,
    completed_count: 0,
    failed_count: 0,
    duplicate_count: 0,
    invalid_count: invalidCount,
    filtered_count: filteredCount,
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
    source_file_hash: computeSourceFileHash(session.xmlContent),
    xml_content: session.xmlContent,
    driver_name: session.driverName,
    detected_session_type: detectSessionTypeFromXml(session.xmlContent),
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
    .select('id, session_name, source_file_name, xml_content, driver_name')
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
      const importResult = await importSetupSession({
        ownerUserId: input.ownerUserId,
        xmlContent: item.xml_content,
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
    }
  }

  const refreshedJob = await refreshSessionImportJobCounters(input.ownerUserId, input.jobId);

  return {
    job: refreshedJob,
    processedCount: items.length,
    hasMoreWork: refreshedJob.queuedCount > 0,
  };
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
    throw result.error;
  }

  return ((result.data ?? []) as SessionImportJobRow[]).map(mapJobRowToSummary);
}
