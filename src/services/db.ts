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
  role: 'mother' | 'admin' | 'doctor' | 'driver';
  avatar: string | null; // base64 / dataUrl or placeholder emoji
  is_active: boolean;
  last_login?: string;
  created_at: string;
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
  status: 'pending' | 'verified' | 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
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

const SEED_USERS: User[] = [
  // Admin
  { id: 1, full_name: 'Dr. Sarah Namukasa', email: 'admin@mukonogeneral.go.ug', phone: '+256-742-100-001', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, created_at: '2026-06-01T00:00:00Z' },
  // Doctors
  { id: 2, full_name: 'Dr. James Ssemakula', email: 'james.ssemakula@mukonogeneral.go.ug', phone: '+256-742-200-001', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 3, full_name: 'Dr. Grace Namutebi', email: 'grace.namutebi@mukonocou.org', phone: '+256-742-200-002', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, created_at: '2026-06-02T00:00:00Z' },
  { id: 4, full_name: 'Dr. Peter Ochieng', email: 'peter.ochieng@mukonogeneral.go.ug', phone: '+256-742-200-003', password_hash: 'password123', role: 'doctor', avatar: null, is_active: true, created_at: '2026-06-03T00:00:00Z' },
  // Drivers
  { id: 5, full_name: 'Moses Kiggundu', email: 'moses.kiggundu@mukonogeneral.go.ug', phone: '+256-742-300-001', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 6, full_name: 'Joseph Lubwama', email: 'joseph.lubwama@mukonocou.org', phone: '+256-742-300-002', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, created_at: '2026-06-02T00:00:00Z' },
  { id: 7, full_name: 'David Ssekandi', email: 'david.ssekandi@seetahospital.co.ug', phone: '+256-742-300-003', password_hash: 'password123', role: 'driver', avatar: null, is_active: true, created_at: '2026-06-03T00:00:00Z' },
  // Mothers
  { id: 8, full_name: 'Nakato Fatima', email: 'fatima.nakato@gmail.com', phone: '+256-769-400-001', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 9, full_name: 'Auma Rosemary', email: 'rosemary.auma@gmail.com', phone: '+256-769-400-002', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, created_at: '2026-06-05T00:00:00Z' },
  { id: 10, full_name: 'Babirye Joan', email: 'joan.babirye@gmail.com', phone: '+256-769-400-003', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, created_at: '2026-06-10T00:00:00Z' },
  { id: 11, full_name: 'Namugga Esther', email: 'esther.namugga@gmail.com', phone: '+256-769-400-004', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, created_at: '2026-06-15T00:00:00Z' },
  { id: 12, full_name: 'Kyomuhendo Ruth', email: 'ruth.kyomuhendo@gmail.com', phone: '+256-769-400-005', password_hash: 'password123', role: 'mother', avatar: null, is_active: true, created_at: '2026-06-20T00:00:00Z' }
];

