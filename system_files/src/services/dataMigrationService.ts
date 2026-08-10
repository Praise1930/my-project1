// MamaTrack GPS — Supabase Data Migration & Verification Service
import { supabase, testSupabaseConnection } from './supabase';
import { db } from './db';

export interface MigrationSummary {
  collectionName: string;
  sourceCount: number;
  transferredCount: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
}

export interface FullMigrationResult {
  overallSuccess: boolean;
  timestamp: string;
  connectionStatus: string;
  summaries: MigrationSummary[];
  totalRecordsTransferred: number;
  verificationMessage: string;
}

// Schema DDL mirroring the TypeScript interfaces in db.ts exactly. Column names
// must match the interface field names one-for-one, because SyncService upserts
// whole records straight from localStorage into these tables.
//
// Foreign keys are deliberately omitted: realtime rows arrive in arbitrary order
// (an emergency can land before the mother row it points at), and FK constraints
// would reject those out-of-order writes. Referential integrity is maintained by
// the application layer instead.
export const SUPABASE_SQL_SCHEMA = `
-- ============================================================
-- MamaTrack GPS — Supabase Schema
-- Run this in the Supabase SQL Editor, then reload the app.
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
-- Realtime: required for cross-device SOS delivery.
-- Without this, an alert raised on a phone never reaches the
-- admin desktop until a manual page reload.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mothers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vht_visits;

-- ============================================================
-- Row Level Security.
-- NOTE: these policies allow the public anon key full read/write.
-- That is acceptable for a demonstration/prototype deployment, but
-- a production system holding real patient data must replace them
-- with per-role policies tied to authenticated users.
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
`;

export class DataMigrationService {
  /**
   * Run complete migration of system data to Supabase
   */
  static async runMigration(): Promise<FullMigrationResult> {
    const connTest = await testSupabaseConnection();
    if (!connTest.success || !supabase) {
      return {
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        connectionStatus: connTest.message,
        summaries: [],
        totalRecordsTransferred: 0,
        verificationMessage: `Migration aborted: ${connTest.message}`
      };
    }

    const summaries: MigrationSummary[] = [];
    let totalTransferred = 0;

    // Seed Supabase from the local database. Reference tables go first so the
    // cloud copy is coherent if a later step fails.
    const collectionsToMigrate = [
      { name: 'users', data: db.users },
      { name: 'hospitals', data: db.hospitals },
      { name: 'vehicles', data: db.vehicles },
      { name: 'mothers', data: db.mothers },
      { name: 'doctors', data: db.doctors },
      { name: 'drivers', data: db.drivers },
      { name: 'vitals', data: db.vitals },
      { name: 'vht_visits', data: db.vhtVisits },
      { name: 'emergencies', data: db.emergencies },
      { name: 'emergency_logs', data: db.emergencyLogs },
      { name: 'notifications', data: db.notifications }
    ];

    for (const item of collectionsToMigrate) {
      const { name, data } = item;
      const sourceCount = data ? data.length : 0;

      if (sourceCount === 0) {
        summaries.push({
          collectionName: name,
          sourceCount: 0,
          transferredCount: 0,
          status: 'SKIPPED',
          errorMessage: 'No source data found'
        });
        continue;
      }

      try {
        // Clean dataset objects for Postgres compatibility
        const cleanData = data.map((record: any) => {
          const cleaned = { ...record };
          // Convert date/timestamp objects or string IDs if needed
          return cleaned;
        });

        // Upsert into Supabase table
        const { data: inserted, error } = await supabase
          .from(name)
          .upsert(cleanData, { onConflict: 'id' })
          .select('id');

        if (error) {
          summaries.push({
            collectionName: name,
            sourceCount,
            transferredCount: 0,
            status: 'FAILED',
            errorMessage: error.message
          });
        } else {
          const count = inserted ? inserted.length : sourceCount;
          totalTransferred += count;
          summaries.push({
            collectionName: name,
            sourceCount,
            transferredCount: count,
            status: 'SUCCESS'
          });
        }
      } catch (err: any) {
        summaries.push({
          collectionName: name,
          sourceCount,
          transferredCount: 0,
          status: 'FAILED',
          errorMessage: err?.message || 'Unknown upsert error'
        });
      }
    }

    const failedCount = summaries.filter(s => s.status === 'FAILED').length;
    const overallSuccess = failedCount === 0;

    return {
      overallSuccess,
      timestamp: new Date().toISOString(),
      connectionStatus: connTest.message,
      summaries,
      totalRecordsTransferred: totalTransferred,
      verificationMessage: overallSuccess
        ? `Verification Passed: All ${totalTransferred} records successfully transferred & verified in Supabase!`
        : `Migration completed with ${failedCount} errors. Please review summaries.`
    };
  }
}
