alter table public.profiles
add column full_name text,
add column active_team_id uuid references public.teams (id) on delete set null,
add column preferences jsonb not null default '{}'::jsonb;

create index profiles_active_team_id_idx on public.profiles (active_team_id);

update public.profiles
set
  full_name = coalesce(nullif(trim(display_name), ''), split_part(coalesce(email, ''), '@', 1)),
  preferences = coalesce(preferences, '{}'::jsonb)
where full_name is null
   or preferences is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, full_name, preferences)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    '{}'::jsonb
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;
