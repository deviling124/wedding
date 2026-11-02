-- Keep the administrator-supplied code so invite links can be listed and exported later.
-- The households table remains RLS-protected and public roles have no privileges.
alter table public.households
  add column if not exists invite_code text;

create unique index if not exists households_invite_code_unique
  on public.households (invite_code)
  where invite_code is not null;

comment on column public.households.invite_code is 'Administrator-supplied bearer code used to rebuild private RSVP links.';

