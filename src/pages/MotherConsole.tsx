// MamaTrack GPS — Unified Expectant Mother Console

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, UserService, EmergencyService, NotificationService, SimulationEngine, User, Mother, Emergency, CheckupSchedule, Notification, Doctor } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { Bell, LogOut, ArrowLeft, Send } from 'lucide-react';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';

export const MotherConsole: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Mother | null>(null);
  
  // Emergency states
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [requireCemonc, setRequireCemonc] = useState(false);
  
  // Lists
  const [checkups, setCheckups] = useState<CheckupSchedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile Edit form states
  const [profileForm, setProfileForm] = useState({
    sub_county: '',
    village: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
    medical_history: ''
  });

  // Chat consultation states
  const [selectedDoctor, setSelectedDoctor] = useState<(Doctor & { name: string; phone: string; hospitalName: string }) | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<Record<number, { sender: 'patient' | 'doctor'; text: string; time: string }[]>>({});
  const [isTyping, setIsTyping] = useState(false);

  // Toggle background body class for whole dashboard image transparency
  useEffect(() => {
    document.body.classList.add('mother-theme-active');
    return () => {
      document.body.classList.remove('mother-theme-active');
    };
  }, []);

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

    // Load lists
    setCheckups(db.checkups.filter(c => c.mother_id === sessionUser.id));
    setNotifications(NotificationService.getNotificationsForUser(sessionUser.id));

    // Get active emergency
    const emg = EmergencyService.getActiveEmergencyForMother(sessionUser.id);
    setActiveEmergency(emg);
  }, [navigate]);

  // 2. Poll active emergency status or run simulation
  const activeEmgId = activeEmergency?.id;
  const activeEmgStatus = activeEmergency?.status;
  useEffect(() => {
    if (!activeEmgId) return;
    
    if (activeEmgStatus && ['dispatched', 'en_route'].includes(activeEmgStatus)) {
      SimulationEngine.startAmbulanceSimulation(activeEmgId, (updatedEmg) => {
        setActiveEmergency(updatedEmg);
        if (user) {
          setNotifications(NotificationService.getNotificationsForUser(user.id));
        }
      });
    }

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
      if (activeEmgId) {
        SimulationEngine.stopSimulation(activeEmgId);
      }
    };
  }, [activeEmgId, activeEmgStatus, user, activeEmergency]);

  if (!user || !profile) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading Clinical Console...</div>;

  // Pregnancy details calculations
  const start = new Date(profile.pregnancy_start_date);
  const diff = new Date().getTime() - start.getTime();
  const weeks = Math.max(1, Math.min(42, Math.floor(diff / (1000 * 60 * 60 * 24 * 7))));
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

  // SOS activation
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
    if (window.confirm('Cancel rescue request?')) {
      const updated = EmergencyService.cancelEmergency(activeEmergency.id, 'Cancelled by patient', user.id);
      setActiveEmergency(null);
      SimulationEngine.stopSimulation(updated.id);
      setNotifications(NotificationService.getNotificationsForUser(user.id));
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    UserService.updateMotherProfile(user.id, profileForm);
    alert('Profile updated successfully!');
  };

  // Seeded doctors
  const doctors = db.doctors.map(d => {
    const u = db.users.find(usr => usr.id === d.user_id);
    const h = db.hospitals.find(hosp => hosp.id === d.hospital_id);
    return {
      ...d,
      name: u?.full_name || 'Dr. Specialist',
      phone: u?.phone || '+256-700-000-000',
      hospitalName: h?.name || 'Clinic'
    };
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedDoctor) return;

    const docId = selectedDoctor.id;
    const userMsg = chatInput.trim();
    setChatInput('');

    const currentChat = chatLogs[docId] || [];
    setChatLogs({
      ...chatLogs,
      [docId]: [
        ...currentChat,
        { sender: 'patient' as const, text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    });

    setIsTyping(true);

    let reply = "Thank you for reaching out. I have received your symptoms description. Please attend your scheduled ANC checkups. If this is an emergency, trigger the SOS alarm.";
    const lower = userMsg.toLowerCase();
    
    if (lower.includes('pain') || lower.includes('cramp') || lower.includes('bleeding')) {
      reply = "Sharp, constant abdominal pain, severe cramps, or bleeding require immediate triage. Please lie down, rest, and trigger the SOS Rescue beacon now to dispatch an ambulance.";
    } else if (lower.includes('swell') || lower.includes('feet') || lower.includes('edema')) {
      reply = "Edema in ankles is normal. Rest with feet elevated above the level of the heart, reduce sodium, and drink water. If you feel headaches, blurred vision or face swelling, visit the clinic immediately.";
    } else if (lower.includes('kick') || lower.includes('move') || lower.includes('baby')) {
      reply = "Assess baby movements. You should note at least 10 kick movements inside 2 hours when active. Go to the hospital if kick counts decrease significantly.";
    } else if (lower.includes('fever') || lower.includes('temp') || lower.includes('hot')) {
      reply = "Fevers over 38°C should be assessed. Keep hydrated, rest, and visit Mukono General Hospital if temperature remains high.";
    }

    setTimeout(() => {
      setIsTyping(false);
      setChatLogs(prev => {
        const chat = prev[docId] || [];
        return {
          ...prev,
          [docId]: [
            ...chat,
            { sender: 'doctor' as const, text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      });
    }, 2000);
  };

  const whoMilestones = [
    { visit: 1, weeks: '8-12', label: '1st Contact', desc: 'Blood panels, HIV scan, prescribe iron/folate.' },
    { visit: 2, weeks: '16', label: '2nd Visit', desc: 'Assess blood pressure, monitor fetal heart beat.' },
    { visit: 3, weeks: '20', label: 'Anomaly Scan', desc: 'Ultrasound screening to verify physical development.' },
    { visit: 4, weeks: '24-26', label: 'TT2 Vaccine', desc: 'Anemia check, administer TT2 vaccination.' },
    { visit: 5, weeks: '28', label: '3rd Trimester', desc: 'Review danger signs (edema, severe bleeding).' },
    { visit: 6, weeks: '32', label: 'Growth Review', desc: 'Verify cephalic position, check baby kick counts.' },
    { visit: 7, weeks: '36', label: 'Pre-Labour', desc: 'Confirm hospital bag checklist, birth planner.' },
    { visit: 8, weeks: '38-40', label: 'Final Check', desc: 'Confirm delivery dispatcher and ambulance coordinates.' }
  ];

  return (
    <div className="mother-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Navbar */}
        <header className="site-header" style={{ width: '100%', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.03)', zIndex: 100 }}>
          <div className="logo" onClick={() => navigate('/mother')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.35rem', cursor: 'pointer', fontWeight: 800 }}>
            <span style={{ fontSize: '1.8rem', background: 'rgba(244,63,94,0.1)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤱</span>
            <span className="logo-text" style={{ color: '#1f2937' }}>Momentra Console</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-momentra-outline" onClick={() => navigate('/mother')} style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>
              <ArrowLeft size={14} style={{ marginRight: '4px' }} />
              Back to Dashboard
            </button>

            {/* Notifications */}
            <ThemeToggle style={{ fontSize: '0.75rem', padding: '6px 12px' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', cursor: 'pointer', position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <Bell size={18} />
                {notifications.some(n => !n.is_read) && (
                  <span style={{ position: 'absolute', top: '1px', right: '1px', background: '#f43f5e', width: '8px', height: '8px', borderRadius: '50%' }} />
                )}
              </button>

              {showNotifications && (
                <div className="card-glass notifications-panel" style={{ position: 'absolute', right: 0, top: '48px', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 999, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Alert Notifications</strong>
                    <button onClick={() => { NotificationService.markAllAsRead(user.id); setNotifications(NotificationService.getNotificationsForUser(user.id)); }} style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.78rem', color: '#8b96a5' }}>No messages</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '8px', borderRadius: '6px', background: n.is_read ? 'transparent' : 'rgba(244,63,94,0.03)', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '2px', opacity: n.is_read ? 0.7 : 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 600 : 700, color: n.type === 'emergency' ? '#f43f5e' : '#1f2937' }}>{n.title}</span>
                        <p style={{ fontSize: '0.72rem', color: '#4b5563', lineHeight: 1.3 }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <ProfilePhotoUpload user={user} onUpdated={setUser} size={36} showLabel={false} />

            <button className="btn-momentra-outline" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>
              <LogOut size={14} style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="main-content" style={{ flex: 1, padding: '2rem var(--space-xl)', display: 'flex', flexDirection: 'column', margin: 0, width: '100%', maxWidth: '100vw' }}>
          
          {/* Eyebrow slogan without quotes or symbols */}
          <div style={{ fontSize: '1.25rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '14px', fontFamily: 'var(--font-heading)' }}>
            Bringing a life should not end another
          </div>

          {/* Three-Column grid formatting EVERYTHING consolidated */}
          <div className="console-grid-3">
            
            {/* COLUMN 1: LIVE RESCUE beacon & HIGH CONTRAST MAP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Emergency dispatch controls */}
              <div className="card-glass text-center" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Maternal Emergency SOS</h3>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '8px 0 16px', lineHeight: 1.45 }}>
                  Press below to coordinate emergency medical ambulance dispatch and notify clinicians.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {!activeEmergency ? (
                    <button className="emergency-btn" onClick={handleTriggerSOS} style={{ width: '150px', height: '150px' }}>
                      <span style={{ fontSize: '2rem' }}>🆘</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Trigger SOS</span>
                    </button>
                  ) : (
                    <div className="emergency-btn triggered" style={{ width: '150px', height: '150px', animation: 'active-emergency-pulse 1s infinite alternate' }}>
                      <span style={{ fontSize: '2rem' }}>🚨</span>
                      <span style={{ fontSize: '0.9rem' }}>SOS Active</span>
                    </div>
                  )}

                  {activeEmergency && (
                    <button className="cancel-alert-btn" onClick={handleCancelSOS} style={{ marginTop: '12px', padding: '0.5rem 1rem' }}>
                      Cancel Rescue Beacon
                    </button>
                  )}
                </div>
              </div>

              {/* Active emergency rescue path tracker steps */}
              {activeEmergency && (
                <div className="card-glass" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>🚑 Rescue Tracker</span>
                    <span className="badge" style={{ background: '#ea580c', color: 'white', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '8px' }}>
                      {activeEmergency.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="status-tracker">
                    <div className="status-steps" style={{ gap: '8px' }}>
                      <div className="status-step completed">
                        <div className="step-circle" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>🆘</div>
                        <div className="step-label" style={{ fontSize: '0.6rem' }}>SOS</div>
                      </div>
                      <div className={`status-step ${['dispatched', 'en_route', 'arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : ''}`}>
                        <div className="step-circle" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>📡</div>
                        <div className="step-label" style={{ fontSize: '0.6rem' }}>Sent</div>
                      </div>
                      <div className={`status-step ${['arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : activeEmergency.status === 'en_route' ? 'active' : ''}`}>
                        <div className="step-circle" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>🚑</div>
                        <div className="step-label" style={{ fontSize: '0.6rem' }}>Route</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* High Contrast map widget */}
              <div className="card-glass" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>📍 Dispatch Map</span>
                  <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>GPS Live</span>
                </div>
                <div style={{ height: '260px', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                  <MapComponent
                    center={[motherLat, motherLng]}
                    zoom={13}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                    emergencyCircle={activeEmergency ? { lat: activeEmergency.latitude, lng: activeEmergency.longitude, radius: 400 } : null}
                    theme={theme}
                  />
                </div>
              </div>

              {/* Support Guidelines */}
              <div className="card-glass" style={{ padding: '1.15rem' }}>
                <h4 style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 800, marginBottom: '6px' }}>⚠️ Critical Warning Red-Flags</h4>
                <ul style={{ fontSize: '0.68rem', color: '#4b5563', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px', lineHeight: 1.45 }}>
                  <li>Severe bleeding or sudden fluid gush</li>
                  <li>Swelling of face/hands, blurred vision</li>
                  <li>Severe constant abdominal pain or high fever</li>
                </ul>
              </div>
            </div>

            {/* COLUMN 2: TIMELINES & ANC VISIT SCHEDULES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Pregnancy progress */}
              <div className="card-glass" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Pregnancy Progress</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f43f5e', margin: '8px 0 2px' }}>{weeks} Weeks</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', margin: '10px 0 4px' }}>
                  <span>Milestone progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="progress-bar" style={{ height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #fb7185, #f43f5e)' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '12px', background: 'rgba(244,63,94,0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                  📅 Expected Delivery: <strong>{new Date(profile.expected_due_date).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* ANC clinic visits schedules calendar */}
              <div className="card-glass" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '8px' }}>📅 Clinic Visits & Appointments</h4>
                {checkups.length === 0 ? (
                  <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>No scheduled visits logged.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {checkups.slice(0, 3).map(c => {
                      const dt = new Date(c.scheduled_date);
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.02)', paddingBottom: '6px' }}>
                          <div style={{ background: 'rgba(244,63,94,0.05)', fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', minWidth: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {dt.getDate()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1f2937' }}>{c.checkup_type}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{c.notes}</div>
                          </div>
                          <span className="badge" style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '6px', background: c.status === 'completed' ? '#dcfce7' : '#fef3c7', color: c.status === 'completed' ? '#15803d' : '#b45309' }}>{c.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Milestones checklist */}
              <div className="card-glass" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '10px' }}>👶 WHO Pregnancy Milestones</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {whoMilestones.map(m => (
                    <div key={m.visit} style={{ borderLeft: '2px solid rgba(244,63,94,0.2)', paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span style={{ color: '#1f2937' }}>Visit {m.visit} ({m.weeks} wks)</span>
                        <span style={{ color: '#f43f5e' }}>{m.label}</span>
                      </div>
                      <p style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '2px', lineHeight: 1.35 }}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: CLINICAL doctor consult & PROFILE SETTINGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Consultation messaging */}
              <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>🩺 Consult Clinical Doctors</h4>
                
                {!selectedDoctor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {doctors.slice(0, 2).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{doc.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 600 }}>{doc.specialization}</div>
                        </div>
                        <button className="btn-momentra-primary" style={{ padding: '2px 8px', fontSize: '0.65rem', borderRadius: '8px' }} onClick={() => setSelectedDoctor(doc)}>Consult</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{selectedDoctor.name}</span>
                      <button style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSelectedDoctor(null)}>Change</button>
                    </div>

                    <div className="chat-log" style={{ height: '170px', padding: '8px' }}>
                      <div className="chat-bubble doctor" style={{ padding: '6px 8px', fontSize: '0.72rem' }}>
                        Hi Fatima. How can I assist you with your pregnancy symptoms today?
                      </div>
                      {(chatLogs[selectedDoctor.id] || []).map((msg, idx) => (
                        <div key={idx} className={`chat-bubble ${msg.sender}`} style={{ padding: '6px 8px', fontSize: '0.72rem' }}>
                          {msg.text}
                        </div>
                      ))}
                      {isTyping && <div className="typing-indicator" style={{ fontSize: '0.65rem' }}>Typing...</div>}
                    </div>

                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input type="text" className="form-input" style={{ padding: '6px', fontSize: '0.75rem' }} placeholder="Type symptoms..." value={chatInput} onChange={e => setChatInput(e.target.value)} required />
                      <button type="submit" className="btn-momentra-primary" style={{ padding: '4px 10px', borderRadius: '8px' }}><Send size={12} /></button>
                    </form>
                  </div>
                )}
              </div>

              {/* VHT contact list support details */}
              <div className="card-glass" style={{ padding: '1.15rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '6px' }}>📞 VHT Support Coordinators</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Emergency Dispatcher:</span>
                    <a href="tel:+256742100001" style={{ color: '#f43f5e', fontWeight: 700 }}>+256-742-100-001</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Betty Namusoke (VHT):</span>
                    <a href="tel:+256772600001" style={{ color: '#f43f5e', fontWeight: 700 }}>+256-772-600-001</a>
                  </div>
                </div>
              </div>

              {/* Profile Details Edit Form */}
              <div className="card-glass" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>👤 Personal Medical Details</span>
                <form onSubmit={handleUpdateProfile} style={{ marginTop: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Sub County</label>
                      <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} value={profileForm.sub_county} onChange={e => setProfileForm({ ...profileForm, sub_county: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Village</label>
                      <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} value={profileForm.village} onChange={e => setProfileForm({ ...profileForm, village: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>Kin Contact Name</label>
                    <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} value={profileForm.next_of_kin_name} onChange={e => setProfileForm({ ...profileForm, next_of_kin_name: e.target.value })} required />
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>Kin Phone</label>
                    <input type="tel" className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} value={profileForm.next_of_kin_phone} onChange={e => setProfileForm({ ...profileForm, next_of_kin_phone: e.target.value })} required />
                  </div>

                  <button type="submit" className="btn-momentra-primary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}>
                    Save Details
                  </button>
                </form>
              </div>
            </div>

          </div>
          {/* FOOTER */}
          <footer className="dashboard-footer" style={{ marginTop: '40px' }}>
            <p>© 2026 MamaTrack GPS · Regional Maternal Emergency Response System. All rights reserved.</p>
          </footer>
        </main>
      </div>

      {/* SOS CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay active">
          <div className="modal" style={{ width: '100%', maxWidth: '440px', padding: '1.25rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f43f5e' }}>Confirm Emergency Trigger</h3>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '1.35rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#4b5563', marginBottom: '10px' }}>
                Are you sure you want to dispatch a rescue ambulance? This locks GPS coordinates and alerts regional medical teams.
              </p>
              <textarea className="form-input" style={{ minHeight: '50px', padding: '6px', fontSize: '0.75rem' }} placeholder="Note symptoms..." value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', marginTop: '10px' }}>
              <button className="btn-momentra-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn-momentra-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleConfirmSOS}>Trigger SOS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
