<?php
/**
 * MamaTrack GPS — Drivers API (api/drivers.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $userId = $_GET['user_id'] ?? null;
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT d.*, d.hospital_id, d.vehicle_id, u.full_name, u.email, u.phone,
                   v.plate_number, v.vehicle_type, v.status AS vehicle_status,
                   h.name AS hospital_name
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            WHERE d.user_id = :uid");
        $stmt->execute([':uid' => $userId]);
        $driver = $stmt->fetch();
        if (!$driver) jsonResponse(['error' => 'Driver not found'], 404);
        jsonResponse(['success' => true, 'driver' => $driver]);
    }

    $onDutyOnly = filter_var($_GET['on_duty'] ?? false, FILTER_VALIDATE_BOOLEAN);

    $sql = "SELECT d.user_id, d.hospital_id, d.vehicle_id, d.is_on_duty, d.current_latitude, d.current_longitude, d.driver_role, d.license_number,
                   u.full_name, u.email, u.phone,
                   v.plate_number, v.vehicle_type, v.status AS vehicle_status,
                   h.name AS hospital_name
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            WHERE u.is_active = 1";

    if ($onDutyOnly) $sql .= " AND d.is_on_duty = 1";
    $sql .= " ORDER BY u.full_name ASC";

    $stmt = $pdo->query($sql);
    jsonResponse(['success' => true, 'drivers' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['driver', 'admin']);

    $input  = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;

    if ($action === 'toggle_duty') {
        $userId = $_SESSION['user_id'];
        $isOnDuty = filter_var($input['is_on_duty'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $pdo->prepare("UPDATE drivers SET is_on_duty = :duty, last_duty_toggle = NOW() WHERE user_id = :uid")
            ->execute([':duty' => $isOnDuty, ':uid' => $userId]);
        jsonResponse(['success' => true, 'is_on_duty' => (bool) $isOnDuty]);
    }

    // Admin-only management endpoints below
    requireApiAuth(['admin']);

    if ($action === 'create') {
        $name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $password = trim($input['password'] ?? '');
        $hospitalId = isset($input['hospital_id']) ? (int)$input['hospital_id'] : null;
        $vehicleId = !empty($input['vehicle_id']) ? (int)$input['vehicle_id'] : null;
        $driverRole = trim($input['driver_role'] ?? 'Primary Emergency Driver');

        if (empty($name) || empty($email) || empty($phone) || empty($password) || !$hospitalId) {
            jsonResponse(['error' => 'Full Name, Email, Phone, Password, and Hospital are required'], 400);
        }

        // Check if email already exists
        $chk = $pdo->prepare("SELECT id FROM users WHERE email = :email");
        $chk->execute([':email' => $email]);
        if ($chk->fetch()) {
            jsonResponse(['error' => 'Email already registered'], 400);
        }

        try {
            $pdo->beginTransaction();

            // Create user
            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (:name, :email, :phone, :pass, 'driver')");
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':pass'  => password_hash($password, PASSWORD_DEFAULT)
            ]);
            $newUserId = $pdo->lastInsertId();

            // Create driver profile
            $stmtProfile = $pdo->prepare("INSERT INTO drivers (user_id, hospital_id, vehicle_id, license_number, driver_role) VALUES (:uid, :hid, :vid, :license, :role)");
            $stmtProfile->execute([
                ':uid' => $newUserId,
                ':hid' => $hospitalId,
                ':vid' => $vehicleId,
                ':license' => trim($input['license_number'] ?? ''),
                ':role' => $driverRole
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Driver added successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'update') {
        $driverUserId = isset($input['driver_user_id']) ? (int)$input['driver_user_id'] : null;
        $name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $hospitalId = isset($input['hospital_id']) ? (int)$input['hospital_id'] : null;
        $vehicleId = !empty($input['vehicle_id']) ? (int)$input['vehicle_id'] : null;
        $driverRole = trim($input['driver_role'] ?? 'Primary Emergency Driver');

        if (!$driverUserId || empty($name) || empty($email) || empty($phone) || !$hospitalId) {
            jsonResponse(['error' => 'All fields are required to update driver'], 400);
        }

        // Check unique email
        $chk = $pdo->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $chk->execute([':email' => $email, ':id' => $driverUserId]);
        if ($chk->fetch()) {
            jsonResponse(['error' => 'Email is already in use by another user'], 400);
        }

        try {
            $pdo->beginTransaction();

            // Update user table
            $stmt = $pdo->prepare("UPDATE users SET full_name = :name, email = :email, phone = :phone WHERE id = :id");
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':id' => $driverUserId
            ]);

            // Update password if provided
            $password = trim($input['password'] ?? '');
            if (!empty($password)) {
                $stmtPass = $pdo->prepare("UPDATE users SET password_hash = :pass WHERE id = :id");
                $stmtPass->execute([
                    ':pass' => password_hash($password, PASSWORD_DEFAULT),
                    ':id' => $driverUserId
                ]);
            }

            // Update driver profile table
            $stmtProfile = $pdo->prepare("UPDATE drivers SET hospital_id = :hid, vehicle_id = :vid, license_number = :license, driver_role = :role WHERE user_id = :uid");
            $stmtProfile->execute([
                ':hid' => $hospitalId,
                ':vid' => $vehicleId,
                ':license' => trim($input['license_number'] ?? ''),
                ':role' => $driverRole,
                ':uid' => $driverUserId
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Driver details updated successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'delete') {
        $driverUserId = isset($input['driver_user_id']) ? (int)$input['driver_user_id'] : null;
        if (!$driverUserId) {
            jsonResponse(['error' => 'Driver User ID required'], 400);
        }

        // Delete from users (cascades to drivers)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $driverUserId]);
        jsonResponse(['success' => true, 'message' => 'Driver deleted successfully']);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
