<?php
/**
 * MamaTrack GPS — Hospitals API Endpoint (api/hospitals.php)
 * Lists all hospitals, updates capacities, and manages details.
 */

require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

// GET: List hospitals
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $hospitalId = $_GET['id'] ?? null;

    if ($hospitalId) {
        $stmt = $pdo->prepare("SELECT * FROM hospitals WHERE id = :id");
        $stmt->execute([':id' => $hospitalId]);
        $hospital = $stmt->fetch();
        if (!$hospital) {
            jsonResponse(['error' => 'Hospital not found'], 404);
        }
        jsonResponse(['success' => true, 'hospital' => $hospital]);
    } else {
        $stmt = $pdo->query("SELECT * FROM hospitals WHERE is_active = 1 ORDER BY name ASC");
        jsonResponse(['success' => true, 'hospitals' => $stmt->fetchAll()]);
    }
}

// POST: Manage hospital resources / CRUD
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;
    $hospitalId = $input['hospital_id'] ?? null;

    // Only admins can do full CRUD; doctors can only update bed counts
    $currentUser = getCurrentUser();
    if ($currentUser['role'] !== 'admin' && !in_array($action, ['update_beds', 'update_capacity'])) {
        jsonResponse(['error' => 'Insufficient permissions'], 403);
    }

    // Doctor-friendly bed update alias
    if ($action === 'update_beds') {
        if (!$hospitalId) jsonResponse(['error' => 'Hospital ID required'], 400);
        $beds = isset($input['available_beds']) ? (int)$input['available_beds'] : null;
        if ($beds === null || $beds < 0) jsonResponse(['error' => 'Valid bed count required'], 400);
        $stmt = $pdo->prepare("UPDATE hospitals SET available_beds = :beds, last_updated = NOW() WHERE id = :id");
        $stmt->execute([':beds' => $beds, ':id' => $hospitalId]);
        jsonResponse(['success' => true, 'available_beds' => $beds, 'message' => 'Bed count updated']);
    }

    if ($action === 'create') {
        $name = trim($input['name'] ?? '');
        $type = trim($input['type'] ?? 'government');
        $lat  = isset($input['latitude']) ? (float)$input['latitude'] : 0.0;
        $lng  = isset($input['longitude']) ? (float)$input['longitude'] : 0.0;
        
        if (empty($name) || empty($lat) || empty($lng)) {
            jsonResponse(['error' => 'Name, Latitude, and Longitude are required'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO hospitals 
            (name, type, latitude, longitude, address, sub_county, phone, email, total_beds, available_beds, has_cemonc, has_blood_bank, blood_types_available, has_surgical_capacity, has_ambulance, operating_hours, facility_type) 
            VALUES (:name, :type, :lat, :lng, :address, :sub, :phone, :email, :tot_beds, :avail_beds, :cemonc, :blood_bank, :blood_types, :surgical, :amb, :hours, :fac_type)");
        
        $stmt->execute([
            ':name' => $name,
            ':type' => $type,
            ':lat'  => $lat,
            ':lng'  => $lng,
            ':address' => $input['address'] ?? '',
            ':sub'     => $input['sub_county'] ?? '',
            ':phone'   => $input['phone'] ?? '',
            ':email'   => $input['email'] ?? '',
            ':tot_beds'=> isset($input['total_beds']) ? (int)$input['total_beds'] : 0,
            ':avail_beds' => isset($input['available_beds']) ? (int)$input['available_beds'] : 0,
            ':cemonc'  => !empty($input['has_cemonc']) ? 1 : 0,
            ':blood_bank' => !empty($input['has_blood_bank']) ? 1 : 0,
            ':blood_types' => $input['blood_types_available'] ?? null,
            ':surgical' => !empty($input['has_surgical_capacity']) ? 1 : 0,
            ':amb'     => !empty($input['has_ambulance']) ? 1 : 0,
            ':hours'   => $input['operating_hours'] ?? '24/7',
            ':fac_type'=> ucfirst($type) . ' Hospital'
        ]);

        jsonResponse(['success' => true, 'message' => 'Hospital created successfully']);
    }

    // Following actions require hospital ID
    if (!$hospitalId) {
        jsonResponse(['error' => 'Hospital ID required'], 400);
    }

    if ($action === 'update_capacity') {
        $beds = isset($input['available_beds']) ? (int)$input['available_beds'] : null;
        if ($beds === null || $beds < 0) {
            jsonResponse(['error' => 'Valid bed count required'], 400);
        }

        $stmt = $pdo->prepare("UPDATE hospitals SET available_beds = :beds, last_updated = NOW() WHERE id = :id");
        $stmt->execute([':beds' => $beds, ':id' => $hospitalId]);

        jsonResponse(['success' => true, 'message' => 'Hospital bed capacity updated successfully']);
    }

    if ($action === 'update') {
        $name = trim($input['name'] ?? '');
        $type = trim($input['type'] ?? 'government');
        $lat  = isset($input['latitude']) ? (float)$input['latitude'] : 0.0;
        $lng  = isset($input['longitude']) ? (float)$input['longitude'] : 0.0;
        
        if (empty($name) || empty($lat) || empty($lng)) {
            jsonResponse(['error' => 'Name, Latitude, and Longitude are required'], 400);
        }

        $stmt = $pdo->prepare("UPDATE hospitals SET 
            name = :name,
            type = :type,
            latitude = :lat,
            longitude = :lng,
            address = :address,
            sub_county = :sub,
            phone = :phone,
            email = :email,
            total_beds = :tot_beds,
            available_beds = :avail_beds,
            has_cemonc = :cemonc,
            has_blood_bank = :blood_bank,
            blood_types_available = :blood_types,
            has_surgical_capacity = :surgical,
            has_ambulance = :amb,
            operating_hours = :hours,
            facility_type = :fac_type,
            last_updated = NOW()
            WHERE id = :id");

        $stmt->execute([
            ':name' => $name,
            ':type' => $type,
            ':lat'  => $lat,
            ':lng'  => $lng,
            ':address' => $input['address'] ?? '',
            ':sub'     => $input['sub_county'] ?? '',
            ':phone'   => $input['phone'] ?? '',
            ':email'   => $input['email'] ?? '',
            ':tot_beds'=> isset($input['total_beds']) ? (int)$input['total_beds'] : 0,
            ':avail_beds' => isset($input['available_beds']) ? (int)$input['available_beds'] : 0,
            ':cemonc'  => !empty($input['has_cemonc']) ? 1 : 0,
            ':blood_bank' => !empty($input['has_blood_bank']) ? 1 : 0,
            ':blood_types' => $input['blood_types_available'] ?? null,
            ':surgical' => !empty($input['has_surgical_capacity']) ? 1 : 0,
            ':amb'     => !empty($input['has_ambulance']) ? 1 : 0,
            ':hours'   => $input['operating_hours'] ?? '24/7',
            ':fac_type'=> ucfirst($type) . ' Hospital',
            ':id'      => $hospitalId
        ]);

        jsonResponse(['success' => true, 'message' => 'Hospital details updated successfully']);
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM hospitals WHERE id = :id");
        $stmt->execute([':id' => $hospitalId]);
        jsonResponse(['success' => true, 'message' => 'Hospital deleted successfully']);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}
