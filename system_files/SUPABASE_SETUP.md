# MamaTrack GPS — Supabase Setup

The app keeps a `localStorage` cache on each device and mirrors it to Supabase so
that all roles see the same emergency in real time. **Until the two environment
variables below are filled in, the app runs local-only** — an SOS raised on a
mother's phone will never appear on the admin's desktop.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

The `anon` key is designed to be shipped in browser code; access is controlled by
Row Level Security, not by hiding the key.

## 2. Configure the app

Fill in `system_files/.env`:

```
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

Vite inlines these **at build time**, so after changing them you must restart the
dev server, and redeploy for the change to reach production.

> On Vercel these are picked up from the committed `.env`. If you would rather
> keep them out of the repo, add the same two variables under
> **Project → Settings → Environment Variables** and remove them from `.env`.

## 3. Create the tables

Open the Supabase **SQL Editor** and run the schema. The exact DDL is kept in
`src/services/dataMigrationService.ts` as `SUPABASE_SQL_SCHEMA` — it is also
shown inside the app via the Supabase migration modal on the admin dashboard.

That script does three things:

1. Creates the 11 synced tables, with columns matching the TypeScript interfaces
   in `src/services/db.ts` one-for-one.
2. Adds every table to the `supabase_realtime` publication. **This step is what
   makes cross-device alerts instant** — without it, changes only appear after a
   manual page reload.
3. Enables Row Level Security with permissive policies.

> ⚠️ **Security note:** the supplied RLS policies allow the anon key to read and
> write every table. That is fine for a prototype demonstration, but a system
> holding real patient data must replace them with per-role policies tied to
> authenticated users before going live.

## 4. Seed the cloud database

Log in as admin, open the **Supabase migration modal**, and run the migration.
This upserts the local seed data (users, hospitals, vehicles, mothers, doctors,
drivers, and any existing emergencies) into Supabase.

## 5. Verify it works

Open the browser console. You should see:

```
SyncService: connecting to Supabase realtime…
SyncService: realtime channel live — cross-device sync active.
```

If instead you see `Supabase is not configured`, step 2 has not taken effect —
check the values and restart the dev server.

Then test end to end:

1. Trigger an SOS as a mother on one device.
2. The admin dashboard on a second device should show the alert within a second,
   with no reload.

## 6. Email Verification & Custom SMTP Configuration

By default, Supabase's built-in email service is limited to **3 to 4 emails per hour** for development, and emails sent from `noreply@mail.app.supabase.io` often get filtered into Spam/Junk folders.

To ensure instant, reliable delivery of Mother registration verification emails and password reset links:

### Step A: Configure Custom SMTP in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Navigate to **Project Settings → Authentication → Email → SMTP Settings**.
3. Toggle **Enable Custom SMTP** to **ON**.
4. Fill in your SMTP provider details:
   - **Using Resend (Recommended & Free):**
     - Host: `smtp.resend.com`
     - Port: `465` (SSL) or `587` (TLS)
     - Username: `resend`
     - Password: `re_...` (Your Resend API Key)
     - Sender Email: `noreply@yourdomain.com` or `onboarding@resend.dev`
     - Sender Name: `MamaTrack GPS`
   - **Using Gmail SMTP (Free):**
     - Host: `smtp.gmail.com`
     - Port: `465` (SSL) or `587` (TLS)
     - Username: `your.email@gmail.com`
     - Password: *16-character Google App Password* (generated under Google Account → Security → 2-Step Verification → App Passwords)
     - Sender Email: `your.email@gmail.com`
     - Sender Name: `MamaTrack GPS Health Network`
5. Click **Save Changes**.

### Step B: Configure Redirect URLs
1. In Supabase Dashboard, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production or local origin:
   - `http://localhost:5173` (local dev) or `https://your-mamatrack-domain.vercel.app` (production).
3. In **Redirect URLs**, add:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - `https://*.vercel.app/**`
4. Click **Save**.

---

## Troubleshooting

**Verification email not arriving:**
1. Check your **Spam / Junk** folder. Free mail providers (Gmail, Outlook, Yahoo) often classify default Supabase notification emails as spam unless Custom SMTP is enabled.
2. If you see `email rate limit exceeded` / `over_email_send_rate_limit (429)`, Supabase's default limit was triggered. Configure Custom SMTP as shown in Section 6, or use the **Verify Account Instantly** option on the `/verify-email` page.
3. Click the **Resend Verification Email** button on the `/login` or `/verify-email` screen to request a fresh token.

**Stale code after deploying.** The app registers a PWA service worker that
caches aggressively, so a phone can keep running an old bundle after a deploy.
If a device behaves as though your changes never shipped, clear the cache:
open the site, then in DevTools use **Application → Service Workers → Unregister**
and **Application → Storage → Clear site data**. On a phone, closing all tabs and
reloading generally picks up the new version.

**Alerts still not crossing devices.** Confirm in Supabase that the row actually
arrived: **Table Editor → emergencies**. If the row is missing, the push side is
failing — check the console for `upsert … failed` messages, which usually mean a
column mismatch or an RLS policy denial. If the row *is* there but the other
device does not react, Realtime is not enabled for that table; re-run the
`ALTER PUBLICATION` statements from step 3.

**Clock/date confusion.** Timestamps are stored as `TIMESTAMPTZ`. Devices in
different timezones will still order events correctly.
