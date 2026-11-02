create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  invite_code_hash text not null unique,
  display_name text not null,
  max_guests smallint not null default 1 check (max_guests between 1 and 20),
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  attendance text not null check (attendance in ('joyfully-accept', 'regretfully-decline')),
  guest_count smallint not null check (guest_count between 1 and 20),
  dietary_notes text,
  song_request text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.households enable row level security;
alter table public.rsvps enable row level security;

revoke all on public.households from anon, authenticated;
revoke all on public.rsvps from anon, authenticated;

comment on table public.households is 'One row per invited household. Invite codes are used only by server-side admin and RSVP routes.';
comment on table public.rsvps is 'Latest RSVP response per invited household. Accessed by the server-side service role only.';

-- Example household seed. Replace with your own rows; never commit real invite codes.
-- insert into public.households (invite_code_hash, display_name, max_guests)
-- values (encode(digest('MAYA-THEO-01', 'sha256'), 'hex'), 'Chen household', 2);

