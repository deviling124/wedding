# Wedding RSVP

Next.js wedding invitation deployed to Vercel, with RSVP submissions stored in Supabase.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL, publishable key, service-role key, and admin email allowlist.
3. Apply `supabase/migrations/20261016000000_wedding_rsvp.sql` in the Supabase SQL editor.
4. Add one row per invited household using the commented seed example in the migration. Store only the SHA-256 hash of each invite code.
5. Create the admin users in Supabase Auth using email/password, then run `pnpm dev`.

The public RSVP flow never exposes the service-role key. It accepts a household invite code, hashes it server-side, and writes through the Node.js route handler in `app/api/rsvp/route.ts`.

## Vercel environment variables

Configure these in Vercel for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ADMIN_EMAILS` (comma-separated admin email addresses)

The current UI uses placeholder couple, date, venue, and contact details from the original invitation. Update the copy in `app/page.tsx` before sending the link to guests.

## Deployment

Connect the GitHub repository to Vercel with the project root set to this directory. Vercel will build with `next build`; pushes to the production branch can deploy the live site, while other branches create preview deployments.
