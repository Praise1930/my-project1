import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tdomiogiabjomkhjkres.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb21pb2dpYWJqb21raGprcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTEwNjksImV4cCI6MjEwMDY4NzA2OX0.gBVxScPK_BFdrXPW-ib2sxQ2ZZ0bebPCHvLhxwjiGOs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEED_USERS = [
  // ── 2 Administrator Accounts ──
  { id: 1, full_name: 'Dr. Sarah Namukasa', email: 'admin@mamatrack.ug', phone: '+256-742-100-001', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 2, full_name: 'Robert Kaggwa', email: 'admin2@mamatrack.ug', phone: '+256-742-100-002', password_hash: 'password123', role: 'admin', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },

  // ── 7 Clinical Doctors (Male & Female) ──
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

  // ── 5 Village Health Team (VHT) Members ──
  { id: 25, full_name: 'Nakitto Sarah', email: 'vht@mamatrack.ug', phone: '+256-788-000-101', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 26, full_name: 'Namusoke Betty', email: 'betty.namusoke@mamatrack.ug', phone: '+256-788-000-102', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 27, full_name: 'Lutwama Charles', email: 'charles.lutwama@mamatrack.ug', phone: '+256-788-000-103', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 28, full_name: 'Mugisha Francis', email: 'francis.mugisha@mamatrack.ug', phone: '+256-788-000-104', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 29, full_name: 'Nantongo Agnes', email: 'agnes.nantongo@mamatrack.ug', phone: '+256-788-000-105', password_hash: 'password123', role: 'vht', avatar: null, is_active: true, email_verified: true, created_at: '2026-06-01T00:00:00Z' }
];

