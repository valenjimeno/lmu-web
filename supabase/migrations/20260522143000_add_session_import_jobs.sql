create table public.session_import_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued',
  session_type_filter text not null default 'all',
  total_count integer not null default 0,
  queued_count integer not null default 0,
  processing_count integer not null default 0,
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  duplicate_count integer not null default 0,
  invalid_count integer not null default 0,
  filtered_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  constraint session_import_jobs_status_check check (
    status in ('queued', 'processing', 'completed', 'failed')
  ),
  constraint session_import_jobs_session_type_filter_check check (
    session_type_filter in ('all', 'race', 'qualify', 'practice')
  ),
  constraint session_import_jobs_total_count_non_negative check (total_count >= 0),
  constraint session_import_jobs_queued_count_non_negative check (queued_count >= 0),
  constraint session_import_jobs_processing_count_non_negative check (processing_count >= 0),
  constraint session_import_jobs_completed_count_non_negative check (completed_count >= 0),
  constraint session_import_jobs_failed_count_non_negative check (failed_count >= 0),
  constraint session_import_jobs_duplicate_count_non_negative check (duplicate_count >= 0),
  constraint session_import_jobs_invalid_count_non_negative check (invalid_count >= 0),
  constraint session_import_jobs_filtered_count_non_negative check (filtered_count >= 0)
);

create table public.session_import_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.session_import_jobs (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued',
  session_name text not null,
  source_file_name text,
  source_file_hash text not null,
  xml_content text not null,
  driver_name text not null,
  detected_session_type text,
  imported_session_id uuid references public.setup_sessions (id) on delete set null,
  error_code text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  constraint session_import_job_items_status_check check (
    status in ('queued', 'processing', 'completed', 'failed')
  )
);

create index session_import_jobs_owner_created_idx
on public.session_import_jobs (owner_user_id, created_at desc);

create index session_import_job_items_job_status_idx
on public.session_import_job_items (job_id, status, created_at);

create index session_import_job_items_owner_hash_idx
on public.session_import_job_items (owner_user_id, source_file_hash);

alter table public.session_import_jobs enable row level security;
alter table public.session_import_job_items enable row level security;

alter table public.session_import_jobs force row level security;
alter table public.session_import_job_items force row level security;

create policy "owners can read session import jobs"
on public.session_import_jobs
for select
to authenticated
using (owner_user_id = (select auth.uid()));

create policy "owners can create session import jobs"
on public.session_import_jobs
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

create policy "owners can update session import jobs"
on public.session_import_jobs
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "owners can read session import job items"
on public.session_import_job_items
for select
to authenticated
using (owner_user_id = (select auth.uid()));

create policy "owners can create session import job items"
on public.session_import_job_items
for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.session_import_jobs
    where session_import_jobs.id = session_import_job_items.job_id
      and session_import_jobs.owner_user_id = (select auth.uid())
  )
);

create policy "owners can update session import job items"
on public.session_import_job_items
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));
