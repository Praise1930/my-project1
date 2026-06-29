<?php
/**
 * MamaTrack GPS — Role-Aware Login Portal
 */
require_once __DIR__ . '/../config/auth.php';

// --- Role metadata ---
$roleConfig = [
    'mother' => [
        'label'     => 'Mother Portal',
        'icon'      => '🤰',
        'emoji'     => '🤰',
        'color'     => '#f43f5e',
        'color_rgb' => '244,63,94',
        'bg_class'  => 'bg-rose',
        'dashboard' => '../mother/index.php',
        'hint'      => 'Sign in to trigger emergency alerts and track your rescue.',
        'register'  => true,
    ],
    'admin'  => [
        'label'     => 'Command Center',
        'icon'      => '📡',
        'emoji'     => '📡',
        'color'     => '#3b82f6',
        'color_rgb' => '59,130,246',
        'bg_class'  => 'bg-blue',
        'dashboard' => '../admin/index.php',
        'hint'      => 'Emergency dispatch, resource management and system oversight.',
        'register'  => false,
    ],
    'doctor' => [
        'label'     => 'Clinical Console',
        'icon'      => '🩺',
        'emoji'     => '🩺',
        'color'     => '#10b981',
        'color_rgb' => '16,185,129',
        'bg_class'  => 'bg-green',
        'dashboard' => '../doctor/index.php',
        'hint'      => 'View incoming patients and manage clinical capacity.',
        'register'  => false,
    ],
    'driver' => [
        'label'     => 'Ambulance Navigation',
        'icon'      => '🚑',
        'emoji'     => '🚑',
        'color'     => '#f59e0b',
        'color_rgb' => '245,158,11',
        'bg_class'  => 'bg-amber',
        'dashboard' => '../driver/index.php',
        'hint'      => 'Navigate to patients and update your rescue status.',
        'register'  => false,
    ],
];

// Determine role from GET or POST
$role = $_GET['role'] ?? $_POST['role'] ?? 'mother';
if (!array_key_exists($role, $roleConfig)) $role = 'mother';
$cfg = $roleConfig[$role];

$error = null;

// Redirect if already logged in
if (isLoggedIn()) {
    $r = $_SESSION['user_role'];
    header('Location: ' . ($roleConfig[$r]['dashboard'] ?? '../index.php'));
    exit;
}

