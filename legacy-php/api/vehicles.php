<?php
/**
 * MamaTrack GPS — Vehicles API (api/vehicles.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $vehicleId = $_GET['id'] ?? null;

    if ($vehicleId) {
        $stmt = $pdo->prepare("SELECT v.*, h.name as hospital_name FROM vehicles v JOIN hospitals h ON v.hospital_id = h.id WHERE v.id = :id");
        $stmt->execute([':id' => $vehicleId]);
        $vehicle = $stmt->fetch();
        if (!$vehicle) {
            jsonResponse(['error' => 'Vehicle not found'], 404);
        }
        jsonResponse(['success' => true, 'vehicle' => $vehicle]);
    } else {
        $stmt = $pdo->query("SELECT v.*, h.name as hospital_name FROM vehicles v JOIN hospitals h ON v.hospital_id = h.id ORDER BY v.plate_number ASC");
        jsonResponse(['success' => true, 'vehicles' => $stmt->fetchAll()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['admin']);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;
    $vehicleId = $input['vehicle_id'] ?? null;

    if ($action === 'create') {
        $plate = trim($input['plate_number'] ?? '');
        $type = trim($input['vehicle_type'] ?? 'Ambulance');
        $hospitalId = isset($input['hospital_id']) ? (int)$input['hospital_id'] : null;

        $capacity = isset($input['capacity']) ? (int)$input['capacity'] : 1;
        if ($capacity < 0) {
            jsonResponse(['error' => 'Vehicle capacity cannot be negative'], 400);
        }

        if (empty($plate) || !$hospitalId) {
            jsonResponse(['error' => 'Plate Number and Hospital are required'], 400);
        }

        // Check unique plate number
        $chk = $pdo->prepare("SELECT id FROM vehicles WHERE plate_number = :plate");
        $chk->execute([':plate' => $plate]);
        if ($chk->fetch()) {
            jsonResponse(['error' => 'Plate number already registered'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO vehicles (plate_number, vehicle_type, hospital_id, status, capacity, has_equipment) VALUES (:plate, :type, :hid, :status, :capacity, :eq)");
        $stmt->execute([
            ':plate' => $plate,
            ':type'  => $type,
            ':hid'   => $hospitalId,
            ':status' => $input['status'] ?? 'available',
            ':capacity' => $capacity,
            ':eq' => !empty($input['has_equipment']) ? 1 : 0
        ]);

        jsonResponse(['success' => true, 'message' => 'Vehicle added successfully']);
    }

    if (!$vehicleId) {
        jsonResponse(['error' => 'Vehicle ID required'], 400);
    }

    if ($action === 'update') {
        $plate = trim($input['plate_number'] ?? '');
        $type = trim($input['vehicle_type'] ?? 'Ambulance');
        $hospitalId = isset($input['hospital_id']) ? (int)$input['hospital_id'] : null;
        $capacity = isset($input['capacity']) ? (int)$input['capacity'] : 1;

        if ($capacity < 0) {
            jsonResponse(['error' => 'Vehicle capacity cannot be negative'], 400);
        }

        if (empty($plate) || !$hospitalId) {
            jsonResponse(['error' => 'Plate Number and Hospital are required'], 400);
        }

        // Check unique plate number excluding current
        $chk = $pdo->prepare("SELECT id FROM vehicles WHERE plate_number = :plate AND id != :id");
        $chk->execute([':plate' => $plate, ':id' => $vehicleId]);
        if ($chk->fetch()) {
            jsonResponse(['error' => 'Plate number already in use by another vehicle'], 400);
        }

        $stmt = $pdo->prepare("UPDATE vehicles SET plate_number = :plate, vehicle_type = :type, hospital_id = :hid, status = :status, capacity = :capacity, has_equipment = :eq, last_updated = NOW() WHERE id = :id");
        $stmt->execute([
            ':plate' => $plate,
            ':type'  => $type,
            ':hid'   => $hospitalId,
            ':status' => $input['status'] ?? 'available',
            ':capacity' => $capacity,
            ':eq' => !empty($input['has_equipment']) ? 1 : 0,
            ':id' => $vehicleId
        ]);

        jsonResponse(['success' => true, 'message' => 'Vehicle details updated successfully']);
    }

    if ($action === 'delete') {
        // Set drivers associated with this vehicle to NULL first (the FK has SET NULL, but it's good practice)
        $pdo->prepare("UPDATE drivers SET vehicle_id = NULL WHERE vehicle_id = :id")->execute([':id' => $vehicleId]);
        
        $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $vehicleId]);
        jsonResponse(['success' => true, 'message' => 'Vehicle deleted successfully']);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}
