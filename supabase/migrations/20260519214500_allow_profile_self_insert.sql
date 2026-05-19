create policy "profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);
