alter table public.setup_sessions
add column if not exists average_virtual_energy_used_per_lap numeric(10,4),
add column if not exists virtual_energy_min_per_lap numeric(10,4),
add column if not exists virtual_energy_max_per_lap numeric(10,4),
add column if not exists virtual_energy_start numeric(10,4),
add column if not exists virtual_energy_end numeric(10,4),
add column if not exists projected_virtual_energy_20_minutes numeric(10,4),
add column if not exists projected_virtual_energy_30_minutes numeric(10,4),
add column if not exists projected_virtual_energy_45_minutes numeric(10,4);
