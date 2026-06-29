<?php
/**
 * MamaTrack GPS — Doctors API (api/doctors.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $userId = $_GET['user_id'] ?? null;
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT d.*, u.full_name, u.email, u.phone, h.name AS hospital_name
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN hospitals h ON d.hospital_id = h.id
            WHERE d.user_id = :uid");
        $stmt->execute([':uid' => $userId]);
        $doctor = $stmt->fetch();
        if (!$doctor) jsonResponse(['error' => 'Doctor not found'], 404);
        jsonResponse(['success' => true, 'doctor' => $doctor]);
    }

    $hospitalId  = $_GET['hospital_id'] ?? null;
    $onDutyOnly  = filter_var($_GET['on_duty'] ?? false, FILTER_VALIDATE_BOOLEAN);

    $sql    = "SELECT d.*, u.full_name, u.email, u.phone, h.name AS hospital_name
               FROM doctors d
               JOIN users u ON d.user_id = u.id
               JOIN hospitals h ON d.hospital_id = h.id
               WHERE u.is_active = 1";
    $params = [];

    if ($hospitalId) { $sql .= " AND d.hospital_id = :hid"; $params[':hid'] = $hospitalId; }
    if ($onDutyOnly) { $sql .= " AND d.is_on_duty = 1"; }
    $sql .= " ORDER BY u.full_name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['success' => true, 'doctors' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['doctor', 'admin']);

    $input  = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;

    if ($action === 'toggle_duty') {
        $userId = $_SESSION['user_id'];
        $isOnDuty = filter_var($input['is_on_duty'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $pdo->prepare("UPDATE doctors SET is_on_duty = :duty, last_duty_toggle = NOW() WHERE user_id = :uid")
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
        $specialization = trim($input['specialization'] ?? 'Obstetrics & Gynecology');
        $licenseNumber = trim($input['license_number'] ?? '');
        $yearsExperience = isset($input['years_experience']) ? (int)$input['years_experience'] : 0;

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
            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (:name, :email, :phone, :pass, 'doctor')");
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':pass'  => password_hash($password, PASSWORD_DEFAULT)
            ]);
            $newUserId = $pdo->lastInsertId();

            // Create doctor profile
            $stmtProfile = $pdo->prepare("INSERT INTO doctors (user_id, hospital_id, specialization, license_number, years_experience) VALUES (:uid, :hid, :spec, :license, :exp)");
            $stmtProfile->execute([
                ':uid' => $newUserId,
                ':hid' => $hospitalId,
                ':spec' => $specialization,
                ':license' => $licenseNumber,
                ':exp' => $yearsExperience
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Doctor added successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'update') {
        $doctorUserId = isset($input['doctor_user_id']) ? (int)$input['doctor_user_id'] : null;
        $name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $hospitalId = isset($input['hospital_id']) ? (int)$input['hospital_id'] : null;
        $specialization = trim($input['specialization'] ?? 'Obstetrics & Gynecology');
        $licenseNumber = trim($input['license_number'] ?? '');
        $yearsExperience = isset($input['years_experience']) ? (int)$input['years_experience'] : 0;

        if (!$doctorUserId || empty($name) || empty($email) || empty($phone) || !$hospitalId) {
            jsonResponse(['error' => 'All fields are required to update doctor'], 400);
        }

        // Check unique email
        $chk = $pdo->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $chk->execute([':email' => $email, ':id' => $doctorUserId]);
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
                ':id' => $doctorUserId
            ]);

            // Update password if provided
            $password = trim($input['password'] ?? '');
            if (!empty($password)) {
                $stmtPass = $pdo->prepare("UPDATE users SET password_hash = :pass WHERE id = :id");
                $stmtPass->execute([
                    ':pass' => password_hash($password, PASSWORD_DEFAULT),
                    ':id' => $doctorUserId
                ]);
            }

            // Update doctor profile table
            $stmtProfile = $pdo->prepare("UPDATE doctors SET hospital_id = :hid, specialization = :spec, license_number = :license, years_experience = :exp WHERE user_id = :uid");
            $stmtProfile->execute([
                ':hid' => $hospitalId,
                ':spec' => $specialization,
                ':license' => $licenseNumber,
                ':exp' => $yearsExperience,
                ':uid' => $doctorUserId
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Doctor details updated successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'delete') {
        $doctorUserId = isset($input['doctor_user_id']) ? (int)$input['doctor_user_id'] : null;
        if (!$doctorUserId) {
            jsonResponse(['error' => 'Doctor User ID required'], 400);
        }

        // Delete from users (cascades to doctors)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $doctorUserId]);
        jsonResponse(['success' => true, 'message' => 'Doctor deleted successfully']);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}

jsonResponse(['error' => 'Method not allowed.'], 405);
