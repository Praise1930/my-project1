<?php
/**
 * MamaTrack GPS — Ambulance Driver & Navigation Portal
 */
require_once __DIR__ . '/../config/auth.php';

requireAuth(['driver']);

$user = getCurrentUser();
$pdo = getDBConnection();

// Fetch driver & vehicle details
$stmt = $pdo->prepare("SELECT d.*, v.plate_number, v.vehicle_type FROM drivers d LEFT JOIN vehicles v ON d.vehicle_id = v.id WHERE d.user_id = :uid");
$stmt->execute([':uid' => $user['id']]);
$driver = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ambulance Navigation - MamaTrack GPS</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/driver.css">
    
    <!-- Leaflet mapping library -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
        .checklist-item {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-md);
            border-radius: var(--radius-lg);
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--border-color);
            margin-bottom: var(--space-sm);
            cursor: pointer;
            transition: all 0.2s;
        }
        .checklist-item:hover { background: rgba(255,255,255,0.12); }
        .checklist-item input[type="checkbox"] {
            width: 18px; height: 18px; cursor: pointer;
            accent-color: var(--success-500);
        }
        .checklist-label { font-size: 0.9rem; font-weight: 500; flex: 1; }
        .checklist-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; }
        .fuel-level-selector { display: flex; gap: var(--space-sm); margin-top: var(--space-sm); }
        .fuel-btn {
            flex: 1; padding: var(--space-sm) var(--space-md);
            border-radius: var(--radius-lg); border: 2px solid var(--border-color);
            background: transparent; color: var(--text-primary); cursor: pointer;
            font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
        }
        .fuel-btn.selected { border-color: var(--success-500); background: rgba(34,197,94,0.15); color: var(--success-400); }
        .fuel-btn:hover { border-color: var(--primary-400); }
        .history-entry {
            padding: var(--space-sm) var(--space-md);
            border-left: 3px solid var(--primary-500);
            background: rgba(255,255,255,0.04);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
            margin-bottom: var(--space-sm);
        }
        .history-entry .entry-title { font-weight: 600; font-size: 0.88rem; }
        .history-entry .entry-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    </style>
