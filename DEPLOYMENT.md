# Deployment guide

This project is the Adrian & KC wedding invitation and RSVP website.

## Repository

- GitHub: [deviling124/wedding](https://github.com/deviling124/wedding)
- Production branch: `main`
- Framework: Next.js
- Package manager: pnpm

## Live deployments

- Vercel deployment: [wedding-rsvp-eight-zeta.vercel.app](https://wedding-rsvp-eight-zeta.vercel.app/)
- Custom domain: [wedding.fenatti.me](https://wedding.fenatti.me/)

The custom domain is the guest-facing address. The Vercel URL is useful for testing a deployment directly.

## Always-on hosting

Vercel keeps the deployment available continuously. Pushes to `main` trigger a new production build when the GitHub repository is connected to the Vercel project. The custom domain points to the Vercel production deployment.

To publish a change:

1. Make and test the change locally.
2. Run `pnpm typecheck`.
3. Run `pnpm build`.
4. Commit the change on `main` and push it to GitHub.
5. Wait for Vercel's deployment check to finish.
6. Verify both live URLs.

## Environment variables

Configure these in Vercel for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `ADMIN_LOGIN_EMAIL`
- `ADMIN_USERNAME`

Never commit `.env.local`, service-role keys, or other secrets to GitHub.

## Local development

```powershell
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) locally.

## Database

Apply the SQL migrations in `supabase/migrations/` to the configured Supabase project before enabling RSVP submissions.
