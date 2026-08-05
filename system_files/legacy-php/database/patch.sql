-- ============================================================
-- MamaTrack GPS — Database Patch v1.1
-- Fixes: passwords, column aliases, status ENUMs, missing tables
-- ============================================================

USE maternal_gps_system;

-- ============================================================
-- FIX 1: Update all user password hashes to 'password123'
-- ============================================================
UPDATE users SET password_hash = '$2y$10$mSIi7ovjao5Yd5Te2NF6heN2KVEs8KzQkCMksu0FJiU/PlVo/kGrG';

-- ============================================================
-- FIX 2: Rename emergency_code -> code, assigned_* -> *
-- ============================================================
ALTER TABLE emergencies
    CHANGE emergency_code code VARCHAR(20) NOT NULL,
    CHANGE assigned_hospital_id hospital_id INT DEFAULT NULL,
    CHANGE assigned_driver_id driver_id INT DEFAULT NULL,
    CHANGE assigned_doctor_id doctor_id INT DEFAULT NULL,
    CHANGE description notes TEXT,
    CHANGE resolved_at completed_at DATETIME DEFAULT NULL,
    ADD COLUMN dispatched_by INT DEFAULT NULL COMMENT 'Admin user who dispatched',
    ADD COLUMN eta_minutes INT DEFAULT NULL;

-- ============================================================
-- FIX 3: Simplify status ENUM values to match PHP code
-- ============================================================
ALTER TABLE emergencies MODIFY status ENUM('pending','verified','dispatched','en_route','arrived','completed','cancelled') DEFAULT 'pending';

-- Update existing sample data statuses
UPDATE emergencies SET status = 'completed' WHERE status = 'resolved' OR status IS NULL;
UPDATE emergencies SET status = 'pending' WHERE status = 'incoming';

-- ============================================================
-- FIX 4: Add notes column to emergencies (in case rename failed)
-- Make mother_id reference users table directly
-- ============================================================
-- Change mother_id FK to reference users instead of mothers
ALTER TABLE emergencies DROP FOREIGN KEY IF EXISTS emergencies_ibfk_1;
ALTER TABLE emergencies MODIFY mother_id INT NOT NULL;
ALTER TABLE emergencies ADD CONSTRAINT fk_emg_user FOREIGN KEY (mother_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================
-- FIX 5: Add missing emergency_locations table
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT DEFAULT NULL,
    source ENUM('mother', 'driver', 'system') DEFAULT 'mother',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
    INDEX idx_emergency (emergency_id),
    INDEX idx_recorded (recorded_at)
) ENGINE=InnoDB;

-- ============================================================
-- FIX 6: Add last_duty_toggle columns to drivers & doctors
-- ============================================================
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_duty_toggle DATETIME DEFAULT NULL;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS last_duty_toggle DATETIME DEFAULT NULL;

-- ============================================================
-- FIX 7: Add facility_type alias & last_updated to hospitals
-- ============================================================
ALTER TABLE hospitals 
    ADD COLUMN IF NOT EXISTS facility_type VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS last_updated DATETIME DEFAULT NULL;

UPDATE hospitals SET facility_type = CONCAT(UPPER(LEFT(type,1)), SUBSTRING(type,2), ' Hospital') WHERE facility_type IS NULL;

-- ============================================================
-- FIX 8: Create checkups view mapping to checkup_schedules
-- ============================================================
DROP VIEW IF EXISTS checkups;
CREATE VIEW checkups AS
    SELECT 
        id,
        mother_id,
        hospital_id,
        checkup_type,
        scheduled_date AS checkup_date,
        scheduled_time,
        notes,
        status,
        created_at,
        updated_at
    FROM checkup_schedules;

-- ============================================================
-- FIX 9: Add vehicles last_updated
-- ============================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_updated DATETIME DEFAULT NULL;

-- ============================================================
-- FIX 10: Fix emergencies sample data — use user IDs not mother IDs
-- ============================================================
UPDATE emergencies SET mother_id = 10 WHERE id = 1;
UPDATE emergencies SET mother_id = 8 WHERE id = 2;

SELECT 'Database patch applied successfully!' AS Status;
