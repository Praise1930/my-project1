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

## Troubleshooting

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
