-- ============================================================
-- MamaTrack GPS — Schema drift repair, 8 Sep 2026
--
-- The live Supabase database was created from an older version of
-- supabase_schema.sql and never re-run, so several columns and two whole
-- tables declared there do not exist in the database.
--
-- This is not cosmetic. PostgREST rejects an INSERT/UPDATE that mentions an
-- unknown column with 400 PGRST204, and SyncService treats that failure as
-- "offline" and queues the row. Because EVERY new SOS carries `category`,
-- no new emergency could ever reach Supabase — a mother's alert never
-- reached a coordinator on a different device. Every status update that
-- writes `delay_intervals` (arrived / delivered / completed) failed the same
-- way, which is what left emergencies stuck mid-cycle.
--
-- HOW TO RUN:
--   Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Safe to run more than once (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
-- ============================================================

-- ── emergencies: the six columns that broke the dispatch cycle ──
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS category              TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS vital_signs           JSONB;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS required_intervention TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS reporting_role        TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS reporting_name        TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS delay_intervals       JSONB;

-- ── hospitals ──
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS district      TEXT DEFAULT 'Mukono';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS nicu_capacity BOOLEAN DEFAULT false;

-- ── mothers ──
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS risk_factors      JSONB;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS consent_given     BOOLEAN DEFAULT true;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS previous_csection BOOLEAN DEFAULT false;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS pph_history       BOOLEAN DEFAULT false;
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS anc_visits_count  INT DEFAULT 1;

-- ── vitals ──
ALTER TABLE public.vitals ADD COLUMN IF NOT EXISTS pulse       INT;
ALTER TABLE public.vitals ADD COLUMN IF NOT EXISTS temperature DOUBLE PRECISION;

-- ── two tables that were never created at all ──
CREATE TABLE IF NOT EXISTS public.mpdsr_records (
  id BIGINT PRIMARY KEY,
  emergency_id BIGINT,
  mother_id BIGINT,
  case_classification TEXT,
  primary_cause TEXT,
  contributing_clinical_factors JSONB,
  delay_1_seeking_care JSONB,
  delay_2_reaching_care JSONB,
  delay_3_receiving_care JSONB,
  avoidable_factors JSONB,
  review_committee_status TEXT,
  corrective_action_plan TEXT,
  responsible_facility TEXT,
  responsible_person TEXT,
  audit_date TIMESTAMPTZ,
  follow_up_date DATE
);

CREATE TABLE IF NOT EXISTS public.referral_records (
  id BIGINT PRIMARY KEY,
  referral_code TEXT,
  emergency_id BIGINT,
  mother_id BIGINT,
  referring_facility_name TEXT,
  referring_clinician_name TEXT,
  referring_clinician_contact TEXT,
  receiving_facility_id BIGINT,
  receiving_facility_name TEXT,
  receiving_clinician_name TEXT,
  reason_for_referral TEXT,
  clinical_summary TEXT,
  obstetric_history JSONB,
  vitals_at_referral JSONB,
  pre_referral_treatments JSONB,
  medications_given JSONB,
  ambulance_plate TEXT,
  driver_name TEXT,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  handover_notes TEXT,
  final_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── realtime + RLS for the two new tables, matching the rest ──
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['mpdsr_records','referral_records']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "mamatrack_all_access" ON public.%I;', t);
    EXECUTE format(
      'CREATE POLICY "mamatrack_all_access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t
    );
  END LOOP;
END $$;

-- ── make PostgREST notice the new columns immediately ──
NOTIFY pgrst, 'reload schema';
