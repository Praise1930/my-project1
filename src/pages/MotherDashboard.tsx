// MamaTrack GPS — Expectant Mother Dashboard (Momentra Redesign)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, UserService, EmergencyService, NotificationService, SimulationEngine, User, Mother, Emergency, CheckupSchedule, Notification, Doctor } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { Bell, Calendar, LogOut, ArrowLeft, PhoneCall, Send } from 'lucide-react';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';

export const MotherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Mother | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'emergency' | 'checkups' | 'anc-timeline' | 'profile'>('home');
  
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

  // Doctor Consultation States
  const [selectedDoctor, setSelectedDoctor] = useState<(Doctor & { name: string; phone: string; hospitalName: string }) | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<Record<number, { sender: 'patient' | 'doctor'; text: string; time: string }[]>>({});
  const [isTyping, setIsTyping] = useState(false);

  // Onboarding Guide states
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const guideSteps = [
    {
      title: "Welcome to Momentra",
      icon: "🤱",
      desc: "Your comprehensive maternal health console. Let's walk you through the key features designed to ensure you and your baby remain safe.",
    },
    {
      title: "🚨 Real-Time Rescue Beacon",
      icon: "🆘",
      desc: "Tap the glowing red SOS button during any pregnancy distress. This instantly logs your GPS coordinates, dispatches the nearest ambulance, and alerts Obstetricians at Mukono General Hospital.",
    },
    {
      title: "👶 Antenatal Milestones Checklist",
      icon: "📈",
      desc: "Track World Health Organization (WHO) pregnancy milestones from weeks 8 to 40. Stay informed about key visits, ultrasound schedules, and critical checks for your delivery care.",
    },
    {
      title: "🩺 Expert Doctor Consultations",
      icon: "💬",
      desc: "Inquire about symptoms in real-time. Chat with on-duty obstetricians and midwives, upload symptom notes (cramping, feet swelling), and receive clinical replies.",
    },
    {
      title: "📋 Smart Appointment Schedules",
      icon: "📅",
      desc: "Review scheduled antenatal visits, log personal medical history (allergies, blood group), and set next-of-kin emergency contact profiles for automated alerts.",
    }
  ];

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

    // Load static lists
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
    
    // If en route, start simulation listener
    if (activeEmgStatus && ['dispatched', 'en_route'].includes(activeEmgStatus)) {
      SimulationEngine.startAmbulanceSimulation(activeEmgId, (updatedEmg) => {
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
      if (activeEmgId) {
        SimulationEngine.stopSimulation(activeEmgId);
      }
    };
  }, [activeEmgId, activeEmgStatus, user, activeEmergency]);

  if (!user || !profile) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading Mother Profile...</div>;

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
    setActiveTab('emergency'); // Auto switch to track
  };

  const handleCancelSOS = () => {
    if (!activeEmergency) return;
    if (window.confirm('Are you sure you want to cancel your emergency dispatch request?')) {
      const updated = EmergencyService.cancelEmergency(activeEmergency.id, 'Cancelled by patient', user.id);
      setActiveEmergency(null);
      SimulationEngine.stopSimulation(updated.id);
      setNotifications(NotificationService.getNotificationsForUser(user.id));
    }
  };

  // Form Submit
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    UserService.updateMotherProfile(user.id, profileForm);
    alert('Profile information updated successfully!');
  };

  // Get Seeded Doctors list
  const getDoctorsList = () => {
    return db.doctors.map(d => {
      const u = db.users.find(usr => usr.id === d.user_id);
      const h = db.hospitals.find(hosp => hosp.id === d.hospital_id);
      return {
        ...d,
        name: u?.full_name || 'Dr. Specialist',
        phone: u?.phone || '+256-700-000-000',
        hospitalName: h?.name || 'District Facility'
      };
    });
  };
  const doctors = getDoctorsList();

  // Handle consultation message dispatch
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedDoctor) return;

    const docId = selectedDoctor.id;
    const userMsg = chatInput.trim();
    setChatInput('');

    // Append user message
    const currentChat = chatLogs[docId] || [];
    const updatedChat = [
      ...currentChat,
      { sender: 'patient' as const, text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatLogs({
      ...chatLogs,
      [docId]: updatedChat
    });

    // Simulated typing response
    setIsTyping(true);

    let reply = "Thank you for reaching out. I have received your concern. Based on your profile, please ensure you keep up with your scheduled clinic checkups. If this is an emergency, please use the SOS Trigger on the Home dashboard.";
    const lower = userMsg.toLowerCase();
    
    if (lower.includes('pain') || lower.includes('cramp') || lower.includes('bleeding')) {
      reply = "Sharp, constant abdominal pain, severe cramps, or any bleeding requires immediate clinical attention. Please rest, elevate your feet, and use the 'Trigger Emergency SOS' button on the Home tab to dispatch an ambulance.";
    } else if (lower.includes('swell') || lower.includes('feet') || lower.includes('edema')) {
      reply = "Ankle swelling is common during pregnancy. Rest with your legs elevated above heart level, keep hydrated, and limit salt. If you experience sudden swelling in your face/hands or a severe headache, check your blood pressure immediately.";
    } else if (lower.includes('move') || lower.includes('kick') || lower.includes('baby')) {
      reply = "Try to count fetal movements. You should note at least 10 distinct movements within a 2-hour window when the baby is active. If you feel a sudden drop in kick counts, please visit the hospital for a Doppler check.";
    } else if (lower.includes('fever') || lower.includes('temp') || lower.includes('hot')) {
      reply = "A fever above 38°C should be examined. Rest, drink plenty of water, and consult in person at Mukono General Hospital if your temperature stays elevated.";
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

  // Dynamic next appointment calculation
  const getNextAppointmentInfo = () => {
    const upcoming = checkups.filter(c => c.status === 'upcoming');
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const dt = new Date(next.scheduled_date);
      return {
        date: dt.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: next.checkup_type
      };
    }
    return {
      date: '24 May, 2026',
      time: '10:30 AM',
      type: 'ANC Checkup'
    };
  };
  const nextAppt = getNextAppointmentInfo();

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
    <div className="mother-theme momentra-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Blurred background image & light tint overlay */}
      <div className="mother-bg" />
      <div className="mother-bg-overlay" />

      <div className="dashboard-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <header className="site-header" style={{ width: '100%', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', borderBottom: theme === 'light' ? '1px solid rgba(0,0,0,0.03)' : '1px solid rgba(255,255,255,0.08)', zIndex: 100 }}>
          <div className="logo" onClick={() => setActiveTab('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.35rem', cursor: 'pointer', fontWeight: 800 }}>
            <span style={{ fontSize: '1.8rem', background: 'rgba(244,63,94,0.1)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤱</span>
            <span className="logo-text" style={{ color: theme === 'light' ? '#1f2937' : '#ffffff' }}>Momentra</span>
          </div>

          <nav className="header-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span onClick={() => setActiveTab('home')} style={{ fontSize: '0.85rem', fontWeight: activeTab === 'home' ? 700 : 500, color: activeTab === 'home' ? '#f43f5e' : (theme === 'light' ? '#4b5563' : '#cbd5e1'), cursor: 'pointer' }}>Home</span>
            <span onClick={() => setActiveTab('emergency')} style={{ fontSize: '0.85rem', fontWeight: activeTab === 'emergency' ? 700 : 500, color: activeTab === 'emergency' ? '#f43f5e' : (theme === 'light' ? '#4b5563' : '#cbd5e1'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Rescue {activeEmergency && <span className="pulse-dot" style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />}
            </span>
            <span onClick={() => setActiveTab('checkups')} style={{ fontSize: '0.85rem', fontWeight: activeTab === 'checkups' ? 700 : 500, color: activeTab === 'checkups' ? '#f43f5e' : (theme === 'light' ? '#4b5563' : '#cbd5e1'), cursor: 'pointer' }}>Schedules</span>
            <span onClick={() => setActiveTab('anc-timeline')} style={{ fontSize: '0.85rem', fontWeight: activeTab === 'anc-timeline' ? 700 : 500, color: activeTab === 'anc-timeline' ? '#f43f5e' : (theme === 'light' ? '#4b5563' : '#cbd5e1'), cursor: 'pointer' }}>Timeline</span>
            <span onClick={() => setActiveTab('profile')} style={{ fontSize: '0.85rem', fontWeight: activeTab === 'profile' ? 700 : 500, color: activeTab === 'profile' ? '#f43f5e' : (theme === 'light' ? '#4b5563' : '#cbd5e1'), cursor: 'pointer' }}>Profile & Doctors</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle style={{ fontSize: '0.75rem', padding: '6px 12px' }} />
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: theme === 'light' ? 'white' : '#1e293b', border: theme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'light' ? '#4b5563' : '#cbd5e1', cursor: 'pointer', position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
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
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'right' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile Photo */}
            <ProfilePhotoUpload user={user} onUpdated={setUser} size={36} showLabel={false} />

            {/* Logout button */}
            <button className="btn-momentra-outline" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>
              <LogOut size={14} style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        </header>

        <main className="main-content" style={{ flex: 1, padding: '2rem var(--space-xl)', display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB 0: MOMENTRA HOME DASHBOARD */}
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div className="momentra-hero-grid">
                
                {/* Left column hero texts & details */}
                <div className="momentra-left-col">
                  {/* Eyebrow maternal health slogan */}
                  <div style={{ fontSize: '1.25rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                    Bringing a life should not end another
                  </div>

                  <h1 className="momentra-title">
                    Empowering Every<br />
                    Mother With <span className="momentra-script">Smarter<br />Pregnancy Care</span>
                  </h1>
                  <p className="momentra-subtitle">
                    Track your pregnancy journey with AI-powered health monitoring, expert guidance, personalized insights, and real-time support all in one seamless experience.
                  </p>

                  {/* Distinct hero actions: Get Started points to schedules, SOS triggers emergency */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px' }}>
                    <button className="btn-momentra-primary" onClick={() => { setShowGuideModal(true); setGuideStep(0); }}>
                      Get Started
                    </button>
                    
                    {!activeEmergency ? (
                      <button className="emergency-btn-home" onClick={handleTriggerSOS}>
                        🚨 Trigger Emergency SOS
                      </button>
                    ) : (
                      <button className="emergency-btn-home triggered" onClick={() => setActiveTab('emergency')}>
                        🚨 Tracking Active SOS
                      </button>
                    )}
                  </div>

                  {/* Social Proof */}
                  <div className="social-proof" style={{ marginTop: '5px' }}>
                    <div className="avatar-stack">
                      <div className="avatar-placeholder" style={{ background: '#fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>👩</div>
                      <div className="avatar-placeholder" style={{ background: '#ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>👩‍⚕️</div>
                      <div className="avatar-placeholder" style={{ background: '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>🤰</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4b5563' }}>50k+ <span style={{ color: '#8b96a5', fontWeight: 400 }}>Satisfied Mothers</span></span>
                  </div>
                </div>

                {/* Right column Mother Image & layered stats widgets */}
                <div className="momentra-right-col">
                  <div className="momentra-mother-frame">
                    <img className="momentra-mother-img" src="/mother.jpeg" alt="Expectant Mother" />

                    {/* Relocated Health Score Card inside parent photo frame */}
                    <div className="floating-widget widget-health">
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8b96a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Health Score</span>
                      
                      <div className="health-circle-wrap">
                        <svg className="health-circle-svg" width="72" height="72">
                          <circle cx="36" cy="36" r="30" stroke="rgba(244,63,94,0.06)" strokeWidth="6" fill="transparent" />
                          <circle cx="36" cy="36" r="30" stroke="url(#rose-grad)" strokeWidth="6" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 30}
                                  strokeDashoffset={2 * Math.PI * 30 * (1 - 0.92)} />
                          <defs>
                            <linearGradient id="rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fb7185" />
                              <stop offset="100%" stopColor="#f43f5e" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="health-score-val">92</div>
                      </div>

                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.08)', padding: '2px 8px', borderRadius: '12px' }}>● Excellent</span>
                    </div>

                    {/* Floating Baby Heart Rate Card */}
                    <div className="floating-widget widget-heart">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: '#ef4444', animation: 'active-emergency-pulse 1s infinite alternate', fontSize: '1.25rem' }}>❤️</span>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: '#8b96a5', fontWeight: 700, textTransform: 'uppercase' }}>Baby's Heart Rate</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>142 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#4b5563' }}>bpm</span></div>
                        </div>
                      </div>

                      <svg width="140" height="35" className="heart-wave-svg" style={{ marginTop: '8px' }}>
                        <path d="M 0,17 Q 12,17 17,17 T 23,5 T 28,30 T 32,17 Q 48,17 53,17 T 59,5 T 64,30 T 68,17 Q 84,17 89,17 T 95,5 T 100,30 T 104,17 H 140"
                              fill="transparent" stroke="#f43f5e" strokeWidth="2.5" />
                      </svg>
                    </div>

                    {/* Floating Next Appointment Card */}
                    <div className="floating-widget widget-appointment">
                      <div className="appointment-icon-wrap">📅</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.62rem', color: '#8b96a5', fontWeight: 700, textTransform: 'uppercase' }}>Next Appointment</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1f2937' }}>{nextAppt.date}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{nextAppt.time} • {nextAppt.type}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom clickable cards to display functional tabs */}
              <div id="dashboard-features" className="momentra-bottom-grid">
                <div className="momentra-feature-card" onClick={() => setActiveTab('emergency')}>
                  <div className="feature-icon-wrap">🚨</div>
                  <div className="feature-title">Real-Time Health Monitoring</div>
                  <p className="feature-desc">Active GPS tracking coordinates, ambulance routing status maps, and distress triggers.</p>
                </div>

                <div className="momentra-feature-card" onClick={() => setActiveTab('anc-timeline')}>
                  <div className="feature-icon-wrap">👶</div>
                  <div className="feature-title">Personalized Pregnancy Insights</div>
                  <p className="feature-desc">Interactive WHO milestones checklists covering weeks 8 to 40 for optimal delivery care.</p>
                </div>

                <div className="momentra-feature-card" onClick={() => setActiveTab('profile')}>
                  <div className="feature-icon-wrap">🩺</div>
                  <div className="feature-title">Expert Doctor Consultation</div>
                  <p className="feature-desc">Coordinate and chat with on-duty specialists and matched medical responders.</p>
                </div>

                <div className="momentra-feature-card" onClick={() => setActiveTab('checkups')}>
                  <div className="feature-icon-wrap">📋</div>
                  <div className="feature-title">Smart Reminders & Scheduling</div>
                  <p className="feature-desc">Never miss clinic visits. View detailed antenatal care appointments, statuses, and history logs.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: EMERGENCY RESPONSE / LIVE GPS MAP */}
          {activeTab === 'emergency' && (
            <div className="tab-content-container">
              <button className="btn-momentra-outline" onClick={() => setActiveTab('home')} style={{ marginBottom: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
              </button>

              <div className="grid-2" style={{ gridTemplateColumns: '1.05fr 1.15fr', gap: '1.5rem' }}>
                {/* Left controls column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card-glass text-center" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Need Urgent Medical Rescue?</h2>
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '10px 0 20px', lineHeight: 1.5 }}>
                      Press the button below. The system will auto-dispatch the nearest available ambulance, map your coordinates, and alert an Obstetrician at the hospital.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {!activeEmergency ? (
                        <button className="emergency-btn" onClick={handleTriggerSOS}>
                          <span className="btn-emoji" style={{ fontSize: '2.5rem' }}>🆘</span>
                          <span style={{ fontWeight: 800 }}>Trigger SOS</span>
                        </button>
                      ) : (
                        <div className="emergency-btn triggered" style={{ animation: 'active-emergency-pulse 1s infinite alternate' }}>
                          <span className="btn-emoji" style={{ fontSize: '2.5rem' }}>🚨</span>
                          <span>SOS Active</span>
                        </div>
                      )}
                      
                      <span style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!activeEmergency ? (
                          <span>Tap to dispatch ambulance</span>
                        ) : (
                          <>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'active-emergency-pulse 1s infinite alternate' }} />
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>GPS Beacon Transmitting Live Coordinates</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Active rescue details or danger signs / clinic contacts to fill empty space */}
                  {activeEmergency ? (
                    <div className="card-glass" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>🚨 Rescue Status</h3>
                        <span className="badge" style={{ background: activeEmergency.status === 'arrived' ? '#16a34a' : '#ea580c', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {activeEmergency.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="status-tracker">
                        <div className="status-steps">
                          <div className={`status-step ${['pending', 'verified', 'dispatched', 'en_route', 'arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : ''}`}>
                            <div className="step-circle">🆘</div>
                            <div className="step-label">SOS</div>
                          </div>
                          <div className={`status-step ${['dispatched', 'en_route', 'arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : activeEmergency.status === 'verified' ? 'active' : ''}`}>
                            <div className="step-circle">📡</div>
                            <div className="step-label">Dispatched</div>
                          </div>
                          <div className={`status-step ${['arrived', 'completed'].includes(activeEmergency.status) ? 'completed' : activeEmergency.status === 'en_route' ? 'active' : ''}`}>
                            <div className="step-circle">🚑</div>
                            <div className="step-label">En-Route</div>
                          </div>
                          <div className={`status-step ${activeEmergency.status === 'completed' ? 'completed' : activeEmergency.status === 'arrived' ? 'active' : ''}`}>
                            <div className="step-circle">🏥</div>
                            <div className="step-label">Arrived</div>
                          </div>
                        </div>

                        <div className="nav-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '1.5rem', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                              {activeEmergency.eta_minutes !== null ? `${activeEmergency.eta_minutes} Min` : 'Calculating'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Ambulance ETA</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2937' }}>
                              {activeEmergency.driver_id ? db.users.find(u => u.id === activeEmergency.driver_id)?.full_name.split(' ')[0] : 'Searching'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Assigned Driver</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4b5563' }}>
                              {activeEmergency.vehicle_id ? db.vehicles.find(v => v.id === activeEmergency.vehicle_id)?.plate_number : '-'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Plate No</div>
                          </div>
                        </div>

                        <button className="cancel-alert-btn" onClick={handleCancelSOS}>
                          Cancel Rescue Beacon
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show Danger signs & Clinic support contacts to fill blank space
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Danger signs list */}
                      <div className="card-glass" style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          ⚠️ Critical Maternal Danger Signs
                        </h4>
                        <p style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '10px', lineHeight: 1.45 }}>
                          If you experience any of these signs, please press the **Trigger Emergency SOS** button immediately to dispatch clinical help:
                        </p>
                        <ul style={{ fontSize: '0.72rem', color: '#4b5563', paddingLeft: '16px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li>Severe, persistent headache or blurred vision</li>
                          <li>Sudden swelling of the face, hands, or ankles</li>
                          <li>Vaginal bleeding or sudden warm fluid leakage</li>
                          <li>Severe, constant abdominal pain or cramping</li>
                          <li>High fever, severe chills, or fits/convulsions</li>
                          <li>Reduced or absent baby movements (kicks)</li>
                        </ul>
                      </div>

                      {/* Clinic and VHT support numbers */}
                      <div className="card-glass" style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          📞 Mukono Support Contacts
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563' }}>Emergency Dispatcher</span>
                            <a href="tel:+256742100001" style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>+256-742-100-001</a>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563' }}>Betty Namusoke (VHT)</span>
                            <a href="tel:+256772600001" style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>+256-772-600-001</a>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563' }}>Mukono General Hospital</span>
                            <a href="tel:+256414290001" style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700, textDecoration: 'none' }}>+256-414-290-001</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column Map Component */}
                <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 12px', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>📍 Live Tracking Map</h3>
                    <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)', animation: 'active-emergency-pulse 1.2s infinite alternate' }} />
                      GPS Transmitting (±15m)
                    </span>
                  </div>
                  <div style={{ flex: 1, minHeight: '380px', position: 'relative' }}>
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
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULED APPOINTMENTS */}
          {activeTab === 'checkups' && (
            <div className="tab-content-container">
              <button className="btn-momentra-outline" onClick={() => setActiveTab('home')} style={{ marginBottom: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
              </button>

              <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
                
                {/* Pregnancy Progress summary */}
                <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Pregnancy Progress</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#f43f5e', margin: '15px 0 5px' }}>{weeks} Weeks</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{trimester}</div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4b5563', marginBottom: '6px' }}>
                      <span>Progress to Delivery</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%`, height: '100%', background: 'linear-gradient(135deg, #fb7185, #f43f5e)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '20px', background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.05)', padding: '12px', borderRadius: '12px' }}>
                      <span>📅</span> Expected Due Date: <strong style={{ color: '#f43f5e' }}>{new Date(profile.expected_due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                  </div>
                </div>

                {/* Calendar listing */}
                <div className="card-glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Antenatal Care (ANC) Appointments</h3>
                  {checkups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Calendar size={40} style={{ strokeWidth: 1.5, color: '#8b96a5' }} />
                      <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '8px' }}>No checkup schedules logged. Visit your nearest matched clinic to add records.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {checkups.map(c => {
                        const dt = new Date(c.scheduled_date);
                        return (
                          <div key={c.id} className="checkup-item">
                            <div className="checkup-date" style={{ background: c.status === 'completed' ? '#16a34a' : 'rgba(244,63,94,0.05)', border: '1px solid rgba(0,0,0,0.03)', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 800, color: c.status === 'completed' ? 'white' : '#f43f5e' }}>{dt.getDate()}</span>
                              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: c.status === 'completed' ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>{dt.toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div className="checkup-info">
                              <div className="checkup-type" style={{ color: '#1f2937', fontWeight: 700 }}>{c.checkup_type}</div>
                              <div className="checkup-hospital" style={{ color: '#6b7280' }}>{c.notes}</div>
                            </div>
                            <span className="badge" style={{ fontSize: '0.65rem', background: c.status === 'completed' ? '#dcfce7' : c.status === 'upcoming' ? '#fef3c7' : '#fee2e2', color: c.status === 'completed' ? '#15803d' : c.status === 'upcoming' ? '#b45309' : '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANC WHO TIMELINE */}
          {activeTab === 'anc-timeline' && (
            <div className="tab-content-container">
              <button className="btn-momentra-outline" onClick={() => setActiveTab('home')} style={{ marginBottom: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
              </button>

              <div className="card-glass" style={{ padding: '2rem' }}>
                <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>🗓️ WHO Antenatal Care Progress Timeline</h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                    The World Health Organization recommends at least 8 ANC contacts. Expand each visit milestone to understand details.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {whoMilestones.map((m) => {
                    const isDone = checkups.some(c => c.status === 'completed' && c.checkup_type.toLowerCase().includes(String(m.visit)));
                    const isCurrent = weeks >= m.minWeek && !isDone;
                    
                    let dotColor = 'rgba(0,0,0,0.08)';
                    let badgeText = 'Future';
                    let cardBorder = 'rgba(0,0,0,0.04)';
                    let badgeColor = { bg: '#f3f4f6', text: '#6b7280' };

                    if (isDone) {
                      dotColor = '#16a34a';
                      badgeText = 'Completed';
                      cardBorder = 'rgba(34,197,94,0.15)';
                      badgeColor = { bg: '#dcfce7', text: '#15803d' };
                    } else if (isCurrent) {
                      dotColor = '#d97706';
                      badgeText = 'Due Now';
                      cardBorder = 'rgba(245,158,11,0.25)';
                      badgeColor = { bg: '#fef3c7', text: '#b45309' };
                    }

                    return (
                      <div key={m.visit} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                          <div style={{ background: dotColor, width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', marginTop: '4px', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} />
                          <div style={{ flex: 1, width: '2px', background: 'rgba(0,0,0,0.04)', margin: '4px 0' }} />
                        </div>
                        <div className="card-glass" style={{ flex: 1, padding: '12px 16px', border: `1px solid ${cardBorder}`, borderRadius: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Visit {m.visit}: {m.label} (Week {m.weeks})</span>
                            <span className="badge" style={{ fontSize: '0.65rem', background: badgeColor.bg, color: badgeColor.text, padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{badgeText}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '4px', lineHeight: 1.4 }}>{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS & DOCTOR CONSULTATION */}
          {activeTab === 'profile' && (
            <div className="tab-content-container">
              <button className="btn-momentra-outline" onClick={() => setActiveTab('home')} style={{ marginBottom: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
              </button>

              <div className="consultation-panel">
                {/* Left panel: Expert doctor consultations */}
                <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '1rem', color: '#1f2937' }}>
                    🩺 Consult Clinical Specialists
                  </h3>
                  
                  {!selectedDoctor ? (
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                        Select an on-duty doctor below to send medical inquiries, discuss symptoms, or review checkup test results in real-time.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {doctors.map(doc => (
                          <div key={doc.id} className="doctor-consult-card">
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1f2937' }}>{doc.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600 }}>{doc.specialization}</div>
                              <div style={{ fontSize: '0.68rem', color: '#8b96a5', marginTop: '2px' }}>{doc.hospitalName} • {doc.years_experience} yrs exp</div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                              <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '8px', background: doc.is_on_duty ? '#dcfce7' : '#f3f4f6', color: doc.is_on_duty ? '#15803d' : '#4b5563', fontWeight: 700 }}>
                                {doc.is_on_duty ? '● ON DUTY' : 'OFF DUTY'}
                              </span>
                              
                              <button 
                                className="btn-momentra-primary" 
                                style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', borderRadius: '12px' }}
                                onClick={() => setSelectedDoctor(doc)}
                              >
                                Consult
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Consultation Active chat interface
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                            onClick={() => setSelectedDoctor(null)}
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>{selectedDoctor.name}</span>
                            <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Specialist • {selectedDoctor.hospitalName}</div>
                          </div>
                        </div>
                        
                        <a href={`tel:${selectedDoctor.phone}`} style={{ textDecoration: 'none' }}>
                          <button style={{ background: 'rgba(244,63,94,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', cursor: 'pointer' }}>
                            <PhoneCall size={14} />
                          </button>
                        </a>
                      </div>

                      {/* Chat log window */}
                      <div className="chat-log">
                        <div className="chat-bubble doctor">
                          Hello Nakato Fatima. I am {selectedDoctor.name}, your assigned obstetrician. How can I assist you with your pregnancy care today?
                        </div>
                        
                        {(chatLogs[selectedDoctor.id] || []).map((msg, idx) => (
                          <div key={idx} className={`chat-bubble ${msg.sender}`}>
                            {msg.text}
                            <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.6, textAlign: 'right', marginTop: '2px' }}>{msg.time}</span>
                          </div>
                        ))}

                        {isTyping && (
                          <div className="typing-indicator">
                            <span style={{ animation: 'active-emergency-pulse 0.8s infinite alternate' }}>✍️</span> {selectedDoctor.name} is typing...
                          </div>
                        )}
                      </div>

                      {/* Msg input form */}
                      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                          placeholder="Type symptoms or medical queries..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn-momentra-primary" style={{ padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right panel: Profile Form */}
                <div className="card-glass" style={{ padding: '1.5rem' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <ProfilePhotoUpload user={user} onUpdated={setUser} size={64} showLabel={true} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937' }}>{user.full_name}</h3>
                    <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 600 }}>Maternal ID: MT-{String(profile.id).padStart(5, '0')}</span>
                  </div>

                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Sub County</label>
                        <select className="form-input" style={{ fontSize: '0.8rem', padding: '8px' }} value={profileForm.sub_county} onChange={e => setProfileForm({ ...profileForm, sub_county: e.target.value })}>
                          <option value="Goma">Goma</option>
                          <option value="Nama">Nama</option>
                          <option value="Mukono Municipality">Mukono Municipality</option>
                          <option value="Koome">Koome</option>
                          <option value="Ntenjeru">Ntenjeru</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Village / Ward</label>
                        <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '8px' }} value={profileForm.village} onChange={e => setProfileForm({ ...profileForm, village: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Kin Contact Name</label>
                        <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '8px' }} value={profileForm.next_of_kin_name} onChange={e => setProfileForm({ ...profileForm, next_of_kin_name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Relationship</label>
                        <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '8px' }} value={profileForm.next_of_kin_relationship} onChange={e => setProfileForm({ ...profileForm, next_of_kin_relationship: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Kin Phone Number</label>
                      <input type="tel" className="form-input" style={{ fontSize: '0.8rem', padding: '8px' }} value={profileForm.next_of_kin_phone} onChange={e => setProfileForm({ ...profileForm, next_of_kin_phone: e.target.value })} required />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">Medical History / Allergies</label>
                      <textarea className="form-input" style={{ minHeight: '60px', padding: '6px', resize: 'vertical', fontSize: '0.8rem' }} value={profileForm.medical_history} onChange={e => setProfileForm({ ...profileForm, medical_history: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-momentra-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}>
                      Update Profile Details
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="dashboard-footer" style={{ marginTop: '40px' }}>
            <p>© 2026 MamaTrack GPS · Regional Maternal Emergency Response System. All rights reserved.</p>
          </footer>
        </main>
      </div>

      {/* CONFIRM TRIGGER SOS MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay active">
          <div className="modal" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>Confirm Emergency SOS Trigger</h3>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.4, color: '#4b5563' }}>
                Are you sure you want to trigger a maternal rescue alert? This will immediately lock your GPS location coordinates, dispatch nearby ambulances, and notify clinical responders.
              </p>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Describe your symptoms (e.g. severe contractions, water broke, bleeding)</label>
                <textarea className="form-input" style={{ minHeight: '60px', padding: '8px' }} placeholder="Provide brief notes..." value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="cemonc-chk" checked={requireCemonc} onChange={e => setRequireCemonc(e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="cemonc-chk" style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none', color: '#4b5563' }}>Require specialized surgical / obstetric theater (CEmONC)</label>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px', marginTop: '14px' }}>
              <button className="btn-momentra-outline" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }} onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn-momentra-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }} onClick={handleConfirmSOS}>Trigger Dispatch SOS</button>
            </div>
          </div>
        </div>
      )}

      {/* MOMENTRA INTERACTIVE ONBOARDING GUIDE MODAL */}
      {showGuideModal && (
        <div className="modal-overlay active">
          <div className="modal card-glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤱</span> Momentra System Guide
              </h3>
              <button onClick={() => setShowGuideModal(false)} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', minHeight: '180px' }}>
              <div style={{ fontSize: '3rem', width: '80px', height: '80px', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(244,63,94,0.08)' }}>
                {guideSteps[guideStep].icon}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1f2937' }}>
                {guideSteps[guideStep].title}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6, maxWidth: '400px' }}>
                {guideSteps[guideStep].desc}
              </p>
              
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {guideSteps.map((_, idx) => (
                  <span key={idx} style={{ width: guideStep === idx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: guideStep === idx ? '#f43f5e' : 'rgba(0,0,0,0.1)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '14px', marginTop: '20px' }}>
              <button 
                className="btn-momentra-outline" 
                style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem', visibility: guideStep === 0 ? 'hidden' : 'visible' }}
                onClick={() => setGuideStep(guideStep - 1)}
              >
                Back
              </button>
              
              <button 
                className="btn-momentra-primary" 
                style={{ padding: '0.45rem 1.5rem', fontSize: '0.8rem' }}
                onClick={() => {
                  if (guideStep < guideSteps.length - 1) {
                    setGuideStep(guideStep + 1);
                  } else {
                    setShowGuideModal(false);
                    navigate('/mother-console');
                  }
                }}
              >
                {guideStep === guideSteps.length - 1 ? "Enter Console" : "Next Step"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
