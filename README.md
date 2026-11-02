# Wedding RSVP

Next.js wedding invitation deployed to Vercel, with RSVP submissions stored in Supabase.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL, publishable key, service-role key, admin email allowlist, and login email.
3. Apply `supabase/migrations/20261016000000_wedding_rsvp.sql` in the Supabase SQL editor.
4. Sign in to `/admin`, open Invitation links, and paste one guest or household per line in the invitation manager (for example `Castillo family | 3 | CASTILLO-2027`). Keep the generated links or export them as CSV. Invite codes are stored in the protected households table so links can be rebuilt later.
5. Create the admin users in Supabase Auth using email/password, then run `pnpm dev`.

The public RSVP flow never exposes the service-role key. The RSVP form is only shown through a personal household invite link; the server hashes and validates that code, enforces that household's `max_guests` limit, and writes through the Node.js route handler in `app/api/rsvp/route.ts`.

## Vercel environment variables

Configure these in Vercel for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ADMIN_EMAILS` (comma-separated admin email addresses allowed into the dashboard)
- `ADMIN_LOGIN_EMAIL` (the Supabase Auth email used when signing in as `fenatti`; if omitted, the first address in `ADMIN_EMAILS` is used)
- `ADMIN_USERNAME` (optional friendly login name; defaults to `fenatti`)

The current UI uses placeholder couple, date, venue, and contact details from the original invitation. Update the copy in `app/page.tsx` before sending the link to guests.

## Deployment

Connect the GitHub repository to Vercel with the project root set to this directory. Vercel will build with `next build`; pushes to the production branch can deploy the live site, while other branches create preview deployments.

