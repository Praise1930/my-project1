-- ============================================================
-- MamaTrack GPS — Database Patch v1.3
-- Fixes: Align emergencies FK constraints to user IDs instead of profiles
-- ============================================================

USE maternal_gps_system;

-- 1. Alter foreign key constraints to drop the old references to drivers(id)/doctors(id)
ALTER TABLE emergencies DROP FOREIGN KEY emergencies_ibfk_3;
ALTER TABLE emergencies DROP FOREIGN KEY emergencies_ibfk_4;

-- 2. Now align sample emergency data with User IDs:
-- Driver: Moses Kiggundu (user_id = 5, previously driver_id = 1)
-- Doctor: Dr. James Ssemakula (user_id = 2, previously doctor_id = 1)
UPDATE emergencies SET driver_id = 5 WHERE driver_id = 1;
UPDATE emergencies SET doctor_id = 2 WHERE doctor_id = 1;

-- 3. Add the new foreign key constraints referencing users(id)
ALTER TABLE emergencies ADD CONSTRAINT fk_emg_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE emergencies ADD CONSTRAINT fk_emg_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;
