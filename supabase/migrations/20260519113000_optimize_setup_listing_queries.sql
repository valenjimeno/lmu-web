create index if not exists setups_owner_created_at_idx
on public.setups (owner_user_id, created_at desc);

create index if not exists setups_owner_bestlap_updated_idx
on public.setups (owner_user_id, best_lap_ms asc, updated_at desc)
where best_lap_ms is not null;