</head>
<body class="driver-dashboard">
    <div class="driver-bg"></div>
    <div class="dashboard-layout">
        
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <div class="logo-icon" style="background: rgba(34,197,94,0.15); color: var(--success-400);">🚑</div>
                <div>
                    <h2>MamaTrack</h2>
                    <p>Ambulance Service</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-item active" data-tab="navigation-center">
                        <span class="nav-icon">🗺️</span>
                        <span>Navigation Hub</span>
                    </div>
                    <div class="nav-item" data-tab="pre-duty-tab">
                        <span class="nav-icon">🔧</span>
                        <span>Pre-Duty Checklist</span>
                    </div>
                    <div class="nav-item" data-tab="fuel-log-tab">
                        <span class="nav-icon">⛽</span>
                        <span>Fuel & Trip Logs</span>
                    </div>
                </div>
            </nav>

            <div class="sidebar-user">
                <label style="cursor: pointer;" title="Change Profile Picture">
                    <input type="file" class="avatar-file-input" style="display:none;" accept="image/*">
                    <div class="user-avatar" style="position: relative; overflow: hidden; background: linear-gradient(135deg, var(--warning-500), var(--primary-500));">
                        <?php if (!empty($user['avatar']) && file_exists(__DIR__ . '/../uploads/avatars/' . $user['avatar'])): ?>
                            <img src="../uploads/avatars/<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                        <?php else: ?>
                            <?= strtoupper(substr($user['full_name'], 0, 2)) ?>
                        <?php endif; ?>
                    </div>
                </label>
                <div class="user-info">
                    <div class="user-name" style="display: flex; align-items: center; gap: 4px;">
                        <?= htmlspecialchars($user['full_name']) ?>
                        <span class="avatar-delete-btn" style="cursor: pointer; font-size: 0.9rem; display: <?php echo !empty($user['avatar']) ? 'inline-block' : 'none'; ?>;" title="Remove Profile Picture">🗑️</span>
                    </div>
                    <div class="user-role" style="font-size:0.68rem; line-height:1.3; color:var(--success-400);"><?= htmlspecialchars($driver['driver_role'] ?? 'Emergency Driver') ?></div>
                </div>
                <a href="../auth/logout.php" class="btn-logout" title="Sign Out">&#x23FB; Logout</a>
            </div>
        </aside>

        <!-- Main Workspace -->
        <main class="main-content">
            <header class="top-header">
                <div>
                    <h1>Ambulance Console</h1>
                    <p class="header-greeting">Welcome, <strong><?= htmlspecialchars($user['full_name']) ?></strong> &nbsp;·&nbsp; Vehicle: <strong><?= htmlspecialchars($driver['plate_number'] ?? 'Unassigned') ?> (<?= htmlspecialchars($driver['vehicle_type'] ?? 'Basic') ?>)</strong> &nbsp;·&nbsp; <span style="color:var(--success-400); font-weight:600;"><?= htmlspecialchars($driver['driver_role'] ?? 'Emergency Driver') ?></span></p>
                </div>

                <div class="header-actions">
                    <!-- Duty Toggle Switch -->
                    <div class="duty-toggle-wrapper">
                        <label class="toggle-switch">
                            <input type="checkbox" id="duty-switch" <?= $driver['is_on_duty'] ? 'checked' : '' ?>>
                            <span class="toggle-slider"></span>
                        </label>
                        <div class="duty-toggle-info">
                            <div class="duty-status" id="duty-status-label"><?= $driver['is_on_duty'] ? 'ON DUTY' : 'OFF DUTY' ?></div>
                            <div class="duty-since">Transmitting live GPS</div>
                        </div>
                    </div>
                    <button class="hamburger-btn">☰</button>
                </div>
            </header>

            <!-- TAB 1: Navigation Hub -->
            <div class="tab-content active" id="navigation-center">
                <div class="grid-2" style="grid-template-columns: 1.2fr 1fr;">
                    
                    <!-- Left: Fullscreen Interactive Map -->
                    <div class="card card-glass flex flex-col gap-md">
                        <div class="card-header">
                            <h3 class="card-title">🗺️ OSRM Optimal Transit Navigation</h3>
                            <span class="text-xs text-muted" id="gps-accuracy">Syncing live location...</span>
                        </div>
                        <div class="map-container" id="driver-map" style="height: 480px;"></div>
                    </div>

                    <!-- Right: Active Assignment Panel -->
                    <div class="flex flex-col gap-lg">
                        
                        <!-- Assignment Card -->
                        <div class="card card-glass hidden" id="assignment-panel">
                            <div class="assignment-card">
                                <div class="assignment-header">
                                    <div class="assignment-icon">🆘</div>
                                    <div>
                                        <div class="assignment-title">Active Emergency Rescue</div>
                                        <div class="assignment-code" id="assignment-code">EMG-2026-0000</div>
                                    </div>
                                </div>

                                <div class="waypoint-list">
                                    <div class="waypoint-item">
                                        <div class="waypoint-dot pickup">1</div>
                                        <div class="waypoint-info">
                                            <div class="waypoint-label">Pick Up Patient</div>
                                            <div class="waypoint-address" id="pickup-name">Namono Sarah</div>
                                            <div class="waypoint-distance" id="pickup-phone">0770000000</div>
                                            <div class="text-xs text-muted mt-xs" id="pickup-notes">Notes: Severe labour pain</div>
                                        </div>
                                    </div>
                                    <div class="waypoint-item">
                                        <div class="waypoint-dot dropoff">2</div>
                                        <div class="waypoint-info">
                                            <div class="waypoint-label">Drop Off Facility</div>
                                            <div class="waypoint-address" id="dropoff-hospital">Mukono Health Centre IV</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Driver Action Buttons -->
                                <div class="driver-action-row" id="action-buttons-container">
                                    <!-- Populated based on active status -->
                                </div>
                            </div>
                        </div>

                        <!-- Fleet Metrics Card -->
                        <div class="card card-glass">
                            <h3 class="mb-md">Vehicle Fleet Metrics</h3>
                            <div class="vehicle-card" style="box-shadow:none; padding:0; border:none; background:none;">
                                <div class="vehicle-icon-large">🚑</div>
                                <div class="vehicle-detail">
                                    <div class="vehicle-plate"><?= htmlspecialchars($driver['plate_number'] ?? 'UG-0000M') ?></div>
                                    <div class="vehicle-type">Mukono Emergency Response Fleet</div>
                                    <div style="margin-top:6px;">
                                        <span style="background:linear-gradient(135deg,var(--success-600),var(--success-500)); color:white; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700; display:inline-block;">
                                            <?= htmlspecialchars($driver['driver_role'] ?? 'Primary Emergency Driver') ?>
                                        </span>
                                    </div>
                                    <div class="vehicle-metrics mt-sm">
                                        <div class="vehicle-metric">
                                            <div class="metric-value">Active</div>
                                            <div class="metric-label">Engine</div>
                                        </div>
                                        <div class="vehicle-metric" style="margin-left: var(--space-lg);">
                                            <div class="metric-value" id="gps-status-indicator">Connected</div>
                                            <div class="metric-label">GPS Link</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <!-- TAB 2: Pre-Duty Checklist -->
            <div class="tab-content" id="pre-duty-tab">
                <div class="grid-2">

                    <!-- Left: Checklist Form -->
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🔧 Vehicle Pre-Duty Inspection</h3>
                            <span class="badge badge-amber">Before Going On Duty</span>
                        </div>
                        <p class="text-sm text-secondary mb-lg">Complete this checklist before every shift. All items must pass before you go ON DUTY.</p>

                        <form id="inspection-form">
                            <div class="form-group mb-md">
                                <label class="form-label">🔋 Fuel Level *</label>
                                <div class="fuel-level-selector" id="fuel-level-selector">
                                    <button type="button" class="fuel-btn" data-val="full" onclick="selectFuelLevel(this)">⛽ Full</button>
                                    <button type="button" class="fuel-btn" data-val="half" onclick="selectFuelLevel(this)">🟡 Half</button>
                                    <button type="button" class="fuel-btn" data-val="low" onclick="selectFuelLevel(this)">🔴 Low</button>
                                </div>
                                <input type="hidden" id="insp-fuel-level" value="" required>
                            </div>

                            <label class="checklist-item" onclick="toggleCheck('insp-siren')">
                                <input type="checkbox" id="insp-siren">
                                <span class="checklist-label">🚨 Siren & Emergency Lights — Operational</span>
                                <span class="checklist-badge badge badge-green">Critical</span>
                            </label>
                            <label class="checklist-item" onclick="toggleCheck('insp-tires')">
                                <input type="checkbox" id="insp-tires">
                                <span class="checklist-label">🔄 All Tires — Good pressure, no damage</span>
                                <span class="checklist-badge badge badge-blue">Safety</span>
                            </label>
                            <label class="checklist-item" onclick="toggleCheck('insp-engine')">
                                <input type="checkbox" id="insp-engine">
                                <span class="checklist-label">🔧 Engine — Running cleanly, no warning lights</span>
                                <span class="checklist-badge badge badge-blue">Safety</span>
                            </label>
                            <label class="checklist-item" onclick="toggleCheck('insp-medical')">
                                <input type="checkbox" id="insp-medical">
                                <span class="checklist-label">🩺 Medical Equipment — Stocked & in good order</span>
                                <span class="checklist-badge badge badge-green">Critical</span>
                            </label>

                            <div id="inspection-status-msg" class="mt-md text-sm text-secondary"></div>

                            <button type="button" class="btn btn-success btn-block mt-lg" id="submit-inspection-btn" onclick="submitInspection()">
                                ✅ Submit Inspection & Go ON DUTY
                            </button>
                        </form>
                    </div>

                    <!-- Right: Inspection History -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">📋 Inspection History</h3>
                        <div id="inspection-history-list">
                            <div class="empty-state">
                                <div class="empty-icon">📋</div>
                                <p>No inspection records yet. Complete your first pre-duty check.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- TAB 3: Fuel & Trip Logs -->
            <div class="tab-content" id="fuel-log-tab">
                <div class="grid-2">

                    <!-- Left: Log Fuel Purchase -->
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">⛽ Log Fuel Purchase</h3>
                            <span class="badge badge-blue">Fleet Record</span>
                        </div>
                        <form id="fuel-log-form" class="dispatch-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="fuel-liters">Litres Purchased *</label>
                                    <input class="form-input" type="number" step="0.1" id="fuel-liters" name="liters" required placeholder="e.g. 45.5" min="1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="fuel-cost">Total Cost (UGX) *</label>
                                    <input class="form-input" type="number" id="fuel-cost" name="cost" required placeholder="e.g. 150000" min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="fuel-station">Fuel Station Name</label>
                                <input class="form-input" type="text" id="fuel-station" name="station" placeholder="e.g. Total Energies, Jinja Road">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Vehicle</label>
                                <input class="form-input" type="text" value="<?= htmlspecialchars($driver['plate_number'] ?? 'Unassigned') ?>" readonly style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                            </div>
                            <button class="btn btn-primary btn-block mt-md" type="submit">⛽ Record Fuel Purchase</button>
                        </form>
                    </div>

                    <!-- Right: Fuel & Trip History -->
                    <div class="card card-glass">
                        <div class="tab-nav" style="margin-bottom: var(--space-lg); background: rgba(255,255,255,0.05);">
                            <button class="tab-item active" id="log-fuel-btn" onclick="switchLog('fuel')">⛽ Fuel Logs</button>
                            <button class="tab-item" id="log-trip-btn" onclick="switchLog('trip')">🚑 Trip Logs</button>
                        </div>
                        <div id="fuel-history-view">
                            <div id="fuel-log-list">
                                <div class="empty-state"><div class="empty-icon">⛽</div><p>No fuel records yet.</p></div>
                            </div>
                        </div>
                        <div id="trip-history-view" style="display:none;">
                            <div id="trip-log-list">
                                <div class="empty-state"><div class="empty-icon">🚑</div><p>No completed trips yet.</p></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    </div>

    <!-- Scripts -->
    <script src="../assets/js/dashboard.js"></script>
    <script src="../assets/js/notifications.js"></script>
    <script src="../assets/js/map.js"></script>
    <script src="../assets/js/emergency.js"></script>

    <script>
        // Tab routing
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.tab;
                document.querySelectorAll('[data-tab]').forEach(i => i.classList.toggle('active', i.dataset.tab === target));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.toggle('active', tc.id === target));
                if(target === 'pre-duty-tab') loadInspectionHistory();
                if(target === 'fuel-log-tab') { loadFuelLogs(); loadTripLogs(); }
                if(target === 'navigation-center' && driverMap) { setTimeout(() => driverMap.invalidateSize(), 50); }
            });
        });

        let driverMap = null;
        let activeAssignment = null;
        let liveLocation = null;
        const DRIVER_ID = <?= (int)$user['id'] ?>;
        const VEHICLE_ID = <?= (int)($driver['vehicle_id'] ?? 0) ?>;

        document.addEventListener('DOMContentLoaded', () => {
            driverMap = MapManager.init('driver-map');
            MapManager.loadHospitals();

            DashboardUI.setupDutyToggle('../api/drivers.php');

            MapManager.startLocationWatch((lat, lng, accuracy) => {
                liveLocation = { lat, lng };
                document.getElementById('gps-accuracy').textContent = `Live GPS Accuracy: ±${Math.round(accuracy)}m`;
                transmitLiveLocation(lat, lng, accuracy);
                MapManager.updateCurrentLocation(lat, lng);
            }, (err) => {
                document.getElementById('gps-accuracy').textContent = `GPS Link Offline: ${err}`;
            });

            syncDriverAssignments();
            setInterval(syncDriverAssignments, 10000);
        });

        async function transmitLiveLocation(lat, lng, acc) {
            const payload = { latitude: lat, longitude: lng, accuracy: acc };
            if(activeAssignment) payload.emergency_id = activeAssignment.id;
            try {
                await fetch('../api/location.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
            } catch(e) { console.warn('GPS location upload failed:', e); }
        }

        async function syncDriverAssignments() {
            try {
                const [r1, r2, r3] = await Promise.all([
                    fetch('../api/emergency.php?status=dispatched').then(r => r.json()),
                    fetch('../api/emergency.php?status=en_route').then(r => r.json()),
                    fetch('../api/emergency.php?status=arrived').then(r => r.json()),
                ]);
                let currentCase = null;
                if(r1.success && r1.emergencies.length > 0) currentCase = r1.emergencies[0];
                else if(r2.success && r2.emergencies.length > 0) currentCase = r2.emergencies[0];
                else if(r3.success && r3.emergencies.length > 0) currentCase = r3.emergencies[0];

                const panel = document.getElementById('assignment-panel');
                if (currentCase) {
                    activeAssignment = currentCase;
                    document.getElementById('assignment-code').textContent = currentCase.code;
                    document.getElementById('pickup-name').textContent = currentCase.mother_name;
                    document.getElementById('pickup-phone').textContent = currentCase.mother_phone || 'Emergency Contact';
                    document.getElementById('pickup-notes').textContent = `Notes: ${currentCase.notes || 'No assessment report.'}`;
                    document.getElementById('dropoff-hospital').textContent = currentCase.hospital_name || 'Nearest CEmONC Hospital';
                    panel.classList.remove('hidden');
                    renderActionButtons(currentCase);
                    MapManager.setMarker('mother_target', currentCase.latitude, currentCase.longitude, 'mother', `Patient: ${currentCase.mother_name}`);
                    if(liveLocation) MapManager.drawRoute(liveLocation.lat, liveLocation.lng, currentCase.latitude, currentCase.longitude);
                    else MapManager.flyTo(currentCase.latitude, currentCase.longitude, 14);
                } else {
                    activeAssignment = null;
                    panel.classList.add('hidden');
                    MapManager.clearRoute();
                    MapManager.removeMarker('mother_target');
                }
            } catch(e) { console.warn(e); }
        }

        function renderActionButtons(emergency) {
            const container = document.getElementById('action-buttons-container');
            container.innerHTML = '';
            if (emergency.status === 'dispatched') {
                container.innerHTML = `<button class="arrived-btn" style="background: linear-gradient(135deg, var(--warning-600), var(--warning-500));" onclick="updateTripStatus('en_route')">🛣️ Start Rescue Journey</button>`;
            } else if (emergency.status === 'en_route') {
                container.innerHTML = `<button class="arrived-btn" onclick="updateTripStatus('arrived')">📍 Arrived at Patient Location</button>`;
            } else if (emergency.status === 'arrived') {
                container.innerHTML = `<button class="arrived-btn" style="background: linear-gradient(135deg, var(--primary-600), var(--primary-500));" onclick="updateTripStatus('completed')">🏥 Patient Safely Delivered to Health Facility</button>`;
            }
        }

        async function updateTripStatus(status) {
            if (!activeAssignment) return;
            let confirmMsg = 'Start the journey now?';
            if (status === 'arrived') confirmMsg = 'Confirm arrival at patient location?';
            if (status === 'completed') confirmMsg = 'Confirm patient safely delivered at clinical facility?';
            if(confirm(confirmMsg)) {
                DashboardUI.showLoading('Updating dispatch status...');
                const res = await EmergencyManager.updateStatus(activeAssignment.id, status);
                DashboardUI.hideLoading();
                if(res.success) {
                    NotificationManager.show('Status Updated', `Trip status changed to ${status.replace('_', ' ')}.`, 'success');
                    syncDriverAssignments();
                } else { alert(res.error); }
            }
        }

        // ============================================================
        // PRE-DUTY INSPECTION
        // ============================================================
        let selectedFuelLevel = '';

        function selectFuelLevel(btn) {
            document.querySelectorAll('.fuel-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedFuelLevel = btn.dataset.val;
            document.getElementById('insp-fuel-level').value = selectedFuelLevel;
        }

        function toggleCheck(id) {
            // Let native checkbox handle it, just update status
            updateInspectionStatus();
        }

        function updateInspectionStatus() {
            const checks = ['insp-siren','insp-tires','insp-engine','insp-medical'];
            const passed = checks.filter(id => document.getElementById(id).checked).length;
            const msg = document.getElementById('inspection-status-msg');
            msg.textContent = `${passed}/${checks.length} checks passed.`;
            msg.style.color = passed === checks.length ? 'var(--success-400)' : 'var(--warning-400)';
        }

        ['insp-siren','insp-tires','insp-engine','insp-medical'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('change', updateInspectionStatus);
        });

        async function submitInspection() {
            const checks = ['insp-siren','insp-tires','insp-engine','insp-medical'];
            const allChecked = checks.every(id => document.getElementById(id).checked);
            if(!selectedFuelLevel) { NotificationManager.show('Missing Info', 'Please select a fuel level.', 'danger'); return; }
            if(!allChecked) {
                if(!confirm('Not all checks are passed. Submit anyway?')) return;
            }
            const payload = {
                fuel_level: selectedFuelLevel,
                siren_ok: document.getElementById('insp-siren').checked ? 1 : 0,
                tires_ok: document.getElementById('insp-tires').checked ? 1 : 0,
                engine_ok: document.getElementById('insp-engine').checked ? 1 : 0,
                medical_checked: document.getElementById('insp-medical').checked ? 1 : 0
            };
            DashboardUI.showLoading('Submitting pre-duty inspection...');
            try {
                const res = await fetch('../api/inspections.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    NotificationManager.show('Inspection Logged', 'Pre-duty checklist submitted. You may now go ON DUTY.', 'success');
                    // Auto-set duty on
                    const dutySwitch = document.getElementById('duty-switch');
                    if(!dutySwitch.checked) { dutySwitch.checked = true; dutySwitch.dispatchEvent(new Event('change')); }
                    loadInspectionHistory();
                } else { NotificationManager.show('Failed', data.error || 'Could not log inspection.', 'danger'); }
            } catch(e) { DashboardUI.hideLoading(); }
        }

        async function loadInspectionHistory() {
            const list = document.getElementById('inspection-history-list');
            try {
                const res = await fetch('../api/inspections.php');
                const data = await res.json();
                if(data.success && data.inspections.length > 0) {
                    list.innerHTML = '';
                    data.inspections.forEach(ins => {
                        const date = new Date(ins.checked_at).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
                        const checks = [
                            ins.siren_ok ? '✅ Siren' : '❌ Siren',
                            ins.tires_ok ? '✅ Tires' : '❌ Tires',
                            ins.engine_ok ? '✅ Engine' : '❌ Engine',
                            ins.medical_checked ? '✅ Medical' : '❌ Medical',
                        ];
                        list.innerHTML += `
                            <div class="history-entry">
                                <div class="entry-title">⛽ Fuel: <strong>${ins.fuel_level}</strong> · ${date}</div>
                                <div class="entry-meta">${checks.join(' · ')}</div>
                            </div>`;
                    });
                } else {
                    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No inspection records yet.</p></div>';
                }
            } catch(e) { console.warn(e); }
        }

        // ============================================================
        // FUEL LOGS
        // ============================================================
        document.getElementById('fuel-log-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {};
            fd.forEach((v,k) => { if(v !== '') payload[k] = v; });
            DashboardUI.showLoading('Recording fuel purchase...');
            try {
                const res = await fetch('../api/fuel_logs.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    NotificationManager.show('Fuel Logged', `Purchase of ${payload.liters}L recorded.`, 'success');
                    e.target.reset();
                    loadFuelLogs();
                } else { NotificationManager.show('Failed', data.error || 'Could not log fuel purchase.', 'danger'); }
            } catch(e) { DashboardUI.hideLoading(); }
        });

        async function loadFuelLogs() {
            const list = document.getElementById('fuel-log-list');
            try {
                const res = await fetch('../api/fuel_logs.php');
                const data = await res.json();
                if(data.success && data.fuel_logs.length > 0) {
                    list.innerHTML = '';
                    data.fuel_logs.forEach(f => {
                        const date = new Date(f.logged_at).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
                        list.innerHTML += `
                            <div class="history-entry">
                                <div class="entry-title">⛽ ${f.liters}L — UGX ${Number(f.cost).toLocaleString()}</div>
                                <div class="entry-meta">📍 ${f.station || 'Unknown Station'} · ${date}</div>
                            </div>`;
                    });
                } else { list.innerHTML = '<div class="empty-state"><div class="empty-icon">⛽</div><p>No fuel records yet.</p></div>'; }
            } catch(e) { console.warn(e); }
        }

        async function loadTripLogs() {
            const list = document.getElementById('trip-log-list');
            try {
                const res = await fetch('../api/emergency.php?status=completed');
                const data = await res.json();
                if(data.success && data.emergencies.length > 0) {
                    list.innerHTML = '';
                    data.emergencies.forEach(t => {
                        const date = new Date(t.created_at).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
                        list.innerHTML += `
                            <div class="history-entry" style="border-left-color: var(--success-500);">
                                <div class="entry-title">🚑 ${t.code} — ${t.mother_name}</div>
                                <div class="entry-meta">🏥 ${t.hospital_name || 'Unknown'} · ${date}</div>
                            </div>`;
                    });
                } else { list.innerHTML = '<div class="empty-state"><div class="empty-icon">🚑</div><p>No completed trips yet.</p></div>'; }
            } catch(e) { console.warn(e); }
        }

        function switchLog(type) {
            document.getElementById('log-fuel-btn').classList.toggle('active', type === 'fuel');
            document.getElementById('log-trip-btn').classList.toggle('active', type === 'trip');
            document.getElementById('fuel-history-view').style.display = type === 'fuel' ? 'block' : 'none';
            document.getElementById('trip-history-view').style.display = type === 'trip' ? 'block' : 'none';
        }
    </script>
</body>
</html>

