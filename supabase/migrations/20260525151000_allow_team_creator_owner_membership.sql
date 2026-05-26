create policy "team creators can add themselves as owners"
on public.team_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.teams
    where teams.id = team_members.team_id
      and teams.created_by = (select auth.uid())
  )
);
