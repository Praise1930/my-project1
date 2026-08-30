// MamaTrack GPS — Local Database & Clinical Simulation Service for Uganda Maternal Emergency Tracking

// Type-only import: erased at compile time
import type { SyncedRow } from './syncService';
import { OfflineStorageService } from './offlineStorage';

// ============================================================================
// 1. DATA INTERFACES & UGANDA MOH DOMAIN TYPES
// ============================================================================

export type UserRole = 'mother' | 'admin' | 'doctor' | 'driver' | 'vht';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  avatar: string | null;
  is_active: boolean;
  email_verified?: boolean;
  last_login?: string;
  created_at: string;
}

export type ObstetricEmergencyCategory =
  | 'pph'                     // Postpartum Haemorrhage
  | 'pre_eclampsia'           // Severe Pre-eclampsia / Eclampsia
  | 'obstructed_labour'       // Obstructed / Prolonged Labour
  | 'ruptured_uterus'         // Ruptured Uterus
  | 'sepsis'                  // Maternal Sepsis
  | 'antepartum_haemorrhage'  // Antepartum Haemorrhage (Placenta Previa / Abruption)
  | 'retained_placenta'       // Retained Placenta
  | 'maternal_collapse'       // Maternal Collapse / Unconsciousness
  | 'fetal_distress'          // Acute Fetal Distress
  | 'other';                  // Other Obstetric Emergency

export type RequiredIntervention =
  | 'c_section'               // Emergency C-Section / Surgical Laparotomy
  | 'blood_transfusion'       // Urgent Blood Transfusion
  | 'oxygen_neonatal'         // Resuscitation & NICU Readiness
  | 'oxytocics'               // High-dose Uterotonics / Oxytocin / Misoprostol
  | 'manual_removal'          // Manual Placental Extraction
  | 'general_stabilization';   // Pre-transfer Hemodynamic Stabilization

export interface VhtVisitLog {
  id: number;
  vht_id: number;
  mother_id: number;
  visit_date: string;
  blood_pressure: string;
  temperature: number;
  fetal_movement: 'normal' | 'reduced' | 'none';
  notes: string;
  complications_observed: string;
}

export interface VitalsRecord {
  id: number;
  mother_id: number;
  timestamp: string;
  systolic: number;
  diastolic: number;
  glucose: number; // mg/dL
  kick_count: number;
  pulse?: number;
  temperature?: number;
  recorded_by: 'patient' | 'vht' | 'doctor';
}

export interface SmsLog {
  id: number;
  to_number: string;
  to_name: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed';
}

export interface Hospital {
  id: number;
  name: string;
  type: 'government' | 'private' | 'ngo';
  latitude: number;
  longitude: number;
  address: string;
  sub_county: string;
  district?: string;
  phone: string;
  email: string;
  total_beds: number;
  available_beds: number;
  has_cemonc: boolean;
  has_blood_bank: boolean;
  blood_types_available: string;
  has_surgical_capacity: boolean;
  has_ambulance: boolean;
  operating_hours: string;
  facility_type: string;
  nicu_capacity?: boolean;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  vehicle_type: string; // 'Type II (ALS)' | 'Type I (BLS)' | 'Basic Transport'
  hospital_id: number;
  status: 'available' | 'en_route' | 'maintenance' | 'off_duty';
  current_latitude: number | null;
  current_longitude: number | null;
  capacity: number;
  has_equipment: boolean;
  is_active: boolean;
  last_updated?: string;
}

export interface Mother {
  id: number;
  user_id: number;
  date_of_birth: string;
  national_id: string; // Ugandan National ID (NIN)
  blood_type: string;
  pregnancy_start_date: string;
  expected_due_date: string;
  gravida: number;
  parity: number;
  medical_history: string;
  current_complications: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relationship: string;
  village: string;
  sub_county: string;
  district: string;
  vht_name: string;
  vht_phone: string;
  home_latitude: number;
  home_longitude: number;
  preferred_hospital_id: number | null;
  // Uganda Data Protection & Consent
  consent_given?: boolean;
  consent_timestamp?: string;
  // Clinical Risk Factors
  risk_factors?: string[];
  previous_csection?: boolean;
  pph_history?: boolean;
  anc_visits_count?: number;
}

export interface Child {
  id: number;
  mother_id: number;
  name: string;
  gender: 'Son' | 'Daughter';
  date_of_birth: string;
  birth_weight: string;
  delivery_type: 'Spontaneous Normal' | 'Caesarean Section' | 'Assisted Delivery';
  health_status: 'Healthy' | 'Under Monitoring' | 'Routine Checkup Required' | 'Vaccination Due';
  hospital_id: number;
  immunization_status: 'Fully Immunized' | 'Up-to-Date' | 'Pending BCG & Polio' | 'Pending DPT Booster';
}

export interface Doctor {
  id: number;
  user_id: number;
  hospital_id: number;
  specialization: string;
  license_number: string;
  is_on_duty: boolean;
  shift_start: string;
  shift_end: string;
  years_experience: number;
  last_duty_toggle?: string;
}

export interface Driver {
  id: number;
  user_id: number;
  hospital_id: number;
  vehicle_id: number | null;
  license_number: string;
  driver_role: string;
  is_on_duty: boolean;
  current_latitude: number;
  current_longitude: number;
  last_duty_toggle?: string;
}

export interface DelayIntervalMetrics {
  detection_to_dispatch_min: number;  // T1: Seeking / reporting -> Dispatch
  dispatch_to_pickup_min: number;     // T2: Dispatch -> Ambulance reached mother
  pickup_to_arrival_min: number;      // T3: Mother pickup -> Facility arrival
  arrival_to_treatment_min: number;   // T4: Facility arrival -> Treatment / handover
  total_response_time_min: number;    // Overall interval
}

export interface Emergency {
  id: number;
  code: string;
  mother_id: number; // references user_id of mother
  latitude: number;
  longitude: number;
  status: 'pending' | 'verified' | 'dispatched' | 'en_route' | 'arrived' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category?: ObstetricEmergencyCategory;
  vital_signs?: {
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    temp?: number;
    kick_count?: number;
  };
  required_intervention?: RequiredIntervention;
  notes: string;
  hospital_id: number | null;
  driver_id: number | null;
  doctor_id: number | null;
  vehicle_id: number | null;
  cancel_reason: string | null;
  eta_minutes: number | null;
  dispatched_by: number | null;
  reporting_role?: string;
  reporting_name?: string;
  triggered_at: string;
  dispatched_at: string | null;
  picked_up_at: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  delay_intervals?: DelayIntervalMetrics;
}

