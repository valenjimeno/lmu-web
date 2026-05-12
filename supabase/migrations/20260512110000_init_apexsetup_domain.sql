create extension if not exists pgcrypto;

create type public.setup_visibility as enum ('private', 'team');
create type public.setup_type as enum ('fixed', 'open');
create type public.team_role as enum ('owner', 'member');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint manufacturers_slug_lowercase check (slug = lower(slug))
);

create table public.car_classes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint car_classes_slug_lowercase check (slug = lower(slug))
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete restrict,
  car_class_id uuid not null references public.car_classes (id) on delete restrict,
  slug text not null unique,
  name text not null unique,
  game_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cars_slug_lowercase check (slug = lower(slug))
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  country_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tracks_slug_lowercase check (slug = lower(slug)),
  constraint tracks_country_code_format check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  )
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint teams_slug_lowercase check (slug = lower(slug))
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, user_id)
);

create table public.setups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  visibility public.setup_visibility not null default 'private',
  car_id uuid not null references public.cars (id) on delete restrict,
  track_id uuid not null references public.tracks (id) on delete restrict,
  name text not null,
  setup_type public.setup_type not null,
  race_duration_minutes integer,
  best_lap_ms integer,
  weather_summary text,
  notes text,
  fuel_data jsonb not null default '{}'::jsonb,
  brake_bias numeric(5,2),
  abs integer,
  tc integer,
  search_document tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(notes, '') || ' ' || coalesce(weather_summary, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint setups_race_duration_positive check (
    race_duration_minutes is null or race_duration_minutes > 0
  ),
  constraint setups_best_lap_positive check (
    best_lap_ms is null or best_lap_ms > 0
  ),
  constraint setups_abs_non_negative check (abs is null or abs >= 0),
  constraint setups_tc_non_negative check (tc is null or tc >= 0),
  constraint setups_visibility_requires_team check (
    (visibility = 'private' and team_id is null)
    or (visibility = 'team' and team_id is not null)
  )
);

create table public.setup_favorites (
  setup_id uuid not null references public.setups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (setup_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (team_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = target_team_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_team_owner(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = target_team_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_manufacturers_updated_at
before update on public.manufacturers
for each row
execute function public.set_updated_at();

create trigger set_car_classes_updated_at
before update on public.car_classes
for each row
execute function public.set_updated_at();

create trigger set_cars_updated_at
before update on public.cars
for each row
execute function public.set_updated_at();

create trigger set_tracks_updated_at
before update on public.tracks
for each row
execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger set_team_members_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

create trigger set_setups_updated_at
before update on public.setups
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create trigger on_team_created
after insert on public.teams
for each row
execute function public.handle_new_team();

create index cars_manufacturer_id_idx on public.cars (manufacturer_id);
create index cars_car_class_id_idx on public.cars (car_class_id);
create index team_members_user_id_idx on public.team_members (user_id);
create index teams_created_by_idx on public.teams (created_by);
create index setups_owner_user_id_idx on public.setups (owner_user_id);
create index setups_team_id_idx on public.setups (team_id);
create index setups_car_id_idx on public.setups (car_id);
create index setups_track_id_idx on public.setups (track_id);
create index setups_visibility_idx on public.setups (visibility);
create index setups_owner_updated_at_idx on public.setups (owner_user_id, updated_at desc);
create index setups_team_updated_at_idx on public.setups (team_id, updated_at desc)
where visibility = 'team';
create index setups_search_document_idx on public.setups using gin (search_document);
create index setups_fuel_data_gin_idx on public.setups using gin (fuel_data jsonb_path_ops);
create index setup_favorites_user_id_idx on public.setup_favorites (user_id);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.setups enable row level security;
alter table public.setup_favorites enable row level security;

alter table public.profiles force row level security;
alter table public.teams force row level security;
alter table public.team_members force row level security;
alter table public.setups force row level security;
alter table public.setup_favorites force row level security;

create policy "profiles are viewable by owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles are updatable by owner"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "authenticated users can read manufacturers"
on public.manufacturers
for select
to authenticated
using (true);

create policy "authenticated users can read car classes"
on public.car_classes
for select
to authenticated
using (true);

create policy "authenticated users can read cars"
on public.cars
for select
to authenticated
using (true);

create policy "authenticated users can read tracks"
on public.tracks
for select
to authenticated
using (true);

alter table public.manufacturers enable row level security;
alter table public.car_classes enable row level security;
alter table public.cars enable row level security;
alter table public.tracks enable row level security;

alter table public.manufacturers force row level security;
alter table public.car_classes force row level security;
alter table public.cars force row level security;
alter table public.tracks force row level security;

create policy "users can read teams they belong to"
on public.teams
for select
to authenticated
using ((select public.is_team_member(id)));

create policy "authenticated users can create teams"
on public.teams
for insert
to authenticated
with check ((select auth.uid()) = created_by);

create policy "team owners can update teams"
on public.teams
for update
to authenticated
using ((select public.is_team_owner(id)))
with check ((select public.is_team_owner(id)));

create policy "members can read team memberships"
on public.team_members
for select
to authenticated
using ((select public.is_team_member(team_id)));

create policy "team owners can manage memberships"
on public.team_members
for all
to authenticated
using ((select public.is_team_owner(team_id)))
with check ((select public.is_team_owner(team_id)));

create policy "users can read accessible setups"
on public.setups
for select
to authenticated
using (
  (select auth.uid()) = owner_user_id
  or (
    visibility = 'team'
    and team_id is not null
    and (select public.is_team_member(team_id))
  )
);

create policy "owners can create setups"
on public.setups
for insert
to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and (
    team_id is null
    or (select public.is_team_member(team_id))
  )
);

create policy "owners can update setups"
on public.setups
for update
to authenticated
using ((select auth.uid()) = owner_user_id)
with check (
  (select auth.uid()) = owner_user_id
  and (
    team_id is null
    or (select public.is_team_member(team_id))
  )
);

create policy "owners can delete setups"
on public.setups
for delete
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy "users can read their own favorites"
on public.setup_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can manage their own favorites"
on public.setup_favorites
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.setups
    where setups.id = setup_favorites.setup_id
      and (
        setups.owner_user_id = (select auth.uid())
        or (
          setups.visibility = 'team'
          and setups.team_id is not null
          and (select public.is_team_member(setups.team_id))
        )
      )
  )
);
