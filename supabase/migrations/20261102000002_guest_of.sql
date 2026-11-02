-- Store which partner the invitation is associated with.
alter table public.households
  add column if not exists guest_of text;

comment on column public.households.guest_of is 'Partner associated with the invitation, such as Adrian or KC.';

