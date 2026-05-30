create or replace function public.profile_exists_by_email(candidate_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(coalesce(email, '')) = lower(coalesce(candidate_email, ''))
  );
$$;

revoke all on function public.profile_exists_by_email(text) from public;
grant execute on function public.profile_exists_by_email(text) to authenticated;