const SEED_DOCTORS: Doctor[] = [
  { id: 1, user_id: 2, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2018-4521', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 8 },
  { id: 2, user_id: 3, hospital_id: 2, specialization: 'Midwifery & Maternal Health', license_number: 'UG-MED-2016-3287', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 10 },
  { id: 3, user_id: 4, hospital_id: 1, specialization: 'Emergency Obstetrics', license_number: 'UG-MED-2020-5890', is_on_duty: false, shift_start: '20:00', shift_end: '08:00', years_experience: 4 }
];

const SEED_DRIVERS: Driver[] = [
  { id: 1, user_id: 5, hospital_id: 1, vehicle_id: 1, license_number: 'UG-DL-2019-88432', driver_role: 'Primary Emergency Driver', is_on_duty: true, current_latitude: 0.3536, current_longitude: 32.7554 },
  { id: 2, user_id: 6, hospital_id: 2, vehicle_id: 3, license_number: 'UG-DL-2017-72145', driver_role: 'Primary Emergency Driver', is_on_duty: true, current_latitude: 0.3548, current_longitude: 32.7501 },
  { id: 3, user_id: 7, hospital_id: 7, vehicle_id: 4, license_number: 'UG-DL-2020-91256', driver_role: 'Primary Emergency Driver', is_on_duty: false, current_latitude: 0.3680, current_longitude: 32.6890 }
];

const SEED_MOTHERS: Mother[] = [
  { id: 1, user_id: 8, date_of_birth: '1995-03-15', national_id: 'CM950315D', blood_type: 'O+', pregnancy_start_date: '2026-01-10', expected_due_date: '2026-10-17', gravida: 2, parity: 1, medical_history: 'No known allergies. Previous normal delivery.', current_complications: 'None', next_of_kin_name: 'Ssemanda Ahmed', next_of_kin_phone: '+256-751-500-001', next_of_kin_relationship: 'Husband', village: 'Goma Village', sub_county: 'Goma', district: 'Mukono', vht_name: 'Namusoke Betty', vht_phone: '+256-772-600-001', home_latitude: 0.3420, home_longitude: 32.7680, preferred_hospital_id: 1 },
  { id: 2, user_id: 9, date_of_birth: '1998-07-22', national_id: 'CM980722D', blood_type: 'A+', pregnancy_start_date: '2026-02-05', expected_due_date: '2026-11-12', gravida: 1, parity: 0, medical_history: 'Mild anaemia. First pregnancy.', current_complications: 'Anaemia under therapy', next_of_kin_name: 'Opio Daniel', next_of_kin_phone: '+256-751-500-002', next_of_kin_relationship: 'Husband', village: 'Seeta Trading Centre', sub_county: 'Nama', district: 'Mukono', vht_name: 'Lutwama Charles', vht_phone: '+256-772-600-002', home_latitude: 0.3650, home_longitude: 32.6920, preferred_hospital_id: 2 },
  { id: 3, user_id: 10, date_of_birth: '1992-11-08', national_id: 'CM921108D', blood_type: 'B+', pregnancy_start_date: '2025-12-20', expected_due_date: '2026-09-26', gravida: 3, parity: 2, medical_history: 'History of PPH in second delivery. High-risk pregnancy.', current_complications: 'Threatened preterm labor', next_of_kin_name: 'Babirye Michael', next_of_kin_phone: '+256-751-500-003', next_of_kin_relationship: 'Husband', village: 'Ntenjeru Village', sub_county: 'Ntenjeru', district: 'Mukono', vht_name: 'Mugisha Francis', vht_phone: '+256-772-600-003', home_latitude: 0.3200, home_longitude: 32.8100, preferred_hospital_id: 1 },
  { id: 4, user_id: 11, date_of_birth: '2000-05-30', national_id: 'CM000530D', blood_type: 'O-', pregnancy_start_date: '2026-03-01', expected_due_date: '2026-12-06', gravida: 1, parity: 0, medical_history: 'Gestational diabetes diagnosed. Under monitoring.', current_complications: 'Gestational Diabetes', next_of_kin_name: 'Namugga Robert', next_of_kin_phone: '+256-751-500-004', next_of_kin_relationship: 'Brother', village: 'Koome Island', sub_county: 'Koome', district: 'Mukono', vht_name: 'Nantongo Agnes', vht_phone: '+256-772-600-004', home_latitude: 0.1480, home_longitude: 32.8750, preferred_hospital_id: 6 },
  { id: 5, user_id: 12, date_of_birth: '1997-09-14', national_id: 'CM970914D', blood_type: 'AB+', pregnancy_start_date: '2026-01-25', expected_due_date: '2026-11-01', gravida: 2, parity: 1, medical_history: 'No complications. Previous C-section.', current_complications: 'Prior Caesarian Section', next_of_kin_name: 'Ssekandi Paul', next_of_kin_phone: '+256-751-500-005', next_of_kin_relationship: 'Husband', village: 'Mukono Town', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Kawuma Isaac', vht_phone: '+256-772-600-005', home_latitude: 0.3530, home_longitude: 32.7540, preferred_hospital_id: 1 }
];

const SEED_CHECKUPS: CheckupSchedule[] = [
  { id: 1, mother_id: 8, hospital_id: 1, checkup_type: 'Antenatal Visit 4', scheduled_date: '2026-06-25', scheduled_time: '09:00', notes: 'Routine checkup - 24 weeks', status: 'completed' },
  { id: 2, mother_id: 8, hospital_id: 1, checkup_type: 'Ultrasound Scan', scheduled_date: '2026-07-10', scheduled_time: '10:30', notes: 'Anomaly scan', status: 'upcoming' },
  { id: 3, mother_id: 9, hospital_id: 2, checkup_type: 'Antenatal Visit 3', scheduled_date: '2026-06-20', scheduled_time: '08:30', notes: 'Blood pressure and weight check', status: 'completed' },
  { id: 4, mother_id: 9, hospital_id: 2, checkup_type: 'Blood Test', scheduled_date: '2026-06-28', scheduled_time: '09:00', notes: 'Hemoglobin level check for anaemia', status: 'missed' },
  { id: 5, mother_id: 10, hospital_id: 1, checkup_type: 'Antenatal Visit 5', scheduled_date: '2026-06-22', scheduled_time: '11:00', notes: 'High-risk monitoring - PPH history', status: 'completed' },
  { id: 6, mother_id: 10, hospital_id: 1, checkup_type: 'Specialist Consultation', scheduled_date: '2026-07-05', scheduled_time: '14:00', notes: 'Obstetrician review for delivery plan', status: 'upcoming' },
  { id: 7, mother_id: 11, hospital_id: 6, checkup_type: 'Antenatal Visit 3', scheduled_date: '2026-07-01', scheduled_time: '09:00', notes: 'Glucose monitoring', status: 'upcoming' },
  { id: 8, mother_id: 12, hospital_id: 1, checkup_type: 'Antenatal Visit 4', scheduled_date: '2026-06-30', scheduled_time: '10:00', notes: 'Routine checkup', status: 'upcoming' }
];

const SEED_EMERGENCIES: Emergency[] = [
  { id: 1, code: 'EMG-2026-0001', mother_id: 10, latitude: 0.3200, longitude: 32.8100, status: 'completed', severity: 'critical', notes: 'Severe abdominal pain and bleeding. History of PPH.', hospital_id: 1, driver_id: 5, doctor_id: 2, vehicle_id: 1, cancel_reason: null, eta_minutes: 30, dispatched_by: 1, triggered_at: '2026-06-15T14:30:00Z', dispatched_at: '2026-06-15T14:32:00Z', picked_up_at: '2026-06-15T15:00:00Z', arrived_at: '2026-06-15T15:30:00Z', completed_at: '2026-06-15T16:30:00Z', cancelled_at: null },
  { id: 2, code: 'EMG-2026-0002', mother_id: 8, latitude: 0.3420, longitude: 32.7680, status: 'completed', severity: 'high', notes: 'Strong contractions, possible early labour.', hospital_id: 1, driver_id: 5, doctor_id: 2, vehicle_id: 1, cancel_reason: null, eta_minutes: 15, dispatched_by: 1, triggered_at: '2026-06-17T22:15:00Z', dispatched_at: '2026-06-17T22:16:30Z', picked_up_at: '2026-06-17T22:30:00Z', arrived_at: '2026-06-17T22:55:00Z', completed_at: '2026-06-18T00:15:00Z', cancelled_at: null }
];

const SEED_EMERGENCY_LOGS: EmergencyLog[] = [
  { id: 1, emergency_id: 1, previous_status: null, new_status: 'pending', changed_by: 10, notes: 'Emergency triggered by mother via GPS', latitude: 0.3200, longitude: 32.8100, created_at: '2026-06-15T14:30:00Z' },
  { id: 2, emergency_id: 1, previous_status: 'pending', new_status: 'dispatched', changed_by: 1, notes: 'Dispatched ambulance UBG 001A to location', latitude: null, longitude: null, created_at: '2026-06-15T14:32:00Z' },
  { id: 3, emergency_id: 1, previous_status: 'dispatched', new_status: 'en_route', changed_by: 5, notes: 'Driver en route to patient', latitude: 0.3536, longitude: 32.7554, created_at: '2026-06-15T14:35:00Z' },
  { id: 4, emergency_id: 1, previous_status: 'en_route', new_status: 'arrived', changed_by: 5, notes: 'Arrived at patient location & picked up', latitude: 0.3200, longitude: 32.8100, created_at: '2026-06-15T15:00:00Z' },
  { id: 5, emergency_id: 1, previous_status: 'arrived', new_status: 'completed', changed_by: 2, notes: 'Patient treated successfully. PPH controlled.', latitude: null, longitude: null, created_at: '2026-06-15T16:30:00Z' }
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 1, user_id: 1, title: 'Emergency Completed', message: 'Emergency EMG-2026-0001 has been resolved. Patient treated successfully.', type: 'status_update', reference_id: 1, is_read: true, created_at: '2026-06-15T16:30:00Z' },
  { id: 2, user_id: 8, title: 'Checkup Completed', message: 'Your checkup (Antenatal Visit 4) was recorded as completed.', type: 'checkup_reminder', reference_id: 1, is_read: false, created_at: '2026-06-25T11:00:00Z' },
  { id: 3, user_id: 2, title: 'New Assignment', message: 'You have been assigned to emergency clinical support for Joan (EMG-2026-0001).', type: 'dispatch', reference_id: 1, is_read: true, created_at: '2026-06-15T14:32:00Z' }
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
    localStorage.setItem(`mamatrack_${key}`, JSON.stringify(data));
  }

  // Schema state accessors
  get users(): User[] { return this.getStore('users', SEED_USERS); }
  set users(val: User[]) { this.setStore('users', val); }

  get hospitals(): Hospital[] { return this.getStore('hospitals', SEED_HOSPITALS); }
  set hospitals(val: Hospital[]) { this.setStore('hospitals', val); }

  get vehicles(): Vehicle[] { return this.getStore('vehicles', SEED_VEHICLES); }
  set vehicles(val: Vehicle[]) { this.setStore('vehicles', val); }

  get mothers(): Mother[] { return this.getStore('mothers', SEED_MOTHERS); }
  set mothers(val: Mother[]) { this.setStore('mothers', val); }

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

  // ── Session Handling ──
  getCurrentSessionUser(): User | null {
    const raw = sessionStorage.getItem('mamatrack_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return this.users.find(u => u.id === session.id) || null;
  }

  setSessionUser(user: User | null): void {
    if (user) {
      sessionStorage.setItem('mamatrack_session', JSON.stringify({ id: user.id, role: user.role }));
    } else {
      sessionStorage.removeItem('mamatrack_session');
    }
  }

  // Reset database to initial seeds
  resetDatabase() {
    localStorage.removeItem('mamatrack_users');
    localStorage.removeItem('mamatrack_hospitals');
    localStorage.removeItem('mamatrack_vehicles');
    localStorage.removeItem('mamatrack_mothers');
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
    sessionStorage.removeItem('mamatrack_session');
  }
}

export const db = new LocalDatabase();

// ============================================================================
// 4. API METHOD ACTIONS (SERVICES)
// ============================================================================

export const AuthService = {
  login(email: string, password_hash: string, role: 'mother' | 'admin' | 'doctor' | 'driver'): { success: boolean; user?: User; error?: string } {
    const users = db.users;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user) {
      return { success: false, error: 'User account not found with selected role' };
    }
    if (user.password_hash !== password_hash) {
      return { success: false, error: 'Incorrect credentials' };
    }
    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
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
    db.setSessionUser(newUser);

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

  triggerEmergency(motherUserId: number, lat: number, lng: number, notes: string, requireCemonc: boolean): Emergency {
    const emergencies = db.emergencies;
    const active = this.getActiveEmergencyForMother(motherUserId);
    if (active) return active;

    const nextId = Math.max(...emergencies.map(e => e.id), 0) + 1;
    const code = `EMG-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;
    
    // Match hospital (nearest or default cemonc if required)
    const hospitals = db.hospitals;
    let assignedHospitalId = 1; // Mukono General default
    let minDistance = Infinity;

    hospitals.forEach(h => {
      if (requireCemonc && !h.has_cemonc) return;
      const d = haversine(lat, lng, h.latitude, h.longitude);
      if (d < minDistance) {
        minDistance = d;
        assignedHospitalId = h.id;
      }
    });

    const newEmergency: Emergency = {
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
      completed_at: null,
      cancelled_at: null
    };

    db.emergencies = [...emergencies, newEmergency];

    // Log the transaction
    this.logTransition(nextId, null, 'pending', motherUserId, 'SOS beacon triggered by patient via GPS');

    // Notify admins
    const admins = db.users.filter(u => u.role === 'admin');
    const motherName = db.users.find(u => u.id === motherUserId)?.full_name || 'Patient';
    admins.forEach(admin => {
      NotificationService.createNotification(
        admin.id,
        '🆘 Critical SOS Triggered',
        `Patient ${motherName} has triggered an emergency beacon. Hospital matched: ${hospitals.find(h => h.id === assignedHospitalId)?.name}`,
        'emergency',
        nextId
      );
    });

    return newEmergency;
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

    const updatedEmg: Emergency = {
      ...emg,
      status: 'dispatched',
      driver_id: driverUserId,
      doctor_id: doctorUserId,
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

    // Notifications
    const motherUser = db.users.find(u => u.id === emg.mother_id);
    const driverUser = db.users.find(u => u.id === driverUserId);
    const hosp = db.hospitals.find(h => h.id === hospitalId);

    // Notify Mother
    if (motherUser) {
      NotificationService.createNotification(
        motherUser.id,
        '🚑 Ambulance Dispatched!',
        `Ambulance driver ${driverUser?.full_name || 'Emergency Team'} is en route. Expected ETA: ${etaMinutes} mins.`,
        'dispatch',
        emergencyId
      );
    }

    // Notify Driver
    NotificationService.createNotification(
      driverUserId,
      '🚨 New Emergency Dispatch',
      `Respond to ${motherUser?.full_name || 'Patient'} located at Mukono coords. Hospital: ${hosp?.name}`,
      'dispatch',
      emergencyId
    );

    // Notify Doctor
    if (doctorUserId) {
      NotificationService.createNotification(
        doctorUserId,
        '🩺 Inbound Clinical Alert',
        `Expecting emergency transfer of maternal patient ${motherUser?.full_name || 'Patient'}. Standby for triage.`,
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
    if (status === 'en_route') {
      // equivalent to driver moving
    } else if (status === 'arrived') {
      updatedEmg.picked_up_at = nowStr;
      updatedEmg.arrived_at = nowStr;
    } else if (status === 'completed') {
      updatedEmg.completed_at = nowStr;
      // Release vehicle
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

    let msg = `Status updated to ${status}.`;
    if (status === 'en_route') msg = `Ambulance driver is en route. GPS tracking active.`;
    else if (status === 'arrived') msg = `Ambulance has arrived at your location. Please board immediately.`;
    else if (status === 'completed') msg = `Rescue completed. Hospital clinical handoff finished.`;

    if (motherUser) {
      NotificationService.createNotification(motherUser.id, '🚨 Rescue Status: ' + status.toUpperCase(), msg, 'status_update', emergencyId);
    }
    if (driverUser && changedByUserId !== driverUser.id) {
      NotificationService.createNotification(driverUser.id, '🚨 Emergency Update', `Emergency status changed to ${status}`, 'status_update', emergencyId);
    }
    if (doctorUser && changedByUserId !== doctorUser.id) {
      NotificationService.createNotification(doctorUser.id, '🩺 Patient Status: ' + status.toUpperCase(), `Emergency status updated to ${status}`, 'status_update', emergencyId);
    }
    if (adminUser && changedByUserId !== adminUser.id) {
      NotificationService.createNotification(adminUser.id, '📡 Fleet Alert: ' + status.toUpperCase(), `Emergency ${emg.code} updated to ${status}`, 'status_update', emergencyId);
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
        const updatedEmg = { ...emg, status: 'arrived' as const, eta_minutes: 0, arrived_at: new Date().toISOString() };
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

        onUpdate(updatedEmg);
        this.stopSimulation(emergencyId);
      }
    }, 4000); // simulation tick every 4s

    activeSims[emergencyId] = interval;
  },

  stopSimulation(emergencyId: number) {
    if (activeSims[emergencyId]) {
      clearInterval(activeSims[emergencyId]);
      delete activeSims[emergencyId];
    }
  }
};
