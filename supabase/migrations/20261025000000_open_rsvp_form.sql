-- Allow the public RSVP form to collect only a full name, reply, and guest count.
-- Existing invitation-based responses remain intact through the legacy columns.

alter table public.rsvps
  add column if not exists full_name text;

update public.rsvps
set full_name = nullif(trim(concat_ws(' ', first_name, last_name)), '')
where full_name is null;

alter table public.rsvps
  alter column full_name set not null,
  alter column household_id drop not null,
  alter column first_name drop not null,
  alter column last_name drop not null,
  alter column email drop not null;

comment on column public.rsvps.full_name is 'Name supplied by the simplified public RSVP form.';