// Handle POST login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');
    $postRole = $_POST['role'] ?? 'mother';

    if (!$email || !$password) {
        $error = 'Please fill in all fields.';
    } else {
        $user = authenticateUser($email, $password);
        if ($user) {
            // Validate role matches
            if ($user['role'] !== $postRole) {
                $error = "This account is registered as a <strong>{$user['role']}</strong>. Please go back and select the correct role.";
            } else {
                header('Location: ' . $roleConfig[$user['role']]['dashboard']);
                exit;
            }
        } else {
            $error = 'Incorrect email or password. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($cfg['label']) ?> Login — MamaTrack GPS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --accent:     <?= $cfg['color'] ?>;
            --accent-rgb: <?= $cfg['color_rgb'] ?>;
            --bg:  #060b18;
            --surface: rgba(255,255,255,0.04);
            --border:  rgba(255,255,255,0.08);
            --text:    #f1f5f9;
            --muted:   #94a3b8;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            padding: 1.5rem;
            position: relative; overflow: hidden;
        }

        /* Animated orbs */
        .orb {
            position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.15; pointer-events: none;
        }
        .orb-1 {
            width: 500px; height: 500px;
            background: var(--accent);
            top: -150px; left: -100px;
            animation: pulse 8s ease-in-out infinite alternate;
        }
        .orb-2 {
            width: 350px; height: 350px;
            background: var(--accent);
            bottom: -80px; right: -80px; opacity: 0.1;
            animation: pulse 10s ease-in-out infinite alternate-reverse;
        }
        @keyframes pulse {
            0%   { transform: scale(1);    opacity: 0.12; }
            100% { transform: scale(1.15); opacity: 0.2; }
        }

        /* Card */
        .login-card {
            width: 100%; max-width: 420px;
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--border);
            border-radius: 1.5rem;
            padding: 2.5rem 2rem;
            position: relative; z-index: 1;
            box-shadow: 0 0 0 1px rgba(var(--accent-rgb),0.08),
                        0 32px 80px rgba(0,0,0,0.6),
                        0 0 60px rgba(var(--accent-rgb),0.08);
            animation: cardIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Back link */
        .back-link {
            display: inline-flex; align-items: center; gap: 0.4rem;
            font-size: 0.78rem; color: var(--muted); text-decoration: none;
            margin-bottom: 1.8rem;
            transition: color 0.2s;
        }
        .back-link:hover { color: var(--text); }

        /* Header */
        .login-header { text-align: center; margin-bottom: 2rem; }
        .role-badge {
            width: 68px; height: 68px;
            border-radius: 1rem;
            background: rgba(var(--accent-rgb), 0.15);
            border: 1px solid rgba(var(--accent-rgb), 0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem;
            margin: 0 auto 1rem;
        }
        .login-title {
            font-size: 1.55rem; font-weight: 800; letter-spacing: -0.03em;
            color: var(--accent);
            margin-bottom: 0.35rem;
        }
        .login-hint { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }

        /* Divider */
        .divider {
            height: 1px; background: var(--border); margin: 1.5rem 0;
        }

        /* Form */
        .form-group { margin-bottom: 1.1rem; }
        .form-label {
            display: block; font-size: 0.8rem; font-weight: 600;
            color: var(--muted); margin-bottom: 0.45rem; letter-spacing: 0.02em;
        }
        .form-input {
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            border-radius: 0.65rem;
            padding: 0.75rem 1rem;
            color: var(--text);
            font-size: 0.92rem;
            font-family: inherit;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }
        .form-input:focus {
            border-color: rgba(var(--accent-rgb), 0.5);
            box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.12);
        }
        .form-input::placeholder { color: rgba(148,163,184,0.5); }

        /* Error */
        .alert-error {
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.25);
            border-radius: 0.75rem;
            padding: 0.8rem 1rem;
            font-size: 0.82rem;
            color: #fca5a5;
            margin-bottom: 1.2rem;
            display: flex; align-items: flex-start; gap: 0.6rem;
            line-height: 1.5;
        }

        /* Submit */
        .btn-submit {
            width: 100%;
            background: var(--accent);
            color: <?= $role === 'driver' ? '#000' : '#fff' ?>;
            border: none; border-radius: 0.75rem;
            padding: 0.9rem;
            font-size: 0.92rem; font-weight: 700;
            font-family: inherit; cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 8px 30px rgba(var(--accent-rgb), 0.35);
            margin-top: 0.5rem;
        }
        .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-submit:active { transform: translateY(0); }

        /* Role switcher */
        .role-switcher {
            margin-top: 1.5rem;
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
        }
        .role-switch-btn {
            display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
            padding: 0.6rem 0.4rem;
            border-radius: 0.65rem;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--muted);
            font-size: 0.65rem; font-weight: 600; text-decoration: none;
            transition: border-color 0.2s, color 0.2s, background 0.2s;
            text-align: center; line-height: 1.3;
        }
        .role-switch-btn span.icon { font-size: 1.1rem; }
        .role-switch-btn:hover { border-color: rgba(var(--accent-rgb),0.4); color: var(--text); }
        .role-switch-btn.active {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.12);
            color: var(--text);
        }

        .role-switcher-label {
            font-size: 0.72rem; color: var(--muted); text-align: center;
            margin-top: 1.2rem; margin-bottom: 0.6rem;
            font-weight: 500;
        }

        /* Register link */
        .register-cta {
            margin-top: 1.5rem; text-align: center;
            font-size: 0.8rem; color: var(--muted);
        }
        .register-cta a {
            color: var(--accent); font-weight: 700; text-decoration: none;
            transition: opacity 0.2s;
        }
        .register-cta a:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>

    <div class="login-card">

        <!-- Back to role selection -->
        <a href="../index.php" class="back-link">&#8592; Back to role selection</a>

        <!-- Header -->
        <div class="login-header">
            <div class="role-badge"><?= $cfg['emoji'] ?></div>
            <h1 class="login-title"><?= htmlspecialchars($cfg['label']) ?></h1>
            <p class="login-hint"><?= htmlspecialchars($cfg['hint']) ?></p>
        </div>

        <div class="divider"></div>

        <!-- Error -->
        <?php if ($error): ?>
            <div class="alert-error">⚠️ <span><?= $error ?></span></div>
        <?php endif; ?>

        <?php if (isset($_GET['error']) && $_GET['error'] === 'unauthorized'): ?>
            <div class="alert-error">⚠️ <span>Access denied. Please sign in to continue.</span></div>
        <?php endif; ?>

        <!-- Login Form -->
        <form method="POST" action="login.php?role=<?= htmlspecialchars($role) ?>" autocomplete="on">
            <input type="hidden" name="role" value="<?= htmlspecialchars($role) ?>">

            <div class="form-group">
                <label class="form-label" for="email">Email Address</label>
                <input class="form-input" type="email" id="email" name="email"
                       placeholder="your@email.com" required autocomplete="email"
                       value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <input class="form-input" type="password" id="password" name="password"
                       placeholder="••••••••" required autocomplete="current-password">
            </div>

            <button class="btn-submit" type="submit">
                Sign in as <?= htmlspecialchars(ucfirst($role)) ?> →
            </button>
        </form>

        <!-- Role Switcher -->
        <p class="role-switcher-label">Wrong role? Switch below:</p>
        <div class="role-switcher">
            <a href="login.php?role=mother" class="role-switch-btn <?= $role==='mother'?'active':'' ?>">
                <span class="icon">🤰</span>Mother
            </a>
            <a href="login.php?role=admin" class="role-switch-btn <?= $role==='admin'?'active':'' ?>">
                <span class="icon">📡</span>Admin
            </a>
            <a href="login.php?role=doctor" class="role-switch-btn <?= $role==='doctor'?'active':'' ?>">
                <span class="icon">🩺</span>Doctor
            </a>
            <a href="login.php?role=driver" class="role-switch-btn <?= $role==='driver'?'active':'' ?>">
                <span class="icon">🚑</span>Driver
            </a>
        </div>

        <!-- Register CTA (mothers only) -->
        <?php if ($cfg['register']): ?>
        <div class="register-cta">
            New expectant mother? <a href="register.php">Create account free →</a>
        </div>
        <?php endif; ?>

    </div>
</body>
</html>
