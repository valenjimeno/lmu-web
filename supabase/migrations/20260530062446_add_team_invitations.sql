create type public.team_invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  role public.team_role not null default 'member',
  invited_by uuid not null references auth.users (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  status public.team_invitation_status not null default 'pending',
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_invitations_email_lowercase check (email = lower(email)),
  constraint team_invitations_member_only check (role = 'member'),
  constraint team_invitations_acceptance_consistency check (
    (
      status = 'accepted'
      and accepted_by is not null
      and accepted_at is not null
    )
    or (
      status <> 'accepted'
      and accepted_by is null
      and accepted_at is null
    )
  )
);

create index team_invitations_team_id_idx on public.team_invitations (team_id);
create index team_invitations_email_idx on public.team_invitations (email);
create index team_invitations_status_idx on public.team_invitations (status);
create index team_invitations_token_idx on public.team_invitations (token);
create unique index team_invitations_pending_team_email_idx
on public.team_invitations (team_id, email)
where status = 'pending';

create trigger set_team_invitations_updated_at
before update on public.team_invitations
for each row
execute function public.set_updated_at();

alter table public.team_invitations enable row level security;
alter table public.team_invitations force row level security;

create policy "team owners can read invitations"
on public.team_invitations
for select
to authenticated
using ((select public.is_team_owner(team_id)));

create policy "invitees can read own invitations"
on public.team_invitations
for select
to authenticated
using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = email);

create policy "team owners can create invitations"
on public.team_invitations
for insert
to authenticated
with check (
  (select public.is_team_owner(team_id))
  and invited_by = (select auth.uid())
);

create policy "team owners can update invitations"
on public.team_invitations
for update
to authenticated
using ((select public.is_team_owner(team_id)))
with check ((select public.is_team_owner(team_id)));

create policy "invitees can accept own invitations"
on public.team_invitations
for update
to authenticated
using (
  status = 'pending'
  and lower(coalesce((select auth.jwt() ->> 'email'), '')) = email
)
with check (
  status = 'accepted'
  and accepted_by = (select auth.uid())
  and accepted_at is not null
  and lower(coalesce((select auth.jwt() ->> 'email'), '')) = email
);

create policy "users can join a team from an accepted invitation"
on public.team_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.team_invitations
    where team_id = team_members.team_id
      and status = 'accepted'
      and accepted_by = (select auth.uid())
      and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  )
);
