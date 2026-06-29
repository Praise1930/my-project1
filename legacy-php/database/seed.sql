-- ============================================================
-- GPS-Based Maternal Emergency Response & Monitoring System
-- Seed Data for Mukono District, Uganda
-- ============================================================

USE maternal_gps_system;

-- ============================================================
-- HOSPITALS — Real Mukono District facilities
-- ============================================================
INSERT INTO hospitals (name, type, latitude, longitude, address, sub_county, phone, email, total_beds, available_beds, has_cemonc, has_blood_bank, blood_types_available, has_surgical_capacity, has_ambulance) VALUES
('Mukono General Hospital', 'government', 0.3536, 32.7554, 'Mukono Town, Main Road', 'Mukono Municipality', '+256-414-290-001', 'info@mukonogeneral.go.ug', 200, 45, 1, 1, 'A+,A-,B+,B-,O+,O-,AB+,AB-', 1, 1),
('Mukono Church of Uganda Hospital', 'private', 0.3548, 32.7501, 'Mukono Town, CoU Road', 'Mukono Municipality', '+256-414-290-102', 'admin@mukonocou.org', 120, 28, 1, 1, 'A+,B+,O+,O-,AB+', 1, 1),
('C-Care (IMC) Hospital', 'private', 0.3510, 32.7612, 'Mukono Industrial Area', 'Mukono Municipality', '+256-414-290-203', 'info@ccare-mukono.com', 80, 15, 0, 0, 'O+,O-,A+,B+', 1, 0),
('AAR Pearl Hospital', 'private', 0.3525, 32.7580, 'Mukono Town Centre', 'Mukono Municipality', '+256-414-290-304', 'reception@aarpearl.co.ug', 60, 12, 0, 0, 'O+,A+,B+', 0, 0),
('Nama Health Centre IV', 'government', 0.2980, 32.8120, 'Nama Sub-County', 'Nama', '+256-414-290-405', 'nama.hc4@health.go.ug', 40, 10, 0, 0, 'O+,O-', 0, 0),
('Koome Health Centre III', 'government', 0.1450, 32.8800, 'Koome Islands, Lake Victoria', 'Koome', '+256-414-290-506', 'koome.hc3@health.go.ug', 20, 8, 0, 0, 'O+', 0, 0),
('Seeta Hospital', 'private', 0.3680, 32.6890, 'Seeta Town', 'Nama', '+256-414-290-607', 'info@seetahospital.co.ug', 50, 14, 0, 1, 'A+,B+,O+,O-', 0, 1),
('Mukono Health Centre IV', 'government', 0.3490, 32.7520, 'Mukono Central', 'Mukono Municipality', '+256-414-290-708', 'mukono.hc4@health.go.ug', 30, 9, 0, 0, 'O+,A+', 0, 0);

-- ============================================================
-- VEHICLES — Ambulance fleet
-- ============================================================
INSERT INTO vehicles (plate_number, vehicle_type, hospital_id, status, current_latitude, current_longitude) VALUES
('UBG 001A', 'Ambulance - Type II', 1, 'available', 0.3536, 32.7554),
('UBG 002A', 'Ambulance - Type I', 1, 'available', 0.3540, 32.7558),
('UBG 003A', 'Ambulance - Type II', 2, 'available', 0.3548, 32.7501),
('UBG 004A', 'Ambulance - Basic', 7, 'available', 0.3680, 32.6890),
('UBG 005A', 'Ambulance - Type I', 2, 'maintenance', 0.3548, 32.7501);

