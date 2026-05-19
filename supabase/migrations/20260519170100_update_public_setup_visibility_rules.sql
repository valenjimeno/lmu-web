alter table public.setups
drop constraint if exists setups_visibility_requires_team;

alter table public.setups
add constraint setups_visibility_requires_team check (
  (visibility in ('private', 'public') and team_id is null)
  or visibility = 'team'
);

drop policy if exists "users can read accessible setups" on public.setups;
create policy "users can read accessible setups"
on public.setups
for select
to authenticated
using (
  (select auth.uid()) = owner_user_id
  or visibility = 'public'
  or (
    visibility = 'team'
    and team_id is not null
    and (select public.is_team_member(team_id))
  )
);

drop policy if exists "users can manage their own favorites" on public.setup_favorites;
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
        or setups.visibility = 'public'
        or (
          setups.visibility = 'team'
          and setups.team_id is not null
          and (select public.is_team_member(setups.team_id))
        )
      )
  )
);
