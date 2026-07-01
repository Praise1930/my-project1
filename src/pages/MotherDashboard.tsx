// MamaTrack GPS — Expectant Mother Dashboard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, UserService, EmergencyService, NotificationService, SimulationEngine, User, Mother, Emergency, CheckupSchedule, Notification } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { Bell, Calendar, LogOut } from 'lucide-react';

export const MotherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Mother | null>(null);
  const [activeTab, setActiveTab] = useState<'emergency' | 'checkups' | 'anc-timeline' | 'profile'>('emergency');
  
  // States for active emergency
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [requireCemonc, setRequireCemonc] = useState(false);
  
  // Profile update form state
  const [profileForm, setProfileForm] = useState({
    sub_county: '',
    village: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
    medical_history: ''
  });

  // Notifications states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Lists
  const [checkups, setCheckups] = useState<CheckupSchedule[]>([]);

  // 1. Authentication check
  useEffect(() => {
    const sessionUser = db.getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== 'mother') {
      navigate('/login?role=mother');
      return;
    }
    setUser(sessionUser);

    const motherData = UserService.getMotherData(sessionUser.id);
    if (motherData) {
      setProfile(motherData.profile);
      setProfileForm({
        sub_county: motherData.profile.sub_county,
        village: motherData.profile.village,
        next_of_kin_name: motherData.profile.next_of_kin_name,
        next_of_kin_phone: motherData.profile.next_of_kin_phone,
        next_of_kin_relationship: motherData.profile.next_of_kin_relationship,
        medical_history: motherData.profile.medical_history
      });
    }

    // Load static lists
    setCheckups(db.checkups.filter(c => c.mother_id === sessionUser.id));
    setNotifications(NotificationService.getNotificationsForUser(sessionUser.id));

    // Get active emergency
    const emg = EmergencyService.getActiveEmergencyForMother(sessionUser.id);
    setActiveEmergency(emg);
  }, [navigate]);

  // 2. Poll active emergency status or run simulation
  useEffect(() => {
    if (!activeEmergency) return;
    
    // If en route, start simulation listener
    if (['dispatched', 'en_route'].includes(activeEmergency.status)) {
      SimulationEngine.startAmbulanceSimulation(activeEmergency.id, (updatedEmg) => {
        setActiveEmergency(updatedEmg);
        // Refresh notifications
        if (user) {
          setNotifications(NotificationService.getNotificationsForUser(user.id));
        }
      });
    }

    // Simple poller to check if status updates elsewhere (e.g. Admin dispatches it)
    const poller = setInterval(() => {
      if (user) {
        const freshEmg = EmergencyService.getActiveEmergencyForMother(user.id);
        if (JSON.stringify(freshEmg) !== JSON.stringify(activeEmergency)) {
          setActiveEmergency(freshEmg);
          setNotifications(NotificationService.getNotificationsForUser(user.id));
        }
      }
    }, 3000);

    return () => {
      clearInterval(poller);
      if (activeEmergency) {
        SimulationEngine.stopSimulation(activeEmergency.id);
      }
    };
  }, [activeEmergency?.id, activeEmergency?.status, user]);

  if (!user || !profile) return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Loading Mother Profile...</div>;

  // Calculate Pregnancy Progress
  const calculateWeeks = () => {
    const start = new Date(profile.pregnancy_start_date);
    const diff = new Date().getTime() - start.getTime();
    return Math.max(1, Math.min(42, Math.floor(diff / (1000 * 60 * 60 * 24 * 7))));
  };
  const weeks = calculateWeeks();
  const trimester = weeks <= 12 ? '1st Trimester' : weeks <= 26 ? '2nd Trimester' : '3rd Trimester';
  const progressPercent = Math.round((weeks / 40) * 100);

  // Map settings
  const motherLat = profile.home_latitude || 0.353;
  const motherLng = profile.home_longitude || 32.754;

  const getMapMarkers = (): MapMarker[] => {
    const list: MapMarker[] = [
      { id: 'mother', lat: motherLat, lng: motherLng, type: 'mother', label: 'My Location', sublabel: profileForm.village }
    ];

    if (activeEmergency) {
      list.push({ id: 'emergency', lat: activeEmergency.latitude, lng: activeEmergency.longitude, type: 'emergency', label: 'SOS Location' });

      if (activeEmergency.driver_id) {
        const driverProfile = db.drivers.find(d => d.user_id === activeEmergency.driver_id);
        const driverUser = db.users.find(u => u.id === activeEmergency.driver_id);
        if (driverProfile) {
          list.push({
            id: 'driver',
            lat: driverProfile.current_latitude,
            lng: driverProfile.current_longitude,
            type: 'driver',
            label: `Ambulance: ${driverUser?.full_name || 'Dispatch'}`,
            sublabel: activeEmergency.eta_minutes ? `ETA: ${activeEmergency.eta_minutes} mins` : 'En Route'
          });
        }
      }

      if (activeEmergency.hospital_id) {
        const hosp = db.hospitals.find(h => h.id === activeEmergency.hospital_id);
        if (hosp) {
          list.push({ id: 'hospital', lat: hosp.latitude, lng: hosp.longitude, type: 'hospital', label: hosp.name, sublabel: hosp.phone });
        }
      }
    } else {
      // Show near hospitals by default
      db.hospitals.forEach(h => {
        list.push({ id: `hosp-${h.id}`, lat: h.latitude, lng: h.longitude, type: 'hospital', label: h.name });
      });
    }

    return list;
  };

  const getRoutePoints = (): [number, number][] => {
    if (activeEmergency && activeEmergency.driver_id) {
      const driverProfile = db.drivers.find(d => d.user_id === activeEmergency.driver_id);
      if (driverProfile) {
        return [
          [driverProfile.current_latitude, driverProfile.current_longitude],
          [activeEmergency.latitude, activeEmergency.longitude]
        ];
      }
    }
    return [];
  };

  // SOS Emergency activation
  const handleTriggerSOS = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSOS = () => {
    setShowConfirmModal(false);
    const newEmg = EmergencyService.triggerEmergency(
      user.id,
      motherLat,
      motherLng,
      emergencyNotes,
      requireCemonc
    );
    setActiveEmergency(newEmg);
    setEmergencyNotes('');
    setRequireCemonc(false);
  };

  const handleCancelSOS = () => {
    if (!activeEmergency) return;
    if (window.confirm('Are you sure you want to cancel your emergency dispatch request?')) {
      const updated = EmergencyService.cancelEmergency(activeEmergency.id, 'Cancelled by patient', user.id);
      setActiveEmergency(null);
      // Stop simulation
      SimulationEngine.stopSimulation(updated.id);
      // Reload page list
      setNotifications(NotificationService.getNotificationsForUser(user.id));
    }
  };

  // Form Submit
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    UserService.updateMotherProfile(user.id, profileForm);
    alert('Profile information updated successfully!');
  };

  // WHO Milestones
  const whoMilestones = [
    { visit: 1, weeks: '8-12', minWeek: 8, label: 'First ANC Contact', desc: 'Confirm pregnancy, conduct base blood panel, test for HIV/syphilis, prescribe iron/folate.' },
    { visit: 2, weeks: '16', minWeek: 16, label: 'Second ANC Visit', desc: 'Assess blood pressure, monitor fetal movement, discuss maternal health birth plans.' },
    { visit: 3, weeks: '20', minWeek: 20, label: 'Foetal Anomaly Scan', desc: 'Ultrasound screening to verify physical organ development, limbs, and placenta position.' },
    { visit: 4, weeks: '24-26', minWeek: 24, label: 'Gestational Diabetes Test', desc: 'Glucose testing, anemia panel check, administer Tetanus Toxoid (TT2) vaccination.' },
    { visit: 5, weeks: '28', minWeek: 28, label: 'Third Trimester Begins', desc: 'Administer Anti-D if Rh-negative. Review danger signs (bleeding, swelling).' },
    { visit: 6, weeks: '32', minWeek: 32, label: 'Foetal Growth Review', desc: 'Fetal positioning check, blood pressure assessment, check kick counts.' },
    { visit: 7, weeks: '36', minWeek: 36, label: 'Pre-Labour Assessment', desc: 'Determine cephalic (head down) engagement. Finalize hospital bag list and transportation.' },
    { visit: 8, weeks: '38-40', minWeek: 38, label: 'Final Birth Check', desc: 'Final clinical assessment, sweep membrane options, confirm 24/7 dispatcher contacts.' }
  ];

  return (
    <div className="mother-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="mother-bg" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🤰</div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>MamaTrack</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maternal Dispatch Portal</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className={`nav-item ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>
                <span className="nav-icon">🚨</span>
                <span>Emergency Hub</span>
              </div>
              <div className={`nav-item ${activeTab === 'checkups' ? 'active' : ''}`} onClick={() => setActiveTab('checkups')}>
                <span className="nav-icon">📅</span>
                <span>ANC Schedules</span>
              </div>
              <div className={`nav-item ${activeTab === 'anc-timeline' ? 'active' : ''}`} onClick={() => setActiveTab('anc-timeline')}>
                <span className="nav-icon">🗓️</span>
                <span>ANC Timeline</span>
              </div>
              <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <span className="nav-icon">👤</span>
                <span>My Profile</span>
              </div>
            </div>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #a855f7)' }}>🤰</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name}</div>
              <div className="user-role" style={{ fontSize: '0.7rem', color: '#ff8080' }}>{trimester} ({weeks}w)</div>
            </div>
            <button className="btn-logout" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Maternal Emergency Response</h1>
              <p className="header-greeting" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Welcome, {user.full_name}</p>
            </div>

            {/* Notifications Dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', position: 'relative' }}>
                <Bell size={18} />
                {notifications.some(n => !n.is_read) && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--rose-500)', width: '10px', height: '10px', borderRadius: '50%' }} />
                )}
              </button>

              {showNotifications && (
                <div className="card-glass" style={{ position: 'absolute', right: 0, top: '48px', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 999, border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Alert Notifications</strong>
                    <button onClick={() => { NotificationService.markAllAsRead(user.id); setNotifications(NotificationService.getNotificationsForUser(user.id)); }} style={{ background: 'none', border: 'none', color: 'var(--rose-400)', fontSize: '0.7rem', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>No messages</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '8px', borderRadius: '6px', background: n.is_read ? 'transparent' : 'rgba(244,63,94,0.06)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px', opacity: n.is_read ? 0.7 : 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 600 : 700, color: n.type === 'emergency' ? 'var(--rose-400)' : '#fff' }}>{n.title}</span>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.message}</p>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </header>

          {/* TAB 1: EMERGENCY CENTER */}
          {activeTab === 'emergency' && (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', flex: 1 }}>
              {/* Left trigger panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card card-glass text-center" style={{ padding: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Need Urgent Medical Rescue?</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '10px 0 20px', lineHeight: 1.5 }}>
                    Press the button below. The system will auto-dispatch the nearest available ambulance, map your coordinates, and alert an Obstetrician at the hospital.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {!activeEmergency ? (
                      <button className="emergency-btn" onClick={handleTriggerSOS}>
                        <span className="btn-emoji">🆘</span>
                        <span style={{ fontWeight: 800 }}>Trigger SOS</span>
                      </button>
                    ) : (
                      <div className="emergency-btn triggered">
                        <span className="btn-emoji">🚨</span>
                        <span>SOS Active</span>
                      </div>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!activeEmergency ? (
                        <span>Tap to dispatch ambulance</span>
                      ) : (
                        <>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 10px #f97316', animation: 'active-emergency-pulse 1s infinite alternate' }} />
                          <span style={{ color: '#fdba74', fontWeight: 700 }}>GPS Beacon Actively Broadcasting Location</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Tracking Progress */}
                {activeEmergency && (
                  <div className="card card-glass" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>🚨 Rescue Status</h3>
                      <span className="badge badge-amber" style={{ background: activeEmergency.status === 'arrived' ? 'var(--success-700)' : 'var(--warning-600)' }}>
                        {activeEmergency.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="status-tracker">
                      <div className="status-steps" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        <div className={`status-step ${['pending', 'verified', 'dispatched', 'en_route', 'arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : ''}`}>
                          <div className="step-circle">🆘</div>
                          <div className="step-label" style={{ fontSize: '0.65rem' }}>SOS</div>
                        </div>
                        <div className={`status-step ${['dispatched', 'en_route', 'arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : activeEmergency.status === 'verified' ? 'active' : ''}`}>
                          <div className="step-circle">📡</div>
                          <div className="step-label" style={{ fontSize: '0.65rem' }}>Dispatched</div>
                        </div>
                        <div className={`status-step ${['arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : activeEmergency.status === 'en_route' ? 'active' : ''}`}>
                          <div className="step-circle">🚑</div>
                          <div className="step-label" style={{ fontSize: '0.65rem' }}>En-Route</div>
                        </div>
                        <div className={`status-step ${activeEmergency.status === 'completed' ? 'completed' : activeEmergency.status === 'arrived' ? 'active' : ''}`}>
                          <div className="step-circle">🏥</div>
                          <div className="step-label" style={{ fontSize: '0.65rem' }}>Arrived</div>
                        </div>
                      </div>

                      <div className="nav-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f97316' }}>
                            {activeEmergency.eta_minutes !== null ? `${activeEmergency.eta_minutes} Min` : 'Calculating'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ambulance ETA</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                            {activeEmergency.driver_id ? db.users.find(u => u.id === activeEmergency.driver_id)?.full_name.split(' ')[0] : 'Searching'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Assigned Driver</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#cbd5e1' }}>
                            {activeEmergency.vehicle_id ? db.vehicles.find(v => v.id === activeEmergency.vehicle_id)?.plate_number : '-'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Plate No</div>
                        </div>
                      </div>

                      <button className="cancel-alert-btn" onClick={handleCancelSOS}>
                        Cancel Rescue Beacon
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Map view */}
              <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 12px', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>📍 Live Tracking Map</h3>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)', animation: 'active-emergency-pulse 1.5s infinite alternate' }} />
                    Live Tracking (±15m)
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: '350px', position: 'relative' }}>
                  <MapComponent
                    center={[motherLat, motherLng]}
                    zoom={13}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                    emergencyCircle={activeEmergency ? { lat: activeEmergency.latitude, lng: activeEmergency.longitude, radius: 400 } : null}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANC CHECKUPS */}
          {activeTab === 'checkups' && (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
              {/* Pregnancy Stats Card */}
              <div className="card card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Pregnancy Progress</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f43f5e', margin: '15px 0 5px' }}>{weeks} Weeks</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{trimester}</div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Progress to Delivery</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%`, background: 'var(--accent-gradient)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                    <span>📅</span> Expected Due Date: <strong style={{ color: '#f43f5e' }}>{new Date(profile.expected_due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              {/* ANC visits list */}
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Antenatal Care (ANC) Appointments</h3>
                {checkups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Calendar size={40} style={{ strokeWidth: 1.5, color: 'var(--text-muted)' }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>No checkup schedules logged. Visit your nearest matched clinic to add records.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {checkups.map(c => {
                      const dt = new Date(c.scheduled_date);
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ background: c.status === 'completed' ? '#16a34a' : 'rgba(255,255,255,0.06)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>{dt.getDate()}</span>
                            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{dt.toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.checkup_type}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.notes}</div>
                          </div>
                          <span className={`badge ${c.status === 'completed' ? 'badge-green' : c.status === 'upcoming' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ANC TIMELINE */}
          {activeTab === 'anc-timeline' && (
            <div className="card card-glass" style={{ padding: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>🗓️ WHO Antenatal Care Progress Timeline</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  The World Health Organization recommends at least 8 ANC contacts. Expand each visit milestone to understand details.
                </p>
              </div>

              {/* Visit Tracker details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {whoMilestones.map((m) => {
                  const isDone = checkups.some(c => c.status === 'completed' && c.checkup_type.toLowerCase().includes(String(m.visit)));
                  const isCurrent = weeks >= m.minWeek && !isDone;
                  
                  let dotColor = '#334155';
                  let badgeText = 'Future';
                  let cardBorder = 'var(--border)';

                  if (isDone) {
                    dotColor = 'var(--success-500)';
                    badgeText = 'Completed';
                    cardBorder = 'rgba(16,185,129,0.3)';
                  } else if (isCurrent) {
                    dotColor = 'var(--warning-500)';
                    badgeText = 'Due Now';
                    cardBorder = 'rgba(245,158,11,0.4)';
                  }

                  return (
                    <div key={m.visit} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                        <div style={{ background: dotColor, width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', marginTop: '4px', zIndex: 1 }} />
                        <div style={{ flex: 1, width: '2px', background: 'var(--border)', margin: '4px 0' }} />
                      </div>
                      <div className="card-glass" style={{ flex: 1, padding: '10px 14px', border: `1px solid ${cardBorder}`, borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Visit {m.visit}: {m.label} (Week {m.weeks})</span>
                          <span className={`badge ${isDone ? 'badge-green' : isCurrent ? 'badge-amber' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>{badgeText}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="card card-glass" style={{ maxWidth: '550px', margin: '0 auto', width: '100%', padding: '2rem' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div className="profile-avatar-large" style={{ margin: '0 auto 10px', background: 'linear-gradient(135deg, var(--rose-400), var(--purple-400))', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%' }}>🤰</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{user.full_name}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--rose-400)' }}>Maternal ID: MT-{String(profile.id).padStart(5, '0')}</span>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sub County</label>
                    <select className="form-input" value={profileForm.sub_county} onChange={e => setProfileForm({ ...profileForm, sub_county: e.target.value })}>
                      <option value="Goma">Goma</option>
                      <option value="Nama">Nama</option>
                      <option value="Mukono Municipality">Mukono Municipality</option>
                      <option value="Koome">Koome</option>
                      <option value="Ntenjeru">Ntenjeru</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Village / Ward</label>
                    <input type="text" className="form-input" value={profileForm.village} onChange={e => setProfileForm({ ...profileForm, village: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Kin Contact Name</label>
                    <input type="text" className="form-input" value={profileForm.next_of_kin_name} onChange={e => setProfileForm({ ...profileForm, next_of_kin_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input type="text" className="form-input" value={profileForm.next_of_kin_relationship} onChange={e => setProfileForm({ ...profileForm, next_of_kin_relationship: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Kin Phone Number</label>
                  <input type="tel" className="form-input" value={profileForm.next_of_kin_phone} onChange={e => setProfileForm({ ...profileForm, next_of_kin_phone: e.target.value })} required />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Medical History / Allergies</label>
                  <textarea className="form-input" style={{ minHeight: '80px', padding: '8px', resize: 'vertical' }} value={profileForm.medical_history} onChange={e => setProfileForm({ ...profileForm, medical_history: e.target.value })} />
                </div>

                <button type="submit" className="btn btn-rose btn-block" style={{ background: 'var(--accent-gradient)', border: 'none', fontWeight: 800 }}>
                  Update Profile Details
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <div className="nav-items">
          <div className={`nav-item ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>
            <span className="nav-icon">🚨</span>
            <span>Emergency</span>
          </div>
          <div className={`nav-item ${activeTab === 'checkups' ? 'active' : ''}`} onClick={() => setActiveTab('checkups')}>
            <span className="nav-icon">📅</span>
            <span>Schedules</span>
          </div>
          <div className={`nav-item ${activeTab === 'anc-timeline' ? 'active' : ''}`} onClick={() => setActiveTab('anc-timeline')}>
            <span className="nav-icon">🗓️</span>
            <span>Timeline</span>
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </div>
        </div>
      </div>

      {/* CONFIRM TRIGGER SOS MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay active">
          <div className="modal" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--rose-400)' }}>Confirm Emergency SOS Trigger</h3>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                Are you sure you want to trigger a maternal rescue alert? This will immediately lock your GPS location coordinates, dispatch nearby ambulances, and notify clinical responders.
              </p>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Describe your symptoms (e.g. severe contractions, water broke, bleeding)</label>
                <textarea className="form-input" style={{ minHeight: '60px', padding: '8px' }} placeholder="Provide brief notes..." value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="cemonc-chk" checked={requireCemonc} onChange={e => setRequireCemonc(e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="cemonc-chk" style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}>Require specialized surgical / obstetric theater (CEmONC)</label>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '14px' }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ background: 'var(--rose-500)' }} onClick={handleConfirmSOS}>Trigger Dispatch SOS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
