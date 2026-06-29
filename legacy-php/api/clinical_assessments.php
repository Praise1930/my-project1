<?php
/**
 * MamaTrack GPS — Clinical Patient Intake Assessments API (api/clinical_assessments.php)
 */
require_once __DIR__ . '/../config/auth.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiAuth(['doctor', 'admin']);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $doctorId = $_SESSION['user_id'];

    $emgId = isset($input['emergency_id']) ? (int)$input['emergency_id'] : null;
    $bp = trim($input['blood_pressure'] ?? '');
    $hr = isset($input['heart_rate']) && !empty($input['heart_rate']) ? (int)$input['heart_rate'] : null;
    $temp = isset($input['temperature']) && !empty($input['temperature']) ? (float)$input['temperature'] : null;
    $findings = trim($input['clinical_findings'] ?? '');
    $treatment = trim($input['treatment_given'] ?? '');
    $outcome = $input['outcome'] ?? 'admitted';

    if (!$emgId) {
        jsonResponse(['error' => 'Emergency ID is required.'], 400);
    }

    // Check if assessment already exists for this emergency
    $chk = $pdo->prepare("SELECT id FROM clinical_assessments WHERE emergency_id = :eid");
    $chk->execute([':eid' => $emgId]);
    if ($chk->fetch()) {
        jsonResponse(['error' => 'Intake assessment has already been logged for this emergency.'], 400);
    }

    $stmtInsert = $pdo->prepare("INSERT INTO clinical_assessments (emergency_id, doctor_id, blood_pressure, heart_rate, temperature, clinical_findings, treatment_given, outcome) VALUES (:eid, :did, :bp, :hr, :temp, :findings, :treatment, :outcome)");
    $stmtInsert->execute([
        ':eid' => $emgId,
        ':did' => $doctorId,
        ':bp' => $bp,
        ':hr' => $hr,
        ':temp' => $temp,
        ':findings' => $findings,
        ':treatment' => $treatment,
        ':outcome' => $outcome
    ]);

    // Also update emergency status to resolved/completed if the doctor discharges/resolves it,
    // or log notes in the emergency row.
    $pdo->prepare("UPDATE emergencies SET status = 'completed', completed_at = NOW() WHERE id = :eid")
        ->execute([':eid' => $emgId]);

    jsonResponse(['success' => true, 'message' => 'Intake clinical assessment logged successfully and emergency resolved.']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireApiAuth();

    $emgId = $_GET['emergency_id'] ?? null;
    $doctorId = $_GET['doctor_id'] ?? null;

    if ($emgId) {
        $stmt = $pdo->prepare("SELECT ca.*, u.full_name as doctor_name FROM clinical_assessments ca JOIN users u ON ca.doctor_id = u.id WHERE ca.emergency_id = :eid");
        $stmt->execute([':eid' => $emgId]);
        $assessment = $stmt->fetch();
        jsonResponse(['success' => true, 'assessment' => $assessment]);
    } elseif ($doctorId) {
        $stmt = $pdo->prepare("SELECT ca.*, e.code as emergency_code, m.user_id as mother_uid, mu.full_name as mother_name 
            FROM clinical_assessments ca 
            JOIN emergencies e ON ca.emergency_id = e.id 
            JOIN mothers m ON e.mother_id = m.user_id
            JOIN users mu ON m.user_id = mu.id
            WHERE ca.doctor_id = :did ORDER BY ca.logged_at DESC");
        $stmt->execute([':did' => $doctorId]);
        jsonResponse(['success' => true, 'assessments' => $stmt->fetchAll()]);
    } else {
        $stmt = $pdo->query("SELECT ca.*, e.code as emergency_code, u.full_name as doctor_name 
            FROM clinical_assessments ca 
            JOIN emergencies e ON ca.emergency_id = e.id 
            JOIN users u ON ca.doctor_id = u.id 
            ORDER BY ca.logged_at DESC LIMIT 100");
        jsonResponse(['success' => true, 'assessments' => $stmt->fetchAll()]);
    }
}
