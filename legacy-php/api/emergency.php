<?php
/**
 * MamaTrack GPS — Emergency API Endpoint (api/emergency.php)
 * Handles triggering, dispatching, tracking, updating status, and listing emergencies.
 */

require_once __DIR__ . '/../config/auth.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? $_GET['action'] ?? null;
$emergencyId = $input['emergency_id'] ?? $_GET['id'] ?? null;

$pdo = getDBConnection();

/* ============================================================
   GET — List or fetch single emergency
   ============================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    // Single emergency detail
    if ($emergencyId) {
        $stmt = $pdo->prepare("
            SELECT e.*,
                u.full_name AS mother_name, u.phone AS mother_phone,
                m.blood_type, m.expected_due_date, m.village, m.sub_county,
                hu.full_name AS doctor_name, hu.phone AS doctor_phone,
                du.full_name AS driver_name, du.phone AS driver_phone,
                v.plate_number, v.vehicle_type,
                h.name AS hospital_name,
                h.latitude AS hospital_latitude, h.longitude AS hospital_longitude,
                drv.current_latitude AS driver_latitude, drv.current_longitude AS driver_longitude
            FROM emergencies e
            JOIN users u ON e.mother_id = u.id
            JOIN mothers m ON u.id = m.user_id
            LEFT JOIN users hu ON e.doctor_id = hu.id
            LEFT JOIN users du ON e.driver_id = du.id
            LEFT JOIN drivers drv ON e.driver_id = drv.user_id
            LEFT JOIN vehicles v ON drv.vehicle_id = v.id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            WHERE e.id = :id");
        $stmt->execute([':id' => $emergencyId]);
        $emergency = $stmt->fetch();

        if (!$emergency) jsonResponse(['error' => 'Emergency not found'], 404);

        // Location history
        $locStmt = $pdo->prepare("SELECT latitude, longitude, accuracy, recorded_at FROM emergency_locations WHERE emergency_id = :id ORDER BY recorded_at DESC LIMIT 10");
        $locStmt->execute([':id' => $emergencyId]);
        $emergency['location_history'] = $locStmt->fetchAll();

        jsonResponse(['success' => true, 'emergency' => $emergency]);
    }

    // List emergencies (role-filtered)
    $status = $_GET['status'] ?? null;
    $role   = $_SESSION['user_role'];
    $userId = $_SESSION['user_id'];

    $sql = "SELECT e.*, u.full_name AS mother_name, m.village, m.sub_county,
                h.name AS hospital_name, du.full_name AS driver_name
            FROM emergencies e
            JOIN users u ON e.mother_id = u.id
            JOIN mothers m ON u.id = m.user_id
            LEFT JOIN hospitals h ON e.hospital_id = h.id
            LEFT JOIN users du ON e.driver_id = du.id
            WHERE 1=1";
    $params = [];

    if ($status) { $sql .= " AND e.status = :status"; $params[':status'] = $status; }

    if ($role === 'mother') {
        $sql .= " AND e.mother_id = :uid"; $params[':uid'] = $userId;
    } elseif ($role === 'doctor') {
        $doc = $pdo->prepare("SELECT hospital_id FROM doctors WHERE user_id = :uid");
        $doc->execute([':uid' => $userId]);
        $docData = $doc->fetch();
        if ($docData) {
            $sql .= " AND (e.hospital_id = :hid OR e.doctor_id = :uid)";
            $params[':hid'] = $docData['hospital_id'];
            $params[':uid'] = $userId;
        }
    } elseif ($role === 'driver') {
        $sql .= " AND e.driver_id = :uid AND e.status IN ('dispatched','en_route','arrived')";
        $params[':uid'] = $userId;
    }

    $sql .= " ORDER BY e.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['success' => true, 'emergencies' => $stmt->fetchAll()]);
}

/* ============================================================
   POST — Trigger / Dispatch / Update Status / Cancel
   ============================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth();

    $userId = $_SESSION['user_id'];
    $role   = $_SESSION['user_role'];

    /* ---- Action: trigger ---- */
    if ($action === 'trigger') {
        if ($role !== 'mother') jsonResponse(['error' => 'Only mothers can trigger emergencies'], 403);

        $lat          = $input['latitude']      ?? null;
        $lng          = $input['longitude']     ?? null;
        $notes        = $input['notes']         ?? '';
        $requireCemonc = filter_var($input['require_cemonc'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$lat || !$lng) jsonResponse(['error' => 'GPS coordinates required to trigger emergency'], 400);

        try {
            $pdo->beginTransaction();

            $code = generateEmergencyCode();

            $stmt = $pdo->prepare("INSERT INTO emergencies (code, mother_id, latitude, longitude, notes, status) VALUES (:code, :mid, :lat, :lng, :notes, 'pending')");
            $stmt->execute([':code' => $code, ':mid' => $userId, ':lat' => $lat, ':lng' => $lng, ':notes' => $notes]);
            $emgId = $pdo->lastInsertId();

            // Save initial GPS location
            $pdo->prepare("INSERT INTO emergency_locations (emergency_id, latitude, longitude, source) VALUES (:eid, :lat, :lng, 'mother')")
                ->execute([':eid' => $emgId, ':lat' => $lat, ':lng' => $lng]);

            // Smart resource matching
            $hospital = findNearestHospital($lat, $lng, $requireCemonc);
            $driver   = findNearestDriver($lat, $lng);

            $suggestions = [
                'recommended_hospital' => $hospital ? ['id' => $hospital['id'], 'name' => $hospital['name'], 'distance' => round($hospital['distance'], 2), 'beds' => $hospital['available_beds']] : null,
                'recommended_driver'   => $driver   ? ['id' => $driver['user_id'], 'name' => $driver['full_name'], 'phone' => $driver['phone'], 'distance' => round($driver['distance'], 2), 'vehicle' => $driver['plate_number']] : null,
            ];

            // Notify all admins
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) SELECT id, 'NEW EMERGENCY TRIGGERED', :msg, 'emergency' FROM users WHERE role = 'admin'")
                ->execute([':msg' => "Alert {$code} triggered. Respond immediately."]);

            $pdo->commit();

            jsonResponse(['success' => true, 'emergency' => ['id' => $emgId, 'code' => $code, 'status' => 'pending', 'latitude' => $lat, 'longitude' => $lng], 'recommendations' => $suggestions]);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Trigger failed: ' . $e->getMessage()], 500);
        }
    }

    /* ---- Action: dispatch ---- */
    if ($action === 'dispatch') {
        if ($role !== 'admin') jsonResponse(['error' => 'Unauthorized'], 403);

        $driverId   = $input['driver_id']   ?? null;
        $hospitalId = $input['hospital_id'] ?? null;
        $doctorId   = $input['doctor_id']   ?? null;

        if (!$emergencyId || !$driverId || !$hospitalId) jsonResponse(['error' => 'Driver and hospital required'], 400);

        try {
            $pdo->beginTransaction();

            // Auto-find on-duty doctor if none chosen
            if (!$doctorId) {
                $doc = findOnDutyDoctor($hospitalId);
                if ($doc) $doctorId = $doc['user_id'];
            }

            $pdo->prepare("UPDATE emergencies SET driver_id = :did, hospital_id = :hid, doctor_id = :doc, status = 'dispatched', dispatched_at = NOW() WHERE id = :eid")
                ->execute([':did' => $driverId, ':hid' => $hospitalId, ':doc' => $doctorId, ':eid' => $emergencyId]);

            // Mark vehicle en_route
            $drv = $pdo->prepare("SELECT vehicle_id FROM drivers WHERE user_id = :did");
            $drv->execute([':did' => $driverId]);
            $vehId = $drv->fetch()['vehicle_id'] ?? null;
            if ($vehId) $pdo->prepare("UPDATE vehicles SET status = 'en_route' WHERE id = :vid")->execute([':vid' => $vehId]);

            // Decrement beds
            $pdo->prepare("UPDATE hospitals SET available_beds = GREATEST(available_beds - 1, 0) WHERE id = :hid")->execute([':hid' => $hospitalId]);

            // Notify driver and doctor
            $notify = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (:uid, :title, :msg, 'emergency')");
            $notify->execute([':uid' => $driverId, ':title' => 'Emergency Dispatch', ':msg' => 'You have been assigned an emergency rescue. Check your console for route details.']);
            if ($doctorId) $notify->execute([':uid' => $doctorId, ':title' => 'Incoming Patient', ':msg' => 'A maternal emergency patient is being transported to your facility. Prepare clinical resources.']);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Resources dispatched successfully.']);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Dispatch failed: ' . $e->getMessage()], 500);
        }
    }

    /* ---- Action: update_status ---- */
    if ($action === 'update_status') {
        $status  = $input['status'] ?? null;
        $allowed = ['en_route', 'arrived', 'completed', 'cancelled'];
        if (!$emergencyId || !in_array($status, $allowed)) jsonResponse(['error' => 'Invalid status'], 400);

        try {
            $pdo->beginTransaction();

            $sql    = "UPDATE emergencies SET status = :status";
            $params = [':status' => $status, ':eid' => $emergencyId];

            if ($status === 'arrived')   $sql .= ", arrived_at = NOW()";
            if ($status === 'completed') {
                $sql .= ", completed_at = NOW()";
                $emg = $pdo->prepare("SELECT driver_id, hospital_id FROM emergencies WHERE id = :eid");
                $emg->execute([':eid' => $emergencyId]);
                $emgData = $emg->fetch();
                if ($emgData && $emgData['driver_id']) {
                    $drv = $pdo->prepare("SELECT vehicle_id FROM drivers WHERE user_id = :did");
                    $drv->execute([':did' => $emgData['driver_id']]);
                    $vehId = $drv->fetch()['vehicle_id'] ?? null;
                    if ($vehId) $pdo->prepare("UPDATE vehicles SET status = 'available' WHERE id = :vid")->execute([':vid' => $vehId]);
                }
                if (!empty($emgData['hospital_id'])) {
                    $pdo->prepare("UPDATE hospitals SET available_beds = available_beds + 1 WHERE id = :hid")->execute([':hid' => $emgData['hospital_id']]);
                }
            }

            $sql .= " WHERE id = :eid";
            $pdo->prepare($sql)->execute($params);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => "Status updated to '{$status}'."]);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Update failed: ' . $e->getMessage()], 500);
        }
    }

    /* ---- Action: cancel ---- */
    if ($action === 'cancel') {
        $reason = $input['reason'] ?? '';
        if (!$emergencyId) jsonResponse(['error' => 'Emergency ID required'], 400);

        try {
            $pdo->beginTransaction();

            $emg = $pdo->prepare("SELECT * FROM emergencies WHERE id = :eid");
            $emg->execute([':eid' => $emergencyId]);
            $emgData = $emg->fetch();
            if (!$emgData) jsonResponse(['error' => 'Emergency not found'], 404);

            $pdo->prepare("UPDATE emergencies SET status = 'cancelled', completed_at = NOW() WHERE id = :eid")->execute([':eid' => $emergencyId]);

            if (!empty($emgData['driver_id'])) {
                $drv = $pdo->prepare("SELECT vehicle_id FROM drivers WHERE user_id = :did");
                $drv->execute([':did' => $emgData['driver_id']]);
                $vehId = $drv->fetch()['vehicle_id'] ?? null;
                if ($vehId) $pdo->prepare("UPDATE vehicles SET status = 'available' WHERE id = :vid")->execute([':vid' => $vehId]);
            }

            if (!empty($emgData['hospital_id'])) {
                $pdo->prepare("UPDATE hospitals SET available_beds = available_beds + 1 WHERE id = :hid")->execute([':hid' => $emgData['hospital_id']]);
            }

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Emergency cancelled.']);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Cancel failed: ' . $e->getMessage()], 500);
        }
    }
}
