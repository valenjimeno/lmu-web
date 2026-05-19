alter table public.profiles
add column first_name text,
add column last_name text;

update public.profiles
set
  first_name = coalesce(
    nullif(trim(split_part(coalesce(full_name, display_name, ''), ' ', 1)), ''),
    split_part(coalesce(email, ''), '@', 1)
  ),
  last_name = nullif(trim(regexp_replace(coalesce(full_name, ''), '^\S+\s*', '')), '')
where first_name is null
   or last_name is null;
