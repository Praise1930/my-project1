<?php
/**
 * MamaTrack GPS — Mother Registration Portal
 */
require_once __DIR__ . '/../config/auth.php';

$error = null;

if (isLoggedIn()) {
    header('Location: ../mother/index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'full_name' => trim($_POST['full_name'] ?? ''),
        'email' => trim($_POST['email'] ?? ''),
        'phone' => trim($_POST['phone'] ?? ''),
        'password' => trim($_POST['password'] ?? ''),
        'date_of_birth' => trim($_POST['date_of_birth'] ?? ''),
        'blood_type' => trim($_POST['blood_type'] ?? ''),
        'pregnancy_start_date' => trim($_POST['pregnancy_start_date'] ?? ''),
        'next_of_kin_name' => trim($_POST['nok_name'] ?? ''),
        'nok_phone' => trim($_POST['nok_phone'] ?? ''),
        'next_of_kin_relationship' => trim($_POST['nok_relationship'] ?? ''),
        'village' => trim($_POST['village'] ?? ''),
        'sub_county' => trim($_POST['sub_county'] ?? ''),
    ];

    if (!empty($data['full_name']) && !empty($data['email']) && !empty($data['phone']) && !empty($data['password']) && !empty($data['pregnancy_start_date'])) {
        $result = registerMother($data);
        if (isset($result['success'])) {
            header('Location: ../mother/index.php');
            exit;
        } else {
            $error = $result['error'];
        }
    } else {
        $error = "Please fill in all required fields (Name, Email, Phone, Password, and Pregnancy Start Date).";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mother Registration - MamaTrack GPS</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/mother.css">
    <style>
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e1e38 100%);
            padding: var(--space-xl) var(--space-md);
            min-height: 100vh;
        }
        .register-container {
            width: 100%;
            max-width: 600px;
        }
        .register-header {
            text-align: center;
            margin-bottom: var(--space-lg);
        }
        .register-logo {
            font-size: 2.5rem;
            margin-bottom: var(--space-xs);
        }
        .register-title {
            font-size: 1.75rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--rose-400), var(--primary-400));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body class="mother-bg">
    <div class="register-container">
        <div class="register-header">
            <div class="register-logo">🤰❤️</div>
            <h1 class="register-title">Register Portal</h1>
            <p class="text-secondary text-sm">Join the MamaTrack GPS emergency support network in Mukono District</p>
        </div>

        <div class="card card-glass">
            <h2 class="mb-lg text-center font-bold">Maternal Profile Registration</h2>
            
            <?php if ($error): ?>
                <div class="alert-banner danger">
                    <div>⚠️</div>
                    <div><?= htmlspecialchars($error) ?></div>
                </div>
            <?php endif; ?>

            <form action="register.php" method="POST">
                <h3 class="mb-md text-secondary" style="border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Personal Details</h3>
                <div class="form-group">
                    <label class="form-label" for="full_name">Full Name *</label>
                    <input class="form-input" type="text" id="full_name" name="full_name" required placeholder="e.g. Namono Sarah" value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="email">Email Address *</label>
                        <input class="form-input" type="email" id="email" name="email" required placeholder="name@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="phone">Phone Number *</label>
                        <input class="form-input" type="tel" id="phone" name="phone" required placeholder="e.g. 0770000000" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="password">Password *</label>
                        <input class="form-input" type="password" id="password" name="password" required placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="date_of_birth">Date of Birth</label>
                        <input class="form-input" type="date" id="date_of_birth" name="date_of_birth" value="<?= htmlspecialchars($_POST['date_of_birth'] ?? '') ?>">
                    </div>
                </div>

                <h3 class="mb-md mt-lg text-secondary" style="border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Clinical Details</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="pregnancy_start_date">L.M.P Date (Pregnancy Start Date) *</label>
                        <input class="form-input" type="date" id="pregnancy_start_date" name="pregnancy_start_date" required value="<?= htmlspecialchars($_POST['pregnancy_start_date'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="blood_type">Blood Type</label>
                        <select class="form-select" id="blood_type" name="blood_type">
                            <option value="">Select blood type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>
                </div>

                <h3 class="mb-md mt-lg text-secondary" style="border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Location & Next of Kin</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="sub_county">Sub-County</label>
                        <input class="form-input" type="text" id="sub_county" name="sub_county" placeholder="e.g. Goma" value="<?= htmlspecialchars($_POST['sub_county'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="village">Village / Ward</label>
                        <input class="form-input" type="text" id="village" name="village" placeholder="e.g. Seeta" value="<?= htmlspecialchars($_POST['village'] ?? '') ?>">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="nok_name">Next of Kin Name</label>
                        <input class="form-input" type="text" id="nok_name" name="nok_name" placeholder="e.g. Mukasa John" value="<?= htmlspecialchars($_POST['nok_name'] ?? '') ?>">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="nok_phone">Kin Phone</label>
                            <input class="form-input" type="tel" id="nok_phone" name="nok_phone" placeholder="e.g. 0700000000" value="<?= htmlspecialchars($_POST['nok_phone'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="nok_relationship">Relationship</label>
                            <input class="form-input" type="text" id="nok_relationship" name="nok_relationship" placeholder="e.g. Husband" value="<?= htmlspecialchars($_POST['nok_relationship'] ?? '') ?>">
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-block mt-lg" type="submit">Create Account</button>
            </form>

            <div class="mt-lg text-center text-sm">
                <span class="text-secondary">Already registered?</span>
                <a href="login.php" class="font-bold ml-xs">Sign In</a>
            </div>
        </div>
    </div>
</body>
</html>
