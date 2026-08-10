-- ============================================================
-- MamaTrack GPS — Supabase Schema
--
-- HOW TO RUN:
--   1. Open https://supabase.com and select your project
--   2. Left sidebar -> "SQL Editor"
--   3. Click "New query"
--   4. Paste this ENTIRE file and click "Run"
--
-- Safe to run more than once (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Column names deliberately match the TypeScript interfaces in
-- src/services/db.ts one-for-one, because SyncService upserts whole
-- records straight from localStorage into these tables.
--
-- Foreign keys are intentionally omitted: realtime rows arrive in
-- arbitrary order (an emergency can land before the mother row it
-- references) and FK constraints would reject those writes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  role TEXT CHECK (role IN ('mother', 'admin', 'doctor', 'driver', 'vht')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hospitals (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  sub_county TEXT,
  phone TEXT,
  email TEXT,
  total_beds INT,
  available_beds INT,
  has_cemonc BOOLEAN DEFAULT false,
  has_blood_bank BOOLEAN DEFAULT false,
  blood_types_available TEXT,
  has_surgical_capacity BOOLEAN DEFAULT false,
  has_ambulance BOOLEAN DEFAULT false,
  operating_hours TEXT,
  facility_type TEXT
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGINT PRIMARY KEY,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT,
  hospital_id BIGINT,
  status TEXT,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  capacity INT,
  has_equipment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.mothers (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  date_of_birth DATE,
  national_id TEXT,
  blood_type TEXT,
  pregnancy_start_date DATE,
  expected_due_date DATE,
  gravida INT,
  parity INT,
  medical_history TEXT,
  current_complications TEXT,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  village TEXT,
  sub_county TEXT,
  district TEXT,
  vht_name TEXT,
  vht_phone TEXT,
  home_latitude DOUBLE PRECISION,
  home_longitude DOUBLE PRECISION,
  preferred_hospital_id BIGINT
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  hospital_id BIGINT,
  specialization TEXT,
  license_number TEXT,
  is_on_duty BOOLEAN DEFAULT false,
  shift_start TEXT,
  shift_end TEXT,
  years_experience INT,
  last_duty_toggle TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  hospital_id BIGINT,
  vehicle_id BIGINT,
  license_number TEXT,
  driver_role TEXT,
  is_on_duty BOOLEAN DEFAULT false,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_duty_toggle TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.emergencies (
  id BIGINT PRIMARY KEY,
  code TEXT,
  mother_id BIGINT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT,
  severity TEXT,
  notes TEXT,
  hospital_id BIGINT,
  driver_id BIGINT,
  doctor_id BIGINT,
  vehicle_id BIGINT,
  cancel_reason TEXT,
  eta_minutes INT,
  dispatched_by BIGINT,
  triggered_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.emergency_logs (
  id BIGINT PRIMARY KEY,
  emergency_id BIGINT,
  previous_status TEXT,
  new_status TEXT,
  changed_by BIGINT,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  title TEXT,
  message TEXT,
  type TEXT,
  reference_id BIGINT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.vitals (
  id BIGINT PRIMARY KEY,
  mother_id BIGINT,
  "timestamp" TIMESTAMPTZ,
  systolic INT,
  diastolic INT,
  glucose DOUBLE PRECISION,
  kick_count INT,
  recorded_by TEXT
);

CREATE TABLE IF NOT EXISTS public.vht_visits (
  id BIGINT PRIMARY KEY,
  vht_id BIGINT,
  mother_id BIGINT,
  visit_date DATE,
  blood_pressure TEXT,
  temperature DOUBLE PRECISION,
  fetal_movement TEXT,
  notes TEXT,
  complications_observed TEXT
);

-- ============================================================
-- Realtime — this is what makes a phone SOS appear on the admin
-- desktop instantly. Without it, changes only show after a reload.
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','hospitals','vehicles','mothers','doctors','drivers',
    'emergencies','emergency_logs','notifications','vitals','vht_visits'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    EXCEPTION WHEN duplicate_object THEN
      -- already published, nothing to do
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- Row Level Security
--
-- WARNING: these policies let the public anon key read and write
-- every table. Acceptable for a prototype demo. A production system
-- holding real patient data must replace them with per-role policies
-- tied to authenticated users.
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','hospitals','vehicles','mothers','doctors','drivers',
    'emergencies','emergency_logs','notifications','vitals','vht_visits'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "mamatrack_all_access" ON public.%I;', t);
    EXECUTE format(
      'CREATE POLICY "mamatrack_all_access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t
    );
  END LOOP;
END $$;

-- Done. Reload the app; the console should show
--   "SyncService: realtime channel live — cross-device sync active."
-- with no "Could not find the table" warnings.
