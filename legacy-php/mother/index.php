<?php
/**
 * MamaTrack GPS — Expectant Mother Dashboard
 */
require_once __DIR__ . '/../config/auth.php';

requireAuth(['mother']);

$user = getCurrentUser();
$profile = getMotherProfile($user['id']);

$weeks = getPregnancyWeeks($profile['pregnancy_start_date']);
$trimester = getTrimester($weeks);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mother Portal - MamaTrack GPS</title>
    <!-- CSS & PWA -->
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/mother.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0f172a">
    <link rel="apple-touch-icon" href="../assets/images/logo.png">
    
    <!-- Leaflet mapping library -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    
    <style>
        .pwa-install-banner {
            display: none;
            background: linear-gradient(135deg, var(--rose-600), var(--purple-600));
            padding: var(--space-md) var(--space-lg);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-lg);
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: white;
            box-shadow: var(--shadow-lg);
        }
    </style>
</head>
<body class="mother-theme">
    <div class="mother-bg"></div>

    <div class="dashboard-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <div class="logo-icon" style="background: rgba(244,114,182,0.15); color: var(--rose-400);">🤰</div>
                <div>
                    <h2>MamaTrack</h2>
                    <p>Mukono Maternal Support</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-item active" data-tab="emergency">
                        <span class="nav-icon">🚨</span>
                        <span>Emergency Center</span>
                    </div>
                    <div class="nav-item" data-tab="checkups">
                        <span class="nav-icon">📅</span>
                        <span>ANC Schedules</span>
                    </div>
                    <div class="nav-item" data-tab="anc-timeline">
                        <span class="nav-icon">🗓️</span>
                        <span>ANC Timeline</span>
                    </div>
                    <div class="nav-item" data-tab="profile">
                        <span class="nav-icon">👤</span>
                        <span>My Profile</span>
                    </div>
                </div>
            </nav>

            <div class="sidebar-user">
                <label style="cursor: pointer;" title="Change Profile Picture">
                    <input type="file" class="avatar-file-input" style="display:none;" accept="image/*">
                    <div class="user-avatar" style="position: relative; overflow: hidden; background: linear-gradient(135deg, var(--rose-400), var(--purple-400));">
                        <?php if (!empty($user['avatar']) && file_exists(__DIR__ . '/../uploads/avatars/' . $user['avatar'])): ?>
                            <img src="../uploads/avatars/<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                        <?php else: ?>
                            🤰
                        <?php endif; ?>
                    </div>
                </label>
                <div class="user-info">
                    <div class="user-name" style="display: flex; align-items: center; gap: 4px;">
                        <?= htmlspecialchars($user['full_name']) ?>
                        <span class="avatar-delete-btn" style="cursor: pointer; font-size: 0.9rem; display: <?php echo !empty($user['avatar']) ? 'inline-block' : 'none'; ?>;" title="Remove Profile Picture">🗑️</span>
                    </div>
                    <div class="user-role"><?= htmlspecialchars($trimester) ?></div>
                </div>
                <a href="../auth/logout.php" class="btn-logout" title="Sign Out">&#x23FB; Logout</a>
            </div>
        </aside>

        <!-- Main Workspace -->
        <main class="main-content">
            <!-- PWA install banner -->
            <div id="pwa-banner" class="pwa-install-banner">
                <div>📱 Add MamaTrack to your home screen for one-tap emergency access.</div>
                <button class="btn btn-sm btn-success" id="pwa-btn" style="box-shadow:none;">Install</button>
            </div>

            <header class="top-header">
                <div>
                    <h1>Maternal Emergency Hub</h1>
                    <p class="header-greeting">Welcome, <?= htmlspecialchars($user['full_name']) ?></p>
                </div>
                <button class="hamburger-btn">☰</button>
            </header>

            <!-- Tab Content 1: Emergency Center -->
            <div class="tab-content active" id="emergency">
                <div class="grid-2" style="grid-template-columns: 1fr 1.2fr;">
                    
                    <!-- Left: One tap trigger & ETA tracker -->
                    <div class="flex flex-col gap-lg">
                        <div class="card card-glass text-center">
                            <h2 class="mb-sm">Need Urgent Assistance?</h2>
                            <p class="text-secondary text-sm mb-lg">Press the button below. The system will dispatch the nearest ambulance driver and alert a specialist doctor at the receiving health facility.</p>
                            
                            <div class="emergency-trigger-wrapper">
                                <button class="emergency-btn" id="trigger-btn">
                                    <span class="btn-emoji">🆘</span>
                                    <span>Trigger Alert</span>
                                </button>
                                <div class="emergency-subtitle" id="trigger-subtitle">Tap to contact ambulance & hospital</div>
                            </div>
                        </div>

                        <!-- ETA display (Visible after emergency active) -->
                        <div class="card card-glass hidden" id="tracker-panel">
                            <div class="card-header">
                                <h3 class="card-title">🚨 Rescue Progress</h3>
                                <span class="badge badge-amber" id="rescue-status">Dispatched</span>
                            </div>
                            
                            <div class="status-tracker">
                                <div class="status-steps">
                                    <div class="status-step active">
                                        <div class="step-circle">🚨</div>
                                        <div class="step-label">Triggered</div>
                                    </div>
                                    <div class="status-step">
                                        <div class="step-circle">📞</div>
                                        <div class="step-label">Verified</div>
                                    </div>
                                    <div class="status-step">
                                        <div class="step-circle">🚑</div>
                                        <div class="step-label">Dispatched</div>
                                    </div>
                                    <div class="status-step">
                                        <div class="step-circle">🏥</div>
                                        <div class="step-label">At Hospital</div>
                                    </div>
                                </div>

                                <div class="nav-info-grid mt-lg">
                                    <div class="nav-info-item">
                                        <div class="nav-value" id="eta-display">Calculating...</div>
                                        <div class="nav-unit">Estimated ETA</div>
                                    </div>
                                    <div class="nav-info-item">
                                        <div class="nav-value" id="driver-name">Searching...</div>
                                        <div class="nav-unit">Ambulance Driver</div>
                                    </div>
                                    <div class="nav-info-item">
                                        <div class="nav-value" id="ambulance-plate">-</div>
                                        <div class="nav-unit">Plate No</div>
                                    </div>
                                </div>

                                <button class="cancel-alert-btn btn-block" id="cancel-btn">Cancel Emergency Request</button>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Live location and surrounding hospitals map -->
                    <div class="card card-glass flex flex-col gap-md">
                        <div class="card-header">
                            <h3 class="card-title">📍 Live Tracking Map</h3>
                            <span class="text-xs text-muted" id="gps-status">GPS Signal Active</span>
                        </div>
                        <div class="map-container full-height" id="mother-map"></div>
                    </div>

                </div>
            </div>

            <!-- Tab Content 2: ANC Checkups -->
            <div class="tab-content" id="checkups">
                <div class="grid-2">
                    
                    <!-- Left: Clinical Weeks Tracker -->
                    <div class="card card-glass pregnancy-tracker flex flex-col justify-between">
                        <div>
                            <h3 class="mb-md">Pregnancy Progress</h3>
                            <div class="pregnancy-weeks"><?= $weeks ?> Weeks</div>
                            <div class="pregnancy-trimester"><?= htmlspecialchars($trimester) ?></div>
                        </div>
                        <div class="mt-lg">
                            <div class="mb-sm text-sm text-secondary flex justify-between">
                                <span>Progress to Delivery</span>
                                <span><?= round(($weeks/40)*100) ?>%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: <?= min(($weeks/40)*100, 100) ?>%;"></div>
                            </div>
                            <div class="due-date-info">
                                <span>📅</span>
                                <span>Expected Due Date: <strong><?= date('M d, Y', strtotime($profile['expected_due_date'])) ?></strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: ANC Schedule list -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">Antenatal Care (ANC) Visits</h3>
                        <div id="checkups-list">
                            <!-- Populated dynamically or fallback list -->
                            <div class="empty-state">
                                <div class="empty-icon">📅</div>
                                <p>No checkup records found. Visit your nearest hospital to register an ANC checkup.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Tab Content: ANC Interactive Timeline -->
            <div class="tab-content" id="anc-timeline">
                <div class="card card-glass">
                    <div class="card-header">
                        <h3 class="card-title">🗓️ WHO ANC Progress Timeline</h3>
                        <span class="badge badge-rose"><?= $weeks ?> Weeks Pregnant</span>
                    </div>
                    <p class="text-sm text-secondary mb-lg">The World Health Organization recommends at least 8 antenatal care contacts. Track your progress below.</p>

                    <div id="anc-timeline-container" style="padding: var(--space-md) 0;">
                        <!-- Rendered by JS -->
                    </div>
                </div>
            </div>

            <!-- Tab Content 3: Profile Settings -->
            <div class="tab-content" id="profile">
                <div class="card card-glass" style="max-width: 600px; margin: 0 auto;">
                    <div class="profile-card">
                        <label style="cursor: pointer;" title="Click to change, Right-click to remove">
                            <input type="file" class="avatar-file-input" style="display:none;" accept="image/*">
                            <div class="profile-avatar-large" style="position: relative; overflow: hidden; background: <?php echo (!empty($user['avatar']) && file_exists(__DIR__ . '/../uploads/avatars/' . $user['avatar'])) ? 'none' : 'linear-gradient(135deg, #f472b6, #c084fc)'; ?>;">
                                <?php if (!empty($user['avatar']) && file_exists(__DIR__ . '/../uploads/avatars/' . $user['avatar'])): ?>
                                    <img src="../uploads/avatars/<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                                <?php else: ?>
                                    🤰
                                <?php endif; ?>
                            </div>
                        </label>
                        <button type="button" class="btn btn-sm btn-ghost avatar-delete-btn" style="margin-top: 5px; color: var(--danger-400); display: <?php echo !empty($user['avatar']) ? 'inline-block' : 'none'; ?>;">Remove Photo</button>
                        <p class="text-xs text-muted mt-xs" style="text-align:center;">Click to change · Right-click to remove</p>
                        <h2 class="profile-name"><?= htmlspecialchars($user['full_name']) ?></h2>
                        <p class="profile-id mb-lg">ID: MT-<?= str_pad($profile['id'], 5, '0', STR_PAD_LEFT) ?></p>
                    </div>

                    <form id="profile-form">
                        <input type="hidden" name="action" value="update_profile">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Sub-County</label>
                                <input class="form-input" type="text" name="sub_county" value="<?= htmlspecialchars($profile['sub_county']) ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Village / Ward</label>
                                <input class="form-input" type="text" name="village" value="<?= htmlspecialchars($profile['village']) ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Next of Kin Name</label>
                                <input class="form-input" type="text" name="next_of_kin_name" value="<?= htmlspecialchars($profile['next_of_kin_name']) ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Kin Relationship</label>
                                <input class="form-input" type="text" name="next_of_kin_relationship" value="<?= htmlspecialchars($profile['next_of_kin_relationship']) ?>">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Kin Phone Number</label>
                            <input class="form-input" type="tel" name="next_of_kin_phone" value="<?= htmlspecialchars($profile['next_of_kin_phone']) ?>">
                        </div>

                        <button class="btn btn-primary btn-block mt-md" type="submit">Update Profile</button>
                    </form>
                </div>
            </div>
        </main>
    </div>

    <!-- Bottom Navigation Bar for Mobile PWA Experience -->
    <div class="mobile-bottom-nav">
        <div class="nav-items">
            <div class="nav-item active" data-tab="emergency">
                <div class="nav-icon">🚨</div>
                <div>Emergency</div>
            </div>
            <div class="nav-item" data-tab="checkups">
                <div class="nav-icon">📅</div>
                <div>ANC Tracker</div>
            </div>
            <div class="nav-item" data-tab="profile">
                <div class="nav-icon">👤</div>
                <div>Profile</div>
            </div>
        </div>
    </div>

    <!-- Confirm Trigger Modal -->
    <div class="modal-overlay" id="confirm-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>Confirm Emergency Trigger</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p class="mb-md">Are you sure you want to trigger an emergency maternal response alert? This will immediately notify dispatchers and track your location.</p>
                <div class="form-group">
                    <label class="form-label">Any specific notes? (e.g. bleeding, severe headache, contractions)</label>
                    <textarea class="form-textarea" id="emergency-notes" placeholder="Optional notes..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label flex items-center gap-sm">
                        <input type="checkbox" id="require-cemonc">
                        <span>Require specialized surgical services (CEmONC)</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" id="confirm-cancel">Cancel</button>
                <button class="btn btn-danger" id="confirm-yes">Trigger Emergency</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../assets/js/dashboard.js"></script>
    <script src="../assets/js/notifications.js"></script>
    <script src="../assets/js/map.js"></script>
    <script src="../assets/js/emergency.js"></script>
    
    <script>
        // Tab routing in layout
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.tab;
                document.querySelectorAll('[data-tab]').forEach(item => {
                    if(item.dataset.tab === target) item.classList.add('active');
                    else item.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(tc => {
                    if(tc.id === target) tc.classList.add('active');
                    else tc.classList.remove('active');
                });
            });
        });

        // Map setup
        let liveLocation = null;
        let mapObj = null;

        document.addEventListener('DOMContentLoaded', async () => {
            mapObj = MapManager.init('mother-map');
            await MapManager.loadHospitals();

            // Locate Mother
            try {
                const pos = await MapManager.getCurrentPosition();
                liveLocation = pos;
                MapManager.flyTo(pos.lat, pos.lng, 14);
                MapManager.updateCurrentLocation(pos.lat, pos.lng);
                document.getElementById('gps-status').textContent = `Accuracy: ±${Math.round(pos.accuracy)}m`;
            } catch(e) {
                document.getElementById('gps-status').textContent = 'Signal Offline';
                console.warn(e);
            }

            // Start location watch
            MapManager.startLocationWatch((lat, lng, acc) => {
                liveLocation = { lat, lng, accuracy: acc };
                document.getElementById('gps-status').textContent = `Live Accuracy: ±${Math.round(acc)}m`;
            });

            // Load ANC list
            loadANCList();
        });

        // ANC List Loader
        async function loadANCList() {
            try {
                const res = await fetch(`../api/mothers.php?id=<?= $user['id'] ?>`);
                const data = await res.json();
                if(data.success && data.mother.checkups.length > 0) {
                    const listContainer = document.getElementById('checkups-list');
                    listContainer.innerHTML = '';
                    data.mother.checkups.forEach(c => {
                        const dateObj = new Date(c.checkup_date || c.scheduled_date);
                        const day = dateObj.getDate();
                        const month = dateObj.toLocaleString('default', { month: 'short' });
                        listContainer.innerHTML += `
                            <div class="checkup-item">
                                <div class="checkup-date">
                                    <div class="day">${day}</div>
                                    <div class="month">${month}</div>
                                </div>
                                <div class="checkup-info">
                                    <div class="checkup-type">${c.checkup_type}</div>
                                    <div class="checkup-hospital">District Facility</div>
                                </div>
                                <div class="checkup-time">${c.notes || 'Routine checkup'}</div>
                            </div>
                        `;
                    });
                    // Also render timeline
                    renderANCTimeline(data.mother.checkups);
                } else {
                    renderANCTimeline([]);
                }
            } catch(e) {
                console.warn('Failed to load checkups:', e);
                renderANCTimeline([]);
            }
        }

        // WHO ANC Timeline renderer — Interactive Version
        function renderANCTimeline(completedCheckups) {
            const currentWeeks = <?= $weeks ?>;
            const container = document.getElementById('anc-timeline-container');
            if (!container) return;

            const whoMilestones = [
                { visit: 1, weeks: '8-12',  minWeek: 8,  label: 'First ANC Contact',        desc: 'Blood tests, urine tests, weight & blood pressure. HIV & syphilis testing. Folic acid & iron prescribed. Dental review recommended.' },
                { visit: 2, weeks: '16',    minWeek: 16, label: 'Second ANC Visit',          desc: 'Blood pressure check, foetal movement assessment, folic acid & iron continued. Discuss birth plan options with your midwife.' },
                { visit: 3, weeks: '20',    minWeek: 20, label: 'Foetal Anomaly Scan',       desc: 'Ultrasound scan to check foetal growth, position and anatomy. Placenta position reviewed. Gender may be visible.' },
                { visit: 4, weeks: '24-26', minWeek: 24, label: 'Gestational Diabetes Test', desc: 'Glucose challenge test, anaemia screening, tetanus vaccination (TT2). Oedema assessment. Discuss warning signs.' },
                { visit: 5, weeks: '28',    minWeek: 28, label: 'Third Trimester Begins',    desc: 'Anti-D injection if Rh-negative. Review birth plan and hospital preferences. Iron & Vitamin D supplements reviewed.' },
                { visit: 6, weeks: '32',    minWeek: 32, label: 'Foetal Growth Review',      desc: 'Foetal position check, blood pressure, oedema assessment, iron & calcium. Kick count education. Discuss newborn care.' },
                { visit: 7, weeks: '36',    minWeek: 36, label: 'Pre-Labour Assessment',     desc: 'Baby\'s position confirmed (cephalic/breech). Birth plan finalized. Hospital bag checklist. Signs of labour reviewed.' },
                { visit: 8, weeks: '38-40', minWeek: 38, label: 'Final Check Before Birth',  desc: 'Full assessment. Membrane sweep may be offered. Labour signs explained. Emergency contacts confirmed.' },
            ];

            // Map visit types to completed checkups
            const doneVisits = new Set();
            completedCheckups.forEach((c, i) => {
                const t = (c.checkup_type || '').toLowerCase();
                if (t.includes('1st') || t.includes('anc 1') || t.includes('first')) doneVisits.add(1);
                else if (t.includes('2nd') || t.includes('anc 2') || t.includes('second')) doneVisits.add(2);
                else if (t.includes('3rd') || t.includes('anc 3') || t.includes('third')) doneVisits.add(3);
                else if (t.includes('4th') || t.includes('anc 4') || t.includes('fourth')) doneVisits.add(4);
                else if (t.includes('postnatal')) doneVisits.add(8);
                else doneVisits.add(Math.min(i + 1, 8));
            });

            // Progress summary
            const completedCount = doneVisits.size;
            const nextDue = whoMilestones.find(m => !doneVisits.has(m.visit) && currentWeeks >= m.minWeek);
            
            container.innerHTML = `
                <div style="background:linear-gradient(135deg,rgba(244,114,182,0.08),rgba(192,132,252,0.08)); border:1px solid rgba(244,114,182,0.2); border-radius:14px; padding:16px 20px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="font-size:2rem; font-weight:800; color:#f472b6; font-family:Outfit,sans-serif; line-height:1;">${completedCount}</div>
                        <div>
                            <div style="font-weight:700; color:#0f172a; font-size:0.9rem;">of 8 ANC visits completed</div>
                            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">WHO recommends at least 8 contacts</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        ${whoMilestones.map(m => {
                            const done = doneVisits.has(m.visit);
                            const curr = !done && currentWeeks >= m.minWeek;
                            return `<div title="Visit ${m.visit}" style="width:28px; height:8px; border-radius:4px; background:${done ? '#22c55e' : curr ? '#f59e0b' : '#e2e8f0'}; transition:all 0.3s;"></div>`;
                        }).join('')}
                    </div>
                    ${nextDue ? `<div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:6px 12px; font-size:0.78rem; font-weight:600; color:#92400e;">⚡ Visit ${nextDue.visit} Due at Week ${nextDue.weeks}</div>` : `<div style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:6px 12px; font-size:0.78rem; font-weight:600; color:#14532d;">🎉 All due visits completed!</div>`}
                </div>
                <div id="anc-visits-list"></div>
            `;

            const visitsList = container.querySelector('#anc-visits-list');
            
            whoMilestones.forEach((m, idx) => {
                const isDone = doneVisits.has(m.visit);
                const isCurrent = currentWeeks >= m.minWeek && !isDone && (idx === 0 || currentWeeks >= whoMilestones[idx - 1].minWeek);
                const isFuture = currentWeeks < m.minWeek;

                let statusColor = '#94a3b8';
                let statusIcon = '⬜';
                let statusLabel = 'Not yet due';
                let cardBg = '#f8fafc';
                let cardBorder = '#e2e8f0';
                let badgeClass = 'badge-gray';
                let dotBg = '#f1f5f9';

                if (isDone) {
                    statusColor = '#22c55e'; statusIcon = '✅'; statusLabel = 'Completed';
                    cardBg = 'rgba(34,197,94,0.04)'; cardBorder = '#22c55e'; badgeClass = 'badge-green'; dotBg = '#dcfce7';
                } else if (isCurrent) {
                    statusColor = '#f59e0b'; statusIcon = '📍'; statusLabel = 'Due Now';
                    cardBg = 'rgba(245,158,11,0.05)'; cardBorder = '#f59e0b'; badgeClass = 'badge-amber'; dotBg = '#fef3c7';
                } else if (!isFuture) {
                    statusColor = '#ef4444'; statusIcon = '⚠️'; statusLabel = 'Overdue';
                    cardBg = 'rgba(239,68,68,0.04)'; cardBorder = '#ef4444'; badgeClass = 'badge-red'; dotBg = '#fee2e2';
                }

                const visitId = `anc-visit-${m.visit}`;
                
                const item = document.createElement('div');
                item.style.cssText = 'display:flex; gap:16px; margin-bottom:16px; position:relative;';
                item.innerHTML = `
                    <!-- Timeline dot + line -->
                    <div style="display:flex; flex-direction:column; align-items:center; width:48px; flex-shrink:0;">
                        <div style="
                            width:44px; height:44px; border-radius:50%;
                            background:${dotBg}; border:3px solid ${statusColor};
                            display:flex; align-items:center; justify-content:center;
                            font-size:1.1rem; flex-shrink:0; cursor:pointer;
                            box-shadow:0 0 0 4px ${statusColor}20;
                            transition:all 0.2s;
                        " onclick="toggleVisit('${visitId}')">${statusIcon}</div>
                        ${idx < 7 ? `<div style="width:2px; flex:1; min-height:28px; background:linear-gradient(to bottom, ${statusColor}, #e2e8f0); margin-top:4px;"></div>` : ''}
                    </div>

                    <!-- Content card -->
                    <div style="flex:1; margin-bottom:4px;">
                        <div style="
                            background:${cardBg}; border:1.5px solid ${cardBorder};
                            border-radius:12px; overflow:hidden; transition:box-shadow 0.2s;
                        " id="${visitId}" class="anc-visit-card">
                            <!-- Card Header (clickable) -->
                            <div style="padding:12px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start;" onclick="toggleVisit('${visitId}')">
                                <div style="flex:1;">
                                    <div style="font-weight:700; font-size:0.9rem; color:#0f172a;">Visit ${m.visit}: ${m.label}</div>
                                    <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">⏱️ Week ${m.weeks}</div>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                                    <span class="badge ${badgeClass}">${statusLabel}</span>
                                    <span class="anc-chevron" style="font-size:0.75rem; color:#94a3b8; transition:transform 0.2s;">▼</span>
                                </div>
                            </div>
                            
                            <!-- Expandable Details -->
                            <div class="anc-details" style="max-height:0; overflow:hidden; transition:max-height 0.3s ease; border-top:1px solid ${cardBorder};">
                                <div style="padding:12px 16px 14px;">
                                    <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin:0 0 12px;">${m.desc}</p>
                                    ${isDone ? `<div style="display:inline-flex; align-items:center; gap:6px; background:#dcfce7; color:#15803d; padding:5px 12px; border-radius:8px; font-size:0.78rem; font-weight:600;">✅ Recorded in your ANC history</div>` : ''}
                                    ${isCurrent ? `<div style="display:inline-flex; align-items:center; gap:6px; background:#fef3c7; color:#92400e; padding:5px 12px; border-radius:8px; font-size:0.78rem; font-weight:600;">📍 Schedule your appointment now</div>` : ''}
                                    ${!isDone && !isFuture && !isCurrent ? `<div style="display:inline-flex; align-items:center; gap:6px; background:#fee2e2; color:#991b1b; padding:5px 12px; border-radius:8px; font-size:0.78rem; font-weight:600;">⚠️ This visit is overdue — please visit a health facility</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                visitsList.appendChild(item);
                
                // Auto-expand current visit
                if (isCurrent) {
                    setTimeout(() => toggleVisit(visitId, true), 200 + idx * 80);
                }
            });
        }

        function toggleVisit(id, forceOpen = false) {
            const card = document.getElementById(id);
            if (!card) return;
            const details = card.querySelector('.anc-details');
            const chevron = card.querySelector('.anc-chevron');
            const isOpen = details.style.maxHeight && details.style.maxHeight !== '0px';
            
            if (forceOpen || !isOpen) {
                details.style.maxHeight = '300px';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                details.style.maxHeight = '0';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        }


        // Trigger logic
        const triggerBtn = document.getElementById('trigger-btn');
        const confirmModal = document.getElementById('confirm-modal');
        
        triggerBtn.addEventListener('click', () => {
            DashboardUI.openModal('confirm-modal');
        });

        document.getElementById('confirm-cancel').addEventListener('click', () => {
            DashboardUI.closeModal('confirm-modal');
        });

        document.getElementById('confirm-yes').addEventListener('click', async () => {
            DashboardUI.closeModal('confirm-modal');
            DashboardUI.showLoading('Triggering emergency beacon...');
            
            // Get coordinates
            let coords = liveLocation;
            if(!coords) {
                try {
                    coords = await MapManager.getCurrentPosition();
                } catch(e) {
                    DashboardUI.hideLoading();
                    NotificationManager.show('GPS Error', 'Please enable Location access in your browser settings to trigger an emergency rescue.', 'danger');
                    return;
                }
            }

            const notes = document.getElementById('emergency-notes').value;
            const cemonc = document.getElementById('require-cemonc').checked;

            const res = await EmergencyManager.trigger({
                lat: coords.lat,
                lng: coords.lng,
                notes: notes,
                requireCemonc: cemonc
            });

            DashboardUI.hideLoading();

            if (res.success) {
                NotificationManager.show('Emergency Triggered', 'Rescue alert has been successfully broadcast to all nearby ambulances.', 'emergency');
                triggerBtn.classList.add('triggered');
                triggerBtn.querySelector('.btn-emoji').textContent = '🚨';
                triggerBtn.querySelector('span:last-child').textContent = 'Alert Sent';
                document.getElementById('trigger-subtitle').textContent = 'Tracking active. Keep this window open.';
                document.getElementById('tracker-panel').classList.remove('hidden');

                // Start polling & mapping live track
                MapManager.setMarker('mother_loc', coords.lat, coords.lng, 'emergency', 'My Location');
                MapManager.addEmergencyCircle(coords.lat, coords.lng);
                
                EmergencyManager.startStatusPolling(res.emergency.id, (emergency) => {
                    // Update tracking on map
                    if(emergency.driver_latitude && emergency.driver_longitude) {
                        MapManager.setMarker('driver_loc', emergency.driver_latitude, emergency.driver_longitude, 'ambulance', `Ambulance: ${emergency.driver_name}`);
                        MapManager.drawRoute(emergency.latitude, emergency.longitude, emergency.driver_latitude, emergency.driver_longitude);
                        document.getElementById('ambulance-plate').textContent = emergency.plate_number || 'En-Route';
                    }
                    
                    document.getElementById('rescue-status').textContent = emergency.status.toUpperCase();
                    
                    if(emergency.status === 'completed' || emergency.status === 'cancelled') {
                        location.reload();
                    }
                });
            } else {
                NotificationManager.show('Trigger Failed', res.error || 'Server error', 'danger');
            }
        });

        // Cancel request logic
        document.getElementById('cancel-btn').addEventListener('click', async () => {
            if(confirm('Are you sure you want to cancel this emergency rescue request?')) {
                DashboardUI.showLoading('Cancelling emergency request...');
                const emg = EmergencyManager.active;
                if(emg) {
                    const res = await EmergencyManager.cancel(emg.id, 'Cancelled by patient');
                    DashboardUI.hideLoading();
                    if(res.success) {
                        location.reload();
                    } else {
                        alert(res.error);
                    }
                }
            }
        });

        // Profile Form Submit
        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            DashboardUI.showLoading('Saving profile...');
            const fd = new FormData(e.target);
            const payload = {};
            fd.forEach((v, k) => payload[k] = v);

            const res = await fetch('../api/mothers.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            DashboardUI.hideLoading();
            if(data.success) {
                NotificationManager.show('Profile Updated', 'Your profile details have been saved successfully.', 'success');
            } else {
                NotificationManager.show('Error', data.error || 'Failed to update', 'danger');
            }
        });

        // Service Worker registration for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered successfully.', reg))
                .catch(err => console.warn('Service Worker registration failed.', err));

            // Custom install prompt
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('pwa-banner').style.display = 'flex';
            });

            document.getElementById('pwa-btn').addEventListener('click', () => {
                document.getElementById('pwa-banner').style.display = 'none';
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the PWA install prompt');
                        }
                        deferredPrompt = null;
                    });
                }
            });
        }
    </script>
</body>
</html>

