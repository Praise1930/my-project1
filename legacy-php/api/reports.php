<?php
/**
 * MamaTrack GPS — Reports & Analytics API
 */
require_once __DIR__ . '/../config/auth.php';
requireApiAuth(['admin']);

$pdo = getDBConnection();

try {
    $reports = [];

    $reports['monthly_trends'] = $pdo->query("
        SELECT DATE_FORMAT(created_at,'%b %Y') AS month,
               COUNT(*) AS count,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
               SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM emergencies
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
    ")->fetchAll();

    $reports['average_response_time'] = (float) $pdo->query("
        SELECT AVG(TIMESTAMPDIFF(MINUTE, dispatched_at, arrived_at))
        FROM emergencies
        WHERE status='completed' AND dispatched_at IS NOT NULL AND arrived_at IS NOT NULL
    ")->fetchColumn();

    $reports['geo_distribution'] = $pdo->query("
        SELECT m.sub_county, COUNT(*) AS count
        FROM emergencies e
        JOIN mothers m ON e.mother_id = m.user_id
        GROUP BY m.sub_county
        ORDER BY count DESC
    ")->fetchAll();

    $reports['hospital_utilization'] = $pdo->query("
        SELECT h.name AS hospital_name, COUNT(*) AS count
        FROM emergencies e
        JOIN hospitals h ON e.hospital_id = h.id
        GROUP BY h.id
        ORDER BY count DESC
    ")->fetchAll();

    jsonResponse(['success' => true, 'reports' => $reports]);

} catch (Exception $e) {
    jsonResponse(['error' => 'Report failure: ' . $e->getMessage()], 500);
}
