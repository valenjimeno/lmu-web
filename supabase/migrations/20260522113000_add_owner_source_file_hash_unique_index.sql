create unique index if not exists setup_sessions_owner_source_file_hash_unique_idx
on public.setup_sessions (owner_user_id, source_file_hash)
where source_file_hash is not null;
