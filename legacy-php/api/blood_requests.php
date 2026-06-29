<?php
/**
 * MamaTrack GPS — Blood Supply Requests API (api/blood_requests.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['doctor', 'admin']);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? 'create';

    if ($action === 'create') {
        requireApiAuth(['doctor']);
        $doctorId = $_SESSION['user_id'];

        // Get doctor's hospital
        $stmt = $pdo->prepare("SELECT hospital_id FROM doctors WHERE user_id = :uid");
        $stmt->execute([':uid' => $doctorId]);
        $hospitalId = $stmt->fetchColumn();

        if (!$hospitalId) {
            jsonResponse(['error' => 'You are not assigned to any hospital.'], 400);
        }

        $bloodType = $input['blood_type'] ?? '';
        $units = isset($input['units']) ? (int)$input['units'] : 0;

        if (empty($bloodType) || $units <= 0) {
            jsonResponse(['error' => 'Valid blood type and units are required.'], 400);
        }

        $stmtInsert = $pdo->prepare("INSERT INTO blood_requests (doctor_id, hospital_id, blood_type, units, status) VALUES (:did, :hid, :blood, :units, 'pending')");
        $stmtInsert->execute([
            ':did' => $doctorId,
            ':hid' => $hospitalId,
            ':blood' => $bloodType,
            ':units' => $units
        ]);

        jsonResponse(['success' => true, 'message' => 'Blood stock request submitted successfully.']);
    }

    if ($action === 'update_status') {
        requireApiAuth(['admin']);
        $reqId = $input['request_id'] ?? null;
        $status = $input['status'] ?? null;

        if (!$reqId || !in_array($status, ['approved', 'delivered', 'cancelled'])) {
            jsonResponse(['error' => 'Valid Request ID and Status are required.'], 400);
        }

        // If delivered, check if we should update hospital's blood stock
        if ($status === 'delivered') {
            // Get hospital & blood type
            $stmtReq = $pdo->prepare("SELECT hospital_id, blood_type, units FROM blood_requests WHERE id = :id");
            $stmtReq->execute([':id' => $reqId]);
            $req = $stmtReq->fetch();

            if ($req) {
                // Update hospital availability flags or note
                $pdo->prepare("UPDATE hospitals SET has_blood_bank = 1, last_updated = NOW() WHERE id = :hid")
                    ->execute([':hid' => $req['hospital_id']]);
            }
        }

        $stmtUpdate = $pdo->prepare("UPDATE blood_requests SET status = :status WHERE id = :id");
        $stmtUpdate->execute([':status' => $status, ':id' => $reqId]);

        jsonResponse(['success' => true, 'message' => 'Blood request status updated successfully.']);
    }

    jsonResponse(['error' => 'Invalid action.'], 400);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $doctorId = $_GET['doctor_id'] ?? null;
    $hospitalId = $_GET['hospital_id'] ?? null;

    if ($doctorId) {
        $stmt = $pdo->prepare("SELECT br.*, h.name as hospital_name FROM blood_requests br JOIN hospitals h ON br.hospital_id = h.id WHERE br.doctor_id = :did ORDER BY br.requested_at DESC");
        $stmt->execute([':did' => $doctorId]);
        jsonResponse(['success' => true, 'blood_requests' => $stmt->fetchAll()]);
    } elseif ($hospitalId) {
        $stmt = $pdo->prepare("SELECT br.*, u.full_name as doctor_name FROM blood_requests br JOIN users u ON br.doctor_id = u.id WHERE br.hospital_id = :hid ORDER BY br.requested_at DESC");
        $stmt->execute([':hid' => $hospitalId]);
        jsonResponse(['success' => true, 'blood_requests' => $stmt->fetchAll()]);
    } else {
        // Admin view
        $stmt = $pdo->query("SELECT br.*, u.full_name as doctor_name, h.name as hospital_name FROM blood_requests br JOIN users u ON br.doctor_id = u.id JOIN hospitals h ON br.hospital_id = h.id ORDER BY br.requested_at DESC LIMIT 100");
        jsonResponse(['success' => true, 'blood_requests' => $stmt->fetchAll()]);
    }
}
