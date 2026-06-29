<?php
/**
 * MamaTrack GPS — Fuel Purchase Logs API (api/fuel_logs.php)
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
        jsonResponse(['error' => 'You do not have an assigned vehicle to log fuel for.'], 400);
    }

    $liters = isset($input['liters']) ? (float)$input['liters'] : 0;
    $cost = isset($input['cost']) ? (int)$input['cost'] : 0;
    $station = trim($input['station'] ?? '');

    if ($liters <= 0 || $cost <= 0) {
        jsonResponse(['error' => 'Valid liters and cost are required.'], 400);
    }

    $stmtInsert = $pdo->prepare("INSERT INTO fuel_logs (driver_id, vehicle_id, liters, cost, station) VALUES (:did, :vid, :liters, :cost, :station)");
    $stmtInsert->execute([
        ':did' => $driverId,
        ':vid' => $vehicleId,
        ':liters' => $liters,
        ':cost' => $cost,
        ':station' => $station
    ]);

    jsonResponse(['success' => true, 'message' => 'Fuel purchase logged successfully.']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $driverId = $_GET['driver_id'] ?? null;

    if ($driverId) {
        $stmt = $pdo->prepare("SELECT fl.*, v.plate_number FROM fuel_logs fl JOIN vehicles v ON fl.vehicle_id = v.id WHERE fl.driver_id = :did ORDER BY fl.logged_at DESC");
        $stmt->execute([':did' => $driverId]);
        jsonResponse(['success' => true, 'fuel_logs' => $stmt->fetchAll()]);
    } else {
        $stmt = $pdo->query("SELECT fl.*, u.full_name as driver_name, v.plate_number FROM fuel_logs fl JOIN users u ON fl.driver_id = u.id JOIN vehicles v ON fl.vehicle_id = v.id ORDER BY fl.logged_at DESC LIMIT 100");
        jsonResponse(['success' => true, 'fuel_logs' => $stmt->fetchAll()]);
    }
}
