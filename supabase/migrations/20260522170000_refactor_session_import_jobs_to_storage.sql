insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'session-imports',
  'session-imports',
  false,
  10485760,
  array['application/xml', 'text/xml', 'application/octet-stream']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners can read session import files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'session-imports'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "owners can upload session import files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'session-imports'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "owners can delete session import files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'session-imports'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

alter table public.session_import_jobs
add column if not exists notification_status text not null default 'pending',
add column if not exists notification_payload jsonb not null default '{}'::jsonb,
add column if not exists notified_at timestamptz,
add constraint session_import_jobs_notification_status_check check (
  notification_status in ('pending', 'ready', 'delivered', 'failed')
);

alter table public.session_import_job_items
add column if not exists storage_bucket text not null default 'session-imports',
add column if not exists storage_path text,
add column if not exists source_file_size_bytes bigint,
add column if not exists source_mime_type text;

alter table public.session_import_job_items
alter column xml_content drop not null;

create index if not exists session_import_job_items_owner_status_idx
on public.session_import_job_items (owner_user_id, status, created_at);
