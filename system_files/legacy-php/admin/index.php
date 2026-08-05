<?php
/**
 * MamaTrack GPS — Administrative Command Center
 */
require_once __DIR__ . '/../config/auth.php';

requireAuth(['admin']);

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Command Center - MamaTrack GPS</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    
    <!-- Leaflet Mapping -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: var(--space-xl);
            margin-bottom: var(--space-xl);
        }
        @media (max-width: 1200px) {
            .dashboard-grid { grid-template-columns: 1fr; }
        }

        /* ── Manage Assets subtab panels ── */
        .mgmt-panel { display: none; }
        .mgmt-panel.active { display: block; animation: fadeIn 0.25s ease; }

        /* ── Subtab nav bar ── */
        .mgmt-tab-bar {
            display: flex; gap: 4px; flex-wrap: wrap;
            background: #f1f5f9; border-radius: 10px;
            padding: 5px; border: 1px solid #e2e8f0;
        }
        .mgmt-tab {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 16px;
            font-size: 0.8rem; font-weight: 600;
            color: #64748b; border-radius: 7px;
            border: 1px solid transparent; background: none;
            cursor: pointer; transition: all 0.15s;
            font-family: var(--font-body); white-space: nowrap;
        }
        .mgmt-tab:hover { background: rgba(255,255,255,0.8); color: #334155; }
        .mgmt-tab.active {
            background: #fff; color: #1d4ed8;
            border-color: #bfdbfe;
            box-shadow: 0 1px 4px rgba(59,130,246,0.18);
            font-weight: 700;
        }

        /* ── Professional table ── */
        .pro-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #e8edf3; }
        .pro-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .pro-table thead th {
            padding: 11px 14px; font-size: 0.7rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.06em;
            color: #64748b; background: #f8fafc;
            border-bottom: 2px solid #e2e8f0; white-space: nowrap;
        }
        .pro-table tbody td {
            padding: 12px 14px; font-size: 0.84rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle; color: #1e293b;
            word-break: break-word;
        }
        .pro-table tbody tr:last-child td { border-bottom: none; }
        .pro-table tbody tr:hover { background: #f0f7ff; }

        /* ── Action button cell ── */
        .act-cell { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; min-width: 110px; }
        .act-cell .btn-edit {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 5px 10px; font-size: 0.75rem; font-weight: 600;
            background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
            border-radius: 6px; cursor: pointer; transition: all 0.15s;
            font-family: var(--font-body); white-space: nowrap;
        }
        .act-cell .btn-edit:hover { background: #e0f2fe; border-color: #7dd3fc; color: #0369a1; }
        .act-cell .btn-del {
            display: inline-flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; font-size: 1rem; font-weight: 600;
            background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
            border-radius: 6px; cursor: pointer; transition: all 0.15s;
            font-family: var(--font-body); flex-shrink: 0; white-space: nowrap;
        }
        .act-cell .btn-del:hover { background: #fee2e2; border-color: #f87171; color: #b91c1c; }

        /* ── Small status helpers ── */
        .cap-yes { background: #dcfce7; color: #16a34a; font-size: 0.7rem; font-weight: 700;
                   padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
        .cap-no  { background: #f1f5f9; color: #64748b; font-size: 0.7rem; font-weight: 600;
                   padding: 2px 8px; border-radius: 999px; border: 1px solid #e2e8f0; white-space: nowrap; }
        .duty-on  { width: 9px; height: 9px; background: #22c55e; border-radius: 50%;
                    display: inline-block; box-shadow: 0 0 5px #22c55e; }
        .duty-off { width: 9px; height: 9px; background: #94a3b8; border-radius: 50%; display: inline-block; }
        .type-gov  { background: #dbeafe; color: #1d4ed8; }
        .type-priv { background: #f3e8ff; color: #7c3aed; }
        .type-ngo  { background: #fef3c7; color: #92400e; }

        /* ── Performance dashboard styles ── */
        .perf-metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-md);
            margin-bottom: var(--space-lg);
        }
        .perf-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
            transition: all var(--transition-fast);
        }
        .perf-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
            border-color: var(--border-light);
        }
        .perf-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-weight: 700;
            margin-bottom: 8px;
        }
        .perf-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-primary);
            font-family: var(--font-heading);
        }
        .perf-unit {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-left: 2px;
            font-weight: 500;
        }
        .perf-bar-container {
            height: 6px;
            background: var(--border-color);
            border-radius: 3px;
            margin-top: 12px;
            overflow: hidden;
        }
        .perf-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-500), var(--primary-300));
            border-radius: 3px;
            transition: width 0.5s ease;
        }
        .perf-log-wrap {
            max-height: 400px;
            overflow-y: auto;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-color);
        }
        .status-pill {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: var(--radius-full);
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-pill.success {
            background: var(--success-100);
            color: var(--success-700);
        }
        .status-pill.error {
            background: var(--danger-100);
            color: var(--danger-700);
        }
        .status-pill.pending {
            background: var(--warning-100);
            color: var(--warning-600);
        }
        .latency-fast { color: var(--success-600); font-weight: 700; }
        .latency-med  { color: var(--warning-600); font-weight: 700; }
        .latency-slow { color: var(--danger-600); font-weight: 700; }
    </style>
</head>
<body>
    <div class="admin-bg"></div>

    <div class="dashboard-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <div class="logo-icon" style="background: rgba(59,130,246,0.15); color: var(--primary-400);">📡</div>
                <div>
                    <h2>MamaTrack</h2>
                    <p>Admin Command Center</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-item active" data-tab="live-board">
                        <span class="nav-icon">📡</span>
                        <span>Emergency Dispatch</span>
                    </div>
                    <div class="nav-item" data-tab="resources">
                        <span class="nav-icon">🚑</span>
                        <span>Resource Center</span>
                    </div>
                    <div class="nav-item" data-tab="analytics">
                        <span class="nav-icon">📈</span>
                        <span>System Analytics</span>
                    </div>
                    <div class="nav-item" data-tab="management">
                        <span class="nav-icon">⚙️</span>
                        <span>Manage Assets</span>
                    </div>
                    <div class="nav-item" data-tab="performance">
                        <span class="nav-icon">⚡</span>
                        <span>Performance Monitor</span>
                    </div>
                </div>
            </nav>

            <div class="sidebar-user">
                <label style="cursor: pointer;" title="Change Profile Picture">
                    <input type="file" class="avatar-file-input" style="display:none;" accept="image/*">
                    <div class="user-avatar" style="position: relative; overflow: hidden; background: linear-gradient(135deg, var(--primary-500), var(--purple-500));">
                        <?php if (!empty($user['avatar']) && file_exists(__DIR__ . '/../uploads/avatars/' . $user['avatar'])): ?>
                            <img src="../uploads/avatars/<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                        <?php else: ?>
                            AD
                        <?php endif; ?>
                    </div>
                </label>
                <div class="user-info">
                    <div class="user-name" style="display: flex; align-items: center; gap: 4px;">
                        <?= htmlspecialchars($user['full_name']) ?>
                        <span class="avatar-delete-btn" style="cursor: pointer; font-size: 0.9rem; display: <?php echo !empty($user['avatar']) ? 'inline-block' : 'none'; ?>;" title="Remove Profile Picture">🗑️</span>
                    </div>
                    <div class="user-role">Administrator</div>
                </div>
                <a href="../auth/logout.php" class="btn-logout" title="Sign Out">&#x23FB; Logout</a>
            </div>
        </aside>

        <!-- Sidebar Overlay (mobile) -->
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <!-- Main Content Area -->
        <main class="main-content" id="main-content">
            <header class="top-header">
                <div>
                    <h1>Command Console</h1>
                    <p class="header-greeting">Welcome, <strong><?= htmlspecialchars($user['full_name']) ?></strong> | Mukono District Emergency Dispatch</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-danger hidden" id="silence-alarm-btn">🔇 Silence Siren</button>
                    <button class="hamburger-btn">☰</button>
                </div>
            </header>

            <!-- Stats Bar -->
            <div class="stats-grid">
                <div class="stat-card rose">
                    <div class="stat-icon">🚨</div>
                    <div class="stat-value" id="stat-active-emergencies">0</div>
                    <div class="stat-label">Active Emergencies</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-icon">🤰</div>
                    <div class="stat-value" id="stat-registered-mothers">0</div>
                    <div class="stat-label">Total Mothers Registered</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-icon">🚑</div>
                    <div class="stat-value" id="stat-available-ambulances">0</div>
                    <div class="stat-label">Available Ambulances</div>
                </div>
                <div class="stat-card amber">
                    <div class="stat-icon">🏥</div>
                    <div class="stat-value" id="stat-beds-capacity">0/0</div>
                    <div class="stat-label">Clinical Beds Available</div>
                </div>
            </div>

            <!-- Tab Content 1: Live Dispatch Board -->
            <div class="tab-content active" id="live-board">
                <div class="dashboard-grid">
                    
                    <!-- Left: Interactive Mapping Console -->
                    <div class="flex flex-col gap-lg">
                        <div class="card card-glass">
                            <div class="card-header">
                                <h3 class="card-title">🗺️ Live System Tracking</h3>
                                <span class="badge badge-blue">Real-time GPS</span>
                            </div>
                            <div class="map-container full-height" id="admin-map" style="height: 500px;"></div>
                        </div>

                        <!-- Active Emergencies List -->
                        <div class="card card-glass">
                            <h3 class="mb-lg">🚨 Active Emergency Alerts</h3>
                            <div id="active-emergencies-container">
                                <div class="empty-state">
                                    <div class="empty-icon">📡</div>
                                    <p>No active emergencies at the moment. Monitoring channel is clear.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Pending Dispatch Panels -->
                    <div class="flex flex-col gap-lg">
                        <div class="card card-glass emergency-panel hidden" id="pending-dispatch-panel">
                            <div class="emergency-panel-header">
                                <h3>🆘 Action Required: Dispatch Dispatcher</h3>
                                <span class="count">1</span>
                            </div>
                            <div class="emergency-panel-body">
                                <div id="pending-details">
                                    <!-- Detailed dispatch interface populated dynamically -->
                                </div>
                            </div>
                        </div>

                        <!-- Facility Statuses -->
                        <div class="card card-glass">
                            <h3 class="mb-md">🏥 Medical Facility Capacity</h3>
                            <div id="hospital-capacity-list">
                                <div class="empty-state">Loading capacities...</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Tab Content 2: Resource Center -->
            <div class="tab-content" id="resources">
                <div class="grid-2">
                    
                    <!-- Left: Drivers & Ambulance fleet -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">🚑 Ambulance Fleet status</h3>
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th>Vehicle</th>
                                        <th>Status</th>
                                        <th>Duty</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-drivers-table">
                                    <!-- Filled dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right: Clinical Doctors -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">👨‍⚕️ Clinical Support Team</h3>
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Doctor</th>
                                        <th>Facility</th>
                                        <th>Contact</th>
                                        <th>On-Duty</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-doctors-table">
                                    <!-- Filled dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Tab Content 3: System Analytics -->
            <div class="tab-content" id="analytics">
                <div class="grid-2">
                    
                    <!-- Left: Sub-county Breakout Table -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">🌍 Heatmap distribution: Sub-counties</h3>
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Sub-County</th>
                                        <th>Emergency Counts</th>
                                    </tr>
                                </thead>
                                <tbody id="analytics-geo-table">
                                    <!-- Filled dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right: Performance Metrics & Audit Logs -->
                    <div class="card card-glass flex flex-col justify-between">
                        <div>
                            <h3 class="mb-md">📈 Rescue Performance Metrics</h3>
                            <div class="nav-info-grid mt-lg">
                                <div class="nav-info-item">
                                    <div class="nav-value" id="metric-avg-response">--</div>
                                    <div class="nav-unit">Avg Response Time</div>
                                </div>
                                <div class="nav-info-item">
                                    <div class="nav-value" id="metric-survival-rate">100%</div>
                                    <div class="nav-unit">Maternal Survival</div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-lg">
                            <h3 class="mb-sm">Historical Summary</h3>
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Incidents</th>
                                            <th>Resolved</th>
                                        </tr>
                                    </thead>
                                    <tbody id="analytics-trends-table">
                                        <!-- Filled dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Tab Content 4: Manage Assets -->
            <div class="tab-content" id="management">

                <!-- Sub-tab navigation -->
                <div class="card card-glass mb-lg" style="padding: 6px;">
                    <div class="mgmt-tab-bar">
                        <button class="mgmt-tab active" data-mgmt="hosp">🏥 Hospitals</button>
                        <button class="mgmt-tab" data-mgmt="veh">🚑 Vehicles</button>
                        <button class="mgmt-tab" data-mgmt="doc">🩺 Doctors</button>
                        <button class="mgmt-tab" data-mgmt="drv">🚑 Drivers</button>
                        <button class="mgmt-tab" data-mgmt="mth">🤰 Mothers</button>
                    </div>
                </div>

                <!-- Panel: Hospitals -->
                <div class="mgmt-panel active" id="mgmt-hosp">
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🏥 Hospital Registry</h3>
                            <button class="btn btn-sm btn-primary" onclick="openCreateHospital()">+ Add Hospital</button>
                        </div>
                        <div class="pro-table-wrap">
                            <table class="pro-table">
                                <thead><tr>
                                    <th>Hospital Name</th>
                                    <th>Type</th>
                                    <th>Sub-County</th>
                                    <th style="text-align:center">Beds</th>
                                    <th style="text-align:center">CEmONC</th>
                                    <th style="text-align:center">Blood Bank</th>
                                    <th style="text-align:center">Surgical</th>
                                    <th style="text-align:center">Ambulance</th>
                                    <th>Contact</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody id="tbl-hospitals"><tr><td colspan="10" style="text-align:center;padding:2rem;color:#94a3b8;">Loading hospitals...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Panel: Vehicles -->
                <div class="mgmt-panel" id="mgmt-veh">
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🚑 Ambulance Fleet</h3>
                            <button class="btn btn-sm btn-primary" onclick="openCreateVehicle()">+ Add Vehicle</button>
                        </div>
                        <div class="pro-table-wrap">
                            <table class="pro-table">
                                <thead><tr>
                                    <th>Plate Number</th>
                                    <th>Vehicle Type</th>
                                    <th>Hospital</th>
                                    <th style="text-align:center">Capacity</th>
                                    <th style="text-align:center">Equipped</th>
                                    <th style="text-align:center">Status</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody id="tbl-vehicles"><tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">Click to load vehicles...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Panel: Doctors -->
                <div class="mgmt-panel" id="mgmt-doc">
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🩺 Clinical Doctors</h3>
                            <button class="btn btn-sm btn-primary" onclick="openCreateDoctor()">+ Add Doctor</button>
                        </div>
                        <div class="pro-table-wrap">
                            <table class="pro-table">
                                <thead><tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Hospital</th>
                                    <th>Specialization</th>
                                    <th>License No.</th>
                                    <th style="text-align:center">On Duty</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody id="tbl-doctors"><tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">Click to load doctors...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Panel: Drivers -->
                <div class="mgmt-panel" id="mgmt-drv">
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">👨‍✈️ Ambulance Drivers</h3>
                            <button class="btn btn-sm btn-primary" onclick="openCreateDriver()">+ Add Driver</button>
                        </div>
                        <div class="pro-table-wrap">
                            <table class="pro-table">
                                <thead><tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Hospital</th>
                                    <th>Vehicle</th>
                                    <th>License No.</th>
                                    <th>Role</th>
                                    <th style="text-align:center">On Duty</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody id="tbl-drivers"><tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">Click to load drivers...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Panel: Mothers -->
                <div class="mgmt-panel" id="mgmt-mth">
                    <div class="card card-glass">
                        <div class="card-header">
                            <h3 class="card-title">🤰 Registered Mothers</h3>
                            <button class="btn btn-sm btn-primary" onclick="openCreateMother()">+ Add Mother</button>
                        </div>
                        <div class="pro-table-wrap">
                            <table class="pro-table">
                                <thead><tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Sub-County / Village</th>
                                    <th>LMP Date</th>
                                    <th>Due Date</th>
                                    <th>Blood Type</th>
                                    <th>Next of Kin</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody id="tbl-mothers"><tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">Click to load mothers...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div><!-- end management tab -->

            <!-- Tab Content 5: Performance Monitor -->
            <div class="tab-content" id="performance">
                <!-- Page Load Performance Metrics -->
                <h3 class="mb-md">⚡ Client Page Load Performance</h3>
                <div class="perf-metrics-grid">
                    <div class="perf-card">
                        <div class="perf-title">DNS Lookup</div>
                        <div class="perf-value" id="load-dns">--<span class="perf-unit">ms</span></div>
                        <div class="perf-bar-container"><div class="perf-bar-fill" id="bar-dns" style="width: 0%;"></div></div>
                    </div>
                    <div class="perf-card">
                        <div class="perf-title">TCP Handshake</div>
                        <div class="perf-value" id="load-tcp">--<span class="perf-unit">ms</span></div>
                        <div class="perf-bar-container"><div class="perf-bar-fill" id="bar-tcp" style="width: 0%;"></div></div>
                    </div>
                    <div class="perf-card">
                        <div class="perf-title">TTFB (Response Start)</div>
                        <div class="perf-value" id="load-ttfb">--<span class="perf-unit">ms</span></div>
                        <div class="perf-bar-container"><div class="perf-bar-fill" id="bar-ttfb" style="width: 0%;"></div></div>
                    </div>
                    <div class="perf-card">
                        <div class="perf-title">DOM Interactive</div>
                        <div class="perf-value" id="load-dom">--<span class="perf-unit">ms</span></div>
                        <div class="perf-bar-container"><div class="perf-bar-fill" id="bar-dom" style="width: 0%;"></div></div>
                    </div>
                    <div class="perf-card">
                        <div class="perf-title">Total Load Time</div>
                        <div class="perf-value" id="load-total">--<span class="perf-unit">ms</span></div>
                        <div class="perf-bar-container"><div class="perf-bar-fill" id="bar-total" style="width: 0%;"></div></div>
                    </div>
                </div>

                <!-- API Latency & Health telemetry -->
                <div class="grid-2">
                    <div class="card card-glass">
                        <h3 class="mb-lg">📊 API Telemetry Summary</h3>
                        <div class="perf-metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
                            <div class="perf-card" style="background: rgba(255,255,255,0.4)">
                                <div class="perf-title">Avg API Latency</div>
                                <div class="perf-value" id="telemetry-avg-latency">--<span class="perf-unit">ms</span></div>
                            </div>
                            <div class="perf-card" style="background: rgba(255,255,255,0.4)">
                                <div class="perf-title">Avg Server Exec</div>
                                <div class="perf-value" id="telemetry-avg-exec">--<span class="perf-unit">ms</span></div>
                            </div>
                            <div class="perf-card" style="background: rgba(255,255,255,0.4)">
                                <div class="perf-title">Total Requests</div>
                                <div class="perf-value" id="telemetry-total-req">0</div>
                            </div>
                            <div class="perf-card" style="background: rgba(255,255,255,0.4)">
                                <div class="perf-title">Success Rate</div>
                                <div class="perf-value" id="telemetry-success-rate">100%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Live Request Logger -->
                    <div class="card card-glass">
                        <h3 class="mb-lg">📡 Live Request Logger (Real-Time)</h3>
                        <div class="pro-table-wrap" style="max-height: 280px; overflow-y: auto;">
                            <table class="pro-table" style="min-width: auto;">
                                <thead>
                                    <tr>
                                        <th>Endpoint</th>
                                        <th>Status</th>
                                        <th>Network Latency</th>
                                        <th>Server Time</th>
                                    </tr>
                                </thead>
                                <tbody id="perf-log-body">
                                    <tr>
                                        <td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No API requests tracked yet.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>

    <!-- Dispatch Modal -->
    <div class="modal-overlay" id="dispatch-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>Select Dispatch Resources</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="dispatch-form-fields" class="dispatch-form">
                    <input type="hidden" id="dispatch-emg-id">
                    
                    <div class="form-group">
                        <label class="form-label">Expectant Mother Location</label>
                        <input class="form-input" type="text" id="dispatch-mother-name" readonly>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="dispatch-select-hospital">Receiving Health Facility *</label>
                        <select class="form-select" id="dispatch-select-hospital" required>
                            <option value="">Choose Hospital...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="dispatch-select-driver">Available Ambulance/Driver *</label>
                        <select class="form-select" id="dispatch-select-driver" required>
                            <option value="">Choose Driver...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="dispatch-select-doctor">Notified Specialised Doctor</label>
                        <select class="form-select" id="dispatch-select-doctor">
                            <option value="">Select Doctor (or auto-assign duty doctor)...</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('dispatch-modal')">Cancel</button>
                <button class="btn btn-success" id="execute-dispatch-btn">Confirm & Dispatch</button>
            </div>
        </div>
    </div>

    <!-- Hospital CRUD Modal -->
    <div class="modal-overlay" id="hospital-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="hospital-modal-title">Add Hospital</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="hospital-form" class="dispatch-form">
                    <input type="hidden" id="hosp-crud-id" name="hospital_id">
                    <input type="hidden" id="hosp-crud-action" name="action" value="create">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="hosp-name">Hospital Name *</label>
                            <input class="form-input" type="text" id="hosp-name" name="name" required placeholder="e.g. Mukono General Hospital">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="hosp-type">Type *</label>
                            <select class="form-select" id="hosp-type" name="type" required>
                                <option value="government">Government</option>
                                <option value="private">Private</option>
                                <option value="ngo">NGO</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="hosp-lat">Latitude *</label>
                            <input class="form-input" type="number" step="any" id="hosp-lat" name="latitude" required placeholder="e.g. 0.3535">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="hosp-lng">Longitude *</label>
                            <input class="form-input" type="number" step="any" id="hosp-lng" name="longitude" required placeholder="e.g. 32.7550">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Map Location Picker (Click map or drag marker to set coordinates)</label>
                        <div id="hosp-map-pick" style="height: 220px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 12px; z-index: 10;"></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="hosp-address">Address</label>
                        <input class="form-input" type="text" id="hosp-address" name="address" placeholder="e.g. Jinja Road, Mukono">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="hosp-sub">Sub-County</label>
                            <input class="form-input" type="text" id="hosp-sub" name="sub_county" placeholder="e.g. Goma">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="hosp-hours">Operating Hours</label>
                            <input class="form-input" type="text" id="hosp-hours" name="operating_hours" value="24/7">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="hosp-phone">Phone</label>
                            <input class="form-input" type="text" id="hosp-phone" name="phone" placeholder="e.g. 0770000000">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="hosp-email">Email</label>
                            <input class="form-input" type="email" id="hosp-email" name="email" placeholder="hosp@example.com">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="hosp-tot-beds">Total Beds</label>
                            <input class="form-input" type="number" id="hosp-tot-beds" name="total_beds" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="hosp-avail-beds">Available Beds</label>
                            <input class="form-input" type="number" id="hosp-avail-beds" name="available_beds" value="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="hosp-blood-types">Available Blood Types</label>
                        <input class="form-input" type="text" id="hosp-blood-types" name="blood_types_available" placeholder="e.g. O+, O-, A+">
                    </div>

                    <div class="form-row" style="grid-template-columns: repeat(2, 1fr); margin-top: 10px;">
                        <label class="form-label flex items-center gap-sm">
                            <input type="checkbox" id="hosp-cemonc" name="has_cemonc">
                            <span>CEmONC Capable</span>
                        </label>
                        <label class="form-label flex items-center gap-sm">
                            <input type="checkbox" id="hosp-blood-bank" name="has_blood_bank">
                            <span>Has Blood Bank</span>
                        </label>
                        <label class="form-label flex items-center gap-sm">
                            <input type="checkbox" id="hosp-surgical" name="has_surgical_capacity">
                            <span>Surgical Capacity</span>
                        </label>
                        <label class="form-label flex items-center gap-sm">
                            <input type="checkbox" id="hosp-amb" name="has_ambulance">
                            <span>Has Ambulance</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('hospital-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="submitHospitalForm()">Save Hospital</button>
            </div>
        </div>
    </div>

    <!-- Vehicle CRUD Modal -->
    <div class="modal-overlay" id="vehicle-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="vehicle-modal-title">Add Vehicle</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="vehicle-form" class="dispatch-form">
                    <input type="hidden" id="veh-crud-id" name="vehicle_id">
                    <input type="hidden" id="veh-crud-action" name="action" value="create">

                    <div class="form-group">
                        <label class="form-label" for="veh-plate">Plate Number *</label>
                        <input class="form-input" type="text" id="veh-plate" name="plate_number" required placeholder="e.g. UBG 001A">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="veh-type">Vehicle Type</label>
                            <input class="form-input" type="text" id="veh-type" name="vehicle_type" value="Ambulance">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="veh-capacity">Capacity</label>
                            <input class="form-input" type="number" id="veh-capacity" name="capacity" value="1" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="veh-hosp">Assigned Hospital *</label>
                        <select class="form-select" id="veh-hosp" name="hospital_id" required>
                            <option value="">Select Hospital...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="veh-status">Status</label>
                        <select class="form-select" id="veh-status" name="status">
                            <option value="available">Available</option>
                            <option value="en_route">En Route</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="off_duty">Off Duty</option>
                        </select>
                    </div>

                    <label class="form-label flex items-center gap-sm mt-md">
                        <input type="checkbox" id="veh-equip" name="has_equipment">
                        <span>Equipped with Emergency Gear</span>
                    </label>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('vehicle-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="submitVehicleForm()">Save Vehicle</button>
            </div>
        </div>
    </div>

    <!-- Doctor CRUD Modal -->
    <div class="modal-overlay" id="doctor-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="doctor-modal-title">Add Doctor</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="doctor-form" class="dispatch-form">
                    <input type="hidden" id="doc-crud-id" name="doctor_user_id">
                    <input type="hidden" id="doc-crud-action" name="action" value="create">

                    <div class="form-group">
                        <label class="form-label" for="doc-name">Full Name *</label>
                        <input class="form-input" type="text" id="doc-name" name="full_name" required placeholder="e.g. Dr. Jane Namono">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="doc-email">Email *</label>
                            <input class="form-input" type="email" id="doc-email" name="email" required placeholder="name@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="doc-phone">Phone *</label>
                            <input class="form-input" type="text" id="doc-phone" name="phone" required placeholder="0770000000">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="doc-pass">Password * <span id="doc-pass-note" style="color:var(--text-muted); font-size:0.75rem;">(Required for new accounts)</span></label>
                        <input class="form-input" type="password" id="doc-pass" name="password" placeholder="••••••••">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="doc-hosp">Hospital Assignment *</label>
                        <select class="form-select" id="doc-hosp" name="hospital_id" required>
                            <option value="">Select Hospital...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="doc-spec">Specialization / Clinical Role *</label>
                        <select class="form-select" id="doc-spec" name="specialization" required>
                            <option value="Obstetrics & Gynecology">Obstetrics & Gynecology (OB/GYN)</option>
                            <option value="Maternal-Fetal Medicine (MFM)">Maternal-Fetal Medicine (MFM)</option>
                            <option value="Neonatology">Neonatology</option>
                            <option value="Emergency Medicine">Emergency Medicine Officer</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="General Practitioner">General Practitioner (GP)</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="doc-license">License Number</label>
                            <input class="form-input" type="text" id="doc-license" name="license_number" placeholder="e.g. LIC-1234">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="doc-exp">Years of Experience</label>
                            <input class="form-input" type="number" id="doc-exp" name="years_experience" value="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('doctor-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="submitDoctorForm()">Save Doctor</button>
            </div>
        </div>
    </div>

    <!-- Driver CRUD Modal -->
    <div class="modal-overlay" id="driver-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="driver-modal-title">Add Driver</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="driver-form" class="dispatch-form">
                    <input type="hidden" id="drv-crud-id" name="driver_user_id">
                    <input type="hidden" id="drv-crud-action" name="action" value="create">

                    <div class="form-group">
                        <label class="form-label" for="drv-name">Full Name *</label>
                        <input class="form-input" type="text" id="drv-name" name="full_name" required placeholder="e.g. Kiggundu Moses">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="drv-email">Email *</label>
                            <input class="form-input" type="email" id="drv-email" name="email" required placeholder="name@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="drv-phone">Phone *</label>
                            <input class="form-input" type="text" id="drv-phone" name="phone" required placeholder="0770000000">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="drv-pass">Password * <span id="drv-pass-note" style="color:var(--text-muted); font-size:0.75rem;">(Required for new accounts)</span></label>
                        <input class="form-input" type="password" id="drv-pass" name="password" placeholder="••••••••">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="drv-hosp">Hospital Assignment *</label>
                            <select class="form-select" id="drv-hosp" name="hospital_id" required>
                                <option value="">Select Hospital...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="drv-veh">Vehicle Assignment</label>
                            <select class="form-select" id="drv-veh" name="vehicle_id">
                                <option value="">No Vehicle...</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="drv-license">Driver License Number</label>
                        <input class="form-input" type="text" id="drv-license" name="license_number" placeholder="e.g. LIC-DRV-1234">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="drv-role">Driver Operational Role *</label>
                        <select class="form-select" id="drv-role" name="driver_role" required>
                            <option value="Primary Emergency Driver">Primary Emergency Driver</option>
                            <option value="Lead Paramedic Response Driver">Lead Paramedic Response Driver</option>
                            <option value="Advanced Life Support (ALS) Driver">Advanced Life Support (ALS) Driver</option>
                            <option value="Basic Life Support (BLS) Driver">Basic Life Support (BLS) Driver</option>
                            <option value="Backup Relief Response Driver">Backup Relief Response Driver</option>
                            <option value="Senior Fleet Transit Captain">Senior Fleet Transit Captain</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('driver-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="submitDriverForm()">Save Driver</button>
            </div>
        </div>
    </div>

    <!-- Mother CRUD Modal -->
    <div class="modal-overlay" id="mother-modal">
        <div class="modal" style="max-width: 650px;">
            <div class="modal-header">
                <h3 id="mother-modal-title">Add Mother</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="mother-form" class="dispatch-form">
                    <input type="hidden" id="mth-crud-id" name="mother_user_id">
                    <input type="hidden" id="mth-crud-action" name="action" value="create_admin">

                    <div class="form-group">
                        <label class="form-label" for="mth-name">Full Name *</label>
                        <input class="form-input" type="text" id="mth-name" name="full_name" required placeholder="e.g. Nakato Fatima">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="mth-email">Email *</label>
                            <input class="form-input" type="email" id="mth-email" name="email" required placeholder="name@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-phone">Phone *</label>
                            <input class="form-input" type="text" id="mth-phone" name="phone" required placeholder="0770000000">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="mth-pass">Password * <span id="mth-pass-note" style="color:var(--text-muted); font-size:0.75rem;">(Required for new accounts)</span></label>
                        <input class="form-input" type="password" id="mth-pass" name="password" placeholder="••••••••">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="mth-dob">Date of Birth</label>
                            <input class="form-input" type="date" id="mth-dob" name="date_of_birth">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-blood">Blood Type</label>
                            <select class="form-select" id="mth-blood" name="blood_type">
                                <option value="">Choose blood type...</option>
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
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="mth-pstart">Pregnancy Start Date *</label>
                            <input class="form-input" type="date" id="mth-pstart" name="pregnancy_start_date" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-gravida">Gravida (Pregnancies count)</label>
                            <input class="form-input" type="number" id="mth-gravida" name="gravida" value="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-parity">Parity (Previous births)</label>
                            <input class="form-input" type="number" id="mth-parity" name="parity" value="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="mth-history">Medical History / Past Complications</label>
                        <textarea class="form-textarea" id="mth-history" name="medical_history" placeholder="Enter pregnancy details, pre-existing conditions..."></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="mth-sub">Sub-County</label>
                            <input class="form-input" type="text" id="mth-sub" name="sub_county" placeholder="e.g. Goma">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-village">Village</label>
                            <input class="form-input" type="text" id="mth-village" name="village" placeholder="e.g. Seeta">
                        </div>
                    </div>

                    <h4 class="mt-md mb-sm text-secondary">Next of Kin Details</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="mth-nok-name">Kin Name</label>
                            <input class="form-input" type="text" id="mth-nok-name" name="next_of_kin_name">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-nok-phone">Kin Phone</label>
                            <input class="form-input" type="text" id="mth-nok-phone" name="next_of_kin_phone">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mth-nok-rel">Relationship</label>
                            <input class="form-input" type="text" id="mth-nok-rel" name="next_of_kin_relationship" placeholder="e.g. Husband">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="DashboardUI.closeModal('mother-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="submitMotherForm()">Save Mother</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../assets/js/dashboard.js"></script>
    <script src="../assets/js/notifications.js"></script>
    <script src="../assets/js/map.js"></script>
    <script src="../assets/js/emergency.js"></script>

    <script>
        // Set tab selection routing
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
                // Invalidate map size if returning to the dispatch board
                if (target === 'live-board' && adminMap) {
                    setTimeout(() => { adminMap.invalidateSize(); }, 50);
                }
                
                // Close sidebar on mobile after selecting tab
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar && window.innerWidth <= 1024) {
                    sidebar.classList.remove('open');
                    if (overlay) { overlay.classList.remove('visible'); setTimeout(() => { overlay.style.display = 'none'; }, 300); }
                }
            });
        });

        // Setup live dispatcher variables
        let adminMap = null;
        let alarmActive = false;

        document.addEventListener('DOMContentLoaded', () => {
            adminMap = MapManager.init('admin-map');
            MapManager.loadHospitals();

            // Sidebar Toggle (works on ALL screen sizes)
            const hamburger = document.querySelector('.hamburger-btn');
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const mainContent = document.getElementById('main-content');

            const isMobile = () => window.innerWidth <= 1024;

            function openSidebar() {
                if (isMobile()) {
                    sidebar.classList.add('open');
                    sidebar.classList.remove('closed');
                    if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('visible')); }
                } else {
                    sidebar.classList.remove('closed');
                    if (mainContent) mainContent.classList.remove('sidebar-closed');
                }
            }

            function closeSidebar() {
                if (isMobile()) {
                    sidebar.classList.remove('open');
                    if (overlay) { overlay.classList.remove('visible'); setTimeout(() => { if (!overlay.classList.contains('visible')) overlay.style.display = 'none'; }, 300); }
                } else {
                    sidebar.classList.add('closed');
                    if (mainContent) mainContent.classList.add('sidebar-closed');
                }
            }

            function toggleSidebar() {
                if (isMobile()) {
                    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
                } else {
                    sidebar.classList.contains('closed') ? openSidebar() : closeSidebar();
                }
            }

            if (hamburger && sidebar) {
                hamburger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleSidebar();
                });

                // Close sidebar when clicking overlay (mobile)
                if (overlay) {
                    overlay.addEventListener('click', () => closeSidebar());
                }

                // On window resize: re-sync sidebar state
                window.addEventListener('resize', () => {
                    if (!isMobile()) {
                        // On desktop: ensure sidebar is visible and overlay is hidden
                        sidebar.classList.remove('open');
                        if (overlay) { overlay.classList.remove('visible'); overlay.style.display = 'none'; }
                    }
                });
            }

            // Run initial load loops
            syncDashboardStats();
            syncLiveEmergencies();
            syncFacilityList();
            syncResourceRegistry();
            syncAnalyticsReports();

            // Setup polling updates
            setInterval(syncDashboardStats, 10000);
            setInterval(syncLiveEmergencies, 8000);
            setInterval(syncFacilityList, 15000);

            // Silence alarm handler
            document.getElementById('silence-alarm-btn').addEventListener('click', () => {
                NotificationManager.stopAlarm();
                document.getElementById('silence-alarm-btn').classList.add('hidden');
                alarmActive = false;
            });
        });

        // 1. Fetch dashboard metric figures
        async function syncDashboardStats() {
            try {
                const res = await fetch('../api/dashboard_stats.php');
                const data = await res.json();
                if(data.success) {
                    const stats = data.stats;
                    document.getElementById('stat-active-emergencies').textContent = stats.active_emergencies;
                    document.getElementById('stat-registered-mothers').textContent = stats.total_mothers;
                    document.getElementById('stat-available-ambulances').textContent = stats.available_ambulances;
                    document.getElementById('stat-beds-capacity').textContent = `${stats.available_beds}/${stats.total_beds}`;
                }
            } catch(e) { console.warn(e); }
        }

        // 2. Fetch and render capacities
        async function syncFacilityList() {
            try {
                const res = await fetch('../api/hospitals.php');
                const data = await res.json();
                if(data.success) {
                    const container = document.getElementById('hospital-capacity-list');
                    container.innerHTML = '';
                    data.hospitals.forEach(h => {
                        const pct = Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100);
                        let cls = 'low';
                        if(pct > 50) cls = 'medium';
                        if(pct > 80) cls = 'high';

                        container.innerHTML += `
                            <div class="mb-md">
                                <div class="flex justify-between text-sm mb-xs">
                                    <strong>${h.name}</strong>
                                    <span class="text-secondary">${h.available_beds}/${h.total_beds} Beds Available</span>
                                </div>
                                <div class="capacity-bar">
                                    <div class="capacity-fill ${cls}" style="width: ${pct}%;"></div>
                                </div>
                            </div>
                        `;
                    });
                }
            } catch(e) { console.warn(e); }
        }

        // 3. Load Resources registries
        async function syncResourceRegistry() {
            try {
                // Drivers
                const resDrivers = await fetch('../api/drivers.php');
                const dataDrivers = await resDrivers.json();
                if(dataDrivers.success) {
                    const tbody = document.getElementById('admin-drivers-table');
                    tbody.innerHTML = '';
                    dataDrivers.drivers.forEach(d => {
                        tbody.innerHTML += `
                            <tr>
                                <td><strong>${d.full_name}</strong><br><span class="text-xs text-muted">${d.phone}</span></td>
                                <td>${d.plate_number || 'No Vehicle'}<br><span class="text-xs text-muted">${d.vehicle_type || ''}</span></td>
                                <td><span class="badge ${d.vehicle_status === 'available' ? 'badge-green' : 'badge-amber'}">${d.vehicle_status || 'Offline'}</span></td>
                                <td><span class="status-dot ${d.is_on_duty ? 'online' : 'offline'}"></span></td>
                            </tr>
                        `;
                    });
                }

                // Doctors
                const resDocs = await fetch('../api/doctors.php');
                const dataDocs = await resDocs.json();
                if(dataDocs.success) {
                    const tbody = document.getElementById('admin-doctors-table');
                    tbody.innerHTML = '';
                    dataDocs.doctors.forEach(d => {
                        tbody.innerHTML += `
                            <tr>
                                <td><strong>${d.full_name}</strong><br><span class="text-xs text-muted">${d.email}</span></td>
                                <td>${d.hospital_name}</td>
                                <td>${d.phone}</td>
                                <td><span class="status-dot ${d.is_on_duty ? 'online' : 'offline'}"></span></td>
                            </tr>
                        `;
                    });
                }
            } catch(e) { console.warn(e); }
        }

        // 4. Fetch live emergency records
        async function syncLiveEmergencies() {
            try {
                const res = await fetch('../api/emergency.php');
                const data = await res.json();
                if(data.success) {
                    const listContainer = document.getElementById('active-emergencies-container');
                    
                    // Filter non-completed/non-cancelled
                    const activeList = data.emergencies.filter(e => !['completed', 'cancelled'].includes(e.status));
                    
                    if (activeList.length === 0) {
                        listContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">📡</div>
                                <p>No active emergencies at the moment. Monitoring channel is clear.</p>
                            </div>`;
                        document.getElementById('pending-dispatch-panel').classList.add('hidden');
                        return;
                    }

                    listContainer.innerHTML = '';
                    
                    // Render list and map locations
                    activeList.forEach(e => {
                        const date = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        // Add marker to map
                        const popup = `<strong>🆘 Patient: ${e.mother_name}</strong><br>Status: ${e.status.toUpperCase()}`;
                        MapManager.setMarker('emergency_' + e.id, e.latitude, e.longitude, 'emergency', popup);

                        listContainer.innerHTML += `
                            <div class="emergency-card">
                                <div class="emergency-card-header">
                                    <span class="emergency-code">${e.code}</span>
                                    <span class="emergency-time">${date}</span>
                                </div>
                                <div class="emergency-details">
                                    <div class="emergency-detail-item">
                                        <span class="detail-label">Mother:</span>
                                        <strong>${e.mother_name}</strong>
                                    </div>
                                    <div class="emergency-detail-item">
                                        <span class="detail-label">Location:</span>
                                        <span>${e.village}, ${e.sub_county}</span>
                                    </div>
                                    <div class="emergency-detail-item">
                                        <span class="detail-label">Status:</span>
                                        ${EmergencyManager.getStatusBadge(e.status)}
                                    </div>
                                    <div class="emergency-detail-item">
                                        <span class="detail-label">Resource:</span>
                                        <span>${e.driver_name || 'Not Dispatched'}</span>
                                    </div>
                                </div>
                                <div class="emergency-actions">
                                    ${e.status === 'pending' ? 
                                        `<button class="btn btn-sm btn-primary" onclick="initiateDispatch(${e.id}, '${e.mother_name}', ${e.latitude}, ${e.longitude})">🚨 Action Dispatch</button>` : 
                                        `<button class="btn btn-sm btn-ghost" onclick="viewEmergency(${e.id})">🔍 Tracking Console</button>`
                                    }
                                    <button class="btn btn-sm btn-ghost btn-danger" style="margin-left:auto;" onclick="cancelEmergency(${e.id})">Cancel</button>
                                </div>
                            </div>
                        `;
                    });

                    // Trigger alarm siren if there is a pending case
                    const hasPending = activeList.some(e => e.status === 'pending');
                    if (hasPending && !alarmActive) {
                        NotificationManager.startAlarm();
                        document.getElementById('silence-alarm-btn').classList.remove('hidden');
                        alarmActive = true;
                        NotificationManager.show('ALERT RECEIVED', 'New maternal rescue alert has been registered. Respond immediately.', 'danger');
                    }
                }
            } catch(e) { console.warn(e); }
        }

        // Initiate dispatch process
        async function initiateDispatch(emgId, motherName, lat, lng) {
            document.getElementById('dispatch-emg-id').value = emgId;
            document.getElementById('dispatch-mother-name').value = motherName;

            // Fetch match suggestions
            DashboardUI.showLoading('Finding nearest ambulances and hospital capacity...');
            
            try {
                // Populate hospitals dropdown
                const hospRes = await fetch('../api/hospitals.php');
                const hospData = await hospRes.json();
                const selectHosp = document.getElementById('dispatch-select-hospital');
                selectHosp.innerHTML = '<option value="">Choose Hospital...</option>';
                
                // Populate drivers dropdown
                const driverRes = await fetch('../api/drivers.php?on_duty=true');
                const driverData = await driverRes.json();
                const selectDriver = document.getElementById('dispatch-select-driver');
                selectDriver.innerHTML = '<option value="">Choose Driver...</option>';

                // Match nearest algorithm recommendation display
                let recommendedHospitalId = null;
                let recommendedDriverId = null;

                if (hospData.success && driverData.success) {
                    // Quick distance matching
                    let minHospDist = Infinity;
                    hospData.hospitals.forEach(h => {
                        const dist = haversineDistance(lat, lng, h.latitude, h.longitude);
                        const label = `${h.name} (${dist.toFixed(2)} km - ${h.available_beds} beds)`;
                        const opt = new Option(label, h.id);
                        if (dist < minHospDist && h.available_beds > 0) {
                            minHospDist = dist;
                            recommendedHospitalId = h.id;
                        }
                        selectHosp.add(opt);
                    });

                    let minDriverDist = Infinity;
                    driverData.drivers.forEach(d => {
                        if (d.vehicle_status === 'available') {
                            const dist = haversineDistance(lat, lng, d.current_latitude, d.current_longitude);
                            const label = `${d.full_name} (${d.plate_number || 'Ambulance'}) - ${dist.toFixed(2)} km away`;
                            const opt = new Option(label, d.user_id);
                            if (dist < minDriverDist) {
                                minDriverDist = dist;
                                recommendedDriverId = d.user_id;
                            }
                            selectDriver.add(opt);
                        }
                    });

                    // Set recommendation matches
                    if (recommendedHospitalId) selectHosp.value = recommendedHospitalId;
                    if (recommendedDriverId) selectDriver.value = recommendedDriverId;

                    // Load doctors for chosen hospital
                    if (recommendedHospitalId) {
                        loadDoctorsForHospital(recommendedHospitalId);
                    }

                    selectHosp.addEventListener('change', () => {
                        loadDoctorsForHospital(selectHosp.value);
                    });
                }
            } catch (e) {
                console.warn(e);
            }

            DashboardUI.hideLoading();
            DashboardUI.openModal('dispatch-modal');
        }

        // Help match doctor list
        async function loadDoctorsForHospital(hospitalId) {
            const selectDoc = document.getElementById('dispatch-select-doctor');
            selectDoc.innerHTML = '<option value="">Select Doctor...</option>';
            if (!hospitalId) return;

            try {
                const res = await fetch(`../api/doctors.php?hospital_id=${hospitalId}&on_duty=true`);
                const data = await res.json();
                if (data.success) {
                    data.doctors.forEach(d => {
                        selectDoc.add(new Option(d.full_name, d.user_id));
                    });
                }
            } catch(e) { console.warn(e); }
        }

        // Haversine fallback helper in front-end
        function haversineDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // Execute dispatch
        document.getElementById('execute-dispatch-btn').addEventListener('click', async () => {
            const emgId = document.getElementById('dispatch-emg-id').value;
            const hospId = document.getElementById('dispatch-select-hospital').value;
            const driverId = document.getElementById('dispatch-select-driver').value;
            const docId = document.getElementById('dispatch-select-doctor').value;

            if(!hospId || !driverId) {
                alert('Please select both Hospital and Driver');
                return;
            }

            DashboardUI.showLoading('Dispatching emergency rescue assets...');
            const res = await EmergencyManager.dispatch(emgId, driverId, hospId, docId);
            DashboardUI.hideLoading();
            DashboardUI.closeModal('dispatch-modal');

            if (res.success) {
                NotificationManager.show('Rescue Assets Dispatched', 'Ambulance team has been notified and routed.', 'success');
                syncLiveEmergencies();
                syncDashboardStats();
            } else {
                alert(res.error);
            }
        });

        // Cancel emergency logic
        async function cancelEmergency(emgId) {
            if(confirm('Are you sure you want to cancel this emergency?')) {
                const reason = prompt('Please enter cancellation reason:');
                if(reason !== null) {
                    DashboardUI.showLoading('Cancelling emergency record...');
                    const res = await EmergencyManager.cancel(emgId, reason);
                    DashboardUI.hideLoading();
                    if(res.success) {
                        NotificationManager.show('Cancelled', 'Emergency has been successfully cancelled.', 'info');
                        syncLiveEmergencies();
                        syncDashboardStats();
                    } else {
                        alert(res.error);
                    }
                }
            }
        }

        // View dynamic tracking console
        async function viewEmergency(emgId) {
            DashboardUI.showLoading('Fetching route details...');
            const res = await EmergencyManager.getDetails(emgId);
            DashboardUI.hideLoading();

            if (res.success) {
                const emg = res.emergency;
                MapManager.flyTo(emg.latitude, emg.longitude, 14);
                
                // Draw route if driver location exists
                if (emg.driver_latitude && emg.driver_longitude) {
                    MapManager.setMarker('mother_marker', emg.latitude, emg.longitude, 'emergency', `Patient: ${emg.mother_name}`);
                    MapManager.setMarker('driver_marker', emg.driver_latitude, emg.driver_longitude, 'ambulance', `Ambulance: ${emg.driver_name}`);
                    MapManager.drawRoute(emg.latitude, emg.longitude, emg.driver_latitude, emg.driver_longitude);
                } else {
                    NotificationManager.show('Tracking Information', 'Ambulance location coordinates not yet synced.', 'info');
                }
            }
        }

        // Load historical reporting analytics
        async function syncAnalyticsReports() {
            try {
                const res = await fetch('../api/reports.php');
                const data = await res.json();
                if(data.success) {
                    const reports = data.reports;
                    
                    // Response Time
                    document.getElementById('metric-avg-response').textContent = 
                        reports.average_response_time ? `${Math.round(reports.average_response_time)} mins` : 'N/A';

                    // Sub-counties
                    const geoBody = document.getElementById('analytics-geo-table');
                    geoBody.innerHTML = '';
                    reports.geo_distribution.forEach(row => {
                        geoBody.innerHTML += `
                            <tr>
                                <td><strong>${row.sub_county || 'Unknown'}</strong></td>
                                <td>${row.count} incidents</td>
                            </tr>
                        `;
                    });

                    // Trends
                    const trendsBody = document.getElementById('analytics-trends-table');
                    trendsBody.innerHTML = '';
                    reports.monthly_trends.forEach(row => {
                        trendsBody.innerHTML += `
                            <tr>
                                <td>${row.month}</td>
                                <td>${row.count}</td>
                                <td>${row.completed} resolved</td>
                            </tr>
                        `;
                    });
                }
            } catch(e) { console.warn(e); }
        }

        // ============================================================
        // MANAGEMENT TAB — Independent sub-tab routing (mgmt-tab / mgmt-panel)
        // ============================================================
        const mgmtLoaded = {}; // track which panels have already loaded

        function switchMgmtTab(key) {
            document.querySelectorAll('.mgmt-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.mgmt-panel').forEach(p => p.classList.remove('active'));
            const btn = document.querySelector(`.mgmt-tab[data-mgmt="${key}"]`);
            const panel = document.getElementById(`mgmt-${key}`);
            if (btn)   btn.classList.add('active');
            if (panel) panel.classList.add('active');
            // Load data for this panel
            if (key === 'hosp') mgmtLoadHospitals();
            if (key === 'veh')  mgmtLoadVehicles();
            if (key === 'doc')  mgmtLoadDoctors();
            if (key === 'drv')  mgmtLoadDrivers();
            if (key === 'mth')  mgmtLoadMothers();
        }

        document.querySelectorAll('.mgmt-tab').forEach(btn => {
            btn.addEventListener('click', () => switchMgmtTab(btn.dataset.mgmt));
        });

        // Hook into management tab activation to load hospitals immediately
        document.querySelector('[data-tab="management"]').addEventListener('click', () => {
            mgmtLoadHospitals();
            loadHospitalDropdowns();
            loadVehicleDropdowns();
        });

        // ============================================================
        // CRUD HELPERS — shared dropdown loaders
        // ============================================================
        let hospitalOptions = [];
        let vehicleOptions = [];

        async function loadHospitalDropdowns() {
            try {
                const res = await fetch('../api/hospitals.php');
                const data = await res.json();
                if(data.success) {
                    hospitalOptions = data.hospitals;
                    ['veh-hosp','doc-hosp','drv-hosp'].forEach(id => {
                        const el = document.getElementById(id);
                        if(!el) return;
                        el.innerHTML = '<option value="">Select Hospital...</option>';
                        hospitalOptions.forEach(h => el.add(new Option(h.name, h.id)));
                    });
                }
            } catch(e) { console.warn(e); }
        }

        async function loadVehicleDropdowns() {
            try {
                const res = await fetch('../api/vehicles.php');
                const data = await res.json();
                if(data.success) {
                    vehicleOptions = data.vehicles;
                    const el = document.getElementById('drv-veh');
                    if(!el) return;
                    el.innerHTML = '<option value="">No Vehicle...</option>';
                    vehicleOptions.forEach(v => el.add(new Option(`${v.plate_number} (${v.vehicle_type})`, v.id)));
                }
            } catch(e) { console.warn(e); }
        }

        function confirmDelete(msg, onConfirm) {
            if(confirm(msg)) onConfirm();
        }

        // ============================================================
        // NEW MGMT CRUD FUNCTIONS (tbl-* IDs, mgmt-* panels)
        // ============================================================

        async function mgmtLoadHospitals() {
            const tbody = document.getElementById('tbl-hospitals');
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</td></tr>';
            try {
                const res = await fetch('../api/hospitals.php');
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                if (data.hospitals.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#94a3b8;">No hospitals registered yet.</td></tr>';
                    return;
                }
                tbody.innerHTML = '';
                data.hospitals.forEach(h => {
                    const bedsPct = h.total_beds > 0 ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0;
                    const barCol  = bedsPct > 80 ? '#ef4444' : bedsPct > 50 ? '#f59e0b' : '#22c55e';
                    const bedBar  = `<div style="width:70px;height:5px;background:#e2e8f0;border-radius:4px;overflow:hidden;display:inline-block;vertical-align:middle;margin-left:5px;"><div style="height:100%;width:${bedsPct}%;background:${barCol};"></div></div>`;
                    const typeClass = h.type === 'government' ? 'type-gov' : h.type === 'private' ? 'type-priv' : 'type-ngo';
                    tbody.innerHTML += `<tr>
                        <td><strong>${h.name}</strong><br><small style="color:#94a3b8;">${h.address || ''}</small></td>
                        <td><span class="badge ${typeClass}" style="text-transform:capitalize;padding:3px 9px;border-radius:999px;font-size:0.7rem;font-weight:700;">${h.type}</span></td>
                        <td>${h.sub_county || '—'}</td>
                        <td style="text-align:center;"><b>${h.available_beds ?? 0}</b><span style="color:#94a3b8;">/${h.total_beds ?? 0}</span>${bedBar}</td>
                        <td style="text-align:center;">${h.has_cemonc ? '<span class="cap-yes">✓ Yes</span>' : '<span class="cap-no">No</span>'}</td>
                        <td style="text-align:center;">${h.has_blood_bank ? '<span class="cap-yes">✓ Yes</span>' : '<span class="cap-no">No</span>'}</td>
                        <td style="text-align:center;">${h.has_surgical_capacity ? '<span class="cap-yes">✓ Yes</span>' : '<span class="cap-no">No</span>'}</td>
                        <td style="text-align:center;">${h.has_ambulance ? '<span class="cap-yes">✓ Yes</span>' : '<span class="cap-no">No</span>'}</td>
                        <td><small>${h.phone || '—'}</small></td>
                        <td style="white-space:nowrap;"><div class="act-cell">
                            <button class="btn-edit" onclick="openEditHospital(${h.id})">&#9998; Edit</button>
                            <button class="btn-del" onclick="deleteHospital(${h.id},'${h.name.replace(/'/g, "\\'")}')" title="Delete hospital">&#128465;</button>
                        </div></td>
                    </tr>`;
                });
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:#ef4444;">⚠ Error: ${e.message}</td></tr>`;
            }
        }

        async function mgmtLoadVehicles() {
            const tbody = document.getElementById('tbl-vehicles');
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</td></tr>';
            try {
                const res = await fetch('../api/vehicles.php');
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                if (data.vehicles.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No vehicles registered yet.</td></tr>';
                    return;
                }
                const statusMap = { available:'#dcfce7|#16a34a', en_route:'#fef3c7|#92400e', maintenance:'#fee2e2|#dc2626', off_duty:'#f1f5f9|#64748b' };
                tbody.innerHTML = '';
                data.vehicles.forEach(v => {
                    const [bg, fg] = (statusMap[v.status] || '#f1f5f9|#64748b').split('|');
                    tbody.innerHTML += `<tr>
                        <td><strong>${v.plate_number}</strong></td>
                        <td>${v.vehicle_type}</td>
                        <td>${v.hospital_name || '—'}</td>
                        <td style="text-align:center;">${v.capacity ?? 1}</td>
                        <td style="text-align:center;">${v.has_equipment ? '<span class="cap-yes">✓ Yes</span>' : '<span class="cap-no">No</span>'}</td>
                        <td style="text-align:center;"><span style="background:${bg};color:${fg};font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:999px;text-transform:capitalize;">${v.status}</span></td>
                        <td style="white-space:nowrap;"><div class="act-cell">
                            <button class="btn-edit" onclick="openEditVehicle(${v.id})">&#9998; Edit</button>
                            <button class="btn-del" onclick="deleteVehicle(${v.id},'${v.plate_number.replace(/'/g, "\\'")}')" title="Delete vehicle">&#128465;</button>
                        </div></td>
                    </tr>`;
                });
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">⚠ Error: ${e.message}</td></tr>`;
            }
        }

        async function mgmtLoadDoctors() {
            const tbody = document.getElementById('tbl-doctors');
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</td></tr>';
            try {
                const res = await fetch('../api/doctors.php');
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                if (data.doctors.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">No doctors registered yet.</td></tr>';
                    return;
                }
                tbody.innerHTML = '';
                data.doctors.forEach(d => {
                    tbody.innerHTML += `<tr>
                        <td><strong>${d.full_name}</strong></td>
                        <td><small>${d.email}</small></td>
                        <td>${d.phone}</td>
                        <td>${d.hospital_name}</td>
                        <td><small>${d.specialization || '—'}</small></td>
                        <td><small>${d.license_number || '—'}</small></td>
                        <td style="text-align:center;"><span class="${d.is_on_duty ? 'duty-on' : 'duty-off'}"></span></td>
                        <td style="white-space:nowrap;"><div class="act-cell">
                            <button class="btn-edit" onclick="openEditDoctor(${d.user_id})">&#9998; Edit</button>
                            <button class="btn-del" onclick="deleteDoctor(${d.user_id},'${d.full_name.replace(/'/g, "\\'")}')" title="Delete doctor">&#128465;</button>
                        </div></td>
                    </tr>`;
                });
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#ef4444;">⚠ Error: ${e.message}</td></tr>`;
            }
        }

        async function mgmtLoadDrivers() {
            const tbody = document.getElementById('tbl-drivers');
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">Loading drivers...</td></tr>';
            try {
                const res = await fetch('../api/drivers.php');
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                if (data.drivers.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">No drivers registered yet.</td></tr>';
                    return;
                }
                tbody.innerHTML = '';
                data.drivers.forEach(d => {
                    tbody.innerHTML += `<tr>
                        <td><strong>${d.full_name}</strong></td>
                        <td><small>${d.email}</small></td>
                        <td>${d.phone}</td>
                        <td>${d.hospital_name || '—'}</td>
                        <td>${d.plate_number ? `<span style="background:#dbeafe;color:#1d4ed8;font-size:0.72rem;font-weight:700;padding:3px 8px;border-radius:999px;">${d.plate_number}</span>` : '<span style="color:#94a3b8;">None</span>'}</td>
                        <td><small>${d.license_number || '—'}</small></td>
                        <td><small style="color:#6366f1;font-weight:600;">${d.driver_role || 'Primary Emergency Driver'}</small></td>
                        <td style="text-align:center;"><span class="${d.is_on_duty ? 'duty-on' : 'duty-off'}"></span></td>
                        <td style="white-space:nowrap;"><div class="act-cell">
                            <button class="btn-edit" onclick="openEditDriver(${d.user_id})">&#9998; Edit</button>
                            <button class="btn-del" onclick="deleteDriver(${d.user_id},'${d.full_name.replace(/'/g, "\\'")}')" title="Delete driver">&#128465;</button>
                        </div></td>
                    </tr>`;
                });
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#ef4444;">⚠ Error: ${e.message}</td></tr>`;
                console.error('mgmtLoadDrivers error:', e);
            }
        }

        async function mgmtLoadMothers() {
            const tbody = document.getElementById('tbl-mothers');
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</td></tr>';
            try {
                const res = await fetch('../api/mothers.php');
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                if (data.mothers.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">No mothers registered yet.</td></tr>';
                    return;
                }
                tbody.innerHTML = '';
                data.mothers.forEach(m => {
                    const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';
                    const btColors = {O:'#fee2e2|#b91c1c','A':'#dbeafe|#1d4ed8','B':'#dcfce7|#15803d','AB':'#f3e8ff|#7c3aed'};
                    const btBase = (m.blood_type || '').replace(/[+-]/g,'');
                    const [btBg, btFg] = (btColors[btBase] || '#f1f5f9|#64748b').split('|');
                    tbody.innerHTML += `<tr>
                        <td><strong>${m.full_name}</strong><br><small style="color:#94a3b8;">${m.email}</small></td>
                        <td>${m.phone}</td>
                        <td>${m.sub_county || '—'}<br><small style="color:#94a3b8;">${m.village || ''}</small></td>
                        <td>${fmt(m.pregnancy_start_date)}</td>
                        <td>${fmt(m.expected_due_date)}</td>
                        <td><span style="background:${btBg};color:${btFg};font-size:0.72rem;font-weight:800;padding:3px 9px;border-radius:999px;">${m.blood_type || '?'}</span></td>
                        <td><small>${m.next_of_kin_name || '—'}<br>${m.next_of_kin_phone || ''}</small></td>
                        <td style="white-space:nowrap;"><div class="act-cell">
                            <button class="btn-edit" onclick="openEditMother(${m.user_id})">&#9998; Edit</button>
                            <button class="btn-del" onclick="deleteMother(${m.user_id},'${m.full_name.replace(/'/g, "\\'")}')" title="Delete mother">&#128465;</button>
                        </div></td>
                    </tr>`;
                });
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#ef4444;">⚠ Error: ${e.message}</td></tr>`;
            }
        }

        // ============================================================
        // HOSPITALS CRUD (legacy openCreateHospital / openEditHospital / deleteHospital still work)
        // ============================================================
        async function loadCrudHospitals() { mgmtLoadHospitals(); }
        async function loadCrudVehicles()  { mgmtLoadVehicles(); }
        async function loadCrudDoctors()   { mgmtLoadDoctors(); }
        async function loadCrudDrivers()   { mgmtLoadDrivers(); }
        async function loadCrudMothers()   { mgmtLoadMothers(); }

        let hospPickMap = null;
        let hospPickMarker = null;

        function initHospitalPickMap(lat, lng) {
            const defaultLat = 0.3535;
            const defaultLng = 32.7550;
            const initialLat = parseFloat(lat) || defaultLat;
            const initialLng = parseFloat(lng) || defaultLng;

            // If map is already initialized, just set view and update marker position
            if (hospPickMap) {
                hospPickMap.setView([initialLat, initialLng], 13);
                if (hospPickMarker) {
                    hospPickMarker.setLatLng([initialLat, initialLng]);
                } else {
                    hospPickMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(hospPickMap);
                    setupMarkerEvents(hospPickMarker);
                }
                setTimeout(() => {
                    hospPickMap.invalidateSize();
                }, 200);
                return;
            }

            // Create map
            hospPickMap = L.map('hosp-map-pick').setView([initialLat, initialLng], 13);

            // Add standard OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(hospPickMap);

            // Create marker
            hospPickMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(hospPickMap);
            setupMarkerEvents(hospPickMarker);

            // Click event on map to place marker
            hospPickMap.on('click', function(e) {
                const newLat = e.latlng.lat;
                const newLng = e.latlng.lng;
                hospPickMarker.setLatLng([newLat, newLng]);
                updateHospitalCoordsInput(newLat, newLng);
            });

            function setupMarkerEvents(marker) {
                marker.on('dragend', function() {
                    const pos = marker.getLatLng();
                    updateHospitalCoordsInput(pos.lat, pos.lng);
                });
            }

            function updateHospitalCoordsInput(latVal, lngVal) {
                document.getElementById('hosp-lat').value = latVal.toFixed(6);
                document.getElementById('hosp-lng').value = lngVal.toFixed(6);
            }

            // Two-way binding for manual input updates
            const updateMarkerFromInputs = () => {
                const latVal = parseFloat(document.getElementById('hosp-lat').value);
                const lngVal = parseFloat(document.getElementById('hosp-lng').value);
                if (!isNaN(latVal) && !isNaN(lngVal)) {
                    hospPickMarker.setLatLng([latVal, lngVal]);
                    hospPickMap.setView([latVal, lngVal]);
                }
            };
            document.getElementById('hosp-lat').addEventListener('input', updateMarkerFromInputs);
            document.getElementById('hosp-lng').addEventListener('input', updateMarkerFromInputs);

            // Invalidate size after modal renders to ensure full layout loaded
            setTimeout(() => {
                hospPickMap.invalidateSize();
            }, 200);
        }

        function openCreateHospital() {
            document.getElementById('hospital-modal-title').textContent = 'Add New Hospital';
            document.getElementById('hospital-form').reset();
            document.getElementById('hosp-crud-id').value = '';
            document.getElementById('hosp-crud-action').value = 'create';
            DashboardUI.openModal('hospital-modal');
            initHospitalPickMap('', '');
        }

        async function openEditHospital(id) {
            DashboardUI.showLoading('Fetching hospital data...');
            try {
                const res = await fetch(`../api/hospitals.php?id=${id}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    const h = data.hospital;
                    document.getElementById('hospital-modal-title').textContent = 'Edit Hospital';
                    document.getElementById('hosp-crud-id').value = h.id;
                    document.getElementById('hosp-crud-action').value = 'update';
                    document.getElementById('hosp-name').value = h.name;
                    document.getElementById('hosp-type').value = h.type;
                    document.getElementById('hosp-lat').value = h.latitude;
                    document.getElementById('hosp-lng').value = h.longitude;
                    document.getElementById('hosp-address').value = h.address || '';
                    document.getElementById('hosp-sub').value = h.sub_county || '';
                    document.getElementById('hosp-hours').value = h.operating_hours || '24/7';
                    document.getElementById('hosp-phone').value = h.phone || '';
                    document.getElementById('hosp-email').value = h.email || '';
                    document.getElementById('hosp-tot-beds').value = h.total_beds || 0;
                    document.getElementById('hosp-avail-beds').value = h.available_beds || 0;
                    document.getElementById('hosp-blood-types').value = h.blood_types_available || '';
                    document.getElementById('hosp-cemonc').checked = !!h.has_cemonc;
                    document.getElementById('hosp-blood-bank').checked = !!h.has_blood_bank;
                    document.getElementById('hosp-surgical').checked = !!h.has_surgical_capacity;
                    document.getElementById('hosp-amb').checked = !!h.has_ambulance;
                    DashboardUI.openModal('hospital-modal');
                    initHospitalPickMap(h.latitude, h.longitude);
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Failed to load hospital data.'); }
        }

        async function submitHospitalForm() {
            const form = document.getElementById('hospital-form');
            if(!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k) => payload[k] = v);
            payload.has_cemonc = document.getElementById('hosp-cemonc').checked ? 1 : 0;
            payload.has_blood_bank = document.getElementById('hosp-blood-bank').checked ? 1 : 0;
            payload.has_surgical_capacity = document.getElementById('hosp-surgical').checked ? 1 : 0;
            payload.has_ambulance = document.getElementById('hosp-amb').checked ? 1 : 0;

            DashboardUI.showLoading('Saving hospital record...');
            try {
                const res = await fetch('../api/hospitals.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('hospital-modal');
                    NotificationManager.show('Saved', 'Hospital record saved successfully.', 'success');
                    loadCrudHospitals();
                    syncFacilityList();
                    loadHospitalDropdowns();
                } else {
                    alert(data.error || 'Failed to save hospital.');
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Network error.'); }
        }

        async function deleteHospital(id, name) {
            confirmDelete(`Delete hospital "${name}"? This cannot be undone.`, async () => {
                DashboardUI.showLoading('Deleting hospital...');
                try {
                    const res = await fetch('../api/hospitals.php', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({action:'delete', hospital_id: id})
                    });
                    const data = await res.json();
                    DashboardUI.hideLoading();
                    if(data.success) {
                        NotificationManager.show('Deleted', `${name} removed.`, 'info');
                        loadCrudHospitals();
                    } else { alert(data.error || 'Delete failed.'); }
                } catch(e) { DashboardUI.hideLoading(); }
            });
        }

        // ============================================================
        // VEHICLES CRUD — loadCrudVehicles() is now a wrapper around mgmtLoadVehicles() (defined above)
        // openCreateVehicle, openEditVehicle, submitVehicleForm, deleteVehicle are below:


        function openCreateVehicle() {
            document.getElementById('vehicle-modal-title').textContent = 'Add New Vehicle';
            document.getElementById('vehicle-form').reset();
            document.getElementById('veh-crud-id').value = '';
            document.getElementById('veh-crud-action').value = 'create';
            loadHospitalDropdowns();
            DashboardUI.openModal('vehicle-modal');
        }

        async function openEditVehicle(id) {
            DashboardUI.showLoading('Fetching vehicle data...');
            try {
                const res = await fetch(`../api/vehicles.php?id=${id}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    const v = data.vehicle;
                    await loadHospitalDropdowns();
                    document.getElementById('vehicle-modal-title').textContent = 'Edit Vehicle';
                    document.getElementById('veh-crud-id').value = v.id;
                    document.getElementById('veh-crud-action').value = 'update';
                    document.getElementById('veh-plate').value = v.plate_number;
                    document.getElementById('veh-type').value = v.vehicle_type;
                    document.getElementById('veh-capacity').value = v.capacity;
                    document.getElementById('veh-hosp').value = v.hospital_id;
                    document.getElementById('veh-status').value = v.status;
                    document.getElementById('veh-equip').checked = !!v.has_equipment;
                    DashboardUI.openModal('vehicle-modal');
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Failed to load vehicle data.'); }
        }

        async function submitVehicleForm() {
            const form = document.getElementById('vehicle-form');
            if(!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k) => payload[k] = v);
            payload.has_equipment = document.getElementById('veh-equip').checked ? 1 : 0;

            DashboardUI.showLoading('Saving vehicle record...');
            try {
                const res = await fetch('../api/vehicles.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('vehicle-modal');
                    NotificationManager.show('Saved', 'Vehicle record saved.', 'success');
                    loadCrudVehicles();
                    loadVehicleDropdowns();
                } else { alert(data.error || 'Failed to save vehicle.'); }
            } catch(e) { DashboardUI.hideLoading(); alert('Network error.'); }
        }

        async function deleteVehicle(id, plate) {
            confirmDelete(`Delete vehicle "${plate}"?`, async () => {
                DashboardUI.showLoading('Deleting vehicle...');
                try {
                    const res = await fetch('../api/vehicles.php', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({action:'delete', vehicle_id: id})
                    });
                    const data = await res.json();
                    DashboardUI.hideLoading();
                    if(data.success) { NotificationManager.show('Deleted', `${plate} removed.`, 'info'); loadCrudVehicles(); }
                    else { alert(data.error || 'Delete failed.'); }
                } catch(e) { DashboardUI.hideLoading(); }
            });
        }

        // DOCTORS CRUD — loadCrudDoctors() is now a wrapper around mgmtLoadDoctors() (defined above)

        function openCreateDoctor() {
            document.getElementById('doctor-modal-title').textContent = 'Add New Doctor';
            document.getElementById('doctor-form').reset();
            document.getElementById('doc-crud-id').value = '';
            document.getElementById('doc-crud-action').value = 'create';
            document.getElementById('doc-pass').required = true;
            document.getElementById('doc-pass-note').textContent = '(Required for new accounts)';
            loadHospitalDropdowns();
            DashboardUI.openModal('doctor-modal');
        }

        async function openEditDoctor(userId) {
            DashboardUI.showLoading('Fetching doctor data...');
            try {
                const res = await fetch(`../api/doctors.php?user_id=${userId}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    const d = data.doctor;
                    await loadHospitalDropdowns();
                    document.getElementById('doctor-modal-title').textContent = 'Edit Doctor';
                    document.getElementById('doc-crud-id').value = d.user_id;
                    document.getElementById('doc-crud-action').value = 'update';
                    document.getElementById('doc-name').value = d.full_name;
                    document.getElementById('doc-email').value = d.email;
                    document.getElementById('doc-phone').value = d.phone;
                    document.getElementById('doc-hosp').value = d.hospital_id;
                    document.getElementById('doc-spec').value = d.specialization || '';
                    document.getElementById('doc-license').value = d.license_number || '';
                    document.getElementById('doc-exp').value = d.years_experience || 0;
                    document.getElementById('doc-pass').required = false;
                    document.getElementById('doc-pass').value = '';
                    document.getElementById('doc-pass-note').textContent = '(Leave blank to keep current)';
                    DashboardUI.openModal('doctor-modal');
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Failed to load doctor data.'); }
        }

        async function submitDoctorForm() {
            const form = document.getElementById('doctor-form');
            if(!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k) => { if(v !== '') payload[k] = v; });

            DashboardUI.showLoading('Saving doctor record...');
            try {
                const res = await fetch('../api/doctors.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('doctor-modal');
                    NotificationManager.show('Saved', 'Doctor record saved.', 'success');
                    loadCrudDoctors();
                } else { alert(data.error || 'Failed to save doctor.'); }
            } catch(e) { DashboardUI.hideLoading(); alert('Network error.'); }
        }

        async function deleteDoctor(userId, name) {
            confirmDelete(`Delete doctor "${name}"? This will remove their account.`, async () => {
                DashboardUI.showLoading('Deleting doctor...');
                try {
                    const res = await fetch('../api/doctors.php', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({action:'delete', doctor_user_id: userId})
                    });
                    const data = await res.json();
                    DashboardUI.hideLoading();
                    if(data.success) { NotificationManager.show('Deleted', `${name} removed.`, 'info'); loadCrudDoctors(); }
                    else { alert(data.error || 'Delete failed.'); }
                } catch(e) { DashboardUI.hideLoading(); }
            });
        }

        // DRIVERS CRUD — loadCrudDrivers() is now a wrapper around mgmtLoadDrivers() (defined above)

        function openCreateDriver() {
            document.getElementById('driver-modal-title').textContent = 'Add New Driver';
            document.getElementById('driver-form').reset();
            document.getElementById('drv-crud-id').value = '';
            document.getElementById('drv-crud-action').value = 'create';
            document.getElementById('drv-pass').required = true;
            document.getElementById('drv-pass-note').textContent = '(Required for new accounts)';
            loadHospitalDropdowns();
            loadVehicleDropdowns();
            DashboardUI.openModal('driver-modal');
        }

        async function openEditDriver(userId) {
            DashboardUI.showLoading('Fetching driver data...');
            try {
                const res = await fetch(`../api/drivers.php?user_id=${userId}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    const d = data.driver;
                    await loadHospitalDropdowns();
                    await loadVehicleDropdowns();
                    document.getElementById('driver-modal-title').textContent = 'Edit Driver';
                    document.getElementById('drv-crud-id').value = d.user_id;
                    document.getElementById('drv-crud-action').value = 'update';
                    document.getElementById('drv-name').value = d.full_name;
                    document.getElementById('drv-email').value = d.email;
                    document.getElementById('drv-phone').value = d.phone;
                    document.getElementById('drv-hosp').value = d.hospital_id;
                    document.getElementById('drv-veh').value = d.vehicle_id || '';
                    document.getElementById('drv-license').value = d.license_number || '';
                    document.getElementById('drv-role').value = d.driver_role || 'Primary Emergency Driver';
                    document.getElementById('drv-pass').required = false;
                    document.getElementById('drv-pass').value = '';
                    document.getElementById('drv-pass-note').textContent = '(Leave blank to keep current)';
                    DashboardUI.openModal('driver-modal');
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Failed to load driver data.'); }
        }

        async function submitDriverForm() {
            const form = document.getElementById('driver-form');
            if(!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k) => { if(v !== '') payload[k] = v; });

            DashboardUI.showLoading('Saving driver record...');
            try {
                const res = await fetch('../api/drivers.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('driver-modal');
                    NotificationManager.show('Saved', 'Driver record saved.', 'success');
                    loadCrudDrivers();
                } else { alert(data.error || 'Failed to save driver.'); }
            } catch(e) { DashboardUI.hideLoading(); alert('Network error.'); }
        }

        async function deleteDriver(userId, name) {
            confirmDelete(`Delete driver "${name}"? This will remove their account.`, async () => {
                DashboardUI.showLoading('Deleting driver...');
                try {
                    const res = await fetch('../api/drivers.php', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({action:'delete', driver_user_id: userId})
                    });
                    const data = await res.json();
                    DashboardUI.hideLoading();
                    if(data.success) { NotificationManager.show('Deleted', `${name} removed.`, 'info'); loadCrudDrivers(); }
                    else { alert(data.error || 'Delete failed.'); }
                } catch(e) { DashboardUI.hideLoading(); }
            });
        }

        // MOTHERS CRUD — loadCrudMothers() is now a wrapper around mgmtLoadMothers() (defined above)

        function openCreateMother() {
            document.getElementById('mother-modal-title').textContent = 'Add New Mother';
            document.getElementById('mother-form').reset();
            document.getElementById('mth-crud-id').value = '';
            document.getElementById('mth-crud-action').value = 'create_admin';
            document.getElementById('mth-pass').required = true;
            document.getElementById('mth-pass-note').textContent = '(Required for new accounts)';
            DashboardUI.openModal('mother-modal');
        }

        async function openEditMother(userId) {
            DashboardUI.showLoading('Fetching mother data...');
            try {
                const res = await fetch(`../api/mothers.php?id=${userId}`);
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    const m = data.mother;
                    document.getElementById('mother-modal-title').textContent = 'Edit Mother Record';
                    document.getElementById('mth-crud-id').value = m.user_id;
                    document.getElementById('mth-crud-action').value = 'update_admin';
                    document.getElementById('mth-name').value = m.full_name;
                    document.getElementById('mth-email').value = m.email;
                    document.getElementById('mth-phone').value = m.phone;
                    document.getElementById('mth-dob').value = m.date_of_birth || '';
                    document.getElementById('mth-blood').value = m.blood_type || '';
                    document.getElementById('mth-pstart').value = m.pregnancy_start_date || '';
                    document.getElementById('mth-gravida').value = m.gravida || 1;
                    document.getElementById('mth-parity').value = m.parity || 0;
                    document.getElementById('mth-history').value = m.medical_history || '';
                    document.getElementById('mth-sub').value = m.sub_county || '';
                    document.getElementById('mth-village').value = m.village || '';
                    document.getElementById('mth-nok-name').value = m.next_of_kin_name || '';
                    document.getElementById('mth-nok-phone').value = m.next_of_kin_phone || '';
                    document.getElementById('mth-nok-rel').value = m.next_of_kin_relationship || '';
                    document.getElementById('mth-pass').required = false;
                    document.getElementById('mth-pass').value = '';
                    document.getElementById('mth-pass-note').textContent = '(Leave blank to keep current)';
                    DashboardUI.openModal('mother-modal');
                }
            } catch(e) { DashboardUI.hideLoading(); alert('Failed to load mother data.'); }
        }

        async function submitMotherForm() {
            const form = document.getElementById('mother-form');
            if(!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k) => { if(v !== '') payload[k] = v; });

            DashboardUI.showLoading('Saving mother record...');
            try {
                const res = await fetch('../api/mothers.php', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                DashboardUI.hideLoading();
                if(data.success) {
                    DashboardUI.closeModal('mother-modal');
                    NotificationManager.show('Saved', 'Mother record saved.', 'success');
                    loadCrudMothers();
                } else { alert(data.error || 'Failed to save mother.'); }
            } catch(e) { DashboardUI.hideLoading(); alert('Network error.'); }
        }

        async function deleteMother(userId, name) {
            confirmDelete(`Delete "${name}"? All records will be removed.`, async () => {
                DashboardUI.showLoading('Deleting mother record...');
                try {
                    const res = await fetch('../api/mothers.php', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({action:'delete', mother_user_id: userId})
                    });
                    const data = await res.json();
                    DashboardUI.hideLoading();
                    if(data.success) { NotificationManager.show('Deleted', `${name} removed.`, 'info'); loadCrudMothers(); }
                    else { alert(data.error || 'Delete failed.'); }
                } catch(e) { DashboardUI.hideLoading(); }
            });
        }

        // ============================================================
        // PERFORMANCE MONITORING & TELEMETRY
        // ============================================================
        const telemetry = {
            totalRequests: 0,
            successRequests: 0,
            totalLatency: 0,
            totalExecTime: 0,
            execTimeCount: 0
        };

        // Initialize Browser Navigation Timing
        function initPageLoadMetrics() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    try {
                        let dns = 0, tcp = 0, ttfb = 0, dom = 0, total = 0;
                        const nav = performance.getEntriesByType('navigation')[0];
                        if (nav) {
                            dns = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
                            tcp = Math.round(nav.connectEnd - nav.connectStart);
                            ttfb = Math.round(nav.responseStart - nav.requestStart);
                            dom = Math.round(nav.domInteractive - nav.responseEnd);
                            total = Math.round(nav.loadEventEnd - nav.startTime);
                        } else if (performance.timing) {
                            const t = performance.timing;
                            dns = Math.round(t.domainLookupEnd - t.domainLookupStart);
                            tcp = Math.round(t.connectEnd - t.connectStart);
                            ttfb = Math.round(t.responseStart - t.requestStart);
                            dom = Math.round(t.domInteractive - t.responseEnd);
                            total = Math.round(t.loadEventEnd - t.navigationStart);
                        }

                        dns = Math.max(0, dns);
                        tcp = Math.max(0, tcp);
                        ttfb = Math.max(0, ttfb);
                        dom = Math.max(0, dom);
                        total = Math.max(0, total);

                        const elDns = document.getElementById('load-dns');
                        const elTcp = document.getElementById('load-tcp');
                        const elTtfb = document.getElementById('load-ttfb');
                        const elDom = document.getElementById('load-dom');
                        const elTotal = document.getElementById('load-total');

                        if (elDns) elDns.innerHTML = `${dns}<span class="perf-unit">ms</span>`;
                        if (elTcp) elTcp.innerHTML = `${tcp}<span class="perf-unit">ms</span>`;
                        if (elTtfb) elTtfb.innerHTML = `${ttfb}<span class="perf-unit">ms</span>`;
                        if (elDom) elDom.innerHTML = `${dom}<span class="perf-unit">ms</span>`;
                        if (elTotal) elTotal.innerHTML = `${total}<span class="perf-unit">ms</span>`;

                        const barDns = document.getElementById('bar-dns');
                        const barTcp = document.getElementById('bar-tcp');
                        const barTtfb = document.getElementById('bar-ttfb');
                        const barDom = document.getElementById('bar-dom');
                        const barTotal = document.getElementById('bar-total');

                        if (barDns) barDns.style.width = `${Math.min(100, (dns / 150) * 100)}%`;
                        if (barTcp) barTcp.style.width = `${Math.min(100, (tcp / 200) * 100)}%`;
                        if (barTtfb) barTtfb.style.width = `${Math.min(100, (ttfb / 400) * 100)}%`;
                        if (barDom) barDom.style.width = `${Math.min(100, (dom / 800) * 100)}%`;
                        if (barTotal) barTotal.style.width = `${Math.min(100, (total / 2000) * 100)}%`;
                    } catch (e) {
                        console.warn('Performance navigation timing unsupported or failed', e);
                    }
                }, 100);
            });
        }

        // Global Fetch Interceptor wrapper
        function setupFetchInterceptor() {
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const startTime = performance.now();
                let urlStr = '';
                if (args[0] && typeof args[0] === 'object' && args[0].url) {
                    urlStr = args[0].url;
                } else {
                    urlStr = String(args[0]);
                }
                
                const isAPI = urlStr.includes('/api/');
                let endpoint = '';
                try {
                    const urlObj = new URL(urlStr, window.location.origin);
                    endpoint = urlObj.pathname.split('/').pop();
                } catch(e) {
                    endpoint = urlStr.split('/').pop().split('?')[0];
                }

                try {
                    const response = await originalFetch(...args);
                    const latency = Math.round(performance.now() - startTime);

                    if (isAPI) {
                        const clone = response.clone();
                        clone.json().then(data => {
                            let serverExec = null;
                            if (data && typeof data.execution_time_ms !== 'undefined') {
                                serverExec = data.execution_time_ms;
                            }
                            logAPIRequest(endpoint, response.status, latency, serverExec);
                        }).catch(() => {
                            logAPIRequest(endpoint, response.status, latency, null);
                        });
                    }
                    return response;
                } catch (error) {
                    const latency = Math.round(performance.now() - startTime);
                    if (isAPI) {
                        logAPIRequest(endpoint, 0, latency, null, true);
                    }
                    throw error;
                }
            };
        }

        function logAPIRequest(endpoint, status, latency, serverExec, isNetworkError = false) {
            telemetry.totalRequests++;
            if (status >= 200 && status < 300) {
                telemetry.successRequests++;
            }
            telemetry.totalLatency += latency;
            if (serverExec !== null) {
                telemetry.totalExecTime += serverExec;
                telemetry.execTimeCount++;
            }

            const avgLatency = Math.round(telemetry.totalLatency / telemetry.totalRequests);
            const avgExec = telemetry.execTimeCount > 0 ? Math.round(telemetry.totalExecTime / telemetry.execTimeCount) : '—';
            const rate = Math.round((telemetry.successRequests / telemetry.totalRequests) * 100);

            const elAvgLatency = document.getElementById('telemetry-avg-latency');
            const elAvgExec = document.getElementById('telemetry-avg-exec');
            const elTotalReq = document.getElementById('telemetry-total-req');
            const elSuccessRate = document.getElementById('telemetry-success-rate');

            if (elAvgLatency) elAvgLatency.innerHTML = `${avgLatency}<span class="perf-unit">ms</span>`;
            if (elAvgExec) elAvgExec.innerHTML = avgExec !== '—' ? `${avgExec}<span class="perf-unit">ms</span>` : '—';
            if (elTotalReq) elTotalReq.textContent = telemetry.totalRequests;
            if (elSuccessRate) elSuccessRate.textContent = `${rate}%`;

            const logBody = document.getElementById('perf-log-body');
            if (logBody) {
                if (telemetry.totalRequests === 1) {
                    logBody.innerHTML = '';
                }

                let statusPill = `<span class="status-pill error">ERR</span>`;
                if (status >= 200 && status < 300) {
                    statusPill = `<span class="status-pill success">${status} OK</span>`;
                } else if (status > 0) {
                    statusPill = `<span class="status-pill error">${status}</span>`;
                }

                let latClass = 'latency-fast';
                if (latency > 300) latClass = 'latency-med';
                if (latency > 800) latClass = 'latency-slow';

                const serverTimeText = serverExec !== null ? `${serverExec} ms` : '—';

                const rowHTML = `
                    <tr>
                        <td><strong>${endpoint}</strong></td>
                        <td>${statusPill}</td>
                        <td class="${latClass}">${latency} ms</td>
                        <td style="color:var(--text-secondary);">${serverTimeText}</td>
                    </tr>
                `;

                logBody.insertAdjacentHTML('afterbegin', rowHTML);
                while (logBody.children.length > 12) {
                    logBody.removeChild(logBody.lastChild);
                }
            }
        }

        // Initialize Performance Modules
        initPageLoadMetrics();
        setupFetchInterceptor();
    </script>
</body>
</html>

