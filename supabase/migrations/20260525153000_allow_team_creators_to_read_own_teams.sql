create policy "team creators can read their own teams"
on public.teams
for select
to authenticated
using ((select auth.uid()) = created_by);
