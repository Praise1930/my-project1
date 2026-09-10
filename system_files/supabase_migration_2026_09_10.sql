-- ============================================================================
-- MamaTrack GPS — migration 2026-09-10
-- Antenatal care contacts and blood bank orders.
--
-- Adds the two tables the role workflows need in order to cross devices:
--   * public.checkups       — the WHO ANC contact schedule and its results
--   * public.blood_requests — orders raised by doctors, actioned by the admin
--
-- Safe to run more than once (CREATE TABLE / ADD COLUMN IF NOT EXISTS).
-- Run it in the Supabase SQL editor before deploying this build.
-- ============================================================================

-- ── Antenatal care contacts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkups (
  id                BIGINT PRIMARY KEY,
  mother_id         BIGINT,          -- the mother's user id
  hospital_id       BIGINT,
  checkup_type      TEXT,
  scheduled_date    DATE,
  scheduled_time    TEXT,
  notes             TEXT,
  status            TEXT DEFAULT 'upcoming',
  anc_visit_number  INT,
  conducted_by      BIGINT,
  conducted_by_role TEXT,
  completed_at      TIMESTAMPTZ,
  results           JSONB
);

-- Columns for databases that already carried an older `checkups` table.
ALTER TABLE public.checkups ADD COLUMN IF NOT EXISTS anc_visit_number  INT;
ALTER TABLE public.checkups ADD COLUMN IF NOT EXISTS conducted_by      BIGINT;
ALTER TABLE public.checkups ADD COLUMN IF NOT EXISTS conducted_by_role TEXT;
ALTER TABLE public.checkups ADD COLUMN IF NOT EXISTS completed_at      TIMESTAMPTZ;
ALTER TABLE public.checkups ADD COLUMN IF NOT EXISTS results           JSONB;

CREATE INDEX IF NOT EXISTS checkups_mother_idx ON public.checkups (mother_id);
CREATE INDEX IF NOT EXISTS checkups_status_idx ON public.checkups (status);

-- ── Blood bank orders ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id           BIGINT PRIMARY KEY,
  doctor_id    BIGINT,
  hospital_id  BIGINT,
  blood_type   TEXT,
  units        INT,
  status       TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blood_requests_status_idx ON public.blood_requests (status);

-- ── Row level security, matching the policy the other tables use ───────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['checkups', 'blood_requests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);',
      t || '_all', t
    );
  END LOOP;
END $$;

-- ── Realtime ───────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checkups;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
