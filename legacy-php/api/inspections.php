<?php
/**
 * MamaTrack GPS — Driver Inspections API (api/inspections.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['driver', 'admin']);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $driverId = $_SESSION['user_id'];

    // Get assigned vehicle
    $stmt = $pdo->prepare("SELECT vehicle_id FROM drivers WHERE user_id = :uid");
    $stmt->execute([':uid' => $driverId]);
    $vehicleId = $stmt->fetchColumn();

    if (!$vehicleId) {
        jsonResponse(['error' => 'You do not have an assigned vehicle to inspect.'], 400);
    }

    $fuel = $input['fuel_level'] ?? 'full';
    $siren = !empty($input['siren_ok']) ? 1 : 0;
    $medical = !empty($input['medical_checked']) ? 1 : 0;
    $tires = !empty($input['tires_ok']) ? 1 : 0;
    $engine = !empty($input['engine_ok']) ? 1 : 0;

    $stmtInsert = $pdo->prepare("INSERT INTO vehicle_inspections (driver_id, vehicle_id, fuel_level, siren_ok, medical_checked, tires_ok, engine_ok) VALUES (:did, :vid, :fuel, :siren, :med, :tires, :eng)");
    $stmtInsert->execute([
        ':did' => $driverId,
        ':vid' => $vehicleId,
        ':fuel' => $fuel,
        ':siren' => $siren,
        ':med' => $medical,
        ':tires' => $tires,
        ':eng' => $engine
    ]);

    // Update vehicle equipment and last_updated
    $pdo->prepare("UPDATE vehicles SET has_equipment = :med, last_updated = NOW() WHERE id = :vid")
        ->execute([':med' => $medical, ':vid' => $vehicleId]);

    jsonResponse(['success' => true, 'message' => 'Vehicle inspection logged successfully.']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $driverId = $_GET['driver_id'] ?? null;

    if ($driverId) {
        $stmt = $pdo->prepare("SELECT vi.*, v.plate_number FROM vehicle_inspections vi JOIN vehicles v ON vi.vehicle_id = v.id WHERE vi.driver_id = :did ORDER BY vi.checked_at DESC");
        $stmt->execute([':did' => $driverId]);
        jsonResponse(['success' => true, 'inspections' => $stmt->fetchAll()]);
    } else {
        $stmt = $pdo->query("SELECT vi.*, u.full_name as driver_name, v.plate_number FROM vehicle_inspections vi JOIN users u ON vi.driver_id = u.id JOIN vehicles v ON vi.vehicle_id = v.id ORDER BY vi.checked_at DESC LIMIT 100");
        jsonResponse(['success' => true, 'inspections' => $stmt->fetchAll()]);
    }
}
