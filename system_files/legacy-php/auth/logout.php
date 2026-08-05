<?php
/**
 * MamaTrack GPS — Logout Handler
 */
require_once __DIR__ . '/../config/auth.php';

logoutUser();

// Redirect to role-selection landing page
header('Location: ../index.php');
exit;
