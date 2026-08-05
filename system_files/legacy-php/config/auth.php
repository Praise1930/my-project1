<?php
/**
 * GPS Maternal Emergency Response System
 * Authentication & Session Management
 */

session_start();

require_once __DIR__ . '/database.php';

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current logged-in user data
 */
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT id, full_name, email, phone, role, avatar, is_active FROM users WHERE id = :id");
    $stmt->execute([':id' => $_SESSION['user_id']]);
    return $stmt->fetch();
}

/**
 * Require authentication — redirect to login if not logged in
 */
function requireAuth($allowedRoles = []) {
    if (!isLoggedIn()) {
        header('Location: ' . getBaseUrl() . 'auth/login.php');
        exit;
    }
    if (!empty($allowedRoles)) {
        $user = getCurrentUser();
        if (!$user || !in_array($user['role'], $allowedRoles)) {
            http_response_code(403);
            header('Location: ' . getBaseUrl() . 'auth/login.php?error=unauthorized');
            exit;
        }
    }
}

/**
 * Require API authentication — return JSON error if not logged in
 */
function requireApiAuth($allowedRoles = []) {
    if (!isLoggedIn()) {
        jsonResponse(['error' => 'Authentication required'], 401);
    }
    if (!empty($allowedRoles)) {
        $user = getCurrentUser();
        if (!$user || !in_array($user['role'], $allowedRoles)) {
            jsonResponse(['error' => 'Insufficient permissions'], 403);
        }
    }
}

/**
 * Authenticate user with email and password
 */
function authenticateUser($email, $password) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email AND is_active = 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['full_name'];
        
        // Update last login
        $update = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
        $update->execute([':id' => $user['id']]);
        
        return $user;
    }
    return false;
}

/**
 * Register a new mother user
 */
function registerMother($data) {
    $pdo = getDBConnection();
    
    // Check if email exists
    $check = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $check->execute([':email' => $data['email']]);
    if ($check->fetch()) {
        return ['error' => 'Email already registered'];
    }
    
    try {
        $pdo->beginTransaction();
        
        // Create user
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (:name, :email, :phone, :pass, 'mother')");
        $stmt->execute([
            ':name' => $data['full_name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'],
            ':pass' => password_hash($data['password'], PASSWORD_DEFAULT)
        ]);
        $userId = $pdo->lastInsertId();
        
        // Create mother profile
        $stmt2 = $pdo->prepare("INSERT INTO mothers (user_id, date_of_birth, blood_type, pregnancy_start_date, expected_due_date, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, village, sub_county) VALUES (:uid, :dob, :blood, :pstart, :due, :nok_name, :nok_phone, :nok_rel, :village, :subcounty)");
        
        // Calculate expected due date (280 days from pregnancy start)
        $dueDate = date('Y-m-d', strtotime($data['pregnancy_start_date'] . ' + 280 days'));
        
        $stmt2->execute([
            ':uid' => $userId,
            ':dob' => $data['date_of_birth'] ?? null,
            ':blood' => $data['blood_type'] ?? null,
            ':pstart' => $data['pregnancy_start_date'],
            ':due' => $dueDate,
            ':nok_name' => $data['next_of_kin_name'] ?? null,
            ':nok_phone' => $data['next_of_kin_phone'] ?? null,
            ':nok_rel' => $data['next_of_kin_relationship'] ?? null,
            ':village' => $data['village'] ?? null,
            ':subcounty' => $data['sub_county'] ?? null,
        ]);
        
        $pdo->commit();
        
        // Auto-login
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_role'] = 'mother';
        $_SESSION['user_name'] = $data['full_name'];
        
        return ['success' => true, 'user_id' => $userId];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['error' => 'Registration failed: ' . $e->getMessage()];
    }
}

/**
 * Logout user
 */
function logoutUser() {
    session_unset();
    session_destroy();
}

/**
 * Get base URL dynamically
 */
function getBaseUrl() {
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    // Navigate to project root
    $parts = explode('/', trim($scriptDir, '/'));
    // Find project root (Fn yr)
    $baseIdx = -1;
    foreach ($parts as $i => $part) {
        if ($part === 'Fn yr' || $part === 'Fn%20yr') {
            $baseIdx = $i;
            break;
        }
    }
    if ($baseIdx >= 0) {
        $baseParts = array_slice($parts, 0, $baseIdx + 1);
        return '/' . implode('/', $baseParts) . '/';
    }
    return '/';
}

/**
 * Get the mother profile for a user
 */
function getMotherProfile($userId) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT m.*, u.full_name, u.email, u.phone, u.avatar FROM mothers m JOIN users u ON m.user_id = u.id WHERE m.user_id = :uid");
    $stmt->execute([':uid' => $userId]);
    return $stmt->fetch();
}

/**
 * Calculate pregnancy weeks from start date
 */
function getPregnancyWeeks($pregnancyStartDate) {
    $start = new DateTime($pregnancyStartDate);
    $now = new DateTime();
    $diff = $start->diff($now);
    return floor($diff->days / 7);
}

/**
 * Get trimester from weeks
 */
function getTrimester($weeks) {
    if ($weeks <= 12) return '1st Trimester';
    if ($weeks <= 26) return '2nd Trimester';
    return '3rd Trimester';
}
