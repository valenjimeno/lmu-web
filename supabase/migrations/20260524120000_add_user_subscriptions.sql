create type public.subscription_plan as enum ('lite', 'pro');
create type public.subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'inactive'
);

create table public.plans (
  code public.subscription_plan primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.plan_features (
  plan_code public.subscription_plan not null references public.plans (code) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  limit_value integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (plan_code, feature_key),
  constraint plan_features_feature_key_not_blank check (length(trim(feature_key)) > 0)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan_code public.subscription_plan not null default 'lite'
    references public.plans (code) on delete restrict,
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index plan_features_feature_key_idx on public.plan_features (feature_key);
create index subscriptions_plan_code_idx on public.subscriptions (plan_code);
create index subscriptions_status_idx on public.subscriptions (status);

create trigger set_plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

create trigger set_plan_features_updated_at
before update on public.plan_features
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

insert into public.plans (code, name, description)
values
  ('lite', 'Lite', 'Plan gratuito con acceso individual y funciones basicas.'),
  ('pro', 'Pro', 'Plan premium con colaboracion y automatizaciones avanzadas.')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.plan_features (plan_code, feature_key, enabled, limit_value)
values
  ('lite', 'teams.create', false, 0),
  ('lite', 'teams.invite', false, 0),
  ('lite', 'teams.share', false, 0),
  ('lite', 'sessions.import_bulk', false, 1),
  ('pro', 'teams.create', true, 3),
  ('pro', 'teams.invite', true, 25),
  ('pro', 'teams.share', true, null),
  ('pro', 'sessions.import_bulk', true, 24)
on conflict (plan_code, feature_key) do update
set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value;

insert into public.subscriptions (user_id, plan_code, status)
select id, 'lite', 'active'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_display_name text;
  resolved_full_name text;
begin
  resolved_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  resolved_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    resolved_display_name,
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (
    id,
    email,
    display_name,
    first_name,
    last_name,
    full_name,
    preferences
  )
  values (
    new.id,
    new.email,
    resolved_display_name,
    nullif(trim(split_part(coalesce(resolved_full_name, ''), ' ', 1)), ''),
    nullif(trim(regexp_replace(coalesce(resolved_full_name, ''), '^\S+\s*', '')), ''),
    resolved_full_name,
    '{}'::jsonb
  )
  on conflict (id) do update
  set email = excluded.email;

  insert into public.subscriptions (user_id, plan_code, status)
  values (new.id, 'lite', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;

alter table public.plans force row level security;
alter table public.plan_features force row level security;
alter table public.subscriptions force row level security;

create policy "authenticated users can read plans"
on public.plans
for select
to authenticated
using (true);

create policy "authenticated users can read plan features"
on public.plan_features
for select
to authenticated
using (true);

create policy "users can read own subscription"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);
