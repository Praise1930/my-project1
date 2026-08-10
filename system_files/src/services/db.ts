// MamaTrack GPS — Local Database & Simulation Service

// ============================================================================
// 1. DATA INTERFACES
// ============================================================================

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'mother' | 'admin' | 'doctor' | 'driver' | 'vht';
  avatar: string | null; // base64 / dataUrl or placeholder emoji
  is_active: boolean;
  email_verified?: boolean;
  last_login?: string;
  created_at: string;
}

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
}

export interface Vehicle {
  id: number;
  plate_number: string;
  vehicle_type: string;
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
  national_id: string;
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
}

export interface Child {
  id: number;
  mother_id: number; // references Mother user_id
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

export interface Emergency {
  id: number;
  code: string;
  mother_id: number; // references user_id of mother
  latitude: number;
  longitude: number;
  status: 'pending' | 'verified' | 'dispatched' | 'en_route' | 'arrived' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  severity: 'critical' | 'high' | 'medium' | 'low';
  notes: string;
  hospital_id: number | null;
  driver_id: number | null; // references user_id of driver
  doctor_id: number | null; // references user_id of doctor
  vehicle_id: number | null;
  cancel_reason: string | null;
  eta_minutes: number | null;
  dispatched_by: number | null; // references user_id of admin
  triggered_at: string;
  dispatched_at: string | null;
  picked_up_at: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface EmergencyLog {
  id: number;
  emergency_id: number;
  previous_status: string | null;
  new_status: string;
  changed_by: number | null; // user_id
  notes: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface CheckupSchedule {
  id: number;
  mother_id: number; // user_id
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
  driver_id: number; // user_id
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
  driver_id: number; // user_id
  vehicle_id: number;
  liters: number;
  cost: number;
  station: string;
  logged_at: string;
}

export interface ClinicalAssessment {
  id: number;
  emergency_id: number;
  doctor_id: number; // user_id
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  clinical_findings: string;
  treatment_given: string;
  outcome: 'admitted' | 'referred' | 'discharged' | 'deceased';
  logged_at: string;
}

export interface BloodRequest {
  id: number;
  doctor_id: number; // user_id
  hospital_id: number;
  blood_type: string;
  units: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  requested_at: string;
}

// ============================================================================
// 2. MOCK SEED DATA
// ============================================================================

const SEED_HOSPITALS: Hospital[] = [
  { id: 1, name: 'Mukono General Hospital', type: 'government', latitude: 0.3536, longitude: 32.7554, address: 'Mukono Town, Main Road', sub_county: 'Mukono Municipality', phone: '+256-414-290-001', email: 'info@mukonogeneral.go.ug', total_beds: 200, available_beds: 45, has_cemonc: true, has_blood_bank: true, blood_types_available: 'A+,A-,B+,B-,O+,O-,AB+,AB-', has_surgical_capacity: true, has_ambulance: true, operating_hours: '24/7', facility_type: 'Government Hospital' },
  { id: 2, name: 'Mukono Church of Uganda Hospital', type: 'private', latitude: 0.3548, longitude: 32.7501, address: 'Mukono Town, CoU Road', sub_county: 'Mukono Municipality', phone: '+256-414-290-102', email: 'admin@mukonocou.org', total_beds: 120, available_beds: 28, has_cemonc: true, has_blood_bank: true, blood_types_available: 'A+,B+,O+,O-,AB+', has_surgical_capacity: true, has_ambulance: true, operating_hours: '24/7', facility_type: 'Private Hospital' },
  { id: 3, name: 'C-Care (IMC) Hospital', type: 'private', latitude: 0.3510, longitude: 32.7612, address: 'Mukono Industrial Area', sub_county: 'Mukono Municipality', phone: '+256-414-290-203', email: 'info@ccare-mukono.com', total_beds: 80, available_beds: 15, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,O-,A+,B+', has_surgical_capacity: true, has_ambulance: false, operating_hours: '24/7', facility_type: 'Private Hospital' },
  { id: 4, name: 'AAR Pearl Hospital', type: 'private', latitude: 0.3525, longitude: 32.7580, address: 'Mukono Town Centre', sub_county: 'Mukono Municipality', phone: '+256-414-290-304', email: 'reception@aarpearl.co.ug', total_beds: 60, available_beds: 12, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,A+,B+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Private Hospital' },
  { id: 5, name: 'Nama Health Centre IV', type: 'government', latitude: 0.2980, longitude: 32.8120, address: 'Nama Sub-County', sub_county: 'Nama', phone: '+256-414-290-405', email: 'nama.hc4@health.go.ug', total_beds: 40, available_beds: 10, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,O-', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Government Hospital' },
  { id: 6, name: 'Koome Health Centre III', type: 'government', latitude: 0.1450, longitude: 32.8800, address: 'Koome Islands, Lake Victoria', sub_county: 'Koome', phone: '+256-414-290-506', email: 'koome.hc3@health.go.ug', total_beds: 20, available_beds: 8, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Government Hospital' },
  { id: 7, name: 'Seeta Hospital', type: 'private', latitude: 0.3680, longitude: 32.6890, address: 'Seeta Town', sub_county: 'Nama', phone: '+256-414-290-607', email: 'info@seetahospital.co.ug', total_beds: 50, available_beds: 14, has_cemonc: false, has_blood_bank: true, blood_types_available: 'A+,B+,O+,O-', has_surgical_capacity: false, has_ambulance: true, operating_hours: '24/7', facility_type: 'Private Hospital' },
  { id: 8, name: 'Mukono Health Centre IV', type: 'government', latitude: 0.3490, longitude: 32.7520, address: 'Mukono Central', sub_county: 'Mukono Municipality', phone: '+256-414-290-708', email: 'mukono.hc4@health.go.ug', total_beds: 30, available_beds: 9, has_cemonc: false, has_blood_bank: false, blood_types_available: 'O+,A+', has_surgical_capacity: false, has_ambulance: false, operating_hours: '24/7', facility_type: 'Government Hospital' }
];

const SEED_VEHICLES: Vehicle[] = [
  { id: 1, plate_number: 'UBG 001A', vehicle_type: 'Ambulance - Type II', hospital_id: 1, status: 'available', current_latitude: 0.3536, current_longitude: 32.7554, capacity: 1, has_equipment: true, is_active: true },
  { id: 2, plate_number: 'UBG 002A', vehicle_type: 'Ambulance - Type I', hospital_id: 1, status: 'available', current_latitude: 0.3540, current_longitude: 32.7558, capacity: 1, has_equipment: true, is_active: true },
  { id: 3, plate_number: 'UBG 003A', vehicle_type: 'Ambulance - Type II', hospital_id: 2, status: 'available', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true },
  { id: 4, plate_number: 'UBG 004A', vehicle_type: 'Ambulance - Basic', hospital_id: 7, status: 'available', current_latitude: 0.3680, current_longitude: 32.6890, capacity: 1, has_equipment: true, is_active: true },
  { id: 5, plate_number: 'UBG 005A', vehicle_type: 'Ambulance - Type I', hospital_id: 2, status: 'maintenance', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true }
];

// Personnel roster for Mukono District. Keep these IDs stable — every seed row
// below references them by user_id, as do records already synced to Supabase.
//   1-2   admins
//   3-12  doctors  (5 male, 5 female)
//   13-17 drivers  (4 male, 1 female)
//   18-27 mothers
//   28-34 VHTs     (3 male, 4 female)
const SEED_USERS: User[] = [
  // ── Administrators ──
  { id: 1, full_name: 'Dr. Sarah Namukasa', email: 'sarah.namukasa@mukonogeneral.go.ug', phone: '+256-742-100-001', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 2, full_name: 'Robert Kaggwa', email: 'robert.kaggwa@mukonogeneral.go.ug', phone: '+256-742-100-002', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── Doctors ──
  { id: 3, full_name: 'Dr. James Ssemakula', email: 'james.ssemakula@mukonogeneral.go.ug', phone: '+256-742-200-001', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 4, full_name: 'Dr. Grace Namutebi', email: 'grace.namutebi@mukonocou.org', phone: '+256-742-200-002', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 5, full_name: 'Dr. Peter Ochieng', email: 'peter.ochieng@mukonogeneral.go.ug', phone: '+256-742-200-003', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 6, full_name: 'Dr. Immaculate Nabukenya', email: 'immaculate.nabukenya@ccare-mukono.com', phone: '+256-742-200-004', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 7, full_name: 'Dr. Daniel Wasswa', email: 'daniel.wasswa@aarpearl.co.ug', phone: '+256-742-200-005', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 8, full_name: 'Dr. Rebecca Atim', email: 'rebecca.atim@health.go.ug', phone: '+256-742-200-006', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 9, full_name: 'Dr. Samuel Kizza', email: 'samuel.kizza@mukonogeneral.go.ug', phone: '+256-742-200-007', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 10, full_name: 'Dr. Harriet Nakayiza', email: 'harriet.nakayiza@seetahospital.co.ug', phone: '+256-742-200-008', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 11, full_name: 'Dr. Emmanuel Tumusiime', email: 'emmanuel.tumusiime@mukonocou.org', phone: '+256-742-200-009', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 12, full_name: 'Dr. Justine Akello', email: 'justine.akello@health.go.ug', phone: '+256-742-200-010', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── Ambulance drivers ──
  { id: 13, full_name: 'Moses Kiggundu', email: 'moses.kiggundu@mukonogeneral.go.ug', phone: '+256-742-300-001', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 14, full_name: 'Joseph Lubwama', email: 'joseph.lubwama@mukonogeneral.go.ug', phone: '+256-742-300-002', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 15, full_name: 'David Ssekandi', email: 'david.ssekandi@mukonocou.org', phone: '+256-742-300-003', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 16, full_name: 'Annet Nakiwala', email: 'annet.nakiwala@seetahospital.co.ug', phone: '+256-742-300-004', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 17, full_name: 'Ronald Mukasa', email: 'ronald.mukasa@mukonocou.org', phone: '+256-742-300-005', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── Expectant mothers ──
  { id: 18, full_name: 'Nakato Fatima', email: 'fatima.nakato@gmail.com', phone: '+256-769-400-001', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 19, full_name: 'Auma Rosemary', email: 'rosemary.auma@gmail.com', phone: '+256-769-400-002', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-02T00:00:00Z' },
  { id: 20, full_name: 'Babirye Joan', email: 'joan.babirye@gmail.com', phone: '+256-769-400-003', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-03T00:00:00Z' },
  { id: 21, full_name: 'Namugga Esther', email: 'esther.namugga@gmail.com', phone: '+256-769-400-004', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-04T00:00:00Z' },
  { id: 22, full_name: 'Kyomuhendo Ruth', email: 'ruth.kyomuhendo@gmail.com', phone: '+256-769-400-005', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-05T00:00:00Z' },
  { id: 23, full_name: 'Nabirye Sylvia', email: 'sylvia.nabirye@gmail.com', phone: '+256-769-400-006', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-06T00:00:00Z' },
  { id: 24, full_name: 'Achieng Brenda', email: 'brenda.achieng@gmail.com', phone: '+256-769-400-007', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-07T00:00:00Z' },
  { id: 25, full_name: 'Nassuna Miriam', email: 'miriam.nassuna@gmail.com', phone: '+256-769-400-008', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-08T00:00:00Z' },
  { id: 26, full_name: 'Tumusiime Peace', email: 'peace.tumusiime@gmail.com', phone: '+256-769-400-009', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-09T00:00:00Z' },
  { id: 27, full_name: 'Nakiganda Cynthia', email: 'cynthia.nakiganda@gmail.com', phone: '+256-769-400-010', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-10T00:00:00Z' },

  // ── Village Health Team members ──
  { id: 28, full_name: 'Nakitto Sarah', email: 'sarah.nakitto@vht.mamatrack.ug', phone: '+256-788-000-101', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 29, full_name: 'Namusoke Betty', email: 'betty.namusoke@vht.mamatrack.ug', phone: '+256-788-000-102', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 30, full_name: 'Lutwama Charles', email: 'charles.lutwama@vht.mamatrack.ug', phone: '+256-788-000-103', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 31, full_name: 'Mugisha Francis', email: 'francis.mugisha@vht.mamatrack.ug', phone: '+256-788-000-104', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 32, full_name: 'Nantongo Agnes', email: 'agnes.nantongo@vht.mamatrack.ug', phone: '+256-788-000-105', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 33, full_name: 'Kawuma Isaac', email: 'isaac.kawuma@vht.mamatrack.ug', phone: '+256-788-000-106', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 34, full_name: 'Nabatanzi Florence', email: 'florence.nabatanzi@vht.mamatrack.ug', phone: '+256-788-000-107', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' }
];

// On duty by default so an SOS can be dispatched immediately after a reset.
const SEED_DOCTORS: Doctor[] = [
  { id: 1, user_id: 2, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2018-4521', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 8 }
];

const SEED_DRIVERS: Driver[] = [
  { id: 1, user_id: 3, hospital_id: 1, vehicle_id: 1, license_number: 'UG-DL-2019-88432', driver_role: 'Primary Emergency Driver', is_on_duty: true, current_latitude: 0.3536, current_longitude: 32.7554 }
];

const SEED_MOTHERS: Mother[] = [
  { id: 1, user_id: 4, date_of_birth: '1995-03-15', national_id: 'CM950315D', blood_type: 'O+', pregnancy_start_date: '2026-01-10', expected_due_date: '2026-10-17', gravida: 2, parity: 1, medical_history: 'No known allergies. Previous normal delivery.', current_complications: 'None', next_of_kin_name: 'Ssemanda Ahmed', next_of_kin_phone: '+256-751-500-001', next_of_kin_relationship: 'Husband', village: 'Goma Village', sub_county: 'Goma', district: 'Mukono', vht_name: 'Nakitto Sarah', vht_phone: '+256-788-000-111', home_latitude: 0.3420, home_longitude: 32.7680, preferred_hospital_id: 1 }
];

const SEED_CHILDREN: Child[] = [
  { id: 1, mother_id: 4, name: 'Ssemanda Joel (Son)', gender: 'Son', date_of_birth: '2024-04-12', birth_weight: '3.5 kg', delivery_type: 'Spontaneous Normal', health_status: 'Healthy', hospital_id: 1, immunization_status: 'Fully Immunized' }
];

const SEED_CHECKUPS: CheckupSchedule[] = [
  { id: 1, mother_id: 4, hospital_id: 1, checkup_type: 'Antenatal Visit 4', scheduled_date: '2026-06-25', scheduled_time: '09:00', notes: 'Routine checkup - 24 weeks', status: 'completed' },
  { id: 2, mother_id: 4, hospital_id: 1, checkup_type: 'Ultrasound Scan', scheduled_date: '2026-07-10', scheduled_time: '10:30', notes: 'Anomaly scan', status: 'upcoming' }
];

// Start with no emergency history so the first SOS raised after a reset is
// EMG-2026-0001 and the dispatch queue is genuinely empty for testing.
const SEED_EMERGENCIES: Emergency[] = [];

const SEED_EMERGENCY_LOGS: EmergencyLog[] = [];

const SEED_NOTIFICATIONS: Notification[] = [];

const SEED_VHT_VISITS: VhtVisitLog[] = [
  { id: 1, vht_id: 5, mother_id: 4, visit_date: '2026-07-01', blood_pressure: '120/80', temperature: 36.6, fetal_movement: 'normal', notes: 'Mother feels healthy. Prescribed folate compliance.', complications_observed: 'None' }
];

const SEED_VITALS: VitalsRecord[] = [
  { id: 1, mother_id: 4, timestamp: '2026-07-10T09:00:00Z', systolic: 120, diastolic: 80, glucose: 95, kick_count: 12, recorded_by: 'patient' },
  { id: 2, mother_id: 4, timestamp: '2026-07-12T10:00:00Z', systolic: 122, diastolic: 82, glucose: 98, kick_count: 10, recorded_by: 'patient' },
  { id: 3, mother_id: 4, timestamp: '2026-07-14T08:30:00Z', systolic: 121, diastolic: 79, glucose: 92, kick_count: 11, recorded_by: 'vht' }
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
    return JSON.parse(raw);
  }

  private setStore<T>(key: string, data: T[]): void {
    const oldDataRaw = localStorage.getItem(`mamatrack_${key}`);
    localStorage.setItem(`mamatrack_${key}`, JSON.stringify(data));

    // Dispatch global window event for same-tab and multi-tab instant UI sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mamatrack_db_update', { detail: { key } }));
    }

    // Push changed rows to Supabase so other devices (mother's phone, admin's
    // desktop, driver's phone, doctor's console) see them. SyncService decides
    // which stores are cloud-backed; purely device-local stores are ignored there.
    try {
      const oldData: any[] = oldDataRaw ? JSON.parse(oldDataRaw) : [];
      const oldMap = new Map(oldData.map(item => [String(item.id), item]));

      data.forEach((newItem: any) => {
        const oldItem = oldMap.get(String((newItem as any).id));
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          // Lazy import SyncService to prevent circular dependency imports
          import('./syncService').then(({ SyncService }) => {
            SyncService.syncLocalChange(key, (newItem as any).id, newItem);
          });
        }
      });
    } catch (e) {
      console.warn('SyncService: Error checking list diff in setStore:', e);
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

  // ── Session Handling (per-role, stored in localStorage so same-tab multi-role testing works) ──
  getCurrentSessionUser(role?: string): User | null {
    // If role is specified, look up only that role's session.
    // Otherwise fall back to the old single-session key for backwards compat.
    const rolesToCheck = role
      ? [role]
      : ['admin', 'mother', 'doctor', 'driver', 'vht'];

    for (const r of rolesToCheck) {
      const raw = localStorage.getItem(`mamatrack_session_${r}`);
      if (raw) {
        try {
          const session = JSON.parse(raw);
          const user = this.users.find(u => u.id === session.id && u.role === r);
          if (user) return user;
        } catch { /* ignore corrupt */ }
      }
    }
    // Legacy fallback: sessionStorage single-key
    const legacy = sessionStorage.getItem('mamatrack_session');
    if (legacy) {
      try {
        const session = JSON.parse(legacy);
        return this.users.find(u => u.id === session.id) || null;
      } catch { /* ignore */ }
    }
    return null;
  }

  getSessionUserForRole(role: 'mother' | 'admin' | 'doctor' | 'driver' | 'vht'): User | null {
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
      localStorage.setItem(
        `mamatrack_session_${targetRole}`,
        JSON.stringify({ id: user.id, role: targetRole })
      );
    } else if (targetRole) {
      localStorage.removeItem(`mamatrack_session_${targetRole}`);
    } else {
      // Clear all role sessions
      ['admin', 'mother', 'doctor', 'driver', 'vht'].forEach(r =>
        localStorage.removeItem(`mamatrack_session_${r}`)
      );
      sessionStorage.removeItem('mamatrack_session'); // clear legacy too
    }
  }

  // Reset database to initial seeds
  resetDatabase() {
    localStorage.removeItem('mamatrack_users');
    localStorage.removeItem('mamatrack_hospitals');
    localStorage.removeItem('mamatrack_vehicles');
    localStorage.removeItem('mamatrack_mothers');
    localStorage.removeItem('mamatrack_children');
    localStorage.removeItem('mamatrack_doctors');
    localStorage.removeItem('mamatrack_drivers');
    localStorage.removeItem('mamatrack_emergencies');
    localStorage.removeItem('mamatrack_emergency_logs');
    localStorage.removeItem('mamatrack_checkups');
    localStorage.removeItem('mamatrack_notifications');
    localStorage.removeItem('mamatrack_inspections');
    localStorage.removeItem('mamatrack_fuel_logs');
    localStorage.removeItem('mamatrack_clinical_assessments');
    localStorage.removeItem('mamatrack_blood_requests');
    localStorage.removeItem('mamatrack_sms_logs');
    localStorage.removeItem('mamatrack_vitals');
    localStorage.removeItem('mamatrack_vht_visits');
    // Clear all per-role sessions
    ['admin', 'mother', 'doctor', 'driver', 'vht'].forEach(r =>
      localStorage.removeItem(`mamatrack_session_${r}`)
    );
    sessionStorage.removeItem('mamatrack_session');
  }
}

export const db = new LocalDatabase();

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

    // Real gateway proxy trigger if configured
    const gatewayUrl = import.meta.env.VITE_SMS_GATEWAY_URL;
    if (gatewayUrl && gatewayUrl.trim() !== '') {
      fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toNumber, name: toName, message })
      }).catch(err => {
        console.warn("SmsService: Direct gateway proxy delivery failed.", err);
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
  addVitalsRecord(motherId: number, record: { systolic: number; diastolic: number; glucose: number; kick_count: number; recorded_by: 'patient' | 'vht' | 'doctor' }): VitalsRecord {
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

// ============================================================================
// 4. API METHOD ACTIONS (SERVICES)
// ============================================================================

export const AuthService = {
  login(email: string, password_hash: string, role: 'mother' | 'admin' | 'doctor' | 'driver' | 'vht', bypassPasswordCheck = false): { success: boolean; user?: User; error?: string } {
    const users = db.users;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user) {
      return { success: false, error: 'User account not found with selected role' };
    }
    if (!bypassPasswordCheck && user.password_hash !== password_hash) {
      return { success: false, error: 'Incorrect credentials' };
    }
    if (bypassPasswordCheck && user.password_hash !== password_hash) {
      user.password_hash = password_hash; // sync password with Supabase Auth
    }
    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
    }
    if (!bypassPasswordCheck && user.email_verified === false) {
      return { success: false, error: 'Email address has not been verified yet. Please check your inbox for the verification link.' };
    }
    
    // update last login
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

    // Calculate expected due date (280 days from start date)
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
      medical_history: 'None declared during self-registration.',
      current_complications: 'None',
      next_of_kin_name: data.next_of_kin_name,
      next_of_kin_phone: data.next_of_kin_phone,
      next_of_kin_relationship: data.next_of_kin_relationship,
      village: data.village,
      sub_county: data.sub_county,
      district: 'Mukono',
      vht_name: 'Assigned on Dispatch',
      vht_phone: '-',
      home_latitude: 0.35 + (Math.random() - 0.5) * 0.05, // generate near Town Centre
      home_longitude: 32.75 + (Math.random() - 0.5) * 0.05,
      preferred_hospital_id: 1
    };

    db.users = [...users, newUser];
    db.mothers = [...mothers, newMother];

    // Add initial notifications
    NotificationService.createNotification(
      nextUserId,
      'Welcome to MamaTrack GPS',
      'Your pregnancy profile is setup. You can trigger emergency support when needed and track antenatal timelines.',
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
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, ...fields, updated_at: new Date().toISOString() };
      }
      return u;
    });
    db.users = updated;
    return updated.find(u => u.id === userId)!;
  },

  updateMotherProfile(userId: number, fields: Partial<Mother>): Mother {
    const mothers = db.mothers;
    const updated = mothers.map(m => {
      if (m.user_id === userId) {
        return { ...m, ...fields };
      }
      return m;
    });
    db.mothers = updated;
    return updated.find(m => m.user_id === userId)!;
  },

  getMotherData(userId: number): { user: User; profile: Mother } | null {
    const user = db.users.find(u => u.id === userId);
    const profile = db.mothers.find(m => m.user_id === userId);
    if (!user || !profile) return null;
    return { user, profile };
  }
};

export const EmergencyService = {
  getActiveEmergencyForMother(userId: number): Emergency | null {
    return db.emergencies.find(e => e.mother_id === userId && !['completed', 'cancelled'].includes(e.status)) || null;
  },

  findBestHospital(lat: number, lng: number, requireCemonc: boolean = false): Hospital {
    const hospitals = db.hospitals;
    if (hospitals.length === 0) throw new Error('No hospitals available in database');

    let bestHospital = hospitals[0];
    let bestScore = Infinity;

    hospitals.forEach(h => {
      // If CEMONC is strictly required and facility lacks surgical care, skip unless no options
      if (requireCemonc && !h.has_cemonc && hospitals.some(opt => opt.has_cemonc)) return;

      const dist = haversine(lat, lng, h.latitude, h.longitude);

      // Resource Readiness Penalty / Bonus System:
      // Lower score = higher priority
      // 1 km distance = +1.0 score penalty
      // Available beds > 0 = -3.0 score bonus
      // Blood bank ready = -1.5 score bonus
      // Surgical C-section ready = -1.5 score bonus
      // Available ambulance = -1.0 score bonus
      let score = dist;
      if (h.available_beds > 0) score -= 3.0;
      if (h.has_blood_bank) score -= 1.5;
      if (h.has_cemonc) score -= 1.5;
      if (h.has_ambulance) score -= 1.0;

      if (score < bestScore) {
        bestScore = score;
        bestHospital = h;
      }
    });

    return bestHospital;
  },

  triggerEmergency(motherUserId: number, lat: number, lng: number, notes: string, requireCemonc: boolean): Emergency {
    const emergencies = db.emergencies;
    let active = this.getActiveEmergencyForMother(motherUserId);
    const matchedHospital = this.findBestHospital(lat, lng, requireCemonc);
    const assignedHospitalId = matchedHospital.id;
    const motherName = db.users.find(u => u.id === motherUserId)?.full_name || 'Patient';

    if (active) {
      // Re-activate / refresh active emergency with latest coordinates and notes
      const updatedEmergencies = emergencies.map(e => {
        if (e.id === active!.id) {
          return {
            ...e,
            latitude: lat || e.latitude,
            longitude: lng || e.longitude,
            notes: notes || e.notes,
            severity: requireCemonc ? ('critical' as const) : ('high' as const),
            hospital_id: assignedHospitalId,
            status: 'pending' as const,
            triggered_at: new Date().toISOString()
          };
        }
        return e;
      });
      db.emergencies = updatedEmergencies;
      active = updatedEmergencies.find(e => e.id === active!.id) || active;
    } else {
      const nextId = Math.max(...emergencies.map(e => e.id), 0) + 1;
      const code = `EMG-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

      active = {
        id: nextId,
        code,
        mother_id: motherUserId,
        latitude: lat,
        longitude: lng,
        status: 'pending',
        severity: requireCemonc ? 'critical' : 'high',
        notes: notes || (requireCemonc ? 'Emergency: Specialized surgical care needed.' : 'Emergency maternal distress beacon active.'),
        hospital_id: assignedHospitalId,
        driver_id: null,
        doctor_id: null,
        vehicle_id: null,
        cancel_reason: null,
        eta_minutes: null,
        dispatched_by: null,
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

    // Log the transaction
    this.logTransition(active.id, null, 'pending', motherUserId, 'SOS beacon triggered by patient via GPS');

    // 1. Notify Admins
    const admins = db.users.filter(u => u.role === 'admin');
    admins.forEach(admin => {
      NotificationService.createNotification(
        admin.id,
        '🆘 Critical SOS Triggered',
        `Patient ${motherName} has triggered an emergency beacon. Hospital matched: ${matchedHospital.name}`,
        'emergency',
        active.id
      );
    });

    // 2. Notify Doctors at assigned hospital & on-duty doctors
    const doctors = db.doctors.filter(d => d.hospital_id === assignedHospitalId || d.is_on_duty);
    doctors.forEach(doc => {
      NotificationService.createNotification(
        doc.user_id,
        '🚨 Emergency Patient Rescue Incoming',
        `Expectant mother ${motherName} triggered an emergency SOS. Matched to ${matchedHospital.name}. Notes: ${active.notes}`,
        'emergency',
        active.id
      );
    });

    // 3. Notify On-Duty Ambulance Drivers
    const drivers = db.drivers.filter(d => d.is_on_duty);
    drivers.forEach(driver => {
      NotificationService.createNotification(
        driver.user_id,
        '🚑 Emergency Dispatch Available',
        `New distress beacon from ${motherName} near ${matchedHospital.name}. Check Command Fleet for dispatch.`,
        'emergency',
        active.id
      );
    });

    // 4. Notify VHTs
    const vhts = db.users.filter(u => u.role === 'vht');
    vhts.forEach(vht => {
      NotificationService.createNotification(
        vht.id,
        '📳 Community SOS Alert',
        `Maternal emergency triggered by ${motherName} in your operational zone.`,
        'emergency',
        active.id
      );
    });

    // 5. Send simulated SMS alerts
    const motherUser = db.users.find(u => u.id === motherUserId);
    if (motherUser) {
      SmsService.sendSms(
        motherUser.full_name,
        motherUser.phone,
        `MamaTrack SOS: Emergency beacon activated. Mukono emergency responders are preparing dispatch.`
      );
    }

    const motherData = db.mothers.find(m => m.user_id === motherUserId);
    if (motherData && motherData.next_of_kin_phone) {
      SmsService.sendSms(
        motherData.next_of_kin_name || 'Next of Kin',
        motherData.next_of_kin_phone,
        `MamaTrack ALERT: Your relative ${motherName} has triggered an emergency maternal SOS beacon in Mukono. Responders alerted.`
      );
    }

    // 6. Broadcast real-time event across all active windows & tabs
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mamatrack_alert_triggered', { detail: active }));
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mamatrack_emergency_channel');
        bc.postMessage({ type: 'NEW_EMERGENCY_SOS', emergency: active });
        bc.close();
      }
    } catch (e) {
      console.log('Broadcast channel event posted');
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

    // Auto-assign an on-duty doctor at the selected hospital if none specified
    let assignedDoctorId = doctorUserId;
    if (!assignedDoctorId) {
      const hospitalDoctors = db.doctors.filter(d => d.hospital_id === hospitalId && d.is_on_duty);
      if (hospitalDoctors.length > 0) {
        assignedDoctorId = hospitalDoctors[0].user_id;
      } else {
        // Fallback: any on-duty doctor
        const anyOnDuty = db.doctors.find(d => d.is_on_duty);
        if (anyOnDuty) assignedDoctorId = anyOnDuty.user_id;
      }
    }

    const updatedEmg: Emergency = {
      ...emg,
      status: 'dispatched',
      driver_id: driverUserId,
      doctor_id: assignedDoctorId,
      hospital_id: hospitalId,
      dispatched_by: adminUserId,
      eta_minutes: etaMinutes,
      dispatched_at: new Date().toISOString()
    };

    // Find ambulance vehicle of driver
    const driverProfile = db.drivers.find(d => d.user_id === driverUserId);
    if (driverProfile && driverProfile.vehicle_id) {
      updatedEmg.vehicle_id = driverProfile.vehicle_id;
      
      // Update vehicle status to en_route
      const vehicles = db.vehicles;
      db.vehicles = vehicles.map(v => v.id === driverProfile.vehicle_id ? { ...v, status: 'en_route' } : v);
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);

    this.logTransition(emergencyId, emg.status, 'dispatched', adminUserId, `Ambulance dispatched. ETA: ${etaMinutes} minutes.`);

    // Gather context data
    const motherUser = db.users.find(u => u.id === emg.mother_id);
    const motherProfile = db.mothers.find(m => m.user_id === emg.mother_id);
    const driverUser = db.users.find(u => u.id === driverUserId);
    const hosp = db.hospitals.find(h => h.id === hospitalId);

    // Notify Mother
    if (motherUser) {
      NotificationService.createNotification(
        motherUser.id,
        '🚑 Ambulance Dispatched!',
        `Ambulance driver ${driverUser?.full_name || 'Emergency Team'} is en route to your location. Destination hospital: ${hosp?.name || 'Nearest facility'}. Expected ETA: ${etaMinutes} mins.`,
        'dispatch',
        emergencyId
      );
    }

    // Notify Driver — include mother's GPS coordinates & location details
    const motherLocation = motherProfile
      ? `${motherProfile.village}, ${motherProfile.sub_county}, ${motherProfile.district}`
      : 'Mukono District';
    NotificationService.createNotification(
      driverUserId,
      '🚨 EMERGENCY DISPATCH — Navigate to Patient',
      `PICKUP: ${motherUser?.full_name || 'Patient'} at ${motherLocation} (GPS: ${emg.latitude.toFixed(4)}, ${emg.longitude.toFixed(4)}).\nDESTINATION: ${hosp?.name || 'Hospital'} (${hosp?.address || ''}).\nBlood Type: ${motherProfile?.blood_type || 'Unknown'} | Severity: ${emg.severity.toUpperCase()}\nNotes: ${emg.notes}\nETA: ${etaMinutes} mins.`,
      'dispatch',
      emergencyId
    );

    // Notify Doctor — include full medical preparation details
    if (assignedDoctorId) {
      const weeksPregnant = motherProfile ? Math.max(1, Math.min(42, Math.floor((new Date().getTime() - new Date(motherProfile.pregnancy_start_date).getTime()) / (1000 * 60 * 60 * 24 * 7)))) : 0;
      const medicalBrief = [
        `🚨 INBOUND MATERNAL EMERGENCY — Prepare for arrival`,
        ``,
        `Patient: ${motherUser?.full_name || 'Unknown'}`,
        `Phone: ${motherUser?.phone || 'N/A'}`,
        `Blood Type: ${motherProfile?.blood_type || 'Unknown'}`,
        `Gestational Age: ${weeksPregnant} weeks`,
        `Expected Due Date: ${motherProfile?.expected_due_date || 'Unknown'}`,
        `Gravida: ${motherProfile?.gravida || 'N/A'} | Parity: ${motherProfile?.parity || 'N/A'}`,
        ``,
        `Medical History: ${motherProfile?.medical_history || 'None declared'}`,
        `Current Complications: ${motherProfile?.current_complications || 'None'}`,
        `Distress Notes: ${emg.notes}`,
        `Severity: ${emg.severity.toUpperCase()}`,
        ``,
        `Next of Kin: ${motherProfile?.next_of_kin_name || 'N/A'} (${motherProfile?.next_of_kin_relationship || ''}) — ${motherProfile?.next_of_kin_phone || 'N/A'}`,
        ``,
        `Destination: ${hosp?.name || 'Your facility'}`,
        `ETA: ~${etaMinutes} minutes`,
      ].join('\n');

      NotificationService.createNotification(
        assignedDoctorId,
        '🩺 INCOMING PATIENT — Medical Preparation Required',
        medicalBrief,
        'dispatch',
        emergencyId
      );
    }

    // Send simulated SMS alerts
    if (motherUser) {
      SmsService.sendSms(
        motherUser.full_name,
        motherUser.phone,
        `MamaTrack: Ambulance dispatched! Driver ${driverUser?.full_name || 'Emergency Team'} is on the way. Destination: ${hosp?.name || 'Hospital'}. ETA: ${etaMinutes} mins.`
      );
    }
    if (driverUser) {
      SmsService.sendSms(
        driverUser.full_name,
        driverUser.phone,
        `MamaTrack DISPATCH: Navigate to ${motherUser?.full_name || 'Patient'} at ${motherLocation} (GPS: ${emg.latitude.toFixed(4)}, ${emg.longitude.toFixed(4)}). Deliver to ${hosp?.name}. ETA: ${etaMinutes} mins.`
      );
    }
    if (assignedDoctorId) {
      const doctorUser = db.users.find(u => u.id === assignedDoctorId);
      if (doctorUser) {
        SmsService.sendSms(
          doctorUser.full_name,
          doctorUser.phone,
          `MamaTrack ALERT: Inbound maternal patient ${motherUser?.full_name || 'Patient'} (Blood: ${motherProfile?.blood_type || '?'}, Complications: ${motherProfile?.current_complications || 'None'}) dispatched to ${hosp?.name || 'your facility'}. Prepare for arrival. ETA: ~${etaMinutes} mins.`
        );
      }
    }

    // Broadcast dispatch event for real-time updates
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mamatrack_dispatch', { detail: updatedEmg }));
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mamatrack_emergency_channel');
        bc.postMessage({ type: 'EMERGENCY_DISPATCHED', emergency: updatedEmg });
        bc.close();
      }
    } catch (e) {
      console.log('Broadcast dispatch event posted');
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
    if (status === 'en_route') {
      // equivalent to driver moving toward mother
    } else if (status === 'arrived') {
      updatedEmg.picked_up_at = nowStr;
      updatedEmg.arrived_at = nowStr;
    } else if (status === 'in_transit') {
      // Mother picked up, ambulance heading to hospital
      updatedEmg.picked_up_at = updatedEmg.picked_up_at || nowStr;
    } else if (status === 'delivered') {
      // Ambulance reached the hospital. The driver's job ends here — release the
      // vehicle for the next dispatch — but the case stays open until the doctor
      // completes clinical triage (see DoctorService.recordAssessment).
      updatedEmg.delivered_at = nowStr;
      if (emg.vehicle_id) {
        const vehicles = db.vehicles;
        db.vehicles = vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
      }
    } else if (status === 'completed') {
      updatedEmg.completed_at = nowStr;
      // Release vehicle (in case the case was closed without going through 'delivered')
      if (emg.vehicle_id) {
        const vehicles = db.vehicles;
        db.vehicles = vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
      }
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);

    this.logTransition(emergencyId, prevStatus, status, changedByUserId, notes);

    // Notifications
    const motherUser = db.users.find(u => u.id === emg.mother_id);
    const driverUser = db.users.find(u => u.id === emg.driver_id);
    const doctorUser = db.users.find(u => u.id === emg.doctor_id);
    const adminUser = db.users.find(u => u.role === 'admin');
    const hosp = emg.hospital_id ? db.hospitals.find(h => h.id === emg.hospital_id) : null;

    let msg = `Status updated to ${status}.`;
    if (status === 'en_route') msg = `Ambulance driver is en route to your location. GPS tracking active.`;
    else if (status === 'arrived') msg = `Ambulance has arrived at your location. Please board immediately.`;
    else if (status === 'in_transit') msg = `You are now in transit to ${hosp?.name || 'the hospital'}. Hold on, help is near.`;
    else if (status === 'delivered') msg = `You have arrived safely at ${hosp?.name || 'the hospital'}. The medical team is now taking over your care.`;
    else if (status === 'completed') msg = `Rescue completed. Clinical handoff at ${hosp?.name || 'the hospital'} is finished.`;

    if (motherUser) {
      NotificationService.createNotification(motherUser.id, '🚨 Rescue Status: ' + status.toUpperCase(), msg, 'status_update', emergencyId);
    }
    if (driverUser && changedByUserId !== driverUser.id) {
      NotificationService.createNotification(driverUser.id, '🚨 Emergency Update', `Emergency status changed to ${status}`, 'status_update', emergencyId);
    }
    if (doctorUser && changedByUserId !== doctorUser.id) {
      let doctorMsg = `Emergency status updated to ${status}`;
      if (status === 'in_transit') doctorMsg = `🚑 Patient is now in transit to your facility. Prepare for arrival.`;
      else if (status === 'arrived' && prevStatus === 'en_route') doctorMsg = `🚑 Ambulance has reached the patient. Pickup complete — transit to hospital beginning soon.`;
      else if (status === 'delivered') doctorMsg = `🏥 Patient has arrived at ${hosp?.name || 'your facility'}. Driver handoff complete — please proceed with clinical triage.`;
      else if (status === 'completed') doctorMsg = `✅ Case closed for patient at ${hosp?.name || 'your facility'}.`;
      NotificationService.createNotification(doctorUser.id, '🩺 Patient Status: ' + status.toUpperCase(), doctorMsg, 'status_update', emergencyId);
    }
    if (adminUser && changedByUserId !== adminUser.id) {
      NotificationService.createNotification(adminUser.id, '📡 Fleet Alert: ' + status.toUpperCase(), `Emergency ${emg.code} updated to ${status}`, 'status_update', emergencyId);
    }

    // Broadcast status update for real-time tracking
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mamatrack_emergency_channel');
        bc.postMessage({ type: 'EMERGENCY_STATUS_UPDATE', emergency: updatedEmg });
        bc.close();
      }
    } catch (e) {
      console.log('Broadcast status update event posted');
    }

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

    // Release vehicle
    if (emg.vehicle_id) {
      const vehicles = db.vehicles;
      db.vehicles = vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
    }

    db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
    this.logTransition(emergencyId, emg.status, 'cancelled', cancelledByUserId, `Emergency cancelled: ${reason}`);

    // Notify participants
    const party = [emg.mother_id, emg.driver_id, emg.doctor_id, 1].filter(Boolean) as number[];
    party.forEach(uid => {
      if (uid === cancelledByUserId) return;
      NotificationService.createNotification(
        uid,
        '⚠️ Emergency Cancelled',
        `Rescue mission ${emg.code} has been cancelled. Reason: ${reason}`,
        'cancelled',
        emergencyId
      );
    });

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
    const notifs = db.notifications;
    db.notifications = notifs.map(n => n.id === notifId ? { ...n, is_read: true } : n);
  },

  markAllAsRead(userId: number): void {
    const notifs = db.notifications;
    db.notifications = notifs.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
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
    outcome: ClinicalAssessment['outcome']
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
      logged_at: new Date().toISOString()
    };

    db.clinicalAssessments = [...assessments, newAssessment];

    // Auto complete emergency if treated/discharged/referred
    const emg = db.emergencies.find(e => e.id === emergencyId);
    if (emg && emg.status !== 'completed') {
      EmergencyService.updateStatus(emergencyId, 'completed', doctorUserId, `Clinical assessment completed. Patient outcome: ${outcome.toUpperCase()}`);
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

    // Notify admin
    db.users.filter(u => u.role === 'admin').forEach(admin => {
      NotificationService.createNotification(
        admin.id,
        '💉 Blood Supply Needed',
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
    
    // Synchronize the vehicle status
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
// 5. MATH & SIMULATION ENGINE
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

// Global active simulations handles to clear intervals if needed
const activeSims: Record<number, number> = {};

export const SimulationEngine = {
  startAmbulanceSimulation(emergencyId: number, onUpdate: (emergency: Emergency) => void) {
    if (activeSims[emergencyId]) return;

    // Periodically update coordinates
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

      // Move 200m towards target
      if (dist > 0.05) {
        const step = 0.002; // Roughly 200 meters in lat/lng delta
        const angle = Math.atan2(targetLat - currentLat, targetLng - currentLng);
        currentLat += step * Math.sin(angle);
        currentLng += step * Math.cos(angle);

        // Update driver location in DB
        const drivers = db.drivers;
        db.drivers = drivers.map(d => d.user_id === emg.driver_id ? { ...d, current_latitude: currentLat, current_longitude: currentLng } : d);

        // Update active vehicle coordinates
        if (emg.vehicle_id) {
          const vehicles = db.vehicles;
          db.vehicles = vehicles.map(v => v.id === emg.vehicle_id ? { ...v, current_latitude: currentLat, current_longitude: currentLng } : v);
        }

        // recalculate ETA
        const newEta = Math.max(1, Math.round(dist * 3)); // ~3 mins per km
        const updatedEmg = { ...emg, eta_minutes: newEta };
        
        // If status was dispatched, transition to en_route
        if (emg.status === 'dispatched') {
          updatedEmg.status = 'en_route';
          EmergencyService.logTransition(emergencyId, 'dispatched', 'en_route', emg.driver_id, 'Ambulance GPS moving. Tracking active.');
        }

        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        onUpdate(updatedEmg);
      } else {
        // Ambulance arrived at mother
        const updatedEmg = { ...emg, status: 'arrived' as const, eta_minutes: 0, arrived_at: new Date().toISOString(), picked_up_at: new Date().toISOString() };
        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        
        EmergencyService.logTransition(emergencyId, emg.status, 'arrived', emg.driver_id, 'Ambulance has arrived at the patient location.');
        
        // Notify Mother
        NotificationService.createNotification(
          emg.mother_id,
          '🚑 Ambulance Arrived',
          'The ambulance has arrived! Please prepare to board.',
          'status_update',
          emergencyId
        );

        // Notify Doctor — patient picked up
        if (emg.doctor_id) {
          NotificationService.createNotification(
            emg.doctor_id,
            '🚑 Patient Picked Up',
            `Ambulance has reached the patient. Transit to your facility will begin shortly.`,
            'status_update',
            emergencyId
          );
        }

        onUpdate(updatedEmg);
        this.stopSimulation(emergencyId);
      }
    }, 4000); // simulation tick every 4s

    activeSims[emergencyId] = interval;
  },

  // Second-leg simulation: Drive from mother's pickup location to the assigned hospital
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

        // Update driver location
        db.drivers = db.drivers.map(d => d.user_id === emg.driver_id ? { ...d, current_latitude: currentLat, current_longitude: currentLng } : d);

        // Update vehicle coordinates
        if (emg.vehicle_id) {
          db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, current_latitude: currentLat, current_longitude: currentLng } : v);
        }

        const newEta = Math.max(1, Math.round(dist * 3));
        const updatedEmg = { ...emg, eta_minutes: newEta };
        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);
        onUpdate(updatedEmg);
      } else {
        // Ambulance arrived at hospital — the driver's job is done, but the case
        // stays open until the doctor completes clinical triage (see
        // DoctorService.recordAssessment, which transitions 'delivered' -> 'completed').
        const updatedEmg: Emergency = {
          ...emg,
          status: 'delivered',
          eta_minutes: 0,
          delivered_at: new Date().toISOString()
        };

        // Release vehicle — driver is free for the next dispatch
        if (emg.vehicle_id) {
          db.vehicles = db.vehicles.map(v => v.id === emg.vehicle_id ? { ...v, status: 'available' } : v);
        }

        db.emergencies = emergencies.map(e => e.id === emergencyId ? updatedEmg : e);

        EmergencyService.logTransition(emergencyId, 'in_transit', 'delivered', emg.driver_id, `Patient delivered to ${hosp.name}. Driver handoff complete — awaiting clinical triage.`);

        // Notify all parties
        NotificationService.createNotification(
          emg.mother_id,
          '🏥 Arrived at Hospital',
          `You have arrived safely at ${hosp.name}. The medical team is ready for you.`,
          'status_update',
          emergencyId
        );

        if (emg.driver_id) {
          NotificationService.createNotification(
            emg.driver_id,
            '✅ Mission Complete',
            `Patient delivered to ${hosp.name}. You are now available for new dispatches.`,
            'status_update',
            emergencyId
          );
        }

        if (emg.doctor_id) {
          NotificationService.createNotification(
            emg.doctor_id,
            '🏥 Patient Has Arrived',
            `Patient has arrived at ${hosp.name}. Please proceed with clinical assessment and triage.`,
            'status_update',
            emergencyId
          );
        }

        const adminUsers = db.users.filter(u => u.role === 'admin');
        adminUsers.forEach(admin => {
          NotificationService.createNotification(
            admin.id,
            '🏥 Patient Delivered — Awaiting Triage',
            `Emergency ${emg.code}: Patient delivered to ${hosp.name}. Driver mission complete; clinical triage pending.`,
            'status_update',
            emergencyId
          );
        });

        onUpdate(updatedEmg);
        this.stopSimulation(emergencyId);
      }
    }, 4000);

    activeSims[emergencyId] = interval;
  },

  stopSimulation(emergencyId: number) {
    if (activeSims[emergencyId]) {
      clearInterval(activeSims[emergencyId]);
      delete activeSims[emergencyId];
    }
  }
};