-- ============================================================
-- USERS — System users (password: 'password123' for all demo users)
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================
INSERT INTO users (full_name, email, phone, password_hash, role, is_active) VALUES
-- Admin
('Dr. Sarah Namukasa', 'admin@mukonogeneral.go.ug', '+256-742-100-001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1),

-- Doctors
('Dr. James Ssemakula', 'james.ssemakula@mukonogeneral.go.ug', '+256-742-200-001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', 1),
('Dr. Grace Namutebi', 'grace.namutebi@mukonocou.org', '+256-742-200-002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', 1),
('Dr. Peter Ochieng', 'peter.ochieng@mukonogeneral.go.ug', '+256-742-200-003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', 1),

-- Drivers
('Moses Kiggundu', 'moses.kiggundu@mukonogeneral.go.ug', '+256-742-300-001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', 1),
('Joseph Lubwama', 'joseph.lubwama@mukonocou.org', '+256-742-300-002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', 1),
('David Ssekandi', 'david.ssekandi@seetahospital.co.ug', '+256-742-300-003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', 1),

-- Mothers
('Nakato Fatima', 'fatima.nakato@gmail.com', '+256-769-400-001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mother', 1),
('Auma Rosemary', 'rosemary.auma@gmail.com', '+256-769-400-002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mother', 1),
('Babirye Joan', 'joan.babirye@gmail.com', '+256-769-400-003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mother', 1),
('Namugga Esther', 'esther.namugga@gmail.com', '+256-769-400-004', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mother', 1),
('Kyomuhendo Ruth', 'ruth.kyomuhendo@gmail.com', '+256-769-400-005', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mother', 1);

-- ============================================================
-- DOCTORS — Doctor profiles
-- ============================================================
INSERT INTO doctors (user_id, hospital_id, specialization, license_number, is_on_duty, shift_start, shift_end, years_experience) VALUES
(2, 1, 'Obstetrics & Gynecology', 'UG-MED-2018-4521', 1, '08:00:00', '20:00:00', 8),
(3, 2, 'Midwifery & Maternal Health', 'UG-MED-2016-3287', 1, '08:00:00', '20:00:00', 10),
(4, 1, 'Emergency Obstetrics', 'UG-MED-2020-5890', 0, '20:00:00', '08:00:00', 4);

-- ============================================================
-- DRIVERS — Driver profiles
-- ============================================================
INSERT INTO drivers (user_id, hospital_id, vehicle_id, license_number, is_on_duty, current_latitude, current_longitude) VALUES
(5, 1, 1, 'UG-DL-2019-88432', 1, 0.3536, 32.7554),
(6, 2, 3, 'UG-DL-2017-72145', 1, 0.3548, 32.7501),
(7, 7, 4, 'UG-DL-2020-91256', 0, 0.3680, 32.6890);

-- ============================================================
-- MOTHERS — Maternal profiles
-- ============================================================
INSERT INTO mothers (user_id, date_of_birth, blood_type, pregnancy_start_date, expected_due_date, gravida, parity, medical_history, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, village, sub_county, vht_name, vht_phone, home_latitude, home_longitude, preferred_hospital_id) VALUES
(8, '1995-03-15', 'O+', '2026-01-10', '2026-10-17', 2, 1, 'No known allergies. Previous normal delivery.', 'Ssemanda Ahmed', '+256-751-500-001', 'Husband', 'Goma Village', 'Goma', 'Namusoke Betty', '+256-772-600-001', 0.3420, 32.7680, 1),
(9, '1998-07-22', 'A+', '2026-02-05', '2026-11-12', 1, 0, 'Mild anaemia. First pregnancy.', 'Opio Daniel', '+256-751-500-002', 'Husband', 'Seeta Trading Centre', 'Nama', 'Lutwama Charles', '+256-772-600-002', 0.3650, 32.6920, 2),
(10, '1992-11-08', 'B+', '2025-12-20', '2026-09-26', 3, 2, 'History of PPH in second delivery. High-risk pregnancy.', 'Babirye Michael', '+256-751-500-003', 'Husband', 'Ntenjeru Village', 'Ntenjeru', 'Mugisha Francis', '+256-772-600-003', 0.3200, 32.8100, 1),
(11, '2000-05-30', 'O-', '2026-03-01', '2026-12-06', 1, 0, 'Gestational diabetes diagnosed. Under monitoring.', 'Namugga Robert', '+256-751-500-004', 'Brother', 'Koome Island', 'Koome', 'Nantongo Agnes', '+256-772-600-004', 0.1480, 32.8750, 6),
(12, '1997-09-14', 'AB+', '2026-01-25', '2026-11-01', 2, 1, 'No complications. Previous C-section.', 'Ssekandi Paul', '+256-751-500-005', 'Husband', 'Mukono Town', 'Mukono Municipality', 'Kawuma Isaac', '+256-772-600-005', 0.3530, 32.7540, 1);

-- ============================================================
-- CHECKUP SCHEDULES — Sample antenatal visits
-- ============================================================
INSERT INTO checkup_schedules (mother_id, hospital_id, checkup_type, scheduled_date, scheduled_time, notes, status) VALUES
(1, 1, 'Antenatal Visit 4', '2026-06-25', '09:00:00', 'Routine checkup - 24 weeks', 'upcoming'),
(1, 1, 'Ultrasound Scan', '2026-07-10', '10:30:00', 'Anomaly scan', 'upcoming'),
(2, 2, 'Antenatal Visit 3', '2026-06-20', '08:30:00', 'Blood pressure and weight check', 'upcoming'),
(2, 2, 'Blood Test', '2026-06-28', '09:00:00', 'Hemoglobin level check for anaemia', 'upcoming'),
(3, 1, 'Antenatal Visit 5', '2026-06-22', '11:00:00', 'High-risk monitoring - PPH history', 'upcoming'),
(3, 1, 'Specialist Consultation', '2026-07-05', '14:00:00', 'Obstetrician review for delivery plan', 'upcoming'),
(4, 6, 'Antenatal Visit 3', '2026-07-01', '09:00:00', 'Glucose monitoring', 'upcoming'),
(5, 1, 'Antenatal Visit 4', '2026-06-30', '10:00:00', 'Routine checkup', 'upcoming');

-- ============================================================
-- SAMPLE EMERGENCY (resolved) — For dashboard demo
-- ============================================================
INSERT INTO emergencies (emergency_code, mother_id, latitude, longitude, status, severity, description, assigned_hospital_id, assigned_driver_id, assigned_doctor_id, assigned_vehicle_id, response_time_seconds, pickup_time_seconds, total_time_seconds, triggered_at, dispatched_at, picked_up_at, arrived_at, resolved_at) VALUES
('EMG-2026-0001', 3, 0.3200, 32.8100, 'resolved', 'critical', 'Severe abdominal pain and bleeding. History of PPH.', 1, 1, 1, 1, 120, 1800, 3600, '2026-06-15 14:30:00', '2026-06-15 14:32:00', '2026-06-15 15:00:00', '2026-06-15 15:30:00', '2026-06-15 16:30:00'),
('EMG-2026-0002', 1, 0.3420, 32.7680, 'resolved', 'high', 'Strong contractions, possible early labour.', 1, 1, 1, 1, 90, 900, 2400, '2026-06-17 22:15:00', '2026-06-17 22:16:30', '2026-06-17 22:30:00', '2026-06-17 22:55:00', '2026-06-18 00:15:00');

-- ============================================================
-- EMERGENCY LOGS — Sample audit trail
-- ============================================================
INSERT INTO emergency_logs (emergency_id, previous_status, new_status, changed_by, notes) VALUES
(1, NULL, 'incoming', NULL, 'Emergency triggered by mother via GPS'),
(1, 'incoming', 'dispatched', 1, 'Dispatched ambulance UBG 001A to location'),
(1, 'dispatched', 'en_route_to_patient', 5, 'Driver en route to patient'),
(1, 'en_route_to_patient', 'patient_picked_up', 5, 'Patient picked up successfully'),
(1, 'patient_picked_up', 'en_route_to_hospital', 5, 'En route to Mukono General Hospital'),
(1, 'en_route_to_hospital', 'arrived', 5, 'Arrived at hospital'),
(1, 'arrived', 'resolved', 2, 'Patient treated successfully. PPH controlled.');

-- ============================================================
-- NOTIFICATIONS — Sample notifications
-- ============================================================
INSERT INTO notifications (user_id, title, message, type, reference_id, is_read) VALUES
(1, 'Emergency Resolved', 'Emergency EMG-2026-0001 has been resolved. Patient treated successfully.', 'status_update', 1, 1),
(8, 'Checkup Reminder', 'You have an antenatal visit scheduled for June 25, 2026 at Mukono General Hospital.', 'checkup_reminder', 1, 0),
(2, 'New Assignment', 'You have been assigned to emergency EMG-2026-0002.', 'dispatch', 2, 1);
