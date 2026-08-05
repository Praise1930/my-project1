<?php
/**
 * MamaTrack GPS — Profile Avatar Upload API (api/profile_upload.php)
 */
require_once __DIR__ . '/../config/auth.php';

requireApiAuth();

$pdo = getDBConnection();
$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $jsonInput = json_decode($rawInput, true);

    // Handle JSON delete request
    if ($jsonInput && isset($jsonInput['action']) && $jsonInput['action'] === 'delete_avatar') {
        $stmt = $pdo->prepare("SELECT avatar FROM users WHERE id = :id");
        $stmt->execute([':id' => $userId]);
        $oldAvatar = $stmt->fetchColumn();

        if ($oldAvatar) {
            $uploadDir = __DIR__ . '/../uploads/avatars/';
            if (file_exists($uploadDir . $oldAvatar)) {
                unlink($uploadDir . $oldAvatar);
            }
        }

        $pdo->prepare("UPDATE users SET avatar = NULL WHERE id = :id")
            ->execute([':id' => $userId]);

        jsonResponse(['success' => true, 'message' => 'Profile picture removed.']);
    }

    // Handle file upload (must be multipart form)
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'No file uploaded or error occurred during upload.'], 400);
    }

    $file = $_FILES['avatar'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 2 * 1024 * 1024; // 2MB

    $fileInfo = getimagesize($file['tmp_name']);
    if ($fileInfo === false) {
        jsonResponse(['error' => 'Invalid image file.'], 400);
    }

    $mimeType = $fileInfo['mime'];
    if (!in_array($mimeType, $allowedTypes)) {
        jsonResponse(['error' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'], 400);
    }

    if ($file['size'] > $maxSize) {
        jsonResponse(['error' => 'File size exceeds 2MB limit.'], 400);
    }

    $uploadDir = __DIR__ . '/../uploads/avatars/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            jsonResponse(['error' => 'Failed to create uploads directory.'], 500);
        }
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (empty($ext)) {
        $ext = $mimeType === 'image/png' ? 'png' : ($mimeType === 'image/gif' ? 'gif' : ($mimeType === 'image/webp' ? 'webp' : 'jpg'));
    }
    $filename = $userId . '_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $filename;

    $stmt = $pdo->prepare("SELECT avatar FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $oldAvatar = $stmt->fetchColumn();

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $stmt = $pdo->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
        $stmt->execute([':avatar' => $filename, ':id' => $userId]);

        if ($oldAvatar && file_exists($uploadDir . $oldAvatar)) {
            unlink($uploadDir . $oldAvatar);
        }

        jsonResponse(['success' => true, 'avatar' => $filename, 'message' => 'Avatar updated successfully.']);
    } else {
        jsonResponse(['error' => 'Failed to save uploaded file.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed.'], 405);
