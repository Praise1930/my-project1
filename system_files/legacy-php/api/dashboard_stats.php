<?php
/**
 * MamaTrack GPS — Dashboard Statistics API
 */
require_once __DIR__ . '/../config/auth.php';

requireApiAuth(['admin', 'doctor']);

$pdo  = getDBConnection();
$role = $_SESSION['user_role'];
$userId = $_SESSION['user_id'];

try {
    $stats = [];

    if ($role === 'admin') {
        $stats['active_emergencies']  = (int) $pdo->query("SELECT COUNT(*) FROM emergencies WHERE status IN ('pending','verified','dispatched','en_route','arrived')")->fetchColumn();
        $stats['total_mothers']       = (int) $pdo->query("SELECT COUNT(*) FROM mothers")->fetchColumn();
        $stats['available_ambulances'] = (int) $pdo->query("SELECT COUNT(*) FROM drivers d JOIN vehicles v ON d.vehicle_id = v.id WHERE d.is_on_duty = 1 AND v.status = 'available'")->fetchColumn();

        $beds = $pdo->query("SELECT SUM(available_beds) AS av, SUM(total_beds) AS tot FROM hospitals WHERE is_active = 1")->fetch();
        $stats['available_beds'] = (int) ($beds['av'] ?? 0);
        $stats['total_beds']     = (int) ($beds['tot'] ?? 0);

        $rows = $pdo->query("SELECT status, COUNT(*) AS cnt FROM emergencies GROUP BY status")->fetchAll();
        $stats['status_breakout'] = [];
        foreach ($rows as $row) $stats['status_breakout'][$row['status']] = (int) $row['cnt'];

        $stats['sub_county_breakout'] = $pdo->query(
            "SELECT m.sub_county, COUNT(*) AS cnt FROM emergencies e JOIN mothers m ON e.mother_id = m.user_id GROUP BY m.sub_county ORDER BY cnt DESC LIMIT 5"
        )->fetchAll();
    }

    if ($role === 'doctor') {
        $doc = $pdo->prepare("SELECT hospital_id FROM doctors WHERE user_id = :uid");
        $doc->execute([':uid' => $userId]);
        $hid = $doc->fetch()['hospital_id'] ?? null;

        if ($hid) {
            $stats['hospital_emergencies'] = (int) $pdo->prepare("SELECT COUNT(*) FROM emergencies WHERE hospital_id = :hid AND status IN ('dispatched','en_route','arrived')")
                ->execute([':hid' => $hid]);

            $hosp = $pdo->prepare("SELECT available_beds, total_beds FROM hospitals WHERE id = :hid");
            $hosp->execute([':hid' => $hid]);
            $h = $hosp->fetch();
            $stats['available_beds'] = (int) ($h['available_beds'] ?? 0);
            $stats['total_beds']     = (int) ($h['total_beds']     ?? 0);

            $dutyStmt = $pdo->prepare("SELECT COUNT(*) FROM doctors WHERE hospital_id = :hid AND is_on_duty = 1");
            $dutyStmt->execute([':hid' => $hid]);
            $stats['doctors_on_duty'] = (int) $dutyStmt->fetchColumn();
        }
    }

    jsonResponse(['success' => true, 'stats' => $stats]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Stats failure: ' . $e->getMessage()], 500);
}
