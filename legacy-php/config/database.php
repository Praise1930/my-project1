<?php
/**
 * MamaTrack GPS — Database Configuration
 */

define('DB_HOST',    'localhost');
define('DB_NAME',    'maternal_gps_system');
define('DB_USER',    'root');
define('DB_PASS',    '');
define('DB_CHARSET', 'utf8mb4');

function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn     = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

define('APP_NAME',    'MamaTrack GPS');
define('APP_TAGLINE', 'Mukono Maternal Emergency Response System');

/**
 * Generate a sequential emergency code: EMG-YYYY-NNNN
 */
function generateEmergencyCode() {
    $pdo  = getDBConnection();
    $year = date('Y');
    $stmt = $pdo->query("SELECT COUNT(*) AS cnt FROM emergencies WHERE YEAR(created_at) = $year");
    $cnt  = ($stmt->fetch()['cnt'] ?? 0) + 1;
    return "EMG-{$year}-" . str_pad($cnt, 4, '0', STR_PAD_LEFT);
}

/**
 * Haversine distance in km between two lat/lng pairs
 */
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R    = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a    = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

/**
 * Find nearest active hospital with available beds
 * Uses MySQL Haversine expression for ordering
 */
function findNearestHospital($lat, $lon, $requireCemonc = false) {
    $pdo = getDBConnection();
    $sql = "SELECT *,
            (6371 * acos(GREATEST(-1, LEAST(1,
                cos(radians(:lat)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(:lon)) +
                sin(radians(:lat2)) * sin(radians(latitude))
            )))) AS distance
            FROM hospitals
            WHERE is_active = 1 AND available_beds > 0";
    if ($requireCemonc) $sql .= " AND has_cemonc = 1";
    $sql .= " ORDER BY distance ASC LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':lat' => $lat, ':lon' => $lon, ':lat2' => $lat]);
    return $stmt->fetch();
}

/**
 * Find nearest on-duty driver with an available vehicle
 */
function findNearestDriver($lat, $lon) {
    $pdo = getDBConnection();
    $sql = "SELECT d.*, u.full_name, u.phone, v.plate_number, v.vehicle_type,
            (6371 * acos(GREATEST(-1, LEAST(1,
                cos(radians(:lat)) * cos(radians(d.current_latitude)) *
                cos(radians(d.current_longitude) - radians(:lon)) +
                sin(radians(:lat2)) * sin(radians(d.current_latitude))
            )))) AS distance
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            WHERE d.is_on_duty = 1 AND d.current_latitude IS NOT NULL
              AND (v.status = 'available' OR v.id IS NULL)
            ORDER BY distance ASC LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':lat' => $lat, ':lon' => $lon, ':lat2' => $lat]);
    return $stmt->fetch();
}

/**
 * Find an on-duty doctor at a given hospital
 */
function findOnDutyDoctor($hospitalId) {
    $pdo  = getDBConnection();
    $stmt = $pdo->prepare("SELECT d.*, u.full_name, u.phone FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.hospital_id = :hid AND d.is_on_duty = 1 LIMIT 1");
    $stmt->execute([':hid' => $hospitalId]);
    return $stmt->fetch();
}

/**
 * Send JSON response and exit
 */
function jsonResponse($data, $statusCode = 200) {
    if (is_array($data) && isset($_SERVER['REQUEST_TIME_FLOAT'])) {
        $data['execution_time_ms'] = round((microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000, 2);
    }
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
