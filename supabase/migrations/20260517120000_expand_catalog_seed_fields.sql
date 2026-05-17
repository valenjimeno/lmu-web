alter table public.cars
add column if not exists season text;

alter table public.tracks
add column if not exists city text,
add column if not exists official_name text,
add column if not exists is_dlc boolean not null default false;
