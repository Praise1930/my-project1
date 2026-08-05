<?php
/**
 * MamaTrack GPS — Role Selection Landing Page
 */
require_once __DIR__ . '/config/auth.php';

if (isLoggedIn()) {
    $role = $_SESSION['user_role'];
    if ($role === 'mother') header('Location: mother/index.php');
    elseif ($role === 'admin') header('Location: admin/index.php');
    elseif ($role === 'doctor') header('Location: doctor/index.php');
    elseif ($role === 'driver') header('Location: driver/index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MamaTrack GPS — Mukono Maternal Emergency Response System</title>
    <meta name="description" content="GPS-based maternal emergency response system for Mukono District, Uganda.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --rose:    #f43f5e;
            --rose-d:  #be123c;
            --blue:    #3b82f6;
            --blue-d:  #1d4ed8;
            --green:   #10b981;
            --green-d: #065f46;
            --amber:   #f59e0b;
            --amber-d: #92400e;
            --purple:  #8b5cf6;
            --bg:      #060b18;
            --surface: rgba(255,255,255,0.04);
            --border:  rgba(255,255,255,0.08);
            --text:    #f1f5f9;
            --muted:   #94a3b8;
        }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ── Animated background ── */
        .bg-orbs {
            position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }
        .orb {
            position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.18; animation: drift 18s ease-in-out infinite alternate;
        }
        .orb-1 { width: 520px; height: 520px; background: var(--rose);   top: -120px; left: -100px; animation-delay: 0s; }
        .orb-2 { width: 400px; height: 400px; background: var(--blue);   bottom: -80px; right: -80px; animation-delay: -6s; }
        .orb-3 { width: 300px; height: 300px; background: var(--purple); top: 40%; left: 50%; transform: translate(-50%,-50%); animation-delay: -12s; }

        @keyframes drift {
            0%   { transform: translate(0,0) scale(1); }
            100% { transform: translate(40px, 30px) scale(1.08); }
        }

        /* ── Layout ── */
        .wrapper {
            position: relative; z-index: 1;
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center;
            padding: 2rem 1.5rem 4rem;
        }

        /* ── Header ── */
        .site-header {
            width: 100%; max-width: 1100px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 0 2.5rem;
        }
        .logo {
            display: flex; align-items: center; gap: 0.6rem;
            font-weight: 800; font-size: 1.1rem; letter-spacing: -0.02em;
        }
        .logo-icon { font-size: 1.6rem; }
        .logo-text span { color: var(--rose); }
        .header-badge {
            background: rgba(244,63,94,0.12);
            border: 1px solid rgba(244,63,94,0.25);
            color: var(--rose);
            border-radius: 999px;
            padding: 0.3rem 0.9rem;
            font-size: 0.75rem; font-weight: 600;
            letter-spacing: 0.04em;
        }

        /* ── Hero text ── */
        .hero {
            text-align: center;
            max-width: 680px;
            margin-bottom: 3.5rem;
        }
        .hero-eyebrow {
            display: inline-flex; align-items: center; gap: 0.5rem;
            background: rgba(139,92,246,0.12);
            border: 1px solid rgba(139,92,246,0.25);
            border-radius: 999px;
            padding: 0.35rem 1rem;
            font-size: 0.78rem; font-weight: 600; color: #a78bfa;
            margin-bottom: 1.2rem;
        }
        .hero h1 {
            font-size: clamp(2.2rem, 5vw, 3.4rem);
            font-weight: 900;
            line-height: 1.08;
            letter-spacing: -0.03em;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #f9fafb 0%, #f43f5e 40%, #8b5cf6 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero p {
            font-size: 1.05rem; color: var(--muted); line-height: 1.7;
        }

        /* ── Role Cards ── */
        .roles-heading {
            text-align: center;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 1.5rem;
        }

        .roles-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
            width: 100%; max-width: 1000px;
            margin-bottom: 3rem;
        }

        .role-card {
            position: relative;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 1.25rem;
            padding: 2rem 1.5rem 1.75rem;
            text-decoration: none;
            color: var(--text);
            cursor: pointer;
            transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
            overflow: hidden;
            display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .role-card::before {
            content: '';
            position: absolute; inset: 0;
            background: var(--card-glow);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .role-card:hover { transform: translateY(-6px); }
        .role-card:hover::before { opacity: 1; }

        /* Per-role glow & accent colours */
        .role-card.mother   { --card-glow: radial-gradient(ellipse at top left, rgba(244,63,94,0.12), transparent 70%); }
        .role-card.admin    { --card-glow: radial-gradient(ellipse at top left, rgba(59,130,246,0.12), transparent 70%); }
        .role-card.doctor   { --card-glow: radial-gradient(ellipse at top left, rgba(16,185,129,0.12), transparent 70%); }
        .role-card.driver   { --card-glow: radial-gradient(ellipse at top left, rgba(245,158,11,0.12), transparent 70%); }

        .role-card.mother:hover  { border-color: rgba(244,63,94,0.5);  box-shadow: 0 20px 60px rgba(244,63,94,0.2); }
        .role-card.admin:hover   { border-color: rgba(59,130,246,0.5); box-shadow: 0 20px 60px rgba(59,130,246,0.2); }
        .role-card.doctor:hover  { border-color: rgba(16,185,129,0.5); box-shadow: 0 20px 60px rgba(16,185,129,0.2); }
        .role-card.driver:hover  { border-color: rgba(245,158,11,0.5); box-shadow: 0 20px 60px rgba(245,158,11,0.2); }

        .role-icon-wrap {
            width: 72px; height: 72px;
            border-radius: 1.1rem;
            display: flex; align-items: center; justify-content: center;
            font-size: 2.2rem;
            margin-bottom: 1.2rem;
            position: relative; z-index: 1;
        }
        .mother .role-icon-wrap  { background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.25); }
        .admin  .role-icon-wrap  { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.25); }
        .doctor .role-icon-wrap  { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.25); }
        .driver .role-icon-wrap  { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.25); }

        .role-title {
            font-size: 1.15rem; font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 0.4rem;
            position: relative; z-index: 1;
        }
        .mother .role-title  { color: #fb7185; }
        .admin  .role-title  { color: #60a5fa; }
        .doctor .role-title  { color: #34d399; }
        .driver .role-title  { color: #fbbf24; }

        .role-subtitle {
            font-size: 0.8rem; color: var(--muted);
            line-height: 1.5; margin-bottom: 1.5rem;
            position: relative; z-index: 1;
        }

        .role-btn {
            display: inline-flex; align-items: center; gap: 0.4rem;
            padding: 0.55rem 1.3rem;
            border-radius: 999px;
            font-size: 0.82rem; font-weight: 700;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative; z-index: 1;
            border: none;
        }
        .role-card:hover .role-btn { transform: scale(1.04); }
        .mother .role-btn  { background: var(--rose);   color: #fff; box-shadow: 0 4px 20px rgba(244,63,94,0.4); }
        .admin  .role-btn  { background: var(--blue);   color: #fff; box-shadow: 0 4px 20px rgba(59,130,246,0.4); }
        .doctor .role-btn  { background: var(--green);  color: #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
        .driver .role-btn  { background: var(--amber);  color: #000; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }

        /* ── Features row ── */
        .features-row {
            display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;
            max-width: 820px; margin-bottom: 3rem;
        }
        .feat {
            display: flex; align-items: center; gap: 0.65rem;
            font-size: 0.82rem; color: var(--muted);
        }
        .feat-dot {
            width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .feat-dot.rose   { background: var(--rose); }
        .feat-dot.blue   { background: var(--blue); }
        .feat-dot.green  { background: var(--green); }

        /* ── Register strip ── */
        .register-strip {
            background: rgba(244,63,94,0.06);
            border: 1px solid rgba(244,63,94,0.15);
            border-radius: 1rem;
            padding: 1.1rem 2rem;
            display: flex; align-items: center; gap: 1.2rem;
            max-width: 560px; width: 100%;
            margin-bottom: 2.5rem;
        }
        .register-strip-icon { font-size: 1.8rem; }
        .register-strip-text { flex: 1; }
        .register-strip-text strong { font-size: 0.92rem; display: block; margin-bottom: 0.15rem; }
        .register-strip-text span { font-size: 0.78rem; color: var(--muted); }
        .register-strip a {
            background: var(--rose);
            color: #fff;
            padding: 0.55rem 1.2rem;
            border-radius: 999px;
            font-size: 0.82rem; font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
            transition: opacity 0.2s;
        }
        .register-strip a:hover { opacity: 0.88; }

        /* ── Footer ── */
        .site-footer {
            font-size: 0.75rem; color: var(--muted);
            text-align: center;
            border-top: 1px solid var(--border);
            padding-top: 1.5rem;
            width: 100%; max-width: 1000px;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
            .roles-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
            .roles-grid { grid-template-columns: 1fr 1fr; gap: 0.85rem; }
            .role-card { padding: 1.4rem 1rem; }
            .role-icon-wrap { width: 56px; height: 56px; font-size: 1.7rem; }
            .role-title { font-size: 1rem; }
            .header-badge { display: none; }
        }
    </style>
</head>
<body>

<div class="bg-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
</div>

<div class="wrapper">

    <!-- Header -->
    <header class="site-header">
        <div class="logo">
            <span class="logo-icon">🚑</span>
            <span class="logo-text">Mama<span>Track</span> GPS</span>
        </div>
        <div class="header-badge">🛰️ Live System</div>
    </header>

    <!-- Hero -->
    <div class="hero">
        <div class="hero-eyebrow">
            <span>📍</span> Mukono District, Uganda
        </div>
        <h1>Maternal Emergency<br>Response, Reimagined</h1>
        <p>A GPS-powered dispatch platform connecting expectant mothers, ambulance drivers, clinical doctors, and emergency administrators — in real time.</p>
    </div>

    <!-- Role Selection -->
    <p class="roles-heading">Select your role to continue</p>

    <div class="roles-grid">

        <!-- Mother -->
        <a href="auth/login.php?role=mother" class="role-card mother" id="card-mother">
            <div class="role-icon-wrap">🤰</div>
            <div class="role-title">Mother</div>
            <p class="role-subtitle">Trigger emergency alerts and track your rescue in real time</p>
            <span class="role-btn">Enter Portal →</span>
        </a>

        <!-- Admin -->
        <a href="auth/login.php?role=admin" class="role-card admin" id="card-admin">
            <div class="role-icon-wrap">📡</div>
            <div class="role-title">Admin</div>
            <p class="role-subtitle">Manage dispatch, monitor all emergencies, and oversee resources</p>
            <span class="role-btn">Command Center →</span>
        </a>

        <!-- Doctor -->
        <a href="auth/login.php?role=doctor" class="role-card doctor" id="card-doctor">
            <div class="role-icon-wrap">🩺</div>
            <div class="role-title">Doctor</div>
            <p class="role-subtitle">Receive incoming patient details and manage clinical readiness</p>
            <span class="role-btn">Clinical Console →</span>
        </a>

        <!-- Driver -->
        <a href="auth/login.php?role=driver" class="role-card driver" id="card-driver">
            <div class="role-icon-wrap">🚑</div>
            <div class="role-title">Driver</div>
            <p class="role-subtitle">Navigate to patients and update rescue status on the go</p>
            <span class="role-btn">Navigation →</span>
        </a>

    </div>

    <!-- Features row -->
    <div class="features-row">
        <div class="feat"><div class="feat-dot rose"></div> One-tap emergency trigger</div>
        <div class="feat"><div class="feat-dot blue"></div> Live GPS tracking</div>
        <div class="feat"><div class="feat-dot green"></div> CEmONC hospital matching</div>
        <div class="feat"><div class="feat-dot rose"></div> Works offline (PWA)</div>
        <div class="feat"><div class="feat-dot blue"></div> Role-based dashboards</div>
        <div class="feat"><div class="feat-dot green"></div> Instant notifications</div>
    </div>

    <!-- Register strip -->
    <div class="register-strip">
        <div class="register-strip-icon">🤱</div>
        <div class="register-strip-text">
            <strong>New expectant mother?</strong>
            <span>Create a free account and install MamaTrack on your phone</span>
        </div>
        <a href="auth/register.php">Register Free</a>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
        © 2026 MamaTrack GPS &nbsp;•&nbsp; Designed for Mukono District, Uganda &nbsp;•&nbsp; All emergencies logged and monitored
    </footer>

</div>

<script>
    // Add subtle pulse animation to cards on load
    document.querySelectorAll('.role-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.1}s`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.25s ease, box-shadow 0.25s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + i * 120);
    });
</script>
</body>
</html>
