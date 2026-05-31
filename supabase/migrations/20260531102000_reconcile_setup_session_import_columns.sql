alter table public.setup_sessions
add column if not exists parc_ferme integer,
add column if not exists fixed_setups boolean,
add column if not exists fixed_upgrades boolean,
add column if not exists tire_warmers boolean,
add column if not exists free_settings integer,
add column if not exists veh_file text,
add column if not exists veh_name text,
add column if not exists category text,
add column if not exists upgrade_code text,
add column if not exists connected boolean,
add column if not exists server_scored boolean,
add column if not exists is_player boolean,
add column if not exists lap_rank_including_discos integer;
