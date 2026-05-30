with timed_laps as (
  select
    laps.session_id,
    laps.lap_number,
    laps.lap_time_seconds,
    row_number() over (
      partition by laps.session_id
      order by laps.lap_number
    ) as timed_lap_index
  from public.setup_session_laps as laps
  where laps.lap_time_seconds is not null
),
pace_metrics as (
  select
    timed_laps.session_id,
    round(avg(timed_laps.lap_time_seconds * 1000))::integer as average_lap_ms
  from timed_laps
  where timed_laps.timed_lap_index > 1
  group by timed_laps.session_id
),
valid_laps as (
  select
    laps.session_id,
    laps.lap_number,
    laps.lap_time_seconds,
    laps.fuel_used,
    laps.virtual_energy_remaining,
    laps.virtual_energy_used,
    laps.tire_wear_fl,
    laps.tire_wear_fr,
    laps.tire_wear_rl,
    laps.tire_wear_rr,
    laps.front_compound,
    laps.rear_compound,
    row_number() over (
      partition by laps.session_id
      order by laps.lap_number
    ) as valid_lap_index
  from public.setup_session_laps as laps
  where laps.is_valid_lap = true
    and laps.pit_flag = false
    and laps.lap_time_seconds is not null
),
valid_lap_rate_metrics as (
  select
    laps.session_id,
    round(
      (
        (count(*) filter (where laps.is_valid_lap = true))::numeric /
        nullif(count(*), 0)::numeric
      ),
      4
    ) as valid_lap_rate
  from public.setup_session_laps as laps
  where laps.pit_flag = false
    and laps.lap_time_seconds is not null
  group by laps.session_id
),
valid_aggregates as (
  select
    valid_laps.session_id,
    count(*)::integer as valid_lap_count,
    case
      when count(*) >= 2 then round(stddev_pop(valid_laps.lap_time_seconds * 1000)::numeric, 2)
      else null
    end as lap_consistency_ms,
    round(
      (
        avg(valid_laps.fuel_used) filter (
          where valid_laps.fuel_used is not null and valid_laps.fuel_used > 0
        )
      )::numeric,
      4
    ) as average_fuel_used_per_lap,
    round(
      (
        min(valid_laps.fuel_used) filter (
          where valid_laps.fuel_used is not null and valid_laps.fuel_used > 0
        )
      )::numeric,
      4
    ) as fuel_min_per_lap,
    round(
      (
        max(valid_laps.fuel_used) filter (
          where valid_laps.fuel_used is not null and valid_laps.fuel_used > 0
        )
      )::numeric,
      4
    ) as fuel_max_per_lap,
    round(
      (
        avg(valid_laps.virtual_energy_used) filter (
          where valid_laps.virtual_energy_used is not null and valid_laps.virtual_energy_used > 0
        )
      )::numeric,
      4
    ) as average_virtual_energy_used_per_lap,
    round(
      (
        min(valid_laps.virtual_energy_used) filter (
          where valid_laps.virtual_energy_used is not null and valid_laps.virtual_energy_used > 0
        )
      )::numeric,
      4
    ) as virtual_energy_min_per_lap,
    round(
      (
        max(valid_laps.virtual_energy_used) filter (
          where valid_laps.virtual_energy_used is not null and valid_laps.virtual_energy_used > 0
        )
      )::numeric,
      4
    ) as virtual_energy_max_per_lap
  from valid_laps
  group by valid_laps.session_id
),
best_three_metrics as (
  select
    windows.session_id,
    round(min(windows.window_avg_ms))::integer as best_three_lap_average_ms
  from (
    select
      valid_laps.session_id,
      valid_laps.valid_lap_index,
      avg(valid_laps.lap_time_seconds * 1000) over (
        partition by valid_laps.session_id
        order by valid_laps.valid_lap_index
        rows between current row and 2 following
      ) as window_avg_ms,
      count(*) over (
        partition by valid_laps.session_id
        order by valid_laps.valid_lap_index
        rows between current row and 2 following
      ) as window_size
    from valid_laps
  ) as windows
  where windows.window_size = 3
  group by windows.session_id
),
last_three_metrics as (
  select distinct on (windows.session_id)
    windows.session_id,
    round(windows.window_avg_ms)::integer as last_three_lap_average_ms
  from (
    select
      valid_laps.session_id,
      valid_laps.valid_lap_index,
      avg(valid_laps.lap_time_seconds * 1000) over (
        partition by valid_laps.session_id
        order by valid_laps.valid_lap_index
        rows between current row and 2 following
      ) as window_avg_ms,
      count(*) over (
        partition by valid_laps.session_id
        order by valid_laps.valid_lap_index
        rows between current row and 2 following
      ) as window_size
    from valid_laps
  ) as windows
  where windows.window_size = 3
  order by windows.session_id, windows.valid_lap_index desc
),
opening_three_metrics as (
  select
    valid_laps.session_id,
    case
      when count(*) >= 4 then round(
        avg(valid_laps.lap_time_seconds * 1000) filter (
          where valid_laps.valid_lap_index between 2 and 4
        )
      )::integer
      when count(*) >= 3 then round(
        avg(valid_laps.lap_time_seconds * 1000) filter (
          where valid_laps.valid_lap_index between 1 and 3
        )
      )::integer
      else null
    end as first_three_lap_average_ms
  from valid_laps
  group by valid_laps.session_id
),
all_lap_aggregates as (
  select
    laps.session_id,
    round(max(laps.top_speed_kph)::numeric, 2) as peak_top_speed_kph,
    case
      when min(laps.sector_1_seconds) filter (where laps.sector_1_seconds is not null and laps.sector_1_seconds > 0) is not null
        and min(laps.sector_2_seconds) filter (where laps.sector_2_seconds is not null and laps.sector_2_seconds > 0) is not null
        and min(laps.sector_3_seconds) filter (where laps.sector_3_seconds is not null and laps.sector_3_seconds > 0) is not null
      then round(
        (
          min(laps.sector_1_seconds) filter (where laps.sector_1_seconds is not null and laps.sector_1_seconds > 0) +
          min(laps.sector_2_seconds) filter (where laps.sector_2_seconds is not null and laps.sector_2_seconds > 0) +
          min(laps.sector_3_seconds) filter (where laps.sector_3_seconds is not null and laps.sector_3_seconds > 0)
        ) * 1000
      )::integer
      else null
    end as optimal_lap_ms
  from public.setup_session_laps as laps
  group by laps.session_id
),
wear_lap_bounds as (
  select
    valid_laps.session_id,
    min(valid_laps.valid_lap_index) as first_valid_lap_index,
    max(valid_laps.valid_lap_index) as last_valid_lap_index
  from valid_laps
  group by valid_laps.session_id
),
wear_metrics as (
  select
    bounds.session_id,
    case
      when first_lap.tire_wear_fl is not null and first_lap.tire_wear_fr is not null
        and last_lap.tire_wear_fl is not null and last_lap.tire_wear_fr is not null
      then round(
        (
          ((first_lap.tire_wear_fl + first_lap.tire_wear_fr) / 2.0) -
          ((last_lap.tire_wear_fl + last_lap.tire_wear_fr) / 2.0)
        )::numeric,
        4
      )
      else null
    end as tire_drop_front,
    case
      when first_lap.tire_wear_rl is not null and first_lap.tire_wear_rr is not null
        and last_lap.tire_wear_rl is not null and last_lap.tire_wear_rr is not null
      then round(
        (
          ((first_lap.tire_wear_rl + first_lap.tire_wear_rr) / 2.0) -
          ((last_lap.tire_wear_rl + last_lap.tire_wear_rr) / 2.0)
        )::numeric,
        4
      )
      else null
    end as tire_drop_rear,
    case
      when bounds.last_valid_lap_index - bounds.first_valid_lap_index > 0
        and first_lap.tire_wear_fl is not null and first_lap.tire_wear_fr is not null
        and last_lap.tire_wear_fl is not null and last_lap.tire_wear_fr is not null
      then round(
        (
          ((first_lap.tire_wear_fl + first_lap.tire_wear_fr) / 2.0) -
          ((last_lap.tire_wear_fl + last_lap.tire_wear_fr) / 2.0)
        )::numeric / (bounds.last_valid_lap_index - bounds.first_valid_lap_index),
        4
      )
      else null
    end as tire_drop_front_per_lap,
    case
      when bounds.last_valid_lap_index - bounds.first_valid_lap_index > 0
        and first_lap.tire_wear_rl is not null and first_lap.tire_wear_rr is not null
        and last_lap.tire_wear_rl is not null and last_lap.tire_wear_rr is not null
      then round(
        (
          ((first_lap.tire_wear_rl + first_lap.tire_wear_rr) / 2.0) -
          ((last_lap.tire_wear_rl + last_lap.tire_wear_rr) / 2.0)
        )::numeric / (bounds.last_valid_lap_index - bounds.first_valid_lap_index),
        4
      )
      else null
    end as tire_drop_rear_per_lap,
    case
      when first_lap.tire_wear_fl is not null and first_lap.tire_wear_fr is not null
        and last_lap.tire_wear_fl is not null and last_lap.tire_wear_fr is not null
        and first_lap.tire_wear_rl is not null and first_lap.tire_wear_rr is not null
        and last_lap.tire_wear_rl is not null and last_lap.tire_wear_rr is not null
        and (
          ((first_lap.tire_wear_rl + first_lap.tire_wear_rr) / 2.0) -
          ((last_lap.tire_wear_rl + last_lap.tire_wear_rr) / 2.0)
        ) > 0
      then round(
        (
          (
            ((first_lap.tire_wear_fl + first_lap.tire_wear_fr) / 2.0) -
            ((last_lap.tire_wear_fl + last_lap.tire_wear_fr) / 2.0)
          ) /
          (
            ((first_lap.tire_wear_rl + first_lap.tire_wear_rr) / 2.0) -
            ((last_lap.tire_wear_rl + last_lap.tire_wear_rr) / 2.0)
          )
        )::numeric,
        4
      )
      else null
    end as front_rear_wear_ratio,
    case
      when first_lap.tire_wear_fl is not null and first_lap.tire_wear_rl is not null
        and last_lap.tire_wear_fl is not null and last_lap.tire_wear_rl is not null
        and first_lap.tire_wear_fr is not null and first_lap.tire_wear_rr is not null
        and last_lap.tire_wear_fr is not null and last_lap.tire_wear_rr is not null
        and (
          (
            (first_lap.tire_wear_fl - last_lap.tire_wear_fl) +
            (first_lap.tire_wear_rl - last_lap.tire_wear_rl)
          ) / 2.0
        ) > 0
      then round(
        (
          (
            (
              (first_lap.tire_wear_fr - last_lap.tire_wear_fr) +
              (first_lap.tire_wear_rr - last_lap.tire_wear_rr)
            ) / 2.0
          ) /
          (
            (
              (first_lap.tire_wear_fl - last_lap.tire_wear_fl) +
              (first_lap.tire_wear_rl - last_lap.tire_wear_rl)
            ) / 2.0
          )
        )::numeric,
        4
      )
      else null
    end as left_right_wear_ratio
  from wear_lap_bounds as bounds
  join valid_laps as first_lap
    on first_lap.session_id = bounds.session_id
   and first_lap.valid_lap_index = bounds.first_valid_lap_index
  join valid_laps as last_lap
    on last_lap.session_id = bounds.session_id
   and last_lap.valid_lap_index = bounds.last_valid_lap_index
),
compound_metrics as (
  select distinct on (valid_laps.session_id)
    valid_laps.session_id,
    valid_laps.front_compound,
    valid_laps.rear_compound
  from valid_laps
  order by valid_laps.session_id, valid_laps.valid_lap_index
),
virtual_energy_bounds as (
  select distinct on (lap_values.session_id)
    lap_values.session_id,
    case
      when lap_values.virtual_energy_remaining is not null and lap_values.virtual_energy_used is not null
      then round((lap_values.virtual_energy_remaining + lap_values.virtual_energy_used)::numeric, 4)
      else lap_values.virtual_energy_remaining
    end as virtual_energy_start
  from public.setup_session_laps as lap_values
  where lap_values.virtual_energy_remaining is not null
     or lap_values.virtual_energy_used is not null
  order by lap_values.session_id, lap_values.lap_number
),
virtual_energy_end_metrics as (
  select distinct on (lap_values.session_id)
    lap_values.session_id,
    lap_values.virtual_energy_remaining as virtual_energy_end
  from public.setup_session_laps as lap_values
  where lap_values.virtual_energy_remaining is not null
  order by lap_values.session_id, lap_values.lap_number desc
),
derived_metrics as (
  select
    sessions.id as session_id,
    pace_metrics.average_lap_ms,
    all_lap_aggregates.optimal_lap_ms,
    valid_aggregates.lap_consistency_ms,
    best_three_metrics.best_three_lap_average_ms,
    last_three_metrics.last_three_lap_average_ms,
    case
      when opening_three_metrics.first_three_lap_average_ms is not null
        and last_three_metrics.last_three_lap_average_ms is not null
      then last_three_metrics.last_three_lap_average_ms - opening_three_metrics.first_three_lap_average_ms
      else null
    end as pace_fade_ms,
    coalesce(valid_aggregates.valid_lap_count, 0) as valid_lap_count,
    valid_lap_rate_metrics.valid_lap_rate,
    valid_aggregates.average_fuel_used_per_lap,
    valid_aggregates.average_virtual_energy_used_per_lap,
    valid_aggregates.fuel_min_per_lap,
    valid_aggregates.fuel_max_per_lap,
    valid_aggregates.virtual_energy_min_per_lap,
    valid_aggregates.virtual_energy_max_per_lap,
    virtual_energy_bounds.virtual_energy_start,
    virtual_energy_end_metrics.virtual_energy_end,
    case
      when valid_aggregates.average_fuel_used_per_lap is not null
        and valid_aggregates.average_fuel_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_fuel_used_per_lap *
          ((20 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_fuel_20_minutes,
    case
      when valid_aggregates.average_fuel_used_per_lap is not null
        and valid_aggregates.average_fuel_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_fuel_used_per_lap *
          ((30 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_fuel_30_minutes,
    case
      when valid_aggregates.average_fuel_used_per_lap is not null
        and valid_aggregates.average_fuel_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_fuel_used_per_lap *
          ((45 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_fuel_45_minutes,
    case
      when valid_aggregates.average_virtual_energy_used_per_lap is not null
        and valid_aggregates.average_virtual_energy_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_virtual_energy_used_per_lap *
          ((20 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_virtual_energy_20_minutes,
    case
      when valid_aggregates.average_virtual_energy_used_per_lap is not null
        and valid_aggregates.average_virtual_energy_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_virtual_energy_used_per_lap *
          ((30 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_virtual_energy_30_minutes,
    case
      when valid_aggregates.average_virtual_energy_used_per_lap is not null
        and valid_aggregates.average_virtual_energy_used_per_lap > 0
        and pace_metrics.average_lap_ms is not null
        and pace_metrics.average_lap_ms > 0
      then round(
        (
          valid_aggregates.average_virtual_energy_used_per_lap *
          ((45 * 60 * 1000)::numeric / pace_metrics.average_lap_ms::numeric)
        ),
        4
      )
      else null
    end as projected_virtual_energy_45_minutes,
    all_lap_aggregates.peak_top_speed_kph,
    wear_metrics.tire_drop_front,
    wear_metrics.tire_drop_rear,
    wear_metrics.tire_drop_front_per_lap,
    wear_metrics.tire_drop_rear_per_lap,
    wear_metrics.front_rear_wear_ratio,
    wear_metrics.left_right_wear_ratio,
    compound_metrics.front_compound,
    compound_metrics.rear_compound,
    (
      (
        array[]::text[] ||
        case
          when sessions.grid_pos is not null and sessions.finish_pos is not null and (sessions.grid_pos - sessions.finish_pos) > 0
          then array[
            format(
              'Buena ejecución de carrera: ganó %s posiciones%s.',
              sessions.grid_pos - sessions.finish_pos,
              case
                when sessions.finish_pos is not null then format(' y acabó P%s', sessions.finish_pos)
                else ''
              end
            )
          ]
          else array[]::text[]
        end ||
        case
          when valid_lap_rate_metrics.valid_lap_rate >= 0.9
          then array['Stint limpio: casi todas las vueltas cronometradas fueron válidas.']
          when valid_lap_rate_metrics.valid_lap_rate < 0.75
          then array['Hubo bastantes vueltas no válidas o de transición; hay margen de limpieza.']
          else array[]::text[]
        end ||
        case
          when opening_three_metrics.first_three_lap_average_ms is not null
            and last_three_metrics.last_three_lap_average_ms is not null
            and (last_three_metrics.last_three_lap_average_ms - opening_three_metrics.first_three_lap_average_ms) > 1500
          then array['El ritmo cae al final del stint; el coche sufre más con desgaste o combustible.']
          when opening_three_metrics.first_three_lap_average_ms is not null
            and last_three_metrics.last_three_lap_average_ms is not null
            and (last_three_metrics.last_three_lap_average_ms - opening_three_metrics.first_three_lap_average_ms) < -500
          then array['El stint va a mejor con el paso de las vueltas; el coche crece cuando baja peso.']
          when opening_three_metrics.first_three_lap_average_ms is not null
            and last_three_metrics.last_three_lap_average_ms is not null
          then array['Ritmo bastante estable entre el inicio y el final del stint.']
          else array[]::text[]
        end ||
        case
          when wear_metrics.front_rear_wear_ratio > 1.12
          then array['La degradación se concentra en el eje delantero.']
          when wear_metrics.front_rear_wear_ratio < 0.9
          then array['La degradación se concentra más en el eje trasero.']
          else array[]::text[]
        end ||
        case
          when wear_metrics.left_right_wear_ratio > 1.08
          then array['El lado derecho trabaja más que el izquierdo en este stint.']
          when wear_metrics.left_right_wear_ratio < 0.92
          then array['El lado izquierdo está soportando más carga que el derecho.']
          else array[]::text[]
        end ||
        case
          when valid_aggregates.fuel_min_per_lap is not null
            and valid_aggregates.fuel_max_per_lap is not null
            and valid_aggregates.fuel_max_per_lap > 0
            and (valid_aggregates.fuel_max_per_lap - valid_aggregates.fuel_min_per_lap) <= 0.004
          then array['El consumo es muy estable vuelta a vuelta.']
          else array[]::text[]
        end
      )[1:5]
    ) as insights
  from public.setup_sessions as sessions
  left join pace_metrics on pace_metrics.session_id = sessions.id
  left join valid_aggregates on valid_aggregates.session_id = sessions.id
  left join valid_lap_rate_metrics on valid_lap_rate_metrics.session_id = sessions.id
  left join best_three_metrics on best_three_metrics.session_id = sessions.id
  left join last_three_metrics on last_three_metrics.session_id = sessions.id
  left join opening_three_metrics on opening_three_metrics.session_id = sessions.id
  left join all_lap_aggregates on all_lap_aggregates.session_id = sessions.id
  left join wear_metrics on wear_metrics.session_id = sessions.id
  left join compound_metrics on compound_metrics.session_id = sessions.id
  left join virtual_energy_bounds on virtual_energy_bounds.session_id = sessions.id
  left join virtual_energy_end_metrics on virtual_energy_end_metrics.session_id = sessions.id
)
update public.setup_sessions as sessions
set
  average_lap_ms = derived.average_lap_ms,
  optimal_lap_ms = derived.optimal_lap_ms,
  lap_consistency_ms = derived.lap_consistency_ms,
  best_three_lap_average_ms = derived.best_three_lap_average_ms,
  last_three_lap_average_ms = derived.last_three_lap_average_ms,
  pace_fade_ms = derived.pace_fade_ms,
  valid_lap_count = derived.valid_lap_count,
  valid_lap_rate = derived.valid_lap_rate,
  average_fuel_used_per_lap = derived.average_fuel_used_per_lap,
  average_virtual_energy_used_per_lap = derived.average_virtual_energy_used_per_lap,
  fuel_min_per_lap = derived.fuel_min_per_lap,
  fuel_max_per_lap = derived.fuel_max_per_lap,
  virtual_energy_min_per_lap = derived.virtual_energy_min_per_lap,
  virtual_energy_max_per_lap = derived.virtual_energy_max_per_lap,
  virtual_energy_start = derived.virtual_energy_start,
  virtual_energy_end = derived.virtual_energy_end,
  projected_fuel_20_minutes = derived.projected_fuel_20_minutes,
  projected_fuel_30_minutes = derived.projected_fuel_30_minutes,
  projected_fuel_45_minutes = derived.projected_fuel_45_minutes,
  projected_virtual_energy_20_minutes = derived.projected_virtual_energy_20_minutes,
  projected_virtual_energy_30_minutes = derived.projected_virtual_energy_30_minutes,
  projected_virtual_energy_45_minutes = derived.projected_virtual_energy_45_minutes,
  peak_top_speed_kph = derived.peak_top_speed_kph,
  tire_drop_front = derived.tire_drop_front,
  tire_drop_rear = derived.tire_drop_rear,
  tire_drop_front_per_lap = derived.tire_drop_front_per_lap,
  tire_drop_rear_per_lap = derived.tire_drop_rear_per_lap,
  front_rear_wear_ratio = derived.front_rear_wear_ratio,
  left_right_wear_ratio = derived.left_right_wear_ratio,
  front_compound = derived.front_compound,
  rear_compound = derived.rear_compound,
  insights = derived.insights
from derived_metrics as derived
where derived.session_id = sessions.id;
