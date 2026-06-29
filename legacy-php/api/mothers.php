<?php
/**
 * MamaTrack GPS — Mothers API
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth(['admin', 'doctor', 'mother']);

    $motherId = $_GET['id'] ?? null;

    if ($motherId) {
        $stmt = $pdo->prepare("
            SELECT m.*, u.full_name, u.email, u.phone, u.avatar
            FROM mothers m
            JOIN users u ON m.user_id = u.id
            WHERE m.user_id = :id");
        $stmt->execute([':id' => $motherId]);
        $mother = $stmt->fetch();
        if (!$mother) jsonResponse(['error' => 'Mother not found'], 404);

        // Checkup schedules (using the view 'checkups')
        $cs = $pdo->prepare("SELECT * FROM checkup_schedules WHERE mother_id = :mid ORDER BY scheduled_date DESC");
        $cs->execute([':mid' => $mother['id']]);
        $mother['checkups'] = $cs->fetchAll();

        // Emergency history
        $es = $pdo->prepare("SELECT id, code, status, created_at FROM emergencies WHERE mother_id = :uid ORDER BY created_at DESC");
        $es->execute([':uid' => $motherId]);
        $mother['emergencies'] = $es->fetchAll();

        jsonResponse(['success' => true, 'mother' => $mother]);
    }

    // All mothers list
    $stmt = $pdo->query("
        SELECT m.*, u.full_name, u.email, u.phone
        FROM mothers m
        JOIN users u ON m.user_id = u.id
        ORDER BY u.full_name ASC");
    jsonResponse(['success' => true, 'mothers' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['admin', 'doctor', 'mother']);

    $input  = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;

    /* Add ANC checkup */
    if ($action === 'add_checkup') {
        $motherId  = $input['mother_id'] ?? null;
        $date      = $input['checkup_date'] ?? date('Y-m-d');
        $type      = $input['checkup_type'] ?? 'Routine ANC';
        $hospId    = $input['hospital_id'] ?? null;
        $notes     = $input['notes'] ?? '';

        if (!$motherId) jsonResponse(['error' => 'Mother ID required'], 400);

        // Look up mothers.id from user_id
        $m = $pdo->prepare("SELECT id FROM mothers WHERE user_id = :uid");
        $m->execute([':uid' => $motherId]);
        $motherRow = $m->fetch();
        if (!$motherRow) jsonResponse(['error' => 'Mother profile not found'], 404);

        $pdo->prepare("INSERT INTO checkup_schedules (mother_id, hospital_id, checkup_type, scheduled_date, notes, status) VALUES (:mid, :hid, :type, :date, :notes, 'completed')")
            ->execute([':mid' => $motherRow['id'], ':hid' => $hospId, ':type' => $type, ':date' => $date, ':notes' => $notes]);

        jsonResponse(['success' => true, 'message' => 'Checkup record saved.']);
    }

    /* Update mother profile (self) */
    if ($action === 'update_profile') {
        $userId = $_SESSION['user_id'];
        $pdo->prepare("UPDATE mothers SET
                next_of_kin_name = :nok_name,
                next_of_kin_phone = :nok_phone,
                next_of_kin_relationship = :nok_rel,
                village = :vil,
                sub_county = :sub
            WHERE user_id = :uid")
            ->execute([
                ':nok_name' => $input['next_of_kin_name'] ?? '',
                ':nok_phone'=> $input['next_of_kin_phone'] ?? '',
                ':nok_rel'  => $input['next_of_kin_relationship'] ?? '',
                ':vil'      => $input['village'] ?? '',
                ':sub'      => $input['sub_county'] ?? '',
                ':uid'      => $userId,
            ]);
        jsonResponse(['success' => true, 'message' => 'Profile updated.']);
    }

    // Admin-only management endpoints below
    requireApiAuth(['admin']);

    if ($action === 'create_admin') {
        $name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $password = trim($input['password'] ?? '');
        $pregStart = trim($input['pregnancy_start_date'] ?? '');

        if (empty($name) || empty($email) || empty($phone) || empty($password) || empty($pregStart)) {
            jsonResponse(['error' => 'Full Name, Email, Phone, Password, and Pregnancy Start Date are required'], 400);
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
            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (:name, :email, :phone, :pass, 'mother')");
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':pass'  => password_hash($password, PASSWORD_DEFAULT)
            ]);
            $newUserId = $pdo->lastInsertId();

            // Calculate expected due date (280 days from pregnancy start)
            $dueDate = date('Y-m-d', strtotime($pregStart . ' + 280 days'));

            // Create mother profile
            $stmtProfile = $pdo->prepare("INSERT INTO mothers 
                (user_id, date_of_birth, blood_type, pregnancy_start_date, expected_due_date, gravida, parity, medical_history, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, village, sub_county) 
                VALUES (:uid, :dob, :blood, :pstart, :due, :gravida, :parity, :med, :nok_name, :nok_phone, :nok_rel, :village, :sub)");
            $stmtProfile->execute([
                ':uid' => $newUserId,
                ':dob' => !empty($input['date_of_birth']) ? $input['date_of_birth'] : null,
                ':blood' => !empty($input['blood_type']) ? $input['blood_type'] : null,
                ':pstart' => $pregStart,
                ':due' => $dueDate,
                ':gravida' => isset($input['gravida']) ? (int)$input['gravida'] : 1,
                ':parity' => isset($input['parity']) ? (int)$input['parity'] : 0,
                ':med' => trim($input['medical_history'] ?? ''),
                ':nok_name' => trim($input['next_of_kin_name'] ?? ''),
                ':nok_phone' => trim($input['next_of_kin_phone'] ?? ''),
                ':nok_rel' => trim($input['next_of_kin_relationship'] ?? ''),
                ':village' => trim($input['village'] ?? ''),
                ':sub' => trim($input['sub_county'] ?? '')
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Mother added successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'update_admin') {
        $motherUserId = isset($input['mother_user_id']) ? (int)$input['mother_user_id'] : null;
        $name = trim($input['full_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $pregStart = trim($input['pregnancy_start_date'] ?? '');

        if (!$motherUserId || empty($name) || empty($email) || empty($phone) || empty($pregStart)) {
            jsonResponse(['error' => 'Full Name, Email, Phone, and Pregnancy Start Date are required'], 400);
        }

        // Check unique email
        $chk = $pdo->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $chk->execute([':email' => $email, ':id' => $motherUserId]);
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
                ':id' => $motherUserId
            ]);

            // Update password if provided
            $password = trim($input['password'] ?? '');
            if (!empty($password)) {
                $stmtPass = $pdo->prepare("UPDATE users SET password_hash = :pass WHERE id = :id");
                $stmtPass->execute([
                    ':pass' => password_hash($password, PASSWORD_DEFAULT),
                    ':id' => $motherUserId
                ]);
            }

            // Calculate expected due date
            $dueDate = date('Y-m-d', strtotime($pregStart . ' + 280 days'));

            // Update mother profile table
            $stmtProfile = $pdo->prepare("UPDATE mothers SET 
                date_of_birth = :dob,
                blood_type = :blood,
                pregnancy_start_date = :pstart,
                expected_due_date = :due,
                gravida = :gravida,
                parity = :parity,
                medical_history = :med,
                next_of_kin_name = :nok_name,
                next_of_kin_phone = :nok_phone,
                next_of_kin_relationship = :nok_rel,
                village = :village,
                sub_county = :sub
                WHERE user_id = :uid");
            
            $stmtProfile->execute([
                ':dob' => !empty($input['date_of_birth']) ? $input['date_of_birth'] : null,
                ':blood' => !empty($input['blood_type']) ? $input['blood_type'] : null,
                ':pstart' => $pregStart,
                ':due' => $dueDate,
                ':gravida' => isset($input['gravida']) ? (int)$input['gravida'] : 1,
                ':parity' => isset($input['parity']) ? (int)$input['parity'] : 0,
                ':med' => trim($input['medical_history'] ?? ''),
                ':nok_name' => trim($input['next_of_kin_name'] ?? ''),
                ':nok_phone' => trim($input['next_of_kin_phone'] ?? ''),
                ':nok_rel' => trim($input['next_of_kin_relationship'] ?? ''),
                ':village' => trim($input['village'] ?? ''),
                ':sub' => trim($input['sub_county'] ?? ''),
                ':uid' => $motherUserId
            ]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Mother details updated successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'delete') {
        $motherUserId = isset($input['mother_user_id']) ? (int)$input['mother_user_id'] : null;
        if (!$motherUserId) {
            jsonResponse(['error' => 'Mother User ID required'], 400);
        }

        // Delete from users (cascades to mothers)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $motherUserId]);
        jsonResponse(['success' => true, 'message' => 'Mother deleted successfully']);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}