const SEED_DOCTORS = [
  { id: 1, user_id: 3, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2018-4521', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 12 },
  { id: 2, user_id: 4, hospital_id: 2, specialization: 'Maternal-Fetal Medicine', license_number: 'UG-MED-2019-3310', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 9 },
  { id: 3, user_id: 5, hospital_id: 1, specialization: 'Emergency Medicine', license_number: 'UG-MED-2017-1109', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 10 },
  { id: 4, user_id: 6, hospital_id: 3, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2020-8812', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 7 },
  { id: 5, user_id: 7, hospital_id: 4, specialization: 'Neonatology & Pediatrics', license_number: 'UG-MED-2016-5432', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 11 },
  { id: 6, user_id: 8, hospital_id: 5, specialization: 'General Surgery & Obstetrics', license_number: 'UG-MED-2021-9941', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 6 },
  { id: 7, user_id: 9, hospital_id: 1, specialization: 'Obstetrics & Gynecology', license_number: 'UG-MED-2015-7721', is_on_duty: true, shift_start: '08:00', shift_end: '20:00', years_experience: 14 }
];

const SEED_DRIVERS = [
  { id: 1, user_id: 10, hospital_id: 1, vehicle_id: 1, license_number: 'UG-DL-2019-88432', driver_role: 'Primary Emergency Driver', is_on_duty: true, current_latitude: 0.3536, current_longitude: 32.7554 },
  { id: 2, user_id: 11, hospital_id: 1, vehicle_id: 2, license_number: 'UG-DL-2020-77123', driver_role: 'Rapid Response Driver', is_on_duty: true, current_latitude: 0.3540, current_longitude: 32.7558 },
  { id: 3, user_id: 12, hospital_id: 2, vehicle_id: 3, license_number: 'UG-DL-2018-44910', driver_role: 'Senior Emergency Driver', is_on_duty: true, current_latitude: 0.3548, current_longitude: 32.7501 },
  { id: 4, user_id: 13, hospital_id: 7, vehicle_id: 4, license_number: 'UG-DL-2021-11928', driver_role: 'Maternal Transport Driver', is_on_duty: true, current_latitude: 0.3680, current_longitude: 32.6890 },
  { id: 5, user_id: 14, hospital_id: 2, vehicle_id: 5, license_number: 'UG-DL-2017-33849', driver_role: 'Standby Emergency Driver', is_on_duty: true, current_latitude: 0.3548, current_longitude: 32.7501 }
];

const SEED_MOTHERS = [
  { id: 1, user_id: 15, date_of_birth: '1995-03-15', national_id: 'CM950315D', blood_type: 'O+', pregnancy_start_date: '2026-01-10', expected_due_date: '2026-10-17', gravida: 2, parity: 1, medical_history: 'No known allergies. Previous normal delivery.', current_complications: 'None', next_of_kin_name: 'Ssemanda Ahmed', next_of_kin_phone: '+256-751-500-001', next_of_kin_relationship: 'Husband', village: 'Goma Village', sub_county: 'Goma', district: 'Mukono', vht_name: 'Nakitto Sarah', vht_phone: '+256-788-000-111', home_latitude: 0.3420, home_longitude: 32.7680, preferred_hospital_id: 1 },
  { id: 2, user_id: 16, date_of_birth: '1998-07-22', national_id: 'CM980722R', blood_type: 'A+', pregnancy_start_date: '2026-02-01', expected_due_date: '2026-11-08', gravida: 1, parity: 0, medical_history: 'Mild asthma.', current_complications: 'None', next_of_kin_name: 'Okwera John', next_of_kin_phone: '+256-751-500-002', next_of_kin_relationship: 'Husband', village: 'Seeta Town', sub_county: 'Nama', district: 'Mukono', vht_name: 'Namusoke Betty', vht_phone: '+256-788-000-112', home_latitude: 0.3650, home_longitude: 32.6910, preferred_hospital_id: 7 },
  { id: 3, user_id: 17, date_of_birth: '1993-11-05', national_id: 'CM931105J', blood_type: 'B+', pregnancy_start_date: '2026-01-20', expected_due_date: '2026-10-27', gravida: 3, parity: 2, medical_history: 'Previous C-Section (2022).', current_complications: 'Gestational Hypertension', next_of_kin_name: 'Kivumbi Paul', next_of_kin_phone: '+256-751-500-003', next_of_kin_relationship: 'Husband', village: 'Mukono Central', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Lutwama Charles', vht_phone: '+256-788-000-113', home_latitude: 0.3510, home_longitude: 32.7530, preferred_hospital_id: 2 },
  { id: 4, user_id: 18, date_of_birth: '2000-05-18', national_id: 'CF000518E', blood_type: 'O-', pregnancy_start_date: '2026-03-05', expected_due_date: '2026-12-10', gravida: 1, parity: 0, medical_history: 'None.', current_complications: 'None', next_of_kin_name: 'Namugga Grace', next_of_kin_phone: '+256-751-500-004', next_of_kin_relationship: 'Mother', village: 'Nama Sub-County', sub_county: 'Nama', district: 'Mukono', vht_name: 'Mugisha Francis', vht_phone: '+256-788-000-114', home_latitude: 0.2990, home_longitude: 32.8140, preferred_hospital_id: 5 },
  { id: 5, user_id: 19, date_of_birth: '1996-09-30', national_id: 'CM960930R', blood_type: 'AB+', pregnancy_start_date: '2026-01-15', expected_due_date: '2026-10-22', gravida: 2, parity: 1, medical_history: 'No major illnesses.', current_complications: 'None', next_of_kin_name: 'Kato Mark', next_of_kin_phone: '+256-751-500-005', next_of_kin_relationship: 'Husband', village: 'Industrial Zone', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Nantongo Agnes', vht_phone: '+256-788-000-115', home_latitude: 0.3530, home_longitude: 32.7620, preferred_hospital_id: 3 },
  { id: 6, user_id: 20, date_of_birth: '1997-04-12', national_id: 'CM970412S', blood_type: 'A-', pregnancy_start_date: '2026-02-14', expected_due_date: '2026-11-21', gravida: 2, parity: 1, medical_history: 'Iron deficiency anemia.', current_complications: 'Mild Anemia', next_of_kin_name: 'Waiswa Peter', next_of_kin_phone: '+256-751-500-006', next_of_kin_relationship: 'Husband', village: 'Goma', sub_county: 'Goma', district: 'Mukono', vht_name: 'Nakitto Sarah', vht_phone: '+256-788-000-111', home_latitude: 0.3450, home_longitude: 32.7660, preferred_hospital_id: 1 },
  { id: 7, user_id: 21, date_of_birth: '1999-12-01', national_id: 'CF991201B', blood_type: 'O+', pregnancy_start_date: '2026-03-01', expected_due_date: '2026-12-06', gravida: 1, parity: 0, medical_history: 'None.', current_complications: 'None', next_of_kin_name: 'Otti Samuel', next_of_kin_phone: '+256-751-500-007', next_of_kin_relationship: 'Husband', village: 'Seeta', sub_county: 'Nama', district: 'Mukono', vht_name: 'Namusoke Betty', vht_phone: '+256-788-000-112', home_latitude: 0.3690, home_longitude: 32.6880, preferred_hospital_id: 7 },
  { id: 8, user_id: 22, date_of_birth: '1994-08-14', national_id: 'CM940814M', blood_type: 'B-', pregnancy_start_date: '2026-01-05', expected_due_date: '2026-10-12', gravida: 4, parity: 3, medical_history: 'Normal previous deliveries.', current_complications: 'None', next_of_kin_name: 'Ssali David', next_of_kin_phone: '+256-751-500-008', next_of_kin_relationship: 'Husband', village: 'Mukono Town', sub_county: 'Mukono Municipality', district: 'Mukono', vht_name: 'Lutwama Charles', vht_phone: '+256-788-000-113', home_latitude: 0.3540, home_longitude: 32.7560, preferred_hospital_id: 1 },
  { id: 9, user_id: 23, date_of_birth: '1996-01-25', national_id: 'CM960125P', blood_type: 'O+', pregnancy_start_date: '2026-02-20', expected_due_date: '2026-11-27', gravida: 2, parity: 1, medical_history: 'None.', current_complications: 'None', next_of_kin_name: 'Mwesigwa Isaac', next_of_kin_phone: '+256-751-500-009', next_of_kin_relationship: 'Husband', village: 'Nama Town', sub_county: 'Nama', district: 'Mukono', vht_name: 'Mugisha Francis', vht_phone: '+256-788-000-114', home_latitude: 0.2970, home_longitude: 32.8100, preferred_hospital_id: 5 },
  { id: 10, user_id: 24, date_of_birth: '1995-10-10', national_id: 'CM951010C', blood_type: 'A+', pregnancy_start_date: '2026-03-10', expected_due_date: '2026-12-15', gravida: 1, parity: 0, medical_history: 'None.', current_complications: 'None', next_of_kin_name: 'Lule Patrick', next_of_kin_phone: '+256-751-500-010', next_of_kin_relationship: 'Husband', village: 'Goma Centre', sub_county: 'Goma', district: 'Mukono', vht_name: 'Nakitto Sarah', vht_phone: '+256-788-000-111', home_latitude: 0.3410, home_longitude: 32.7690, preferred_hospital_id: 1 }
];

const SEED_VEHICLES = [
  { id: 1, plate_number: 'UBG 001A', vehicle_type: 'Ambulance - Type II (Advanced Life Support)', hospital_id: 1, status: 'available', current_latitude: 0.3536, current_longitude: 32.7554, capacity: 1, has_equipment: true, is_active: true },
  { id: 2, plate_number: 'UBG 002A', vehicle_type: 'Ambulance - Type I (Basic Life Support)', hospital_id: 1, status: 'available', current_latitude: 0.3540, current_longitude: 32.7558, capacity: 1, has_equipment: true, is_active: true },
  { id: 3, plate_number: 'UBG 003A', vehicle_type: 'Ambulance - Type II (Advanced Life Support)', hospital_id: 2, status: 'available', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true },
  { id: 4, plate_number: 'UBG 004A', vehicle_type: 'Ambulance - Basic Transport', hospital_id: 7, status: 'available', current_latitude: 0.3680, current_longitude: 32.6890, capacity: 1, has_equipment: true, is_active: true },
  { id: 5, plate_number: 'UBG 005A', vehicle_type: 'Ambulance - Type I (Basic Life Support)', hospital_id: 2, status: 'available', current_latitude: 0.3548, current_longitude: 32.7501, capacity: 1, has_equipment: true, is_active: true }
];

async function seedSupabase() {
  console.log('Seeding Supabase tables with complete user roster...');

  // Upsert users
  const { error: userErr } = await supabase.from('users').upsert(SEED_USERS, { onConflict: 'id' });
  if (userErr) console.error('Users upsert error:', userErr.message);
  else console.log(`✓ Upserted ${SEED_USERS.length} users into Supabase users table`);

  // Upsert doctors
  const { error: docErr } = await supabase.from('doctors').upsert(SEED_DOCTORS, { onConflict: 'id' });
  if (docErr) console.error('Doctors upsert error:', docErr.message);
  else console.log(`✓ Upserted ${SEED_DOCTORS.length} doctors into Supabase doctors table`);

  // Upsert drivers
  const { error: drvErr } = await supabase.from('drivers').upsert(SEED_DRIVERS, { onConflict: 'id' });
  if (drvErr) console.error('Drivers upsert error:', drvErr.message);
  else console.log(`✓ Upserted ${SEED_DRIVERS.length} drivers into Supabase drivers table`);

  // Upsert mothers
  const { error: mthErr } = await supabase.from('mothers').upsert(SEED_MOTHERS, { onConflict: 'id' });
  if (mthErr) console.error('Mothers upsert error:', mthErr.message);
  else console.log(`✓ Upserted ${SEED_MOTHERS.length} mothers into Supabase mothers table`);

  // Upsert vehicles
  const { error: vehErr } = await supabase.from('vehicles').upsert(SEED_VEHICLES, { onConflict: 'id' });
  if (vehErr) console.error('Vehicles upsert error:', vehErr.message);
  else console.log(`✓ Upserted ${SEED_VEHICLES.length} vehicles into Supabase vehicles table`);

  console.log('Supabase seeding complete!');
}

seedSupabase();
