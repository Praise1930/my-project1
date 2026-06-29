-- ============================================================
-- GPS-Based Maternal Emergency Response & Monitoring System
-- Database Schema for Mukono District, Uganda
-- ============================================================

CREATE DATABASE IF NOT EXISTS maternal_gps_system
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE maternal_gps_system;

-- ============================================================
-- 1. USERS TABLE — All system users with role-based access
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('mother', 'admin', 'doctor', 'driver') NOT NULL DEFAULT 'mother',
    avatar VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- 2. HOSPITALS TABLE — Health facility registry
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type ENUM('government', 'private', 'ngo') NOT NULL DEFAULT 'government',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    sub_county VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    total_beds INT DEFAULT 0,
    available_beds INT DEFAULT 0,
    has_cemonc TINYINT(1) DEFAULT 0 COMMENT 'Comprehensive Emergency Obstetric and Newborn Care',
    has_blood_bank TINYINT(1) DEFAULT 0,
    blood_types_available VARCHAR(100) DEFAULT NULL COMMENT 'Comma-separated: A+,A-,B+,B-,O+,O-,AB+,AB-',
    has_surgical_capacity TINYINT(1) DEFAULT 0,
    has_ambulance TINYINT(1) DEFAULT 0,
    operating_hours VARCHAR(50) DEFAULT '24/7',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- ============================================================
-- 3. VEHICLES TABLE — Ambulance fleet management
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) DEFAULT 'Ambulance',
    hospital_id INT NOT NULL,
    status ENUM('available', 'en_route', 'maintenance', 'off_duty') DEFAULT 'available',
    current_latitude DECIMAL(10, 8) DEFAULT NULL,
    current_longitude DECIMAL(11, 8) DEFAULT NULL,
    last_location_update DATETIME DEFAULT NULL,
    capacity INT DEFAULT 1,
    has_equipment TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_hospital (hospital_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. MOTHERS TABLE — Extended maternal profile
-- ============================================================
CREATE TABLE IF NOT EXISTS mothers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE,
    national_id VARCHAR(50),
    blood_type ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') DEFAULT NULL,
    pregnancy_start_date DATE NOT NULL COMMENT 'Date pregnancy was confirmed/started',
    expected_due_date DATE,
    gravida INT DEFAULT 1 COMMENT 'Number of pregnancies including current',
    parity INT DEFAULT 0 COMMENT 'Number of previous deliveries',
    medical_history TEXT COMMENT 'Pre-existing conditions, allergies, past complications',
    current_complications TEXT COMMENT 'Any current complications noted',
    next_of_kin_name VARCHAR(150),
    next_of_kin_phone VARCHAR(20),
    next_of_kin_relationship VARCHAR(50),
    village VARCHAR(100),
    sub_county VARCHAR(100),
    district VARCHAR(100) DEFAULT 'Mukono',
    vht_name VARCHAR(150) COMMENT 'Village Health Team contact',
    vht_phone VARCHAR(20),
    home_latitude DECIMAL(10, 8) DEFAULT NULL,
    home_longitude DECIMAL(11, 8) DEFAULT NULL,
    preferred_hospital_id INT DEFAULT NULL,
    registration_status ENUM('pending', 'approved', 'archived') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_due_date (expected_due_date),
    INDEX idx_sub_county (sub_county)
) ENGINE=InnoDB;

-- ============================================================
-- 5. DOCTORS TABLE — Clinical officer profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    specialization VARCHAR(100) DEFAULT 'Obstetrics & Gynecology',
    license_number VARCHAR(50),
    is_on_duty TINYINT(1) DEFAULT 0,
    shift_start TIME DEFAULT NULL,
    shift_end TIME DEFAULT NULL,
    years_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_on_duty (is_on_duty)
) ENGINE=InnoDB;

-- ============================================================
-- 6. DRIVERS TABLE — Ambulance driver profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    vehicle_id INT DEFAULT NULL,
    license_number VARCHAR(50),
    driver_role VARCHAR(100) DEFAULT 'Primary Emergency Driver',
    is_on_duty TINYINT(1) DEFAULT 0,
    current_latitude DECIMAL(10, 8) DEFAULT NULL,
    current_longitude DECIMAL(11, 8) DEFAULT NULL,
    last_location_update DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_on_duty (is_on_duty)
) ENGINE=InnoDB;

-- ============================================================
-- 7. EMERGENCIES TABLE — Emergency events
-- ============================================================
CREATE TABLE IF NOT EXISTS emergencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g. EMG-2026-0001',
    mother_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL COMMENT 'Mother location at time of emergency',
    longitude DECIMAL(11, 8) NOT NULL,
    status ENUM('incoming', 'dispatched', 'en_route_to_patient', 'patient_picked_up', 'en_route_to_hospital', 'arrived', 'resolved', 'cancelled') DEFAULT 'incoming',
    severity ENUM('critical', 'high', 'medium', 'low') DEFAULT 'high',
    description TEXT COMMENT 'Emergency description or auto-generated details',
    assigned_hospital_id INT DEFAULT NULL,
    assigned_driver_id INT DEFAULT NULL,
    assigned_doctor_id INT DEFAULT NULL,
    assigned_vehicle_id INT DEFAULT NULL,
    cancel_reason TEXT DEFAULT NULL,
    response_time_seconds INT DEFAULT NULL COMMENT 'Time from trigger to dispatch',
    pickup_time_seconds INT DEFAULT NULL COMMENT 'Time from dispatch to patient pickup',
    total_time_seconds INT DEFAULT NULL COMMENT 'Total emergency duration',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispatched_at DATETIME DEFAULT NULL,
    picked_up_at DATETIME DEFAULT NULL,
    arrived_at DATETIME DEFAULT NULL,
    resolved_at DATETIME DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mother_id) REFERENCES mothers(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_mother (mother_id),
    INDEX idx_triggered (triggered_at),
    INDEX idx_hospital (assigned_hospital_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. EMERGENCY LOGS TABLE — Audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT DEFAULT NULL COMMENT 'User ID who made the change',
    notes TEXT,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emergency_id) REFERENCES emergencies(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_emergency (emergency_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 9. CHECKUP SCHEDULES — Antenatal visit reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS checkup_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mother_id INT NOT NULL,
    hospital_id INT DEFAULT NULL,
    checkup_type VARCHAR(100) NOT NULL COMMENT 'e.g. Antenatal Visit 1, Ultrasound, Blood Test',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '09:00:00',
    notes TEXT,
    status ENUM('upcoming', 'completed', 'missed', 'rescheduled') DEFAULT 'upcoming',
    reminder_sent TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mother_id) REFERENCES mothers(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    INDEX idx_mother (mother_id),
    INDEX idx_date (scheduled_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 10. NOTIFICATIONS TABLE — In-app notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('emergency', 'dispatch', 'status_update', 'checkup_reminder', 'system', 'cancelled') DEFAULT 'system',
    reference_id INT DEFAULT NULL COMMENT 'Related emergency or checkup ID',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;
