-- These RSVP fields are no longer collected or displayed.
alter table public.rsvps
  drop column if exists dietary_notes,
  drop column if exists song_request;

