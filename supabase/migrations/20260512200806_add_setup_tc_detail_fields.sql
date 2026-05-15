alter table public.setups
add column tc_power_cut integer,
add column tc_slip_angle integer;

alter table public.setups
add constraint setups_tc_power_cut_non_negative check (
  tc_power_cut is null or tc_power_cut >= 0
),
add constraint setups_tc_slip_angle_non_negative check (
  tc_slip_angle is null or tc_slip_angle >= 0
);
