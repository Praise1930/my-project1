-- ============================================================
-- MamaTrack GPS — Database Patch v1.2
-- Adds tables for: inspections, fuel logs, blood requests, clinical assessments
-- ============================================================

USE maternal_gps_system;

-- 1. Vehicle pre-duty inspections
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    fuel_level ENUM('full', 'half', 'low') NOT NULL,
    siren_ok TINYINT(1) DEFAULT 1,
    medical_checked TINYINT(1) DEFAULT 1,
    tires_ok TINYINT(1) DEFAULT 1,
    engine_ok TINYINT(1) DEFAULT 1,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Fuel purchase logs
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    liters DECIMAL(6, 2) NOT NULL,
    cost INT NOT NULL,
    station VARCHAR(150) DEFAULT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Blood supply requests
CREATE TABLE IF NOT EXISTS blood_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    blood_type ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
    units INT NOT NULL,
    status ENUM('pending', 'approved', 'delivered', 'cancelled') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Emergency clinical assessments
CREATE TABLE IF NOT EXISTS clinical_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    doctor_id INT NOT NULL,
    blood_pressure VARCHAR(20) DEFAULT NULL,
    heart_rate INT DEFAULT NULL,
    temperature DECIMAL(4, 1) DEFAULT NULL,
    clinical_findings TEXT,
    treatment_given TEXT,
    outcome ENUM('admitted', 'referred', 'discharged', 'deceased') DEFAULT 'admitted',
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
