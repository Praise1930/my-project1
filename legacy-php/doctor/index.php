<?php
/**
 * MamaTrack GPS — Doctor Portal / Clinical Command
 */
require_once __DIR__ . '/../config/auth.php';

requireAuth(['doctor']);

$user = getCurrentUser();
$pdo = getDBConnection();

// Fetch doctor details
$stmt = $pdo->prepare("SELECT d.*, h.name as hospital_name, h.available_beds, h.total_beds FROM doctors d JOIN hospitals h ON d.hospital_id = h.id WHERE d.user_id = :uid");
$stmt->execute([':uid' => $user['id']]);
$doctor = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinical Console - MamaTrack GPS</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/doctor.css">
    
    <!-- Leaflet mapping library -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
        .bed-counter {
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            padding: var(--space-lg);
            background: rgba(255,255,255,0.05);
            border-radius: var(--radius-xl);
            border: 1px solid var(--border-color);
        }
        .bed-count-display {
            font-size: 3rem;
            font-weight: 800;
            color: var(--success-400);
            line-height: 1;
            min-width: 80px;
            text-align: center;
        }
        .bed-count-display.low { color: var(--warning-400); }
        .bed-count-display.critical { color: var(--danger-400); }
        .bed-count-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
        .bed-btn {
            width: 48px; height: 48px; border-radius: 50%;
            border: 2px solid var(--border-color); font-size: 1.5rem;
            background: rgba(255,255,255,0.08); cursor: pointer;
            transition: all 0.2s; display: flex; align-items: center; justify-content: center;
            color: var(--text-primary);
        }
        .bed-btn:hover { transform: scale(1.1); }
        .bed-btn.inc { border-color: var(--success-500); color: var(--success-400); }
        .bed-btn.inc:hover { background: rgba(34,197,94,0.2); }
        .bed-btn.dec { border-color: var(--danger-500); color: var(--danger-400); }
        .bed-btn.dec:hover { background: rgba(239,68,68,0.2); }
        .clinical-entry {
            padding: var(--space-md);
            border-radius: var(--radius-lg);
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border-color);
            margin-bottom: var(--space-sm);
        }
        .clinical-entry-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: var(--space-xs);
        }
        .clinical-entry-title { font-weight: 600; font-size: 0.9rem; }
        .clinical-entry-meta { font-size: 0.75rem; color: var(--text-muted); }
    </style>
