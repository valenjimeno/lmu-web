alter table public.setup_sessions
add column if not exists source_session_setting text;

update public.setup_sessions
set source_session_setting = coalesce(
  source_session_setting,
  nullif(raw_payload ->> 'sourceSessionSetting', '')
)
where source_session_setting is null;

create index if not exists setup_sessions_source_session_setting_idx
on public.setup_sessions (source_session_setting);
