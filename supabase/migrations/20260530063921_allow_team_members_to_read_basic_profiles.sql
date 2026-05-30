create policy "team members can read teammate profiles"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.team_members as viewer_membership
    join public.team_members as teammate_membership
      on teammate_membership.team_id = viewer_membership.team_id
    where viewer_membership.user_id = (select auth.uid())
      and teammate_membership.user_id = profiles.id
  )
);
