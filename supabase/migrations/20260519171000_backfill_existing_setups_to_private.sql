update public.setups
set
  visibility = 'private',
  team_id = null,
  updated_at = timezone('utc', now())
where visibility <> 'private' or team_id is not null;
