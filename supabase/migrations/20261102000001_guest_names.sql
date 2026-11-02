-- Keep each RSVP guest as a separate value so admin views do not need to split display text.
alter table public.rsvps
  add column if not exists guest_names text[];

update public.rsvps
set guest_names = regexp_split_to_array(trim(full_name), '\\s*,\\s*')
where guest_names is null and full_name is not null and trim(full_name) <> '';

comment on column public.rsvps.guest_names is 'Names submitted for each guest in this RSVP, in display order.';

