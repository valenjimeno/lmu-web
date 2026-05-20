alter table public.setup_sessions
alter column setup_id drop not null;

drop policy if exists "users can read accessible setup sessions" on public.setup_sessions;
drop policy if exists "owners can create setup sessions" on public.setup_sessions;
drop policy if exists "owners can update setup sessions" on public.setup_sessions;
drop policy if exists "users can read accessible setup session laps" on public.setup_session_laps;

create policy "users can read accessible setup sessions"
on public.setup_sessions
for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or exists (
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
  and (
    setup_id is null
    or exists (
      select 1
      from public.setups
      where setups.id = setup_sessions.setup_id
        and setups.owner_user_id = (select auth.uid())
    )
  )
);

create policy "owners can update setup sessions"
on public.setup_sessions
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (
  owner_user_id = (select auth.uid())
  and (
    setup_id is null
    or exists (
      select 1
      from public.setups
      where setups.id = setup_sessions.setup_id
        and setups.owner_user_id = (select auth.uid())
    )
  )
);

create policy "users can read accessible setup session laps"
on public.setup_session_laps
for select
to authenticated
using (
  exists (
    select 1
    from public.setup_sessions
    left join public.setups on setups.id = setup_sessions.setup_id
    where setup_sessions.id = setup_session_laps.session_id
      and (
        setup_sessions.owner_user_id = (select auth.uid())
        or (
          setup_sessions.setup_id is not null
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
      )
  )
);