</head>
<body>
    <div class="doctor-bg"></div>

    <div class="dashboard-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <div class="logo-icon" style="background: rgba(168,85,247,0.15); color: var(--purple-400);">👨‍⚕️</div>
                <div>
                    <h2>MamaTrack</h2>
                    <p>Clinical Console</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-item active" data-tab="clinical-board">
                        <span class="nav-icon">🏥</span>
                        <span>Clinical Center</span>
                    </div>
                    <div class="nav-item" data-tab="mothers-list">
                        <span class="nav-icon">🤰</span>
                        <span>Maternal Directory</span>
                    </div>
                    <div class="nav-item" data-tab="clinical-tools">
                        <span class="nav-icon">🩺</span>
                        <span>Clinical Tools</span>
                    </div>
                    <div class="nav-item" data-tab="assessments-log">
                        <span class="nav-icon">📋</span>
                        <span>Assessment Logs</span>
                    </div>
                </div>
            </nav>

            <div class="sidebar-user">
                <label style="cursor: pointer;" title="Change Profile Picture">
                    <input type="file" class="avatar-file-input" style="display:none;" accept="image/*">
                    <div class="user-avatar" style="position: relative; overflow: hidden; background: linear-gradient(135deg, var(--primary-500), var(--success-500));">
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
                    <div class="user-role"><?= htmlspecialchars($doctor['hospital_name']) ?></div>
                </div>
                <a href="../auth/logout.php" class="btn-logout" title="Sign Out">&#x23FB; Logout</a>
            </div>
        </aside>

        <!-- Main Workspace -->
        <main class="main-content">
            <header class="top-header">
                <div>
                    <h1>Clinical Console</h1>
                    <p class="header-greeting">Welcome, Dr. <strong><?= htmlspecialchars($user['full_name']) ?></strong> &nbsp;·&nbsp; Facility: <strong><?= htmlspecialchars($doctor['hospital_name']) ?></strong></p>
                </div>
                
                <div class="header-actions">
                    <!-- Duty Toggle Switch -->
                    <div class="duty-toggle-wrapper">
                        <label class="toggle-switch">
                            <input type="checkbox" id="duty-switch" <?= $doctor['is_on_duty'] ? 'checked' : '' ?>>
                            <span class="toggle-slider"></span>
                        </label>
                        <div class="duty-toggle-info">
                            <div class="duty-status" id="duty-status-label"><?= $doctor['is_on_duty'] ? 'ON DUTY' : 'OFF DUTY' ?></div>
                            <div class="duty-since">Receiving emergency alerts</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-ghost" onclick="openBloodRequestModal()" title="Request Blood">🩸 Blood Request</button>
                    <button class="hamburger-btn">☰</button>
                </div>
            </header>

            <!-- TAB 1: Clinical Board -->
            <div class="tab-content active" id="clinical-board">
                <!-- Incoming Rescues Alert -->
                <div class="incoming-emergency hidden" id="incoming-alert-banner">
                    <div class="emergency-pulse-icon">🚨</div>
                    <div class="emergency-info">
                        <div class="emergency-title">INCOMING RESCUE PATIENT</div>
                        <div class="emergency-details">
                            <span id="alert-patient-name">Patient: Sarah Namono</span>
                            <span id="alert-eta">ETA: 14 mins away</span>
                            <span id="alert-clinical-notes">Notes: Bleeding</span>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap: var(--space-sm);">
                        <button class="btn btn-primary" id="view-transit-btn">Track Transit</button>
                        <button class="btn btn-success btn-sm" id="open-intake-btn">📋 Log Intake</button>
                    </div>
                </div>

                <div class="grid-2" style="grid-template-columns: 1.2fr 1fr;">
                    
                    <!-- Left: Interactive Tracking Map -->
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🗺️ Transit Track Console</h3>
                            <span class="badge badge-rose" id="transit-tag">Facility Live</span>
                        </div>
                        <div class="map-container" id="doctor-map" style="height: 450px;"></div>
                    </div>

                    <!-- Right: Patient Profile and Bed Management -->
                    <div class="flex flex-col gap-md">
                        <!-- Bed Management Card -->
                        <div class="card card-glass">
                            <div class="card-header">
                                <h3 class="card-title">🛏️ Bed Capacity Manager</h3>
                                <span class="badge badge-blue"><?= htmlspecialchars($doctor['hospital_name']) ?></span>
                            </div>
                            <div class="bed-counter">
                                <button class="bed-btn dec" onclick="adjustBeds(-1)" title="Bed Occupied">−</button>
                                <div style="text-align:center; flex:1;">
                                    <div class="bed-count-display" id="available-beds-count"><?= (int)($doctor['available_beds'] ?? 0) ?></div>
                                    <div class="bed-count-label">Available of <strong id="total-beds-display"><?= (int)($doctor['total_beds'] ?? 0) ?></strong> total beds</div>
                                </div>
                                <button class="bed-btn inc" onclick="adjustBeds(1)" title="Bed Freed">+</button>
                            </div>
                            <p class="text-xs text-muted mt-sm">Click <strong>−</strong> when a bed is occupied by a new arrival, <strong>+</strong> when a patient is discharged.</p>
                        </div>

                        <!-- Active Patient Card -->
                        <div class="card card-glass flex-1">
                            <h3 class="mb-lg">🩺 Active Patient Overview</h3>
                            <div id="active-patient-card">
                                <div class="empty-state">
                                    <div class="empty-icon">🩺</div>
                                    <p>Select a patient from the directory or tracking map.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- TAB 2: Maternal Directory -->
            <div class="tab-content" id="mothers-list">
                <div class="grid-2" style="grid-template-columns: 1fr 1.2fr;">
                    
                    <!-- Left: Mothers List -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">🤰 Maternal Case Registry</h3>
                        <div id="maternal-registry-list" style="max-height: 500px; overflow-y: auto;">
                            <!-- Filled dynamically -->
                        </div>
                    </div>

                    <!-- Right: Record ANC checkup form -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">📅 Log ANC / Clinical Checkup</h3>
                        <form id="anc-log-form">
                            <input type="hidden" name="action" value="add_checkup">
                            <input type="hidden" name="hospital_id" value="<?= $doctor['hospital_id'] ?>">
                            
                            <div class="form-group">
                                <label class="form-label" for="anc-mother-select">Select Patient *</label>
                                <select class="form-select" id="anc-mother-select" name="mother_id" required>
                                    <option value="">Choose expectant mother...</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="anc-date">Checkup Date *</label>
                                    <input class="form-input" type="date" id="anc-date" name="checkup_date" required value="<?= date('Y-m-d') ?>">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="anc-type">Checkup Type *</label>
                                    <select class="form-select" id="anc-type" name="checkup_type" required>
                                        <option value="Routine ANC 1">1st ANC Visit</option>
                                        <option value="Routine ANC 2">2nd ANC Visit</option>
                                        <option value="Routine ANC 3">3rd ANC Visit</option>
                                        <option value="Routine ANC 4">4th ANC Visit</option>
                                        <option value="Postnatal ANC">Postnatal Checkup</option>
                                        <option value="Emergency Intake">Emergency Intake Assessment</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="anc-notes">Clinical Assessment & Prescription Notes</label>
                                <textarea class="form-textarea" id="anc-notes" name="notes" placeholder="Enter clinical assessment notes, blood pressure measurement, and treatment updates..."></textarea>
                            </div>

                            <button class="btn btn-primary btn-block" type="submit">Submit Checkup Record</button>
                        </form>
                    </div>

                </div>
            </div>

            <!-- TAB 3: Clinical Tools -->
            <div class="tab-content" id="clinical-tools">
                <div class="grid-2">

                    <!-- Left: Patient Intake Clinical Assessment -->
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🩺 Emergency Clinical Intake Assessment</h3>
                            <span class="badge badge-rose">Post-Arrival</span>
                        </div>
                        <p class="text-sm text-secondary mb-lg">Complete this assessment when an emergency patient arrives at the facility.</p>

                        <form id="clinical-assessment-form" class="dispatch-form">
                            <div class="form-group">
                                <label class="form-label" for="ca-emergency-select">Emergency Case *</label>
                                <select class="form-select" id="ca-emergency-select" required>
                                    <option value="">Select arrived patient...</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="ca-bp">Blood Pressure (mmHg)</label>
                                    <input class="form-input" type="text" id="ca-bp" name="blood_pressure" placeholder="e.g. 120/80">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="ca-hr">Heart Rate (bpm)</label>
                                    <input class="form-input" type="number" id="ca-hr" name="heart_rate" placeholder="e.g. 88" min="30" max="200">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="ca-temp">Temperature (°C)</label>
                                <input class="form-input" type="number" step="0.1" id="ca-temp" name="temperature" placeholder="e.g. 37.2" min="34" max="42">
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="ca-findings">Clinical Findings *</label>
                                <textarea class="form-textarea" id="ca-findings" name="clinical_findings" required placeholder="Describe patient condition, symptoms, and any observed complications..."></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="ca-treatment">Treatment Given</label>
                                <textarea class="form-textarea" id="ca-treatment" name="treatment_given" placeholder="Medications administered, procedures done, interventions carried out..."></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="ca-outcome">Outcome *</label>
                                <select class="form-select" id="ca-outcome" name="outcome" required>
                                    <option value="admitted">Admitted to Ward</option>
                                    <option value="referred">Referred to Higher Facility</option>
                                    <option value="discharged">Discharged (Stable)</option>
                                    <option value="deceased">Deceased</option>
                                </select>
                            </div>

                            <button class="btn btn-primary btn-block mt-md" type="submit">📋 Submit Clinical Assessment</button>
                        </form>
                    </div>

                    <!-- Right: Blood Requests History -->
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🩸 Blood Supply Requests</h3>
                            <button class="btn btn-sm btn-danger" onclick="openBloodRequestModal()">+ Request Blood</button>
                        </div>
                        <div id="blood-request-list">
                            <div class="empty-state"><div class="empty-icon">🩸</div><p>No blood requests submitted yet.</p></div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- TAB 4: Assessment Logs -->
            <div class="tab-content" id="assessments-log">
                <div class="card card-glass">
                    <div class="card-header">
                        <h3 class="card-title">📋 Clinical Assessment History</h3>
                        <span class="badge badge-blue">My Records</span>
                    </div>
                    <div id="assessments-log-list">
                        <div class="empty-state"><div class="empty-icon">📋</div><p>No assessment records yet.</p></div>
                    </div>
                </div>
            </div>

        </main>
    </div>

    <!-- Blood Request Modal -->
    <div class="modal-overlay" id="blood-request-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>🩸 Request Emergency Blood Supply</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="blood-request-form" class="dispatch-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="br-blood-type">Blood Type Required *</label>
                            <select class="form-select" id="br-blood-type" name="blood_type" required>
                                <option value="">Select type...</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="br-units">Units Required *</label>
                            <input class="form-input" type="number" id="br-units" name="units" min="1" max="20" required placeholder="e.g. 2">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Requesting Facility</label>
                        <input class="form-input" type="text" value="<?= htmlspecialchars($doctor['hospital_name']) ?>" readonly style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('blood-request-modal')">Cancel</button>
                <button class="btn btn-danger" onclick="submitBloodRequest()">🩸 Submit Emergency Request</button>
            </div>
        </div>
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
                if(target === 'clinical-tools') { loadBloodRequests(); loadArrivedCases(); }
                if(target === 'assessments-log') loadAssessmentLogs();
                if(target === 'clinical-board' && docMap) {
                    setTimeout(() => docMap.invalidateSize(), 50);
                }
            });
        });

        let docMap = null;
        let activeEmergencyId = null;
        const HOSPITAL_ID = <?= (int)$doctor['hospital_id'] ?>;
        let currentAvailableBeds = <?= (int)($doctor['available_beds'] ?? 0) ?>;
        let currentTotalBeds = <?= (int)($doctor['total_beds'] ?? 0) ?>;

        document.addEventListener('DOMContentLoaded', () => {
            docMap = MapManager.init('doctor-map');
            MapManager.loadHospitals();
            DashboardUI.setupDutyToggle('../api/doctors.php');
            syncMaternalRegistry();
            checkForIncomingRescue();
            setInterval(checkForIncomingRescue, 10000);
            updateBedDisplay(currentAvailableBeds);
        });

        // ============================================================
        // BED MANAGEMENT
        // ============================================================
        function updateBedDisplay(count) {
            const el = document.getElementById('available-beds-count');
            el.textContent = count;
            el.className = 'bed-count-display';
            const pct = currentTotalBeds > 0 ? (count / currentTotalBeds) : 1;
            if(pct < 0.1) el.classList.add('critical');
            else if(pct < 0.3) el.classList.add('low');
        }

        async function adjustBeds(delta) {
            const newCount = Math.max(0, Math.min(currentTotalBeds, currentAvailableBeds + delta));
            if(newCount === currentAvailableBeds) return;
            try {
                const res = await fetch('../api/hospitals.php', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({
                        action: 'update_beds',
                        hospital_id: HOSPITAL_ID,
                        available_beds: newCount
                    })
                });
                const data = await res.json();
                if(data.success) {
                    currentAvailableBeds = newCount;
                    updateBedDisplay(newCount);
                    const msg = delta < 0 ? 'Bed marked as occupied.' : 'Bed marked as available.';
                    NotificationManager.show('Bed Updated', msg, 'success');
                } else { alert(data.error || 'Failed to update bed count.'); }
            } catch(e) { console.warn(e); }
        }

        // ============================================================
        // INCOMING RESCUE ALERTS
        // ============================================================
        async function checkForIncomingRescue() {
            try {
                const [r1, r2, r3] = await Promise.all([
                    fetch('../api/emergency.php?status=dispatched').then(r => r.json()),
                    fetch('../api/emergency.php?status=en_route').then(r => r.json()),
                    fetch('../api/emergency.php?status=arrived').then(r => r.json()),
                ]);
                let activeCase = null;
                if(r1.success && r1.emergencies.length > 0) activeCase = r1.emergencies[0];
                else if(r2.success && r2.emergencies.length > 0) activeCase = r2.emergencies[0];
                else if(r3.success && r3.emergencies.length > 0) activeCase = r3.emergencies[0];

                const banner = document.getElementById('incoming-alert-banner');
                if(activeCase) {
                    activeEmergencyId = activeCase.id;
                    document.getElementById('alert-patient-name').textContent = `Patient: ${activeCase.mother_name}`;
                    document.getElementById('alert-clinical-notes').textContent = `Notes: ${activeCase.notes || 'None specified'}`;
                    document.getElementById('alert-eta').textContent = `Status: ${activeCase.status.toUpperCase().replace('_',' ')}`;
                    banner.classList.remove('hidden');
                    MapManager.setMarker('mother_transit', activeCase.latitude, activeCase.longitude, 'emergency', `Patient: ${activeCase.mother_name}`);
                    MapManager.flyTo(activeCase.latitude, activeCase.longitude, 13);
                    document.getElementById('view-transit-btn').onclick = () => viewCaseTracker(activeCase.id);
                    document.getElementById('open-intake-btn').onclick = () => {
                        document.querySelector('[data-tab="clinical-tools"]').click();
                        setTimeout(() => {
                            const sel = document.getElementById('ca-emergency-select');
                            if(sel) sel.value = activeCase.id;
                        }, 300);
                    };
                } else {
                    banner.classList.add('hidden');
                    activeEmergencyId = null;
                }
            } catch(e) { console.warn(e); }
        }

        async function viewCaseTracker(emgId) {
            DashboardUI.showLoading('Connecting live location stream...');
            const res = await EmergencyManager.getDetails(emgId);
            DashboardUI.hideLoading();
            if (res.success) {
                const emg = res.emergency;
                const overview = document.getElementById('active-patient-card');
                overview.innerHTML = `
                    <div class="patient-list-item priority-high" style="border-left-width: 4px; border-radius: var(--radius-xl); cursor:default;">
                        <div class="patient-avatar">🤰</div>
                        <div class="patient-info">
                            <div class="patient-name">${emg.mother_name}</div>
                            <div class="patient-meta mt-xs">
                                <span>Blood Type: <strong>${emg.blood_type || 'Unknown'}</strong></span>
                                <span>Due: <strong>${emg.expected_due_date ? new Date(emg.expected_due_date).toLocaleDateString() : 'Unknown'}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-lg">
                        <h4 class="mb-sm text-secondary">Vitals & Assessment</h4>
                        <div class="grid-2 mb-md">
                            <div class="vital-sign-item normal">
                                <div class="vital-icon">🩸</div>
                                <div class="vital-value">${emg.blood_type || 'O+'}</div>
                                <div class="vital-label">Blood Type</div>
                            </div>
                            <div class="vital-sign-item warning">
                                <div class="vital-icon">⏱️</div>
                                <div class="vital-value">${emg.status.toUpperCase().replace('_',' ')}</div>
                                <div class="vital-label">Rescue Status</div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dispatcher Notes</label>
                            <p class="text-sm text-secondary bg-glass p-sm rounded" style="border: 1px solid var(--border-color);">${emg.notes || 'No assessment notes reported.'}</p>
                        </div>
                    </div>`;
                MapManager.setMarker('mother_transit', emg.latitude, emg.longitude, 'emergency', `Patient: ${emg.mother_name}`);
                if (emg.driver_latitude && emg.driver_longitude) {
                    MapManager.setMarker('driver_transit', emg.driver_latitude, emg.driver_longitude, 'ambulance', `Ambulance: ${emg.driver_name}`);
                    MapManager.drawRoute(emg.latitude, emg.longitude, emg.driver_latitude, emg.driver_longitude);
                }
            }
        }

        // ============================================================
        // MATERNAL REGISTRY
        // ============================================================
        async function syncMaternalRegistry() {
            try {
                const res = await fetch('../api/mothers.php');
                const data = await res.json();
                if(data.success) {
                    const list = document.getElementById('maternal-registry-list');
                    const select = document.getElementById('anc-mother-select');
                    list.innerHTML = '';
                    select.innerHTML = '<option value="">Choose expectant mother...</option>';
                    data.mothers.forEach(m => {
                        list.innerHTML += `
                            <div class="patient-list-item" onclick="loadMotherDetail(${m.user_id})">
                                <div class="patient-avatar">🤰</div>
                                <div class="patient-info">
                                    <div class="patient-name">${m.full_name}</div>
                                    <div class="patient-meta mt-xs">
                                        <span>Phone: ${m.phone}</span>
                                        <span>Village: ${m.village || 'Mukono'}</span>
                                    </div>
                                </div>
                                <div class="patient-week-badge">${m.blood_type || 'O+'}</div>
                            </div>`;
                        select.add(new Option(m.full_name, m.user_id));
                    });
                }
            } catch(e) { console.warn(e); }
        }

        async function loadMotherDetail(mid) {
            DashboardUI.showLoading('Retrieving patient records...');
            try {
                const res = await fetch(`../api/mothers.php?id=${mid}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    document.getElementById('anc-mother-select').value = data.mother.user_id;
                    NotificationManager.show('Patient Selected', `${data.mother.full_name} selected for ANC logging.`, 'info');
                }
            } catch(e) { DashboardUI.hideLoading(); }
        }

        document.getElementById('anc-log-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            DashboardUI.showLoading('Logging ANC checkup records...');
            const fd = new FormData(e.target);
            const payload = {};
            fd.forEach((v, k) => payload[k] = v);
            try {
                const res = await fetch('../api/mothers.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    NotificationManager.show('Checkup Saved', 'Maternal checkup ANC record logged successfully.', 'success');
                    document.getElementById('anc-notes').value = '';
                } else { NotificationManager.show('Logging Failed', data.error || 'Server error', 'danger'); }
            } catch(e) { DashboardUI.hideLoading(); }
        });

        // ============================================================
        // BLOOD REQUESTS
        // ============================================================
        function openBloodRequestModal() { DashboardUI.openModal('blood-request-modal'); }

        async function submitBloodRequest() {
            const bloodType = document.getElementById('br-blood-type').value;
            const units = document.getElementById('br-units').value;
            if(!bloodType || !units) { alert('Please select blood type and units.'); return; }
            DashboardUI.showLoading('Submitting blood request...');
            try {
                const res = await fetch('../api/blood_requests.php', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ blood_type: bloodType, units: units, hospital_id: HOSPITAL_ID })
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('blood-request-modal');
                    document.getElementById('blood-request-form').reset();
                    NotificationManager.show('Request Sent', `Blood type ${bloodType} × ${units} units requested.`, 'success');
                    loadBloodRequests();
                } else { alert(data.error || 'Failed to submit blood request.'); }
            } catch(e) { DashboardUI.hideLoading(); }
        }

        async function loadBloodRequests() {
            const list = document.getElementById('blood-request-list');
            try {
                const res = await fetch('../api/blood_requests.php');
                const data = await res.json();
                if(data.success && data.blood_requests.length > 0) {
                    list.innerHTML = '';
                    const statusColors = { pending:'badge-amber', approved:'badge-green', delivered:'badge-blue', cancelled:'badge-rose' };
                    data.blood_requests.forEach(r => {
                        const date = new Date(r.requested_at).toLocaleString([], {dateStyle:'short',timeStyle:'short'});
                        list.innerHTML += `
                            <div class="clinical-entry">
                                <div class="clinical-entry-header">
                                    <div class="clinical-entry-title">🩸 ${r.blood_type} — ${r.units} units</div>
                                    <span class="badge ${statusColors[r.status] || 'badge-blue'}">${r.status}</span>
                                </div>
                                <div class="clinical-entry-meta">${date}</div>
                            </div>`;
                    });
                } else { list.innerHTML = '<div class="empty-state"><div class="empty-icon">🩸</div><p>No blood requests yet.</p></div>'; }
            } catch(e) { console.warn(e); }
        }

        // ============================================================
        // CLINICAL INTAKE ASSESSMENT
        // ============================================================
        async function loadArrivedCases() {
            try {
                const res = await fetch('../api/emergency.php?status=arrived');
                const data = await res.json();
                const sel = document.getElementById('ca-emergency-select');
                sel.innerHTML = '<option value="">Select arrived patient...</option>';
                if(data.success && data.emergencies.length > 0) {
                    data.emergencies.forEach(e => sel.add(new Option(`${e.code} — ${e.mother_name}`, e.id)));
                }
            } catch(e) { console.warn(e); }
        }

        document.getElementById('clinical-assessment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const emgId = document.getElementById('ca-emergency-select').value;
            if(!emgId) { alert('Please select an emergency case.'); return; }
            const payload = {
                emergency_id: emgId,
                blood_pressure: document.getElementById('ca-bp').value,
                heart_rate: document.getElementById('ca-hr').value,
                temperature: document.getElementById('ca-temp').value,
                clinical_findings: document.getElementById('ca-findings').value,
                treatment_given: document.getElementById('ca-treatment').value,
                outcome: document.getElementById('ca-outcome').value
            };
            DashboardUI.showLoading('Saving clinical assessment...');
            try {
                const res = await fetch('../api/clinical_assessments.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    NotificationManager.show('Assessment Saved', 'Clinical intake assessment logged successfully.', 'success');
                    e.target.reset();
                    loadAssessmentLogs();
                } else { alert(data.error || 'Failed to save assessment.'); }
            } catch(e) { DashboardUI.hideLoading(); }
        });

        async function loadAssessmentLogs() {
            const list = document.getElementById('assessments-log-list');
            try {
                const res = await fetch('../api/clinical_assessments.php');
                const data = await res.json();
                if(data.success && data.assessments.length > 0) {
                    list.innerHTML = '';
                    const outcomeColors = { admitted:'badge-blue', referred:'badge-amber', discharged:'badge-green', deceased:'badge-rose' };
                    data.assessments.forEach(a => {
                        const date = new Date(a.logged_at).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
                        list.innerHTML += `
                            <div class="clinical-entry">
                                <div class="clinical-entry-header">
                                    <div>
                                        <div class="clinical-entry-title">📋 ${a.emergency_code || 'Case'} — ${a.mother_name || 'Patient'}</div>
                                        <div class="clinical-entry-meta">BP: ${a.blood_pressure || '—'} · HR: ${a.heart_rate || '—'} bpm · Temp: ${a.temperature || '—'}°C</div>
                                    </div>
                                    <span class="badge ${outcomeColors[a.outcome] || 'badge-blue'}">${a.outcome}</span>
                                </div>
                                <p class="text-xs text-secondary mt-xs">${a.clinical_findings ? a.clinical_findings.substring(0, 120) + '...' : 'No notes.'}</p>
                                <div class="clinical-entry-meta mt-xs">📅 ${date}</div>
                            </div>`;
                    });
                } else { list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No assessment records yet.</p></div>'; }
            } catch(e) { console.warn(e); }
        }
    </script>
</body>
</html>

