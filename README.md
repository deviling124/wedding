# Wedding RSVP site — setup

## 1. Create the database (Supabase, free tier)
1. Go to supabase.com → New project.
2. Open the SQL editor and run:

```sql
create table rsvps (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  attending text not null,
  party int default 0,
  dietary text,
  email text not null,
  message text,
  created_at timestamp with time zone default now()
);

-- Lock the table down: with RLS on and no policies, only the
-- service_role key (used server-side by api/rsvp.js) can read or
-- write. If the public "anon" key were ever exposed in the
-- frontend by mistake, it would be refused, not just discouraged.
alter table rsvps enable row level security;
```

3. Go to Project Settings → API. Copy the **Project URL** and the **service_role** key (not the anon key — the API route needs the service key to write server-side, and it bypasses the RLS lock above by design).

## 2. Push this folder to GitHub
Create a new repo and push these files. `.gitignore` already excludes `node_modules` and any local `.env` file, so you won't accidentally commit secrets.

## 3. Deploy on Vercel
1. Go to vercel.com → Add New → Project → import the GitHub repo.
2. Under **Environment Variables**, add:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_KEY` — your service_role key
   - `DASHBOARD_PASSCODE` — whatever passcode you want to use to view responses
3. Click Deploy. Vercel auto-detects `api/rsvp.js` as a serverless function — no other config needed.

## 4. Personalize
Edit `js/config.js` — names, date, venue, hotels, registry links, and gallery photo URLs. Site behavior lives in `js/app.js` and shouldn't need changes.

## 5. Test
Visit your live URL, submit a test RSVP, then click "Couple's dashboard" in the footer and enter your passcode to see it appear.

---

## Security notes

**What's already handled:**
- The Supabase `service_role` key only ever lives in a Vercel environment variable, read by the serverless function on the server. It's never sent to the browser.
- Vercel gives you HTTPS automatically — traffic between guests and the site is encrypted.
- The RSVP form is server-validated (name, valid email, attending yes/no) and every field is length-capped, so a bad request can't blow up the database or the page.
- A hidden honeypot field quietly discards most basic bots without bothering real guests.
- Anything guests type (name, message, dietary notes) is HTML-escaped before it's shown in the dashboard, so a guest can't inject a script into your own dashboard view.
- The RLS lock above means even a leaked anon key can't be used to read the guest list directly from Supabase.
- The dashboard passcode check happens server-side, and repeated wrong guesses from the same IP get throttled (5 per minute).

**Worth knowing, given this is a low-stakes personal site:**
- The dashboard passcode is a shared secret, not a real login — anyone with the passcode (and the URL) can see every guest's name, email, and message. That's normal for a wedding site, but don't reuse a password you care about, and don't post the passcode anywhere public.
- The rate limit on passcode attempts resets whenever the serverless function cold-starts (which happens periodically on Vercel's free tier), so it's a deterrent, not a hard cap. If you want a real one, a free tier of Upstash Redis (a few lines added to `api/rsvp.js`) makes it durable — ask if you'd like that wired in.
- There's no CAPTCHA on the RSVP form. The honeypot stops simple bots; a determined spammer could still submit fake RSVPs. Given this is a private link shared with guests rather than a public marketing page, that risk is low — but if you publicize the link widely, consider adding Cloudflare Turnstile (free) to the form.
