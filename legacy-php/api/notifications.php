<?php
/**
 * MamaTrack GPS — Notifications API Endpoint (api/notifications.php)
 * Fetches unread notifications and updates status indicators.
 */

require_once __DIR__ . '/../config/auth.php';

requireApiAuth();

$pdo = getDBConnection();
$userId = $_SESSION['user_id'];

// GET Requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? null;

    if ($action === 'unread') {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :uid AND is_read = 0 ORDER BY created_at DESC");
        $stmt->execute([':uid' => $userId]);
        jsonResponse(['success' => true, 'notifications' => $stmt->fetchAll()]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 30");
        $stmt->execute([':uid' => $userId]);
        jsonResponse(['success' => true, 'notifications' => $stmt->fetchAll()]);
    }
}

// POST Requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? null;

    if ($action === 'read') {
        $id = $input['id'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :uid");
            $stmt->execute([':id' => $id, ':uid' => $userId]);
        } else {
            // Mark all as read
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
        }

        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Invalid action'], 400);
}
