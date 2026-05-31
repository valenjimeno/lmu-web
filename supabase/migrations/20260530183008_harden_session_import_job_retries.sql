alter table public.session_import_jobs
add column if not exists last_activity_at timestamptz not null default timezone('utc', now());

alter table public.session_import_job_items
add column if not exists attempt_count integer not null default 0,
add column if not exists last_activity_at timestamptz not null default timezone('utc', now()),
add constraint session_import_job_items_attempt_count_non_negative check (attempt_count >= 0);

create index if not exists session_import_job_items_job_status_activity_idx
on public.session_import_job_items (job_id, status, last_activity_at);
