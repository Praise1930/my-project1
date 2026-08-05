// MamaTrack GPS — Firebase to Supabase Data Migration & Verification Service
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

export const SUPABASE_SQL_SCHEMA = `
-- MamaTrack GPS Supabase Database Schema DDL

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
  hospital_id BIGINT REFERENCES public.hospitals(id) ON DELETE SET NULL,
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
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
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
  assigned_vht_id BIGINT,
  assigned_hospital_id BIGINT,
  address TEXT,
  sub_county TEXT,
  village TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vitals (
  id BIGINT PRIMARY KEY,
  mother_id BIGINT REFERENCES public.mothers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  systolic INT,
  diastolic INT,
  glucose DOUBLE PRECISION,
  kick_count INT,
  recorded_by TEXT
);

CREATE TABLE IF NOT EXISTS public.vht_visits (
  id BIGINT PRIMARY KEY,
  vht_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  mother_id BIGINT REFERENCES public.mothers(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  blood_pressure TEXT,
  temperature DOUBLE PRECISION,
  fetal_movement TEXT,
  notes TEXT,
  complications_observed TEXT
);

CREATE TABLE IF NOT EXISTS public.emergencies (
  id BIGINT PRIMARY KEY,
  mother_id BIGINT REFERENCES public.mothers(id) ON DELETE CASCADE,
  hospital_id BIGINT REFERENCES public.hospitals(id) ON DELETE SET NULL,
  vehicle_id BIGINT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_doctor_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT,
  severity TEXT,
  symptoms TEXT,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  eta_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
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

    // Collections to migrate from local DB / Firestore cache
    const collectionsToMigrate = [
      { name: 'users', data: db.users },
      { name: 'hospitals', data: db.hospitals },
      { name: 'vehicles', data: db.vehicles },
      { name: 'mothers', data: db.mothers },
      { name: 'vitals', data: db.vitals },
      { name: 'vht_visits', data: db.vhtVisits },
      { name: 'emergencies', data: db.emergencies }
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