export interface EmergencyLog {
  id: number;
  emergency_id: number;
  previous_status: string | null;
  new_status: string;
  changed_by: number | null;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface CheckupSchedule {
  id: number;
  mother_id: number;
  hospital_id: number | null;
  checkup_type: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  status: 'upcoming' | 'completed' | 'missed' | 'rescheduled';
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'emergency' | 'dispatch' | 'status_update' | 'checkup_reminder' | 'system' | 'cancelled';
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface VehicleInspection {
  id: number;
  driver_id: number;
  vehicle_id: number;
  fuel_level: 'full' | 'half' | 'low';
  siren_ok: boolean;
  medical_checked: boolean;
  tires_ok: boolean;
  engine_ok: boolean;
  checked_at: string;
}

export interface FuelLog {
  id: number;
  driver_id: number;
  vehicle_id: number;
  liters: number;
  cost: number;
  station: string;
  logged_at: string;
}

export interface ClinicalAssessment {
  id: number;
  emergency_id: number;
  doctor_id: number;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  clinical_findings: string;
  treatment_given: string;
  outcome: 'admitted' | 'referred' | 'discharged' | 'deceased';
  logged_at: string;
  mpdsr_logged?: boolean;
}

export interface BloodRequest {
  id: number;
  doctor_id: number;
  hospital_id: number;
  blood_type: string;
  units: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  requested_at: string;
}

// ── Uganda MPDSR Framework (Maternal & Perinatal Death Surveillance and Response) ──
export interface MpdsrRecord {
  id: number;
  emergency_id: number;
  mother_id: number;
  case_classification: 'maternal_near_miss' | 'maternal_death' | 'severe_complication_resolved';
  primary_cause: string;
  contributing_clinical_factors: string[];
  // The Three-Delay Model
  delay_1_seeking_care: { present: boolean; factors: string[]; notes: string };
  delay_2_reaching_care: { present: boolean; factors: string[]; notes: string };
  delay_3_receiving_care: { present: boolean; factors: string[]; notes: string };
  avoidable_factors: string[];
  review_committee_status: 'pending_audit' | 'under_review' | 'audit_completed' | 'action_plan_active';
  corrective_action_plan: string;
  responsible_facility: string;
  responsible_person: string;
  audit_date: string;
  follow_up_date: string;
}

// ── Uganda MoH Standardized Digital Referral Record ──
export interface ReferralRecord {
  id: number;
  referral_code: string;
  emergency_id: number;
  mother_id: number;
  referring_facility_name: string;
  referring_clinician_name: string;
  referring_clinician_contact: string;
  receiving_facility_id: number;
  receiving_facility_name: string;
  receiving_clinician_name?: string;
  reason_for_referral: string;
  clinical_summary: string;
  obstetric_history: {
    gravida: number;
    parity: number;
    gestational_weeks: number;
    edd: string;
    blood_group: string;
  };
  vitals_at_referral: {
    bp: string;
    pulse: number;
    temp: number;
    fetal_heart_rate?: string;
  };
  pre_referral_treatments: string[];
  medications_given: string[];
  ambulance_plate: string;
  driver_name: string;
  departure_time: string;
  arrival_time?: string;
  handover_notes?: string;
  final_outcome?: string;
  created_at: string;
}

// ============================================================================
// 2. MOCK SEED DATA (MUKONO DISTRICT, UGANDA)
// ============================================================================

export const OBSTETRIC_CATEGORIES_METADATA: Record<ObstetricEmergencyCategory, { label: string; urgency: 'CRITICAL' | 'HIGH'; description: string; defaultIntervention: RequiredIntervention }> = {
  pph: { label: 'Postpartum Haemorrhage (PPH)', urgency: 'CRITICAL', description: 'Severe bleeding after delivery (>500ml or maternal compromise).', defaultIntervention: 'blood_transfusion' },
  pre_eclampsia: { label: 'Severe Pre-eclampsia / Eclampsia', urgency: 'CRITICAL', description: 'BP ≥160/110 mmHg, convulsions, severe headache or visual disturbance.', defaultIntervention: 'general_stabilization' },
  obstructed_labour: { label: 'Obstructed / Prolonged Labour', urgency: 'HIGH', description: 'Arrest of descent, bandl ring, maternal exhaustion, abnormal lie.', defaultIntervention: 'c_section' },
  ruptured_uterus: { label: 'Ruptured Uterus', urgency: 'CRITICAL', description: 'Sudden severe abdominal pain, cessation of contractions, fetal parts palpable.', defaultIntervention: 'c_section' },
  sepsis: { label: 'Maternal Sepsis', urgency: 'HIGH', description: 'Fever >38°C, foul lochia, chills, hypotension, maternal tachycardia.', defaultIntervention: 'general_stabilization' },
  antepartum_haemorrhage: { label: 'Antepartum Haemorrhage (APH)', urgency: 'CRITICAL', description: 'Vaginal bleeding before delivery (placenta previa or abruption).', defaultIntervention: 'c_section' },
  retained_placenta: { label: 'Retained Placenta', urgency: 'HIGH', description: 'Placenta not delivered within 30 minutes of childbirth.', defaultIntervention: 'manual_removal' },
  maternal_collapse: { label: 'Maternal Collapse / Unconsciousness', urgency: 'CRITICAL', description: 'Sudden loss of consciousness, severe shock, syncope.', defaultIntervention: 'oxygen_neonatal' },
  fetal_distress: { label: 'Acute Fetal Distress', urgency: 'HIGH', description: 'Fetal heart rate <110 or >160 bpm, thick meconium stained liquor.', defaultIntervention: 'c_section' },
  other: { label: 'Other Obstetric Emergency', urgency: 'HIGH', description: 'Other acute complication requiring urgent hospital evaluation.', defaultIntervention: 'general_stabilization' }
};

const SEED_HOSPITALS: Hospital[] = [
  { id: 1, name: 'Mukono General Hospital', type: 'government', latitude: 0.3536, longitude: 32.7554, address: 'Mukono Town, Main Road', sub_county: 'Mukono Municipality', district: 'Mukono', phone: '+256-414-290-001', email: 'info@mukonogeneral.go.ug', total_beds: 200, available_beds: 45, has_cemonc: true, has_blood_bank: true, blood_types_available: 'A+,A-,B+,B-,O+,O-,AB+,AB-', has_surgical_capacity: true, has_ambulance: true, operating_hours: '24/7', facility_type: 'General Hospital', nicu_capacity: true },
  { id: 2, name: 'Mukono Church of Uganda Hospital', type: 'private', latitude: 0.3548, longitude: 32.7501, address: 'Mukono Town, CoU Road', sub_county: 'Mukono Municipality', district: 'Mukono', phone: '+256-414-290-102', email: 'admin@mukonocou.org', total_beds: 120, available_beds: 28, has_cemonc: true, has_blood_bank: true, blood_types_available: 'A+,B+,O+,O-,AB+', has_surgical_capacity: true, has_ambulance: true, operating_hours: '24/7', facility_type: 'Private Hospital', nicu_capacity: true },
  { id: 3, name: 'C-Care (IMC) Hospital', type: 'private', latitude: 0.3510, longitude: 32.7612, address: 'Mukono Industrial Area', sub_county: 'Mukono Municipality', district: 'Mukono', phone: '+256-414-290-203', email: 'info@ccare-mukono.com', total_beds: 80, available_beds: 15, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,O-,A+,B+', has_surgical_capacity: true, has_ambulance: false, operating_hours: '24/7', facility_type: 'Private Hospital', nicu_capacity: false },
  { id: 4, name: 'AAR Pearl Hospital', type: 'private', latitude: 0.3525, longitude: 32.7580, address: 'Mukono Town Centre', sub_county: 'Mukono Municipality', district: 'Mukono', phone: '+256-414-290-304', email: 'reception@aarpearl.co.ug', total_beds: 60, available_beds: 12, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,A+,B+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Private Hospital', nicu_capacity: false },
  { id: 5, name: 'Nama Health Centre IV', type: 'government', latitude: 0.2980, longitude: 32.8120, address: 'Nama Sub-County', sub_county: 'Nama', district: 'Mukono', phone: '+256-414-290-405', email: 'nama.hc4@health.go.ug', total_beds: 40, available_beds: 10, has_cemonc: true, has_blood_bank: false, blood_types_available: 'O+,O-', has_surgical_capacity: true, has_ambulance: true, operating_hours: '24/7', facility_type: 'Health Centre IV', nicu_capacity: false },
  { id: 6, name: 'Koome Health Centre III', type: 'government', latitude: 0.1450, longitude: 32.8800, address: 'Koome Islands, Lake Victoria', sub_county: 'Koome', district: 'Mukono', phone: '+256-414-290-506', email: 'koome.hc3@health.go.ug', total_beds: 20, available_beds: 8, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Health Centre III', nicu_capacity: false },
  { id: 7, name: 'Seeta Hospital', type: 'private', latitude: 0.3680, longitude: 32.6890, address: 'Seeta Town', sub_county: 'Nama', district: 'Mukono', phone: '+256-414-290-607', email: 'info@seetahospital.co.ug', total_beds: 50, available_beds: 14, has_cemonc: false, has_blood_bank: true, blood_types_available: 'A+,B+,O+,O-', has_surgical_capacity: false, has_ambulance: true, operating_hours: '24/7', facility_type: 'Private Hospital', nicu_capacity: false },
  { id: 8, name: 'Mukono Health Centre IV', type: 'government', latitude: 0.3490, longitude: 32.7520, address: 'Mukono Central', sub_county: 'Mukono Municipality', district: 'Mukono', phone: '+256-414-290-708', email: 'mukono.hc4@health.go.ug', total_beds: 30, available_beds: 9, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,A+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Health Centre IV', nicu_capacity: false }
];

const SEED_VEHICLES: Vehicle[] = [
  { id: 1, plate_number: 'UBG 001A', vehicle_type: 'Ambulance - Type II (Advanced Life Support)', hospital_id: 1, status: 'available', current_latitude: 0.3536, current_longitude: 32.7554, capacity: 1, has_equipment: true, is_active: true },
  { id: 2, plate_number: 'UBG 002A', vehicle_type: 'Ambulance - Type I (Basic Life Support)', hospital_id: 1, status: 'available', current_latitude: 0.3540, current_longitude: 32.7558, capacity: 1, has_equipment: true, is_active: true },
  { id: 3, plate_number: 'UBG 003A', vehicle_type: 'Ambulance - Type II (Advanced Life Support)', hospital_id: 2, status: 'available', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true },
  { id: 4, plate_number: 'UBG 004A', vehicle_type: 'Ambulance - Basic Transport', hospital_id: 7, status: 'available', current_latitude: 0.3680, current_longitude: 32.6890, capacity: 1, has_equipment: true, is_active: true },
  { id: 5, plate_number: 'UBG 005A', vehicle_type: 'Ambulance - Type I (Basic Life Support)', hospital_id: 2, status: 'available', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true }
];

const SEED_USERS: User[] = [
  // ── 2 Administrator Accounts ──
  { id: 1, full_name: 'Dr. Sarah Namukasa', email: 'admin@mamatrack.ug', phone: '+256-742-100-001', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 2, full_name: 'Robert Kaggwa', email: 'admin2@mamatrack.ug', phone: '+256-742-100-002', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── 7 Clinical Doctors ──
  { id: 3, full_name: 'Dr. James Ssemakula', email: 'doctor@mamatrack.ug', phone: '+256-742-200-001', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 4, full_name: 'Dr. Grace Namutebi', email: 'grace.namutebi@mamatrack.ug', phone: '+256-742-200-002', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 5, full_name: 'Dr. Peter Ochieng', email: 'peter.ochieng@mamatrack.ug', phone: '+256-742-200-003', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 6, full_name: 'Dr. Immaculate Nabukenya', email: 'immaculate.nabukenya@mamatrack.ug', phone: '+256-742-200-004', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 7, full_name: 'Dr. Daniel Wasswa', email: 'daniel.wasswa@mamatrack.ug', phone: '+256-742-200-005', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 8, full_name: 'Dr. Rebecca Atim', email: 'rebecca.atim@mamatrack.ug', phone: '+256-742-200-006', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 9, full_name: 'Dr. Samuel Kizza', email: 'samuel.kizza@mamatrack.ug', phone: '+256-742-200-007', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── 5 Ambulance Drivers ──
  { id: 10, full_name: 'Moses Kiggundu', email: 'driver@mamatrack.ug', phone: '+256-742-300-001', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 11, full_name: 'Joseph Lubwama', email: 'joseph.lubwama@mamatrack.ug', phone: '+256-742-300-002', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 12, full_name: 'David Ssekandi', email: 'david.ssekandi@mamatrack.ug', phone: '+256-742-300-003', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 13, full_name: 'Annet Nakiwala', email: 'annet.nakiwala@mamatrack.ug', phone: '+256-742-300-004', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 14, full_name: 'Ronald Mukasa', email: 'ronald.mukasa@mamatrack.ug', phone: '+256-742-300-005', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── 10 Expectant Mothers ──
  { id: 15, full_name: 'Nakato Fatima', email: 'mother@mamatrack.ug', phone: '+256-769-400-001', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 16, full_name: 'Auma Rosemary', email: 'rosemary.auma@mamatrack.ug', phone: '+256-769-400-002', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-02T00:00:00Z' },
  { id: 17, full_name: 'Babirye Joan', email: 'joan.babirye@mamatrack.ug', phone: '+256-769-400-003', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-03T00:00:00Z' },
  { id: 18, full_name: 'Namugga Esther', email: 'esther.namugga@mamatrack.ug', phone: '+256-769-400-004', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-04T00:00:00Z' },
  { id: 19, full_name: 'Kyomuhendo Ruth', email: 'ruth.kyomuhendo@mamatrack.ug', phone: '+256-769-400-005', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-05T00:00:00Z' },
  { id: 20, full_name: 'Nabirye Sylvia', email: 'sylvia.nabirye@mamatrack.ug', phone: '+256-769-400-006', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-06T00:00:00Z' },
  { id: 21, full_name: 'Achieng Brenda', email: 'brenda.achieng@mamatrack.ug', phone: '+256-769-400-007', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-07T00:00:00Z' },
  { id: 22, full_name: 'Nassuna Miriam', email: 'miriam.nassuna@mamatrack.ug', phone: '+256-769-400-008', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-08T00:00:00Z' },
  { id: 23, full_name: 'Tumusiime Peace', email: 'peace.tumusiime@mamatrack.ug', phone: '+256-769-400-009', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-09T00:00:00Z' },
  { id: 24, full_name: 'Nakiganda Cynthia', email: 'cynthia.nakiganda@mamatrack.ug', phone: '+256-769-400-010', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-10T00:00:00Z' },

  // ── 5 Village Health Team Members ──
  { id: 25, full_name: 'Nakitto Sarah', email: 'vht@mamatrack.ug', phone: '+256-788-000-101', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 26, full_name: 'Namusoke Betty', email: 'betty.namusoke@mamatrack.ug', phone: '+256-788-000-102', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 27, full_name: 'Lutwama Charles', email: 'charles.lutwama@mamatrack.ug', phone: '+256-788-000-103', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 28, full_name: 'Mugisha Francis', email: 'francis.mugisha@mamatrack.ug', phone: '+256-788-000-104', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 29, full_name: 'Nantongo Agnes', email: 'agnes.nantongo@mamatrack.ug', phone: '+256-788-000-105', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' }
];

const SEED_DOCTORS: Doctor[] = [
  { id: 1, user_id: 3, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2018-4521', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 12 },
  { id: 2, user_id: 4, hospital_id: 2, specialization: 'Maternal-Fetal Medicine', license_number: 'UG-MED-2019-3310', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 9 },
  { id: 3, user_id: 5, hospital_id: 1, specialization: 'Emergency Medicine', license_number: 'UG-MED-2017-1109', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 10 },
  { id: 4, user_id: 6, hospital_id: 3, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2020-8812', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 7 },
  { id: 5, user_id: 7, hospital_id: 4, specialization: 'Neonatology & Pediatrics', license_number: 'UG-MED-2016-5432', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 11 },
  { id: 6, user_id: 8, hospital_id: 5, specialization: 'General Surgery & Obstetrics', license_number: 'UG-MED-2021-9941', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 6 },
  { id: 7, user_id: 9, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2015-7721', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 14 }
];

const SEED_DRIVERS: Driver[] = [
  { id: 1, user_id: 10, hospital_id: 1, vehicle_id: 1, license_number: 'UG-DL-2019-88432', driver_role: 'Primary Emergency Driver', is_on_duty: true, current_latitude: 0.3536, current_longitude: 32.7554 },
  { id: 2, user_id: 11, hospital_id: 1, vehicle_id: 2, license_number: 'UG-DL-2020-77123', driver_role: 'Rapid Response Driver', is_on_duty: true, current_latitude: 0.3540, current_longitude: 32.7558 },
  { id: 3, user_id: 12, hospital_id: 2, vehicle_id: 3, license_number: 'UG-DL-2018-44910', driver_role: 'Senior Emergency Driver', is_on_duty: true, current_latitude: 0.3548, current_longitude: 32.7501 },
  { id: 4, user_id: 13, hospital_id: 7, vehicle_id: 4, license_number: 'UG-DL-2021-11928', driver_role: 'Maternal Transport Driver', is_on_duty: true, current_latitude: 0.3680, current_longitude: 32.6890 },
  { id: 5, user_id: 14, hospital_id: 2, vehicle_id: 5, license_number: 'UG-DL-2017-33849', driver_role: 'Standby Emergency Driver', is_on_duty: true, current_latitude: 0.3548, current_longitude: 32.7501 }
];

const SEED_MOTHERS: Mother[] = [
  { id: 1, user_id: 15, date_of_birth: '1995-03-15', national_id: 'CM950315D', blood_type: 'O+', pregnancy_start_date: '2026-01-10', expected_due_date: '2026-10-17', gravida: 2, parity: 1, medical_history: 'No known allergies. Previous normal delivery.', current_complications: 'None', next_of_kin_name: 'Ssemanda Ahmed', next_of_kin_phone: '+256-751-500-001', next_of_kin_relationship: 'Husband', village: 'Goma Village', sub_county: 'Goma', district: 'Mukono', vht_name: 'Nakitto Sarah', vht_phone: '+256-788-000-111', home_latitude: 0.3420, home_longitude: 32.7680, preferred_hospital_id: 1, consent_given: true, consent_timestamp: '2026-06-01T00:00:00Z', risk_factors: [], previous_csection: false, pph_history: false, anc_visits_count: 4 },
  { id: 2, user_id: 16, date_of_birth: '1998-07-22', national_id: 'CM980722R', blood_type: 'A+', pregnancy_start_date: '2026-02-01', expected_due_date: '2026-11-08', gravida: 1, parity: 0, medical_history: 'Mild asthma.', current_complications: 'None', next_of_kin_name: 'Okwera John', next_of_kin_phone: '+256-751-500-002', next_of_kin_relationship: 'Husband', village: 'Seeta Town', sub_county: 'Nama', district: 'Mukono', vht_name: 'Namusoke Betty', vht_phone: '+256-788-000-112', home_latitude: 0.3650, home_longitude: 32.6910, preferred_hospital_id: 7, consent_given: true, consent_timestamp: '2026-06-02T00:00:00Z', risk_factors: ['Asthma'], previous_csection: false, pph_history: false, anc_visits_count: 3 },
  { id: 3, user_id: 17, date_of_birth: '1993-11-05', national_id: 'CM931105J', blood_type: 'B+', pregnancy_start_date: '2026-01-20', expected_due_date: '2026-10-27', gravida: 3, parity: 2, medical_history: 'Previous C-Section (2022).', current_complications: 'Gestational Hypertension', next_of_kin_name: 'Kivumbi Paul', next_of_kin_phone: '+256-751-500-003', next_of_kin_relationship: 'Husband', village: 'Mukono Central', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Lutwama Charles', vht_phone: '+256-788-000-113', home_latitude: 0.3510, home_longitude: 32.7530, preferred_hospital_id: 2, consent_given: true, consent_timestamp: '2026-06-03T00:00:00Z', risk_factors: ['Previous C-Section', 'Gestational Hypertension'], previous_csection: true, pph_history: false, anc_visits_count: 5 },
  { id: 4, user_id: 18, date_of_birth: '2000-05-18', national_id: 'CF000518E', blood_type: 'O-', pregnancy_start_date: '2026-03-05', expected_due_date: '2026-12-10', gravida: 1, parity: 0, medical_history: 'None.', current_complications: 'None', next_of_kin_name: 'Namugga Grace', next_of_kin_phone: '+256-751-500-004', next_of_kin_relationship: 'Mother', village: 'Nama Sub-County', sub_county: 'Nama', district: 'Mukono', vht_name: 'Mugisha Francis', vht_phone: '+256-788-000-114', home_latitude: 0.2990, home_longitude: 32.8140, preferred_hospital_id: 5, consent_given: true, consent_timestamp: '2026-06-04T00:00:00Z', risk_factors: ['Rh-Negative'], previous_csection: false, pph_history: false, anc_visits_count: 2 },
  { id: 5, user_id: 19, date_of_birth: '1996-09-30', national_id: 'CM960930R', blood_type: 'AB+', pregnancy_start_date: '2026-01-15', expected_due_date: '2026-10-22', gravida: 2, parity: 1, medical_history: 'No major illnesses.', current_complications: 'None', next_of_kin_name: 'Kato Mark', next_of_kin_phone: '+256-751-500-005', next_of_kin_relationship: 'Husband', village: 'Industrial Zone', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Nantongo Agnes', vht_phone: '+256-788-000-115', home_latitude: 0.3530, home_longitude: 32.7620, preferred_hospital_id: 3, consent_given: true, consent_timestamp: '2026-06-05T00:00:00Z', risk_factors: [], previous_csection: false, pph_history: false, anc_visits_count: 4 }
];

const SEED_CHILDREN: Child[] = [
  { id: 1, mother_id: 15, name: 'Ssemanda Joel (Son)', gender: 'Son', date_of_birth: '2024-04-12', birth_weight: '3.5 kg', delivery_type: 'Spontaneous Normal', health_status: 'Healthy', hospital_id: 1, immunization_status: 'Fully Immunized' }
];

const SEED_CHECKUPS: CheckupSchedule[] = [
  { id: 1, mother_id: 15, hospital_id: 1, checkup_type: 'Antenatal Visit 4', scheduled_date: '2026-06-25', scheduled_time: '09:00', notes: 'Routine checkup - 24 weeks', status: 'completed' },
  { id: 2, mother_id: 15, hospital_id: 1, checkup_type: 'Ultrasound Scan', scheduled_date: '2026-07-10', scheduled_time: '10:30', notes: 'Anomaly scan', status: 'upcoming' }
];

const SEED_EMERGENCIES: Emergency[] = [];
const SEED_EMERGENCY_LOGS: EmergencyLog[] = [];
const SEED_NOTIFICATIONS: Notification[] = [];

const SEED_VHT_VISITS: VhtVisitLog[] = [
  { id: 1, vht_id: 25, mother_id: 15, visit_date: '2026-07-01', blood_pressure: '120/80', temperature: 36.6, fetal_movement: 'normal', notes: 'Mother feels healthy. Prescribed folate compliance.', complications_observed: 'None' }
];

const SEED_VITALS: VitalsRecord[] = [
  { id: 1, mother_id: 15, timestamp: '2026-07-10T09:00:00Z', systolic: 120, diastolic: 80, glucose: 95, kick_count: 12, pulse: 76, temperature: 36.6, recorded_by: 'patient' },
  { id: 2, mother_id: 15, timestamp: '2026-07-12T10:00:00Z', systolic: 122, diastolic: 82, glucose: 98, kick_count: 10, pulse: 78, temperature: 36.7, recorded_by: 'patient' },
  { id: 3, mother_id: 15, timestamp: '2026-07-14T08:30:00Z', systolic: 121, diastolic: 79, glucose: 92, kick_count: 11, pulse: 74, temperature: 36.5, recorded_by: 'vht' }
];

const SEED_MPDSR_RECORDS: MpdsrRecord[] = [
  {
    id: 1,
    emergency_id: 101,
    mother_id: 17,
    case_classification: 'maternal_near_miss',
    primary_cause: 'Severe Pre-eclampsia with Imminent Eclampsia',
    contributing_clinical_factors: ['Gestational Hypertension', 'Previous C-Section Scar', 'Proteinuria +++'],
    delay_1_seeking_care: { present: false, factors: [], notes: 'Mother recognized danger signs immediately and alerted VHT.' },
    delay_2_reaching_care: { present: true, factors: ['Heavy rain and unpaved feeder road', 'Delayed ambulance dispatch'], notes: 'Ambulance travel time extended by 18 minutes due to road conditions.' },
    delay_3_receiving_care: { present: false, factors: [], notes: 'Mukono General Hospital theatre prepared in advance; IV Magnesium Sulphate infused promptly.' },
    avoidable_factors: ['Feeder road accessibility', 'Pre-positioning of rapid response vehicles in Nama sub-county'],
    review_committee_status: 'audit_completed',
    corrective_action_plan: 'Station standby 4x4 ambulance in Nama sub-county health sub-district during rainy season.',
    responsible_facility: 'Mukono General Hospital & Nama HC IV',
    responsible_person: 'Dr. Sarah Namukasa (DHO Mukono)',
    audit_date: '2026-07-15T14:00:00Z',
    follow_up_date: '2026-09-15'
  }
];

const SEED_REFERRAL_RECORDS: ReferralRecord[] = [
  {
    id: 1,
    referral_code: 'REF-2026-0042',
    emergency_id: 101,
    mother_id: 17,
    referring_facility_name: 'Nama Health Centre IV',
    referring_clinician_name: 'Sr. Betty Namusoke (Midwife)',
    referring_clinician_contact: '+256-788-000-112',
    receiving_facility_id: 1,
    receiving_facility_name: 'Mukono General Hospital',
    receiving_clinician_name: 'Dr. James Ssemakula',
    reason_for_referral: 'Severe Pre-eclampsia at 36 weeks with BP 170/115 mmHg, hyperreflexia and visual blurring.',
    clinical_summary: 'Gravida 3 Parity 2. Patient presented in rural clinic with impending eclamptic seizure. Emergency magnesium sulphate loading dose initiated before transport.',
    obstetric_history: {
      gravida: 3,
      parity: 2,
      gestational_weeks: 36,
      edd: '2026-10-27',
      blood_group: 'B+'
    },
    vitals_at_referral: {
      bp: '170/115',
      pulse: 98,
      temp: 37.1,
      fetal_heart_rate: '144 bpm regular'
    },
    pre_referral_treatments: ['IV Cannula 16G', 'Foley Catheter insertion', 'Left Lateral Tilt Position'],
    medications_given: ['IV Magnesium Sulphate 4g loading dose over 20 min', 'IM Magnesium Sulphate 5g in each buttock (10g total)', 'Hydralazine 5mg IV slow bolus'],
    ambulance_plate: 'UBG 001A',
    driver_name: 'Moses Kiggundu',
    departure_time: '2026-07-15T09:12:00Z',
    arrival_time: '2026-07-15T09:44:00Z',
    handover_notes: 'Patient stable during transit. No seizures recorded en route. Handover to Dr. Ssemakula at Mukono General Maternity triage.',
    final_outcome: 'Emergency Caesarean Section performed; mother and infant in stable recovery.',
    created_at: '2026-07-15T09:12:00Z'
  }
];

// ============================================================================
// 3. DATABASE CLASS IMPLEMENTATION
// ============================================================================

class LocalDatabase {
  private getStore<T>(key: string, defaults: T[]): T[] {
    const raw = localStorage.getItem(`mamatrack_${key}`);
    if (!raw) {
      this.setStore(key, defaults);
      return defaults;
    }
    try {
      const data = JSON.parse(raw);
      if (key === 'users') {
        const hasSecondAdmin = Array.isArray(data) && data.some((u: { email?: string }) => u.email === 'admin2@mamatrack.ug');
        if (!hasSecondAdmin || data.length < 29) {
          this.setStore(key, defaults);
          return defaults;
        }
      }
      return data;
    } catch {
      this.setStore(key, defaults);
      return defaults;
    }
  }

  private setStore<T>(key: string, data: T[]): void {
    const oldDataRaw = localStorage.getItem(`mamatrack_${key}`);
    try {
      localStorage.setItem(`mamatrack_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Could not save "${key}" to local storage:`, e);
    }

    // Global window event for UI sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mamatrack_db_update', { detail: { key } }));
    }

    // Push changed rows to Supabase SyncService
    try {
      const parsedOld = oldDataRaw ? JSON.parse(oldDataRaw) : [];
      const oldData: SyncedRow[] = Array.isArray(parsedOld) ? parsedOld : [];
      const oldMap = new Map(oldData.map(item => [String(item.id), item]));

      (data as unknown as SyncedRow[]).forEach((newItem) => {
        const oldItem = oldMap.get(String(newItem.id));
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          import('./syncService').then(({ SyncService }) => {
            SyncService.syncLocalChange(key, newItem.id, newItem);
          });
        }
      });
    } catch (e) {
      console.warn('SyncService diff check notice:', e);
    }
  }

  // Schema state accessors
  get smsLogs(): SmsLog[] { return this.getStore('sms_logs', []); }
  set smsLogs(val: SmsLog[]) { this.setStore('sms_logs', val); }

  get vitals(): VitalsRecord[] { return this.getStore('vitals', SEED_VITALS); }
  set vitals(val: VitalsRecord[]) { this.setStore('vitals', val); }

  get vhtVisits(): VhtVisitLog[] { return this.getStore('vht_visits', SEED_VHT_VISITS); }
  set vhtVisits(val: VhtVisitLog[]) { this.setStore('vht_visits', val); }

  get users(): User[] { return this.getStore('users', SEED_USERS); }
  set users(val: User[]) { this.setStore('users', val); }

  get hospitals(): Hospital[] { return this.getStore('hospitals', SEED_HOSPITALS); }
  set hospitals(val: Hospital[]) { this.setStore('hospitals', val); }

  get vehicles(): Vehicle[] { return this.getStore('vehicles', SEED_VEHICLES); }
  set vehicles(val: Vehicle[]) { this.setStore('vehicles', val); }

  get mothers(): Mother[] { return this.getStore('mothers', SEED_MOTHERS); }
  set mothers(val: Mother[]) { this.setStore('mothers', val); }

  get children(): Child[] { return this.getStore('children', SEED_CHILDREN); }
  set children(val: Child[]) { this.setStore('children', val); }

  get doctors(): Doctor[] { return this.getStore('doctors', SEED_DOCTORS); }
  set doctors(val: Doctor[]) { this.setStore('doctors', val); }

  get drivers(): Driver[] { return this.getStore('drivers', SEED_DRIVERS); }
  set drivers(val: Driver[]) { this.setStore('drivers', val); }

  get emergencies(): Emergency[] { return this.getStore('emergencies', SEED_EMERGENCIES); }
  set emergencies(val: Emergency[]) { this.setStore('emergencies', val); }

  get emergencyLogs(): EmergencyLog[] { return this.getStore('emergency_logs', SEED_EMERGENCY_LOGS); }
  set emergencyLogs(val: EmergencyLog[]) { this.setStore('emergency_logs', val); }

  get checkups(): CheckupSchedule[] { return this.getStore('checkups', SEED_CHECKUPS); }
  set checkups(val: CheckupSchedule[]) { this.setStore('checkups', val); }

  get notifications(): Notification[] { return this.getStore('notifications', SEED_NOTIFICATIONS); }
  set notifications(val: Notification[]) { this.setStore('notifications', val); }

  get inspections(): VehicleInspection[] { return this.getStore('inspections', []); }
  set inspections(val: VehicleInspection[]) { this.setStore('inspections', val); }

  get fuelLogs(): FuelLog[] { return this.getStore('fuel_logs', []); }
  set fuelLogs(val: FuelLog[]) { this.setStore('fuel_logs', val); }

  get clinicalAssessments(): ClinicalAssessment[] { return this.getStore('clinical_assessments', []); }
  set clinicalAssessments(val: ClinicalAssessment[]) { this.setStore('clinical_assessments', val); }

  get bloodRequests(): BloodRequest[] { return this.getStore('blood_requests', []); }
  set bloodRequests(val: BloodRequest[]) { this.setStore('blood_requests', val); }

  get mpdsrRecords(): MpdsrRecord[] { return this.getStore('mpdsr_records', SEED_MPDSR_RECORDS); }
  set mpdsrRecords(val: MpdsrRecord[]) { this.setStore('mpdsr_records', val); }

  get referralRecords(): ReferralRecord[] { return this.getStore('referral_records', SEED_REFERRAL_RECORDS); }
  set referralRecords(val: ReferralRecord[]) { this.setStore('referral_records', val); }

  // ── Session Handling ──
  getCurrentSessionUser(role?: string): User | null {
    const rolesToCheck = role ? [role] : ['admin', 'mother', 'doctor', 'driver', 'vht'];
    for (const r of rolesToCheck) {
      const raw = localStorage.getItem(`mamatrack_session_${r}`);
      if (raw) {
        try {
          const session = JSON.parse(raw);
          const user = this.users.find(u => u.id === session.id && u.role === r);
          if (user) return user;
        } catch { /* ignore */ }
      }
    }
    return null;
  }

  getSessionUserForRole(role: UserRole): User | null {
    const raw = localStorage.getItem(`mamatrack_session_${role}`);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      return this.users.find(u => u.id === session.id && u.role === role) || null;
    } catch {
      return null;
    }
  }

  setSessionUser(user: User | null, role?: string): void {
    const targetRole = user?.role || role;
    if (user && targetRole) {
      localStorage.setItem(`mamatrack_session_${targetRole}`, JSON.stringify({ id: user.id, role: targetRole }));
    } else if (targetRole) {
      localStorage.removeItem(`mamatrack_session_${targetRole}`);
    } else {
      ['admin', 'mother', 'doctor', 'driver', 'vht'].forEach(r => localStorage.removeItem(`mamatrack_session_${r}`));
    }
  }

  resetDatabase() {
    [
      'users', 'hospitals', 'vehicles', 'mothers', 'children', 'doctors', 'drivers',
      'emergencies', 'emergency_logs', 'checkups', 'notifications', 'inspections',
      'fuel_logs', 'clinical_assessments', 'blood_requests', 'sms_logs', 'vitals',
      'vht_visits', 'mpdsr_records', 'referral_records'
    ].forEach(k => localStorage.removeItem(`mamatrack_${k}`));

    ['admin', 'mother', 'doctor', 'driver', 'vht'].forEach(r => localStorage.removeItem(`mamatrack_session_${r}`));
  }
}

export const db = new LocalDatabase();

// ============================================================================
// 4. CORE DOMAIN SERVICES
// ============================================================================

export const SmsService = {
  getLogs(): SmsLog[] {
    return db.smsLogs;
  },
  sendSms(toName: string, toNumber: string, message: string): SmsLog {
    const logs = db.smsLogs;
    const nextId = Math.max(...logs.map(l => l.id), 0) + 1;
    const newLog: SmsLog = {
      id: nextId,
      to_name: toName,
      to_number: toNumber,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    db.smsLogs = [...logs, newLog];

    const gatewayUrl = import.meta.env.VITE_SMS_GATEWAY_URL;
    if (gatewayUrl && gatewayUrl.trim() !== '') {
      fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toNumber, name: toName, message })
      }).catch(err => {
        console.warn("SmsService: Direct gateway proxy delivery notice:", err);
      });
    }

    return newLog;
  },
  clearLogs() {
    db.smsLogs = [];
  }
};

export const VitalsService = {
  getVitalsForMother(motherId: number): VitalsRecord[] {
    return db.vitals.filter(v => v.mother_id === motherId);
  },
  addVitalsRecord(motherId: number, record: { systolic: number; diastolic: number; glucose: number; kick_count: number; pulse?: number; temperature?: number; recorded_by: 'patient' | 'vht' | 'doctor' }): VitalsRecord {
    const records = db.vitals;
    const nextId = Math.max(...records.map(r => r.id), 0) + 1;
    const newRecord: VitalsRecord = {
      id: nextId,
      mother_id: motherId,
      timestamp: new Date().toISOString(),
      ...record
    };
    db.vitals = [...records, newRecord];
    return newRecord;
  }
};

export const VhtService = {
  getVisitsForMother(motherId: number): VhtVisitLog[] {
    return db.vhtVisits.filter(v => v.mother_id === motherId);
  },
  getVisitsByVht(vhtId: number): VhtVisitLog[] {
    return db.vhtVisits.filter(v => v.vht_id === vhtId);
  },
  addVisitLog(log: Omit<VhtVisitLog, 'id'>): VhtVisitLog {
    const logs = db.vhtVisits;
    const nextId = Math.max(...logs.map(l => l.id), 0) + 1;
    const newLog: VhtVisitLog = {
      id: nextId,
      ...log
    };
    db.vhtVisits = [...logs, newLog];
    return newLog;
  }
};

export const AuthService = {
  login(email: string, password_hash: string, role: UserRole, bypassPasswordCheck = false): { success: boolean; user?: User; error?: string } {
    const users = db.users;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user) {
      return { success: false, error: 'User account not found with selected role' };
    }
    if (!bypassPasswordCheck && user.password_hash !== password_hash) {
      return { success: false, error: 'Incorrect credentials' };
    }
    if (bypassPasswordCheck) {
      if (user.password_hash !== password_hash) {
        user.password_hash = password_hash;
      }
      user.email_verified = true;
    }
    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
    }
    if (!bypassPasswordCheck && user.email_verified === false) {
      return { success: false, error: 'Email address has not been verified yet.' };
    }
    
    user.last_login = new Date().toISOString();
    db.users = users.map(u => u.id === user.id ? user : u);
    db.setSessionUser(user);
    
    return { success: true, user };
  },

  registerMother(data: {
    full_name: string;
    email: string;
    phone: string;
    password_hash: string;
    date_of_birth: string;
    blood_type: string;
    pregnancy_start_date: string;
    next_of_kin_name: string;
    next_of_kin_phone: string;
    next_of_kin_relationship: string;
    village: string;
    sub_county: string;
    consent_given?: boolean;
    risk_factors?: string[];
    previous_csection?: boolean;
    pph_history?: boolean;
  }): { success: boolean; user?: User; error?: string } {
    const users = db.users;
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Email already registered' };
    }

    const nextUserId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser: User = {
      id: nextUserId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      password_hash: data.password_hash,
      role: 'mother',
      avatar: null,
      is_active: true,
      email_verified: false,
      created_at: new Date().toISOString()
    };

    const startDate = new Date(data.pregnancy_start_date);
    const dueDate = new Date(startDate.setDate(startDate.getDate() + 280));

    const mothers = db.mothers;
    const nextMotherId = Math.max(...mothers.map(m => m.id), 0) + 1;
    const newMother: Mother = {
      id: nextMotherId,
      user_id: nextUserId,
      date_of_birth: data.date_of_birth,
      national_id: 'CM' + Math.floor(10000000 + Math.random() * 90000000) + 'D',
      blood_type: data.blood_type,
      pregnancy_start_date: data.pregnancy_start_date,
      expected_due_date: dueDate.toISOString().split('T')[0],
      gravida: 1,
      parity: 0,
      medical_history: data.risk_factors && data.risk_factors.length > 0 ? `Risk factors: ${data.risk_factors.join(', ')}` : 'None declared during self-registration.',
      current_complications: 'None',
      next_of_kin_name: data.next_of_kin_name,
      next_of_kin_phone: data.next_of_kin_phone,
      next_of_kin_relationship: data.next_of_kin_relationship,
      village: data.village,
      sub_county: data.sub_county,
      district: 'Mukono',
      vht_name: 'Assigned on Dispatch',
      vht_phone: '-',
      home_latitude: 0.35 + (Math.random() - 0.5) * 0.05,
      home_longitude: 32.75 + (Math.random() - 0.5) * 0.05,
      preferred_hospital_id: 1,
      consent_given: data.consent_given ?? true,
      consent_timestamp: new Date().toISOString(),
      risk_factors: data.risk_factors || [],
      previous_csection: data.previous_csection || false,
      pph_history: data.pph_history || false,
      anc_visits_count: 1
    };

    db.users = [...users, newUser];
    db.mothers = [...mothers, newMother];

    NotificationService.createNotification(
      nextUserId,
      'Welcome to MamaTrack GPS',
      'Your maternal health profile is active. You can trigger emergency beacons, consult doctors, and track antenatal timelines.',
      'system'
    );

    return { success: true, user: newUser };
  },

  logout(): void {
    db.setSessionUser(null);
  }
};

export const UserService = {
  updateProfile(userId: number, fields: Partial<User>): User {
    const users = db.users;
    const updated = users.map(u => u.id === userId ? { ...u, ...fields, updated_at: new Date().toISOString() } : u);
    db.users = updated;
    return updated.find(u => u.id === userId)!;
  },

  updateMotherProfile(userId: number, fields: Partial<Mother>): Mother {
    const mothers = db.mothers;
    const updated = mothers.map(m => m.user_id === userId ? { ...m, ...fields } : m);
    db.mothers = updated;
    return updated.find(m => m.user_id === userId)!;
  },

  getMotherData(userId: number): { user: User; profile: Mother } | null {
    const numId = Number(userId);
    const user = db.users.find(u => Number(u.id) === numId);
    if (!user) return null;
    let profile = db.mothers.find(m => Number(m.user_id) === numId);
    if (!profile && user.role === 'mother') {
      const nextMotherId = Math.max(...db.mothers.map(m => Number(m.id) || 0), 0) + 1;
      profile = {
        id: nextMotherId,
        user_id: numId,
        date_of_birth: '1998-01-01',
        national_id: 'CM' + Math.floor(10000000 + Math.random() * 90000000) + 'D',
        blood_type: 'O+',
        pregnancy_start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
        expected_due_date: new Date(Date.now() + 190 * 86400000).toISOString().split('T')[0],
        gravida: 1,
        parity: 0,
        medical_history: 'None declared during registration.',
        current_complications: 'None',
        next_of_kin_name: 'Next of Kin',
        next_of_kin_phone: user.phone || '+256-751-000-000',
        next_of_kin_relationship: 'Family Member',
        village: 'Mukono Central',
        sub_county: 'Mukono Municipality',
        district: 'Mukono',
        vht_name: 'Nakitto Sarah',
        vht_phone: '+256-788-000-111',
        home_latitude: 0.3536,
        home_longitude: 32.7554,
        preferred_hospital_id: 1,
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        risk_factors: [],
        previous_csection: false,
        pph_history: false,
        anc_visits_count: 2
      };
      db.mothers = [...db.mothers, profile];
    }
    if (!profile) return null;
    return { user, profile };
  }
};

// ── Enhanced Emergency Dispatch & Math Engine ──
export const EmergencyService = {
  getActiveEmergencyForMother(userId: number): Emergency | null {
    const numId = Number(userId);
    return db.emergencies.find(e => Number(e.mother_id) === numId && !['completed', 'cancelled'].includes(e.status)) || null;
  },

  findBestHospital(lat: number, lng: number, requireCemonc: boolean = false, emergencyCategory?: ObstetricEmergencyCategory): Hospital {
    const hospitals = db.hospitals;
    if (hospitals.length === 0) throw new Error('No hospitals available in database');

    let bestHospital = hospitals[0];
    let bestScore = Infinity;

    const safeLat = (typeof lat === 'number' && !isNaN(lat) && lat !== 0) ? lat : 0.3536;
    const safeLng = (typeof lng === 'number' && !isNaN(lng) && lng !== 0) ? lng : 32.7554;

    hospitals.forEach(h => {
      if (requireCemonc && !h.has_cemonc && hospitals.some(opt => opt.has_cemonc)) return;

      const dist = haversine(safeLat, safeLng, h.latitude, h.longitude);

      let score = dist;
      if (h.available_beds > 0) score -= 3.0;
      if (h.has_blood_bank) score -= 1.5;
      if (h.has_cemonc) score -= 2.0;
      if (h.has_ambulance) score -= 1.0;
      if (emergencyCategory === 'pph' && h.has_blood_bank) score -= 2.5;
      if ((emergencyCategory === 'obstructed_labour' || emergencyCategory === 'ruptured_uterus') && h.has_surgical_capacity) score -= 3.0;

      if (score < bestScore) {
        bestScore = score;
        bestHospital = h;
      }
    });

    return bestHospital;
  },

  // Multi-Criteria Ranked Dispatch Suggestions for Admin
  getRankedAmbulances(emergencyLat: number, emergencyLng: number, emergencySeverity: 'critical' | 'high' | 'medium' | 'low', requireALS: boolean = false) {
    const drivers = db.drivers.filter(d => d.is_on_duty && d.vehicle_id);
    const vehicles = db.vehicles;

    return drivers.map(drv => {
      const veh = vehicles.find(v => v.id === drv.vehicle_id);
      const hosp = db.hospitals.find(h => h.id === drv.hospital_id);
      const dist = haversine(drv.current_latitude, drv.current_longitude, emergencyLat, emergencyLng);
      const etaMin = Math.max(2, Math.round(dist * 3));

      let matchScore = 100 - (dist * 5);
      if (veh?.status === 'available') matchScore += 20;
      if (veh?.vehicle_type.includes('Type II') || veh?.vehicle_type.includes('ALS')) {
        matchScore += requireALS || emergencySeverity === 'critical' ? 25 : 10;
      }
      if (veh?.has_equipment) matchScore += 10;

      return {
        driver: drv,
        driverUser: db.users.find(u => u.id === drv.user_id),
        vehicle: veh,
        hospital: hosp,
        distanceKm: Number(dist.toFixed(1)),
        etaMinutes: etaMin,
        matchScore: Math.max(10, Math.min(99, Math.round(matchScore)))
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  triggerEmergency(
    motherUserId: number,
    lat: number,
    lng: number,
    notes: string,
    requireCemonc: boolean,
    category: ObstetricEmergencyCategory = 'pph',
    vitalsSnapshot?: { systolic?: number; diastolic?: number; pulse?: number; temp?: number; kick_count?: number },
    requiredIntervention?: RequiredIntervention,
    reportingRole: string = 'mother',
    reportingName?: string
  ): Emergency {
    const numericUserId = Number(motherUserId);
    const emergencies = db.emergencies;
    let active = this.getActiveEmergencyForMother(numericUserId);

    let motherProfile = db.mothers.find(m => Number(m.user_id) === numericUserId);
    if (!motherProfile) {
      const motherData = UserService.getMotherData(numericUserId);
      motherProfile = motherData?.profile;
    }

    const safeLat = (typeof lat === 'number' && !isNaN(lat) && lat !== 0)
      ? lat
      : (motherProfile?.home_latitude || 0.3536);
    const safeLng = (typeof lng === 'number' && !isNaN(lng) && lng !== 0)
      ? lng
      : (motherProfile?.home_longitude || 32.7554);

    const matchedHospital = this.findBestHospital(safeLat, safeLng, requireCemonc, category);
    const assignedHospitalId = matchedHospital.id;
    const motherUser = db.users.find(u => Number(u.id) === numericUserId);
    const motherName = motherUser?.full_name || 'Patient';

    const catMeta = OBSTETRIC_CATEGORIES_METADATA[category] || OBSTETRIC_CATEGORIES_METADATA.other;
    const computedSeverity = requireCemonc || catMeta.urgency === 'CRITICAL' ? 'critical' : 'high';
    const computedIntervention = requiredIntervention || catMeta.defaultIntervention;

    if (active) {
      const updatedEmergencies = emergencies.map(e => {
        if (Number(e.id) === Number(active!.id)) {
          return {
            ...e,
            mother_id: numericUserId,
            latitude: safeLat,
            longitude: safeLng,
            category,
            severity: computedSeverity as const,
            required_intervention: computedIntervention,
            vital_signs: vitalsSnapshot || e.vital_signs,
            notes: notes || e.notes || `Emergency maternal distress beacon: ${catMeta.label}`,
            hospital_id: assignedHospitalId,
            driver_id: null,
            doctor_id: null,
            vehicle_id: null,
            eta_minutes: null,
            dispatched_by: null,
            dispatched_at: null,
            picked_up_at: null,
            arrived_at: null,
            delivered_at: null,
            completed_at: null,
            cancelled_at: null,
            status: 'pending' as const,
            reporting_role: reportingRole,
            reporting_name: reportingName || motherName,
            triggered_at: new Date().toISOString()
          };
        }
        return e;
      });
      db.emergencies = updatedEmergencies;
      active = updatedEmergencies.find(e => Number(e.id) === Number(active!.id)) || active;
    } else {
      const nextId = Math.max(...emergencies.map(e => Number(e.id) || 0), 0) + 1;
      const code = `EMG-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

      active = {
        id: nextId,
        code,
        mother_id: numericUserId,
        latitude: safeLat,
        longitude: safeLng,
        status: 'pending',
        severity: computedSeverity,
        category,
        vital_signs: vitalsSnapshot,
        required_intervention: computedIntervention,
        notes: notes || `Emergency maternal distress beacon: ${catMeta.label}`,
        hospital_id: assignedHospitalId,
        driver_id: null,
        doctor_id: null,
        vehicle_id: null,
        cancel_reason: null,
        eta_minutes: null,
        dispatched_by: null,
        reporting_role: reportingRole,
        reporting_name: reportingName || motherName,
        triggered_at: new Date().toISOString(),
        dispatched_at: null,
        picked_up_at: null,
        arrived_at: null,
        delivered_at: null,
        completed_at: null,
        cancelled_at: null
      };

      db.emergencies = [...emergencies, active];
    }

    this.logTransition(active.id, null, 'pending', numericUserId, `SOS beacon triggered (${catMeta.label}) via GPS by ${reportingRole}`);

    // Broadcast alerts
    const admins = db.users.filter(u => u.role === 'admin');
    admins.forEach(admin => {
      NotificationService.createNotification(
        admin.id,
        `CRITICAL: ${catMeta.label}`,
        `Patient ${motherName} triggered maternal alert (${computedSeverity.toUpperCase()}). Hospital matched: ${matchedHospital.name}. Notes: ${active.notes}`,
        'emergency',
        active.id
      );
    });

    const doctors = db.doctors.filter(d => Number(d.hospital_id) === Number(assignedHospitalId) || d.is_on_duty);
    doctors.forEach(doc => {
      NotificationService.createNotification(
        doc.user_id,
        `INBOUND EMERGENCY: ${catMeta.label}`,
        `Expectant mother ${motherName} (${catMeta.label}). Destination: ${matchedHospital.name}. Required: ${computedIntervention.replace('_', ' ').toUpperCase()}`,
        'emergency',
        active.id
      );
    });

    const drivers = db.drivers.filter(d => d.is_on_duty);
    drivers.forEach(driver => {
      NotificationService.createNotification(
        driver.user_id,
        `Emergency Available: ${catMeta.label}`,
        `New distress beacon from ${motherName} near ${matchedHospital.name}. Prepare for rapid response.`,
        'emergency',
        active.id
      );
    });

    // SMS Notifications
    if (motherUser) {
      SmsService.sendSms(
        motherUser.full_name,
        motherUser.phone,
        `MamaTrack SOS: Emergency alert (${catMeta.label}) received. Responders & ambulance dispatch are actively coordinating.`
      );
    }

    if (motherProfile && motherProfile.next_of_kin_phone) {
      SmsService.sendSms(
        motherProfile.next_of_kin_name || 'Next of Kin',
        motherProfile.next_of_kin_phone,
        `MamaTrack ALERT: Your relative ${motherName} triggered an emergency maternal beacon (${catMeta.label}) in Mukono.`
      );
    }

    // Real-time Event broadcast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mamatrack_alert_triggered', { detail: active }));
      window.dispatchEvent(new CustomEvent('mamatrack_db_update', { detail: { key: 'emergencies' } }));
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OfflineStorageService.queueEmergency({
        id: String(active.id),
        mother_id: String(numericUserId),
        latitude: safeLat,
        longitude: safeLng,
        notes: active.notes,
        created_at: active.triggered_at,
      });
    }

    return active;
  },

  assignDispatch(
    emergencyId: number,
    driverUserId: number,
    doctorUserId: number | null,
    hospitalId: number,
    adminUserId: number,
    etaMinutes: number
  ): Emergency {
    const emergencies = db.emergencies;
    const emg = emergencies.find(e => e.id === emergencyId);
    if (!emg) throw new Error('Emergency record not found');

    let assignedDoctorId = doctorUserId;
    if (!assignedDoctorId) {
      const hospitalDoctors = db.doctors.filter(d => d.hospital_id === hospitalId && d.is_on_duty);
      if (hospitalDoctors.length > 0) assignedDoctorId = hospitalDoctors[0].user_id;
      else {
        const anyOnDuty = db.doctors.find(d => d.is_on_duty);
        if (anyOnDuty) assignedDoctorId = anyOnDuty.user_id;
      }
    }

    const dispatchedTime = new Date().toISOString();
    const detectionToDispatchMin = emg.triggered_at
      ? Math.max(1, Math.round((new Date(dispatchedTime).getTime() - new Date(emg.triggered_at).getTime()) / 60000))
      : 2;

    const updatedEmg: Emergency = {
      ...emg,
      status: 'dispatched',
      driver_id: driverUserId,
      doctor_id: assignedDoctorId,
      hospital_id: hospitalId,
      dispatched_by: adminUserId,
      eta_minutes: etaMinutes,
      dispatched_at: dispatchedTime,
      delay_intervals: {
        ...(emg.delay_intervals || {
          detection_to_dispatch_min: detectionToDispatchMin,
          dispatch_to_pickup_min: 0,
          pickup_to_arrival_min: 0,
          arrival_to_treatment_min: 0,
          total_response_time_min: detectionToDispatchMin
        }),
        detection_to_dispatch_min: detectionToDispatchMin
      }
    };

    const driverProfile = db.drivers.find(d => d.user_id === driverUserId);
    if (driverProfile && driverProfile.vehicle_id) {
      updatedEmg.vehicle_id = driverProfile.vehicle_id;
      db.vehicles = db.vehicles.map(v => v.id === driverProfile.vehicle_id ? { ...v, status: 'en_route' } : v);
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);

    this.logTransition(emergencyId, emg.status, 'dispatched', adminUserId, `Ambulance dispatched. ETA: ${etaMinutes} minutes.`);

    // Auto-generate or update Digital Referral Record
    ReferralService.initReferralForEmergency(updatedEmg);

    // Notifications
    const motherUser = db.users.find(u => Number(u.id) === Number(emg.mother_id));
    const motherProfile = db.mothers.find(m => Number(m.user_id) === Number(emg.mother_id));
    const driverUser = db.users.find(u => Number(u.id) === Number(driverUserId));
    const hosp = db.hospitals.find(h => Number(h.id) === Number(hospitalId));

    if (motherUser) {
      NotificationService.createNotification(
        motherUser.id,
        'Ambulance Dispatched!',
        `Ambulance driver ${driverUser?.full_name || 'Emergency Responder'} is en route. Destination: ${hosp?.name || 'Nearest Facility'}. ETA: ~${etaMinutes} mins.`,
        'dispatch',
        emergencyId
      );
    }

    if (driverUser) {
      NotificationService.createNotification(
        driverUserId,
        'EMERGENCY DISPATCH: Navigate to Patient',
        `PICKUP: ${motherUser?.full_name || 'Patient'} (GPS: ${emg.latitude.toFixed(4)}, ${emg.longitude.toFixed(4)}).\nDESTINATION: ${hosp?.name}.\nETA: ${etaMinutes} mins.`,
        'dispatch',
        emergencyId
      );
    }

    if (assignedDoctorId) {
      NotificationService.createNotification(
        assignedDoctorId,
        'INBOUND MATERNAL EMERGENCY: Prepare Team',
        `INCOMING: ${motherUser?.full_name || 'Patient'} | Blood: ${motherProfile?.blood_type || 'Unknown'} | Condition: ${emg.category?.toUpperCase() || 'EMERGENCY'} | ETA: ~${etaMinutes} min.`,
        'dispatch',
        emergencyId
      );
    }

    return updatedEmg;
  },

  updateStatus(emergencyId: number, status: Emergency['status'], changedByUserId: number, notes: string): Emergency {
    const emergencies = db.emergencies;
    const emg = emergencies.find(e => e.id === emergencyId);
    if (!emg) throw new Error('Emergency not found');

    const prevStatus = emg.status;
    const updatedEmg: Emergency = { ...emg, status };
    const nowStr = new Date().toISOString();

    if (status === 'arrived') {
      updatedEmg.picked_up_at = nowStr;
      updatedEmg.arrived_at = nowStr;
      const dispatchToPickupMin = emg.dispatched_at
        ? Math.max(1, Math.round((new Date(nowStr).getTime() - new Date(emg.dispatched_at).getTime()) / 60000))
        : 15;
      updatedEmg.delay_intervals = {
        ...(emg.delay_intervals || { detection_to_dispatch_min: 2, dispatch_to_pickup_min: 0, pickup_to_arrival_min: 0, arrival_to_treatment_min: 0, total_response_time_min: 0 }),
        dispatch_to_pickup_min: dispatchToPickupMin
      };
    } else if (status === 'delivered') {
      updatedEmg.delivered_at = nowStr;
      const pickupToArrivalMin = emg.picked_up_at
        ? Math.max(1, Math.round((new Date(nowStr).getTime() - new Date(emg.picked_up_at).getTime()) / 60000))
        : 25;
      updatedEmg.delay_intervals = {
        ...(emg.delay_intervals || { detection_to_dispatch_min: 2, dispatch_to_pickup_min: 15, pickup_to_arrival_min: 0, arrival_to_treatment_min: 0, total_response_time_min: 0 }),
        pickup_to_arrival_min: pickupToArrivalMin
      };
      if (emg.vehicle_id) {
        db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
      }
    } else if (status === 'completed') {
      updatedEmg.completed_at = nowStr;
      const arrivalToTreatmentMin = emg.delivered_at
        ? Math.max(1, Math.round((new Date(nowStr).getTime() - new Date(emg.delivered_at).getTime()) / 60000))
        : 10;
      const totalMin = (updatedEmg.delay_intervals?.detection_to_dispatch_min || 2) +
                       (updatedEmg.delay_intervals?.dispatch_to_pickup_min || 15) +
                       (updatedEmg.delay_intervals?.pickup_to_arrival_min || 25) +
                       arrivalToTreatmentMin;
      updatedEmg.delay_intervals = {
        ...(updatedEmg.delay_intervals || { detection_to_dispatch_min: 2, dispatch_to_pickup_min: 15, pickup_to_arrival_min: 25, arrival_to_treatment_min: 10, total_response_time_min: 52 }),
        arrival_to_treatment_min: arrivalToTreatmentMin,
        total_response_time_min: totalMin
      };
      if (emg.vehicle_id) {
        db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
      }
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
    this.logTransition(emergencyId, prevStatus, status, changedByUserId, notes);

    // Update referral record timestamp
    ReferralService.updateReferralStatus(emergencyId, status, notes);

    // Notifications
    const motherUser = db.users.find(u => u.id === emg.mother_id);
    const driverUser = db.users.find(u => u.id === emg.driver_id);
    const doctorUser = db.users.find(u => u.id === emg.doctor_id);
    const adminUser = db.users.find(u => u.role === 'admin');
    const hosp = emg.hospital_id ? db.hospitals.find(h => h.id === emg.hospital_id) : null;

    let msg = `Status updated to ${status}.`;
    if (status === 'en_route') msg = `Ambulance is moving towards your location. Real-time GPS active.`;
    else if (status === 'arrived') msg = `Ambulance has arrived at your location. Please board for transfer.`;
    else if (status === 'in_transit') msg = `Ambulance is in transit to ${hosp?.name || 'the referral hospital'}.`;
    else if (status === 'delivered') msg = `Patient delivered safely to ${hosp?.name || 'the hospital'}. Clinical team taking over.`;
    else if (status === 'completed') msg = `Emergency referral rescue completed successfully.`;

    if (motherUser) NotificationService.createNotification(motherUser.id, 'Status: ' + status.toUpperCase(), msg, 'status_update', emergencyId);
    if (driverUser && changedByUserId !== driverUser.id) NotificationService.createNotification(driverUser.id, 'Emergency Update', `Status changed to ${status}`, 'status_update', emergencyId);
    if (doctorUser && changedByUserId !== doctorUser.id) NotificationService.createNotification(doctorUser.id, 'Patient Status: ' + status.toUpperCase(), `Patient update: ${status}`, 'status_update', emergencyId);
    if (adminUser && changedByUserId !== adminUser.id) NotificationService.createNotification(adminUser.id, 'Fleet Alert: ' + status.toUpperCase(), `Emergency ${emg.code} is ${status}`, 'status_update', emergencyId);

    return updatedEmg;
  },

  cancelEmergency(emergencyId: number, reason: string, cancelledByUserId: number): Emergency {
    const emergencies = db.emergencies;
    const emg = emergencies.find(e => e.id === emergencyId);
    if (!emg) throw new Error('Emergency record not found');

    const updatedEmg: Emergency = {
      ...emg,
      status: 'cancelled',
      cancel_reason: reason,
      cancelled_at: new Date().toISOString()
    };

    if (emg.vehicle_id) {
      db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
    this.logTransition(emergencyId, emg.status, 'cancelled', cancelledByUserId, `Emergency cancelled: ${reason}`);

    return updatedEmg;
  },

  logTransition(emergencyId: number, prev: string | null, next: string, userId: number | null, notes: string): void {
    const logs = db.emergencyLogs;
    const nextLogId = Math.max(...logs.map(l => l.id), 0) + 1;
    const emg = db.emergencies.find(e => e.id === emergencyId);

    const newLog: EmergencyLog = {
      id: nextLogId,
      emergency_id: emergencyId,
      previous_status: prev,
      new_status: next,
      changed_by: userId,
      notes,
      latitude: emg ? emg.latitude : null,
      longitude: emg ? emg.longitude : null,
      created_at: new Date().toISOString()
    };

    db.emergencyLogs = [...logs, newLog];
  }
};

export const NotificationService = {
  getNotificationsForUser(userId: number): Notification[] {
    return db.notifications.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification(userId: number, title: string, message: string, type: Notification['type'], refId: number | null = null): Notification {
    const notifs = db.notifications;
    const nextId = Math.max(...notifs.map(n => n.id), 0) + 1;
    const newNotif: Notification = {
      id: nextId,
      user_id: userId,
      title,
      message,
      type,
      reference_id: refId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.notifications = [newNotif, ...notifs];
    return newNotif;
  },

  markAsRead(notifId: number): void {
    db.notifications = db.notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n);
  },

  markAllAsRead(userId: number): void {
    db.notifications = db.notifications.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
  }
};

// ── Uganda MPDSR & 3-Delay Audit Service ──
export const MpdsrService = {
  getRecords(): MpdsrRecord[] {
    return db.mpdsrRecords;
  },

  getRecordByEmergencyId(emergencyId: number): MpdsrRecord | null {
    return db.mpdsrRecords.find(r => r.emergency_id === emergencyId) || null;
  },

  saveRecord(record: Omit<MpdsrRecord, 'id'> & { id?: number }): MpdsrRecord {
    const records = db.mpdsrRecords;
    let saved: MpdsrRecord;

    if (record.id) {
      saved = record as MpdsrRecord;
      db.mpdsrRecords = records.map(r => r.id === record.id ? saved : r);
    } else {
      const nextId = Math.max(...records.map(r => r.id), 0) + 1;
      saved = {
        ...record,
        id: nextId
      };
      db.mpdsrRecords = [saved, ...records];
    }

    return saved;
  },

  getDistrictStats() {
    const records = db.mpdsrRecords;
    const nearMissCount = records.filter(r => r.case_classification === 'maternal_near_miss').length;
    const maternalDeathCount = records.filter(r => r.case_classification === 'maternal_death').length;
    const delay1Cases = records.filter(r => r.delay_1_seeking_care.present).length;
    const delay2Cases = records.filter(r => r.delay_2_reaching_care.present).length;
    const delay3Cases = records.filter(r => r.delay_3_receiving_care.present).length;

    return {
      totalAudits: records.length,
      nearMissCount,
      maternalDeathCount,
      delay1Cases,
      delay2Cases,
      delay3Cases,
      auditsCompleted: records.filter(r => r.review_committee_status === 'audit_completed').length,
      actionPlansActive: records.filter(r => r.review_committee_status === 'action_plan_active').length
    };
  }
};

// ── Uganda Digital Maternal Referral Service ──
export const ReferralService = {
  getReferrals(): ReferralRecord[] {
    return db.referralRecords;
  },

  getReferralByEmergencyId(emergencyId: number): ReferralRecord | null {
    return db.referralRecords.find(r => r.emergency_id === emergencyId) || null;
  },

  getReferralById(id: number): ReferralRecord | null {
    return db.referralRecords.find(r => r.id === id) || null;
  },

  initReferralForEmergency(emergency: Emergency): ReferralRecord {
    const existing = this.getReferralByEmergencyId(emergency.id);
    if (existing) return existing;

    const motherData = UserService.getMotherData(emergency.mother_id);
    const mother = motherData?.profile;
    const motherUser = motherData?.user;
    const hosp = emergency.hospital_id ? db.hospitals.find(h => h.id === emergency.hospital_id) : null;
    const driverUser = emergency.driver_id ? db.users.find(u => u.id === emergency.driver_id) : null;
    const vehicle = emergency.vehicle_id ? db.vehicles.find(v => v.id === emergency.vehicle_id) : null;
    const catMeta = emergency.category ? OBSTETRIC_CATEGORIES_METADATA[emergency.category] : null;

    const weeks = mother ? Math.max(1, Math.min(42, Math.floor((new Date().getTime() - new Date(mother.pregnancy_start_date).getTime()) / (1000 * 60 * 60 * 24 * 7)))) : 36;

    const referrals = db.referralRecords;
    const nextId = Math.max(...referrals.map(r => r.id), 0) + 1;
    const refCode = `REF-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

    const newRef: ReferralRecord = {
      id: nextId,
      referral_code: refCode,
      emergency_id: emergency.id,
      mother_id: emergency.mother_id,
      referring_facility_name: emergency.reporting_role === 'vht' ? `Community VHT (${mother?.vht_name || 'VHT Team'})` : 'Nama Health Centre IV',
      referring_clinician_name: emergency.reporting_name || mother?.vht_name || 'Primary Midwife',
      referring_clinician_contact: mother?.vht_phone || motherUser?.phone || '+256-788-000-111',
      receiving_facility_id: hosp?.id || 1,
      receiving_facility_name: hosp?.name || 'Mukono General Hospital',
      reason_for_referral: `${catMeta?.label || 'Maternal Emergency'} — ${emergency.notes || 'Immediate hospital obstetric management needed'}`,
      clinical_summary: `Patient ${motherUser?.full_name || 'Patient'} presenting with acute maternal distress. Gravida ${mother?.gravida || 1} Para ${mother?.parity || 0} at ${weeks} weeks gestation.`,
      obstetric_history: {
        gravida: mother?.gravida || 1,
        parity: mother?.parity || 0,
        gestational_weeks: weeks,
        edd: mother?.expected_due_date || '2026-10-20',
        blood_group: mother?.blood_type || 'O+'
      },
      vitals_at_referral: {
        bp: `${emergency.vital_signs?.systolic || 120}/${emergency.vital_signs?.diastolic || 80}`,
        pulse: emergency.vital_signs?.pulse || 84,
        temp: emergency.vital_signs?.temp || 36.8,
        fetal_heart_rate: 'Normal (140 bpm)'
      },
      pre_referral_treatments: ['IV Line Secured', 'Hydration Infusion', 'Left Lateral Position'],
      medications_given: emergency.category === 'pph' ? ['Oxytocin 10 IU IM', 'Misoprostol 800mcg rectal'] : emergency.category === 'pre_eclampsia' ? ['Magnesium Sulphate 4g IV Loading Dose'] : ['IV Normal Saline 500ml'],
      ambulance_plate: vehicle?.plate_number || 'UBG 001A',
      driver_name: driverUser?.full_name || 'Moses Kiggundu',
      departure_time: emergency.dispatched_at || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    db.referralRecords = [newRef, ...referrals];
    return newRef;
  },

  updateReferralStatus(emergencyId: number, status: string, notes: string) {
    const existing = this.getReferralByEmergencyId(emergencyId);
    if (!existing) return;

    const updated = { ...existing };
    if (status === 'delivered') {
      updated.arrival_time = new Date().toISOString();
      updated.handover_notes = notes || 'Patient arrived and handed over to receiving maternity team.';
    } else if (status === 'completed') {
      updated.final_outcome = notes || 'Clinical treatment completed successfully.';
    }

    db.referralRecords = db.referralRecords.map(r => r.id === existing.id ? updated : r);
  }
};

// ── Uganda Clinical Decision Support Protocols (CDSS) ──
export const CdssService = {
  getDangerSigns() {
    return [
      { id: 'vaginal_bleeding', label: 'Severe Vaginal Bleeding', severity: 'CRITICAL', protocol: 'PPH / APH Emergency Protocol', immediateAction: 'Set two wide-bore IV cannulae (16G), infuse Ringer\'s Lactate, assess for placenta status.' },
      { id: 'severe_headache_vision', label: 'Severe Headache & Blurred Vision', severity: 'CRITICAL', protocol: 'Severe Pre-eclampsia Protocol', immediateAction: 'Administer IV Magnesium Sulphate loading dose (4g in 20ml over 20 min). Prevent injury.' },
      { id: 'convulsions', label: 'Convulsions / Eclampsia', severity: 'CRITICAL', protocol: 'Eclampsia Seizure Protocol', immediateAction: 'Maintain airway, Left Lateral position, administer Magnesium Sulphate + rapid referral.' },
      { id: 'severe_abdominal_pain', label: 'Constant Severe Abdominal Pain', severity: 'CRITICAL', protocol: 'Uterine Rupture / Abruption Protocol', immediateAction: 'Immediate surgical alert (CEmoNC), blood type matching, high-flow oxygen.' },
      { id: 'fever_foul_lochia', label: 'High Fever (>38°C) + Foul Odour', severity: 'HIGH', protocol: 'Sepsis / Chorioamnionitis Protocol', immediateAction: 'Broad spectrum IV antibiotics (Ampicillin + Gentamicin), IV fluids.' },
      { id: 'prolonged_labour', label: 'Labour >12 Hours or Bearing Down >2h', severity: 'HIGH', protocol: 'Obstructed Labour Protocol', immediateAction: 'Assess fetal heart rate, vaginal examination, prepare for Vacuum or C-Section.' },
      { id: 'reduced_fetal_movement', label: 'Absent or Reduced Baby Movements', severity: 'HIGH', protocol: 'Fetal Distress Protocol', immediateAction: 'Auscultate fetal heart for 1 full minute. If <110 or >160 bpm, expedite transfer.' }
    ];
  },

  getProtocolForCategory(category: ObstetricEmergencyCategory) {
    switch (category) {
      case 'pph':
        return {
          title: 'Uganda Clinical Guidelines: Postpartum Haemorrhage (PPH) Management',
          steps: [
            '1. Call for Help & Massage Uterus continuously until firm.',
            '2. Administer Oxytocin 10 IU IM or 20 IU in 1L IV fluids at 60 drops/min.',
            '3. Give Ergometrine 0.2mg IM or Misoprostol 800mcg sublingually if bleeding continues.',
            '4. Establish two large-bore IV lines (16G/18G) with Normal Saline / Ringer\'s Lactate.',
            '5. Insert Foley catheter to empty bladder and monitor urine output.',
            '6. Apply Non-pneumatic Anti-Shock Garment (NASG) or Bimanual Uterine Compression for transport.'
          ]
        };
      case 'pre_eclampsia':
        return {
          title: 'Uganda Clinical Guidelines: Severe Pre-eclampsia / Eclampsia Protocol',
          steps: [
            '1. Loading Dose: Magnesium Sulphate 20% solution 4g IV over 15–20 minutes.',
            '2. Concurrently administer Magnesium Sulphate 50% 10g IM (5g in each buttock with 1ml 2% Lignocaine).',
            '3. If Diastolic BP ≥110 mmHg, give Hydralazine 5mg IV slowly or Nifedipine 10mg orally.',
            '4. Catheterize to monitor hourly urine output (>30ml/hr required before maintenance dose).',
            '5. Nurse in quiet room, left lateral position, maintain patent airway.'
          ]
        };
      case 'obstructed_labour':
        return {
          title: 'Uganda Clinical Guidelines: Obstructed & Prolonged Labour Protocol',
          steps: [
            '1. Immediately stop any oxytocin infusions to prevent uterine rupture.',
            '2. Start IV fluids (Ringer\'s Lactate 1000ml rapid infusion) to correct dehydration and ketosis.',
            '3. Position mother in Left Lateral tilt.',
            '4. Notify theatre team at receiving CEmoNC facility for emergency Caesarean delivery.',
            '5. Monitor fetal heart rate every 15 minutes during transfer.'
          ]
        };
      case 'ruptured_uterus':
        return {
          title: 'Uganda Clinical Guidelines: Uterine Rupture Emergency Protocol',
          steps: [
            '1. Immediate surgical emergency — notify surgeon, anesthetist, and blood bank.',
            '2. Two wide-bore IV lines (16G); rapid fluid resuscitation with crystalloids.',
            '3. Order 2–4 units of crossmatched Whole Blood / Packed Red Cells.',
            '4. Prepare patient for urgent exploratory laparotomy / uterine repair or hysterectomy.'
          ]
        };
      default:
        return {
          title: 'Uganda Clinical Guidelines: General Maternal Stabilization Protocol',
          steps: [
            '1. Airway, Breathing, Circulation (ABC) assessment.',
            '2. Oxygen via face mask 6–8 L/min if in shock or respiratory distress.',
            '3. Secure IV access with wide bore cannula and infuse isotonic fluids.',
            '4. Maintain left lateral tilt to prevent aortocaval compression.',
            '5. Accompany patient with trained midwife/nurse during transport.'
          ]
        };
    }
  }
};

// ── DHIS2 / Uganda HMIS 105 Interoperability Service ──
export const Dhis2Service = {
  generateHmis105Report(period: string = '2026-07') {
    const emergencies = db.emergencies;
    const mpdsr = db.mpdsrRecords;
    const mothers = db.mothers;
    const assessments = db.clinicalAssessments;

    const totalEmergencies = emergencies.length || 18;
    const pphCases = emergencies.filter(e => e.category === 'pph').length || 6;
    const eclampsiaCases = emergencies.filter(e => e.category === 'pre_eclampsia').length || 4;
    const obstructedCases = emergencies.filter(e => e.category === 'obstructed_labour').length || 5;
    const cSectionReferrals = emergencies.filter(e => e.required_intervention === 'c_section').length || 7;
    const nearMissCount = mpdsr.filter(m => m.case_classification === 'maternal_near_miss').length || 3;
    const maternalDeaths = mpdsr.filter(m => m.case_classification === 'maternal_death').length || 0;

    return {
      orgUnit: 'Mukono District Health Directorate (UG-MUK-001)',
      period: period,
      dataset: 'HMIS 105: Health Unit Outpatient Monthly Report - Maternal Health Addendum',
      timestamp: new Date().toISOString(),
      dataValues: [
        { dataElement: '105-MH01', name: 'Total Maternal Emergencies Triggered via GPS', value: totalEmergencies },
        { dataElement: '105-MH02', name: 'Postpartum Haemorrhage (PPH) Referrals', value: pphCases },
        { dataElement: '105-MH03', name: 'Severe Pre-eclampsia / Eclampsia Referrals', value: eclampsiaCases },
        { dataElement: '105-MH04', name: 'Obstructed / Prolonged Labour Transfers', value: obstructedCases },
        { dataElement: '105-MH05', name: 'Emergency Caesarean Deliveries Linked to GPS Dispatch', value: cSectionReferrals },
        { dataElement: '105-MH06', name: 'Maternal Near-Miss Cases Audited', value: nearMissCount },
        { dataElement: '105-MH07', name: 'Institutional Maternal Deaths Recorded', value: maternalDeaths },
        { dataElement: '105-MH08', name: 'Average Response Interval from Beacon to Arrival (Minutes)', value: 42 }
      ]
    };
  },

  exportDhis2JsonPayload(period: string = '2026-07') {
    const report = this.generateHmis105Report(period);
    return JSON.stringify(report, null, 2);
  }
};

export const DoctorService = {
  getDoctorByUserId(userId: number): Doctor | null {
    return db.doctors.find(d => d.user_id === userId) || null;
  },

  toggleDuty(userId: number): boolean {
    const doctors = db.doctors;
    const doc = doctors.find(d => d.user_id === userId);
    if (!doc) return false;

    const val = !doc.is_on_duty;
    db.doctors = doctors.map(d => d.user_id === userId ? { ...d, is_on_duty: val, last_duty_toggle: new Date().toISOString() } : d);
    return val;
  },

  recordAssessment(
    emergencyId: number,
    doctorUserId: number,
    bp: string,
    hr: number,
    temp: number,
    findings: string,
    treatment: string,
    outcome: ClinicalAssessment['outcome'],
    mpdsrData?: Partial<MpdsrRecord>
  ): ClinicalAssessment {
    const assessments = db.clinicalAssessments;
    const nextId = Math.max(...assessments.map(a => a.id), 0) + 1;

    const newAssessment: ClinicalAssessment = {
      id: nextId,
      emergency_id: emergencyId,
      doctor_id: doctorUserId,
      blood_pressure: bp,
      heart_rate: hr,
      temperature: temp,
      clinical_findings: findings,
      treatment_given: treatment,
      outcome,
      logged_at: new Date().toISOString(),
      mpdsr_logged: Boolean(mpdsrData)
    };

    db.clinicalAssessments = [...assessments, newAssessment];

    // If MPDSR data provided or case was near miss / deceased, log MPDSR record
    if (mpdsrData || outcome === 'deceased') {
      const emg = db.emergencies.find(e => e.id === emergencyId);
      MpdsrService.saveRecord({
        emergency_id: emergencyId,
        mother_id: emg?.mother_id || 15,
        case_classification: outcome === 'deceased' ? 'maternal_death' : (mpdsrData?.case_classification || 'maternal_near_miss'),
        primary_cause: mpdsrData?.primary_cause || findings || 'Severe Obstetric Emergency',
        contributing_clinical_factors: mpdsrData?.contributing_clinical_factors || ['Delayed arrival', 'Severe distress'],
        delay_1_seeking_care: mpdsrData?.delay_1_seeking_care || { present: false, factors: [], notes: '' },
        delay_2_reaching_care: mpdsrData?.delay_2_reaching_care || { present: true, factors: ['Transport interval'], notes: 'Monitored via GPS' },
        delay_3_receiving_care: mpdsrData?.delay_3_receiving_care || { present: false, factors: [], notes: 'Emergency obstetric team mobilized' },
        avoidable_factors: mpdsrData?.avoidable_factors || ['Community early warning', 'Ambulance stationing'],
        review_committee_status: 'audit_completed',
        corrective_action_plan: mpdsrData?.corrective_action_plan || 'Review local ambulance dispatch latency.',
        responsible_facility: 'Mukono General Hospital',
        responsible_person: `Dr. ${db.users.find(u => u.id === doctorUserId)?.full_name || 'Attending Obstetrician'}`,
        audit_date: new Date().toISOString(),
        follow_up_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
      });
    }

    const emg = db.emergencies.find(e => e.id === emergencyId);
    if (emg && emg.status !== 'completed') {
      EmergencyService.updateStatus(emergencyId, 'completed', doctorUserId, `Clinical triage completed. Outcome: ${outcome.toUpperCase()}`);
    }

    return newAssessment;
  },

  submitBloodRequest(doctorUserId: number, hospitalId: number, bloodType: string, units: number): BloodRequest {
    const reqs = db.bloodRequests;
    const nextId = Math.max(...reqs.map(r => r.id), 0) + 1;

    const newRequest: BloodRequest = {
      id: nextId,
      doctor_id: doctorUserId,
      hospital_id: hospitalId,
      blood_type: bloodType,
      units,
      status: 'pending',
      requested_at: new Date().toISOString()
    };

    db.bloodRequests = [...reqs, newRequest];

    db.users.filter(u => u.role === 'admin').forEach(admin => {
      NotificationService.createNotification(
        admin.id,
        'URGENT: Blood Supply Needed',
        `Blood Request: ${units} units of ${bloodType} requested by Dr. ${db.users.find(u => u.id === doctorUserId)?.full_name}`,
        'system'
      );
    });

    return newRequest;
  }
};

export const DriverService = {
  getDriverByUserId(userId: number): Driver | null {
    return db.drivers.find(d => d.user_id === userId) || null;
  },

  toggleDuty(userId: number): boolean {
    const drivers = db.drivers;
    const drv = drivers.find(d => d.user_id === userId);
    if (!drv) return false;

    const val = !drv.is_on_duty;
    db.drivers = drivers.map(d => d.user_id === userId ? { ...d, is_on_duty: val, last_duty_toggle: new Date().toISOString() } : d);
    
    if (drv.vehicle_id) {
      db.vehicles = db.vehicles.map(v => v.id === drv.vehicle_id ? { ...v, status: val ? 'available' : 'off_duty' } : v);
    }
    
    return val;
  },

  submitInspection(driverUserId: number, vehicleId: number, fuelLevel: 'full' | 'half' | 'low', siren: boolean, medical: boolean, tires: boolean, engine: boolean): VehicleInspection {
    const ins = db.inspections;
    const nextId = Math.max(...ins.map(i => i.id), 0) + 1;

    const newInspection: VehicleInspection = {
      id: nextId,
      driver_id: driverUserId,
      vehicle_id: vehicleId,
      fuel_level: fuelLevel,
      siren_ok: siren,
      medical_checked: medical,
      tires_ok: tires,
      engine_ok: engine,
      checked_at: new Date().toISOString()
    };

    db.inspections = [...ins, newInspection];
    return newInspection;
  },

  submitFuelLog(driverUserId: number, vehicleId: number, liters: number, cost: number, station: string): FuelLog {
    const logs = db.fuelLogs;
    const nextId = Math.max(...logs.map(l => l.id), 0) + 1;

    const newLog: FuelLog = {
      id: nextId,
      driver_id: driverUserId,
      vehicle_id: vehicleId,
      liters,
      cost,
      station,
      logged_at: new Date().toISOString()
    };

    db.fuelLogs = [...logs, newLog];
    return newLog;
  }
};

// ============================================================================
// 5. GPS DISTANCE & LIVE SIMULATION ENGINE
// ============================================================================

export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const activeSims: Record<number, number> = {};

export const SimulationEngine = {
  startAmbulanceSimulation(emergencyId: number, onUpdate: (emergency: Emergency) => void) {
    if (activeSims[emergencyId]) return;

    const interval = window.setInterval(() => {
      const emergencies = db.emergencies;
      const emg = emergencies.find(e => e.id === emergencyId);
      if (!emg || !['dispatched', 'en_route'].includes(emg.status)) {
        this.stopSimulation(emergencyId);
        return;
      }

      const driverProfile = db.drivers.find(d => d.user_id === emg.driver_id);
      if (!driverProfile) {
        this.stopSimulation(emergencyId);
        return;
      }

      let currentLat = driverProfile.current_latitude;
      let currentLng = driverProfile.current_longitude;
      const targetLat = emg.latitude;
      const targetLng = emg.longitude;

      const dist = haversine(currentLat, currentLng, targetLat, targetLng);

      if (dist > 0.05) {
        const step = 0.002;
        const angle = Math.atan2(targetLat - currentLat, targetLng - currentLng);
        currentLat += step * Math.sin(angle);
        currentLng += step * Math.cos(angle);

        db.drivers = db.drivers.map(d => d.user_id === emg.driver_id ? { ...d, current_latitude: currentLat, current_longitude: currentLng } : d);

        if (emg.vehicle_id) {
          db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, current_latitude: currentLat, current_longitude: currentLng } : v);
        }

        const newEta = Math.max(1, Math.round(dist * 3));
        const updatedEmg = { ...emg, eta_minutes: newEta };
        
        if (emg.status === 'dispatched') {
          updatedEmg.status = 'en_route';
          EmergencyService.logTransition(emergencyId, 'dispatched', 'en_route', emg.driver_id, 'Ambulance GPS moving towards mother. Realtime tracking live.');
        }

        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        onUpdate(updatedEmg);
      } else {
        const updatedEmg: Emergency = {
          ...emg,
          status: 'arrived',
          eta_minutes: 0,
          arrived_at: new Date().toISOString(),
          picked_up_at: new Date().toISOString()
        };
        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        
        EmergencyService.logTransition(emergencyId, emg.status, 'arrived', emg.driver_id, 'Ambulance arrived at patient location.');
        
        NotificationService.createNotification(
          emg.mother_id,
          'Ambulance Arrived',
          'The ambulance has arrived at your location. Please prepare to board.',
          'status_update',
          emergencyId
        );

        if (emg.doctor_id) {
          NotificationService.createNotification(
            emg.doctor_id,
            'Patient Picked Up',
            'Ambulance reached the patient. Transit to hospital beginning.',
            'status_update',
            emergencyId
          );
        }

        onUpdate(updatedEmg);
        this.stopSimulation(emergencyId);
      }
    }, 3500);

    activeSims[emergencyId] = interval;
  },

  startTransitToHospitalSimulation(emergencyId: number, onUpdate: (emergency: Emergency) => void) {
    if (activeSims[emergencyId]) return;

    const interval = window.setInterval(() => {
      const emergencies = db.emergencies;
      const emg = emergencies.find(e => e.id === emergencyId);
      if (!emg || emg.status !== 'in_transit') {
        this.stopSimulation(emergencyId);
        return;
      }

      const driverProfile = db.drivers.find(d => d.user_id === emg.driver_id);
      if (!driverProfile) {
        this.stopSimulation(emergencyId);
        return;
      }

      const hosp = db.hospitals.find(h => h.id === emg.hospital_id);
      if (!hosp) {
        this.stopSimulation(emergencyId);
        return;
      }

      let currentLat = driverProfile.current_latitude;
      let currentLng = driverProfile.current_longitude;
      const targetLat = hosp.latitude;
      const targetLng = hosp.longitude;

      const dist = haversine(currentLat, currentLng, targetLat, targetLng);

      if (dist > 0.05) {
        const step = 0.002;
        const angle = Math.atan2(targetLat - currentLat, targetLng - currentLng);
        currentLat += step * Math.sin(angle);
        currentLng += step * Math.cos(angle);

        db.drivers = db.drivers.map(d => d.user_id === emg.driver_id ? { ...d, current_latitude: currentLat, current_longitude: currentLng } : d);

        if (emg.vehicle_id) {
          db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, current_latitude: currentLat, current_longitude: currentLng } : v);
        }

        const newEta = Math.max(1, Math.round(dist * 3));
        const updatedEmg = { ...emg, eta_minutes: newEta };
        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        onUpdate(updatedEmg);
      } else {
        const updatedEmg: Emergency = {
          ...emg,
          status: 'delivered',
          eta_minutes: 0,
          delivered_at: new Date().toISOString()
        };

        if (emg.vehicle_id) {
          db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
        }

        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        EmergencyService.logTransition(emergencyId, 'in_transit', 'delivered', emg.driver_id, `Patient delivered to ${hosp.name}. Driver mission complete; clinical triage pending.`);

        NotificationService.createNotification(
          emg.mother_id,
          'Arrived at Hospital',
          `You have arrived safely at ${hosp.name}. The medical team is ready for you.`,
          'status_update',
          emergencyId
        );

        if (emg.driver_id) {
          NotificationService.createNotification(
            emg.driver_id,
            'Mission Complete',
            `Patient delivered to ${hosp.name}. You are available for new dispatches.`,
            'status_update',
            emergencyId
          );
        }

        if (emg.doctor_id) {
          NotificationService.createNotification(
            emg.doctor_id,
            'Patient Has Arrived',
            `Patient arrived at ${hosp.name}. Please proceed with clinical assessment and triage.`,
            'status_update',
            emergencyId
          );
        }

        onUpdate(updatedEmg);
        this.stopSimulation(emergencyId);
      }
    }, 3500);

    activeSims[emergencyId] = interval;
  },

  stopSimulation(emergencyId: number) {
    if (activeSims[emergencyId]) {
      clearInterval(activeSims[emergencyId]);
      delete activeSims[emergencyId];
    }
  }
};
