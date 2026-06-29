<?php
/**
 * MamaTrack GPS — Location Tracking API
 */
require_once __DIR__ . '/../config/auth.php';

requireApiAuth();

$pdo   = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action      = $input['action'] ?? 'update_location';
    $userId      = $_SESSION['user_id'];
    $role        = $_SESSION['user_role'];
    $lat         = $input['latitude']    ?? null;
    $lng         = $input['longitude']   ?? null;
    $accuracy    = $input['accuracy']    ?? null;
    $emergencyId = $input['emergency_id'] ?? null;

    if (!$lat || !$lng) {
        jsonResponse(['error' => 'Latitude and longitude required'], 400);
    }

    if ($role === 'mother') {
        // Log into emergency_locations if there's an active emergency
        if ($emergencyId) {
            $pdo->prepare("INSERT INTO emergency_locations (emergency_id, latitude, longitude, accuracy, source) VALUES (:eid, :lat, :lng, :acc, 'mother')")
                ->execute([':eid' => $emergencyId, ':lat' => $lat, ':lng' => $lng, ':acc' => $accuracy]);
        } else {
            // Auto-detect active emergency
            $emg = $pdo->prepare("SELECT id FROM emergencies WHERE mother_id = :uid AND status IN ('pending','verified','dispatched','en_route') ORDER BY created_at DESC LIMIT 1");
            $emg->execute([':uid' => $userId]);
            $active = $emg->fetch();
            if ($active) {
                $pdo->prepare("INSERT INTO emergency_locations (emergency_id, latitude, longitude, accuracy, source) VALUES (:eid, :lat, :lng, :acc, 'mother')")
                    ->execute([':eid' => $active['id'], ':lat' => $lat, ':lng' => $lng, ':acc' => $accuracy]);
            }
        }
    } elseif ($role === 'driver') {
        // Update driver location
        $pdo->prepare("UPDATE drivers SET current_latitude = :lat, current_longitude = :lng, last_location_update = NOW() WHERE user_id = :uid")
            ->execute([':lat' => $lat, ':lng' => $lng, ':uid' => $userId]);

        // Log into emergency_locations for active dispatch
        if ($emergencyId) {
            $pdo->prepare("INSERT INTO emergency_locations (emergency_id, latitude, longitude, accuracy, source) VALUES (:eid, :lat, :lng, :acc, 'driver')")
                ->execute([':eid' => $emergencyId, ':lat' => $lat, ':lng' => $lng, ':acc' => $accuracy]);
        }
    }

    jsonResponse(['success' => true, 'timestamp' => date('c')]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $emergencyId = $_GET['emergency_id'] ?? null;
    $role        = $_SESSION['user_role'];

    if (!$emergencyId) jsonResponse(['error' => 'Emergency ID required'], 400);

    // Get latest locations from emergency_locations
    $stmt = $pdo->prepare("
        SELECT latitude, longitude, accuracy, source, recorded_at
        FROM emergency_locations
        WHERE emergency_id = :eid
        ORDER BY recorded_at DESC
        LIMIT 20");
    $stmt->execute([':eid' => $emergencyId]);
    $locations = $stmt->fetchAll();

    // Merge with driver current position
    $emg = $pdo->prepare("SELECT e.*, drv.current_latitude AS driver_lat, drv.current_longitude AS driver_lng, u.full_name AS driver_name, v.plate_number FROM emergencies e LEFT JOIN drivers drv ON e.driver_id = drv.user_id LEFT JOIN users u ON e.driver_id = u.id LEFT JOIN vehicles v ON drv.vehicle_id = v.id WHERE e.id = :eid");
    $emg->execute([':eid' => $emergencyId]);
    $emergency = $emg->fetch();

    jsonResponse(['success' => true, 'locations' => $locations, 'emergency' => $emergency]);
}
