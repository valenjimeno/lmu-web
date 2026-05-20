create table public.setup_sessions (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.setups (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null default 'rfactor_xml',
  source_file_name text,
  source_file_hash text,
  imported_at timestamptz not null default timezone('utc', now()),
  session_datetime timestamptz,
  session_type text,
  server_name text,
  game_version text,
  track_venue text,
  track_course text,
  track_event text,
  track_layout_path text,
  track_length_m numeric(10,2),
  vehicles_allowed text,
  race_time_minutes integer,
  race_laps integer,
  damage_mult numeric(8,3),
  fuel_mult numeric(8,3),
  tire_mult numeric(8,3),
  mech_fail_rate numeric(8,3),
  parc_ferme integer,
  fixed_setups boolean,
  fixed_upgrades boolean,
  tire_warmers boolean,
  free_settings integer,
  driver_name text,
  car_number text,
  team_name text,
  car_class text,
  car_type text,
  veh_file text,
  veh_name text,
  category text,
  upgrade_code text,
  connected boolean,
  server_scored boolean,
  is_player boolean,
  grid_pos integer,
  finish_pos integer,
  class_grid_pos integer,
  class_finish_pos integer,
  lap_rank_including_discos integer,
  laps_completed integer,
  pitstops integer,
  finish_status text,
  dnf_reason text,
  finish_time_seconds numeric(12,4),
  best_lap_seconds numeric(12,4),
  incidents_count integer not null default 0,
  penalties_count integer not null default 0,
  track_limits_count integer not null default 0,
  control_and_aids text,
  control_and_aids_start_lap integer,
  control_and_aids_end_lap integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint setup_sessions_race_time_positive check (
    race_time_minutes is null or race_time_minutes > 0
  ),
  constraint setup_sessions_race_laps_non_negative check (
    race_laps is null or race_laps >= 0
  ),
  constraint setup_sessions_track_length_non_negative check (
    track_length_m is null or track_length_m >= 0
  ),
  constraint setup_sessions_laps_completed_non_negative check (
    laps_completed is null or laps_completed >= 0
  ),
  constraint setup_sessions_pitstops_non_negative check (
    pitstops is null or pitstops >= 0
  ),
  constraint setup_sessions_incidents_count_non_negative check (
    incidents_count >= 0
  ),
  constraint setup_sessions_penalties_count_non_negative check (
    penalties_count >= 0
  ),
  constraint setup_sessions_track_limits_count_non_negative check (
    track_limits_count >= 0
  ),
  constraint setup_sessions_best_lap_positive check (
    best_lap_seconds is null or best_lap_seconds > 0
  )
);

create table public.setup_session_laps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.setup_sessions (id) on delete cascade,
  lap_number integer not null,
  running_position integer,
  elapsed_time_seconds numeric(12,4),
  lap_time_seconds numeric(12,4),
  sector_1_seconds numeric(12,4),
  sector_2_seconds numeric(12,4),
  sector_3_seconds numeric(12,4),
  top_speed_kph numeric(8,2),
  fuel_remaining numeric(10,4),
  fuel_used numeric(10,4),
  virtual_energy_remaining numeric(10,4),
  virtual_energy_used numeric(10,4),
  tire_wear_fl numeric(8,4),
  tire_wear_fr numeric(8,4),
  tire_wear_rl numeric(8,4),
  tire_wear_rr numeric(8,4),
  front_compound text,
  rear_compound text,
  tire_fl_compound text,
  tire_fr_compound text,
  tire_rl_compound text,
  tire_rr_compound text,
  pit_flag boolean not null default false,
  is_valid_lap boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint setup_session_laps_lap_number_positive check (lap_number > 0),
  constraint setup_session_laps_lap_time_positive check (
    lap_time_seconds is null or lap_time_seconds > 0
  )
);

alter table public.setups
add column last_validated_at timestamptz,
add column validation_sessions_count integer not null default 0,
add column best_validated_lap_ms integer,
add column avg_fuel_used_per_lap numeric(10,4),
add column avg_tire_drop_front numeric(10,4),
add column avg_tire_drop_rear numeric(10,4),
add column avg_position_gain numeric(10,4),
add column consistency_score numeric(10,4),
add column confidence_score numeric(10,4);

alter table public.setups
add constraint setups_validation_sessions_count_non_negative check (
  validation_sessions_count >= 0
),
add constraint setups_best_validated_lap_positive check (
  best_validated_lap_ms is null or best_validated_lap_ms > 0
);

create index setup_sessions_setup_id_idx
on public.setup_sessions (setup_id, session_datetime desc nulls last, imported_at desc);

create index setup_sessions_owner_user_id_idx
on public.setup_sessions (owner_user_id, imported_at desc);

create index setup_sessions_track_venue_idx
on public.setup_sessions (track_venue);

create unique index setup_sessions_setup_source_file_hash_unique_idx
on public.setup_sessions (setup_id, source_file_hash)
where source_file_hash is not null;

create index setup_sessions_raw_payload_gin_idx
on public.setup_sessions using gin (raw_payload jsonb_path_ops);

create unique index setup_session_laps_session_lap_unique_idx
on public.setup_session_laps (session_id, lap_number);

create index setup_session_laps_session_idx
on public.setup_session_laps (session_id, lap_number);

create index setup_session_laps_valid_idx
on public.setup_session_laps (session_id, is_valid_lap, lap_time_seconds);

alter table public.setup_sessions enable row level security;
alter table public.setup_session_laps enable row level security;

alter table public.setup_sessions force row level security;
alter table public.setup_session_laps force row level security;

create policy "users can read accessible setup sessions"
on public.setup_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.setups
    where setups.id = setup_sessions.setup_id
      and (
        setups.owner_user_id = (select auth.uid())
        or setups.visibility = 'public'
        or (
          setups.visibility = 'team'
          and setups.team_id is not null
          and (select public.is_team_member(setups.team_id))
        )
      )
  )
);

create policy "owners can create setup sessions"
on public.setup_sessions
for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.setups
    where setups.id = setup_sessions.setup_id
      and setups.owner_user_id = (select auth.uid())
  )
);

create policy "owners can update setup sessions"
on public.setup_sessions
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.setups
    where setups.id = setup_sessions.setup_id
      and setups.owner_user_id = (select auth.uid())
  )
);

create policy "owners can delete setup sessions"
on public.setup_sessions
for delete
to authenticated
using (owner_user_id = (select auth.uid()));

create policy "users can read accessible setup session laps"
on public.setup_session_laps
for select
to authenticated
using (
  exists (
    select 1
    from public.setup_sessions
    join public.setups on setups.id = setup_sessions.setup_id
    where setup_sessions.id = setup_session_laps.session_id
      and (
        setups.owner_user_id = (select auth.uid())
        or setups.visibility = 'public'
        or (
          setups.visibility = 'team'
          and setups.team_id is not null
          and (select public.is_team_member(setups.team_id))
        )
      )
  )
);

create policy "owners can manage setup session laps"
on public.setup_session_laps
for all
to authenticated
using (
  exists (
    select 1
    from public.setup_sessions
    where setup_sessions.id = setup_session_laps.session_id
      and setup_sessions.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.setup_sessions
    where setup_sessions.id = setup_session_laps.session_id
      and setup_sessions.owner_user_id = (select auth.uid())
  )
);
