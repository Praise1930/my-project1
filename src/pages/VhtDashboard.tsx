// MamaTrack GPS — Village Health Team (VHT) Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, EmergencyService, NotificationService, VhtService, VitalsService, SmsService, User, VhtVisitLog, Emergency } from '../services/db';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { Bell, LogOut, Search } from 'lucide-react';

export const VhtDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'mothers' | 'visits' | 'register'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lists
  const [mothersList, setMothersList] = useState<any[]>([]);
  const [visitsList, setVisitsList] = useState<VhtVisitLog[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<Emergency[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Home Visit Form State
  const [selectedMother, setSelectedMother] = useState<any | null>(null);
  const [bpInput, setBpInput] = useState('120/80');
  const [tempInput, setTempInput] = useState('36.6');
  const [kicksInput, setKicksInput] = useState('10');
  const [movementInput, setMovementInput] = useState<'normal' | 'reduced' | 'none'>('normal');
  const [notesInput, setNotesInput] = useState('');
  const [compInput, setCompInput] = useState('None');

  // Register Mother Form State
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password_hash: 'password123',
    date_of_birth: '',
    blood_type: 'O+',
    pregnancy_start_date: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: 'Husband',
    village: '',
    sub_county: 'Goma'
  });

  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regDobDay, setRegDobDay] = useState('');
  const [regDobMonth, setRegDobMonth] = useState('');
  const [regDobYear, setRegDobYear] = useState('');

  const handleRegDobChange = (part: 'day' | 'month' | 'year', value: string) => {
    let d = regDobDay;
    let m = regDobMonth;
    let y = regDobYear;
    if (part === 'day') {
      setRegDobDay(value);
      d = value;
    } else if (part === 'month') {
      setRegDobMonth(value);
      m = value;
    } else if (part === 'year') {
      setRegDobYear(value);
      y = value;
    }
    
    const nextDob = (d && m && y) ? `${y}-${m}-${d}` : '';
    setRegForm(prev => ({
      ...prev,
      date_of_birth: nextDob
    }));

    if (nextDob) {
      setRegErrors(prev => {
        const copy = { ...prev };
        delete copy.date_of_birth;
        return copy;
      });
    }
  };

  // Load VHT Session & Data
  useEffect(() => {
    const session = db.getCurrentSessionUser();
    if (!session || session.role !== 'vht') {
      navigate('/login?role=vht');
      return;
    }
    setUser(session);

    // Load data
    const refreshData = () => {
      // Map mothers with their user names
      const mothers = db.mothers.map(m => {
        const u = db.users.find(usr => usr.id === m.user_id);
        return {
          ...m,
          name: u?.full_name || 'Expectant Mother',
          email: u?.email || '',
          phone: u?.phone || ''
        };
      });
      setMothersList(mothers);

      // Load VHT visits
      setVisitsList(VhtService.getVisitsByVht(session.id));

      // Load active emergencies
      setActiveEmergencies(db.emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)));

      // Load notifications
      setNotifications(NotificationService.getNotificationsForUser(session.id));
    };

    refreshData();
    const interval = setInterval(refreshData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [navigate]);

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading VHT Console...</div>;

  const handleRegisterMother = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors({});

    const errors: Record<string, string> = {};
    const phoneRegex = /^7\d{7}$/;

    if (!regForm.full_name.trim()) errors.full_name = "Full name is required.";
    if (!regForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) {
      errors.email = "Invalid email format.";
    }
    
    if (!regForm.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(regForm.phone)) {
      errors.phone = "Invalid format. Must start with 7 and have exactly 8 digits (e.g. 71234567).";
    }

    if (!regForm.date_of_birth) {
      errors.date_of_birth = "Date of birth is required.";
    }

    if (!regForm.pregnancy_start_date) {
      errors.pregnancy_start_date = "Pregnancy start date is required.";
    }

    if (!regForm.village.trim()) {
      errors.village = "Village name is required.";
    }

    if (!regForm.next_of_kin_name.trim()) {
      errors.next_of_kin_name = "Kin name is required.";
    }

    if (!regForm.next_of_kin_phone.trim()) {
      errors.next_of_kin_phone = "Kin phone is required.";
    } else if (!phoneRegex.test(regForm.next_of_kin_phone)) {
      errors.next_of_kin_phone = "Invalid format. Must start with 7 and have exactly 8 digits (e.g. 71234567).";
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    const submissionData = {
      ...regForm,
      phone: `+267${regForm.phone}`,
      next_of_kin_phone: `+267${regForm.next_of_kin_phone}`
    };
    
    const res = AuthService.registerMother(submissionData);
    if (res.success) {
      // Send Welcome SMS
      SmsService.sendSms(
        submissionData.full_name,
        submissionData.phone,
        `MamaTrack: Welcome! VHT ${user.full_name} has registered you to the Mukono health monitoring network. Download the app or dial *270#.`
      );
      
      // Update state
      const mothers = db.mothers.map(m => {
        const u = db.users.find(usr => usr.id === m.user_id);
        return { ...m, name: u?.full_name || 'Expectant Mother', email: u?.email || '', phone: u?.phone || '' };
      });
      setMothersList(mothers);

      alert(`Mother ${regForm.full_name} registered successfully! A welcome text has been sent.`);
      setRegForm({
        full_name: '',
        email: '',
        phone: '',
        password_hash: 'password123',
        date_of_birth: '',
        blood_type: 'O+',
        pregnancy_start_date: '',
        next_of_kin_name: '',
        next_of_kin_phone: '',
        next_of_kin_relationship: 'Husband',
        village: '',
        sub_county: 'Goma'
      });
      setRegDobDay('');
      setRegDobMonth('');
      setRegDobYear('');
      setActiveTab('mothers');
    } else {
      alert(res.error || 'Failed to register mother.');
    }
  };

  const handleLogVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMother) return;

    const bpParts = bpInput.split('/');
    const systolic = parseInt(bpParts[0] || '120');
    const diastolic = parseInt(bpParts[1] || '80');
    const tempVal = parseFloat(tempInput);
    const kicksVal = parseInt(kicksInput);

    // Save VHT Visit Log
    VhtService.addVisitLog({
      vht_id: user.id,
      mother_id: selectedMother.user_id,
      visit_date: new Date().toISOString().split('T')[0],
      blood_pressure: bpInput,
      temperature: tempVal,
      fetal_movement: movementInput,
      notes: notesInput,
      complications_observed: compInput
    });

    // Sync to Vitals Ledger
    VitalsService.addVitalsRecord(selectedMother.user_id, {
      systolic,
      diastolic,
      glucose: 90, // mock average glucose
      kick_count: kicksVal,
      recorded_by: 'vht'
    });

    // Warning validation
    let danger = false;
    let alerts = [];
    if (systolic >= 140 || diastolic >= 90) {
      danger = true;
      alerts.push(`High BP (${bpInput} mmHg)`);
    }
    if (tempVal >= 38) {
      danger = true;
      alerts.push(`Fever (${tempVal}°C)`);
    }
    if (movementInput === 'reduced' || movementInput === 'none') {
      danger = true;
      alerts.push('Reduced fetal movements');
    }

    if (danger) {
      // Send alert SMS to doctor
      const doctorUser = db.users.find(u => u.role === 'doctor') || db.users.find(u => u.role === 'admin');
      if (doctorUser) {
        SmsService.sendSms(
          doctorUser.full_name,
          doctorUser.phone,
          `CLINICAL ALERT from VHT Sarah: Monitored patient ${selectedMother.name} has risk factors: ${alerts.join(', ')}. Urgent follow up recommended.`
        );
      }
      // SMS to mother kin
      SmsService.sendSms(
        selectedMother.next_of_kin_name,
        selectedMother.next_of_kin_phone,
        `MamaTrack Alert: VHT logged abnormal vital readings for ${selectedMother.name}: ${alerts.join(', ')}. Please monitor her condition.`
      );
    }

    setVisitsList(VhtService.getVisitsByVht(user.id));
    setSelectedMother(null);
    setNotesInput('');
    setCompInput('None');
    alert('VHT visit logged successfully!' + (danger ? ' ⚠️ High risk triggers dispatched to clinical staff.' : ''));
  };

  const handleTriggerSOSForMother = (mother: any) => {
    if (window.confirm(`Trigger an emergency medical rescue dispatch for ${mother.name}?`)) {
      EmergencyService.triggerEmergency(
        mother.user_id,
        mother.home_latitude,
        mother.home_longitude,
        `Emergency triggered by VHT Sarah on scene: suspected labor or maternal distress.`,
        false
      );
      alert(`SOS Dispatched! Rescue responders have been alerted.`);
      setActiveTab('home');
    }
  };

  const filteredMothers = mothersList.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  return (
    <div className="vht-theme" style={{ display: 'flex', minHeight: '100vh', background: isDark ? '#0f172a' : '#f0f9ff', color: isDark ? '#f1f5f9' : '#334155', fontFamily: "'Muli', sans-serif" }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', background: isDark ? '#1e293b' : '#ffffff', borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, bottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <img src="/assets/img/icons/logo.png" alt="Logo" style={{ width: '38px', height: '38px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0284c7' }}>VHT Console</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={() => setActiveTab('home')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'home' ? 'rgba(14,165,233,0.1)' : 'transparent', color: activeTab === 'home' ? '#0284c7' : 'inherit', fontWeight: activeTab === 'home' ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span>🏠</span> Dashboard Home
          </button>
          <button onClick={() => setActiveTab('mothers')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'mothers' ? 'rgba(14,165,233,0.1)' : 'transparent', color: activeTab === 'mothers' ? '#0284c7' : 'inherit', fontWeight: activeTab === 'mothers' ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span>🤰</span> Expectant Mothers
          </button>
          <button onClick={() => setActiveTab('visits')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'visits' ? 'rgba(14,165,233,0.1)' : 'transparent', color: activeTab === 'visits' ? '#0284c7' : 'inherit', fontWeight: activeTab === 'visits' ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span>📋</span> Visit Logs History
          </button>
          <button onClick={() => setActiveTab('register')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'register' ? 'rgba(14,165,233,0.1)' : 'transparent', color: activeTab === 'register' ? '#0284c7' : 'inherit', fontWeight: activeTab === 'register' ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span>➕</span> Register Mother
          </button>
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>V</div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{user.full_name}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Mukono VHT Officer</div>
            </div>
          </div>
          <button onClick={() => { AuthService.logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* SCOPED MOBILE OVERRIDES */}
      <style>{`
        @media (max-width: 768px) {
          .vht-theme aside {
            display: none !important;
          }
          .vht-theme main {
            margin-left: 0 !important;
            padding: 16px !important;
            padding-bottom: 20px !important;
          }
        }
      `}</style>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '32px', boxSizing: 'border-box' }}>
        
        {/* Top Header Strip */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'inherit', cursor: 'pointer', padding: '4px' }}
              title="Open Navigation Menu"
            >
              ☰
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>{activeTab} Workspace</h1>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Mukono District Maternal Health Network</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <ThemeToggle />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'inherit', position: 'relative' }}>
                <Bell size={20} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', width: 8, height: 8, borderRadius: '50%' }} />
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '35px', right: 0, width: '280px', background: isDark ? '#1e293b' : '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', zIndex: 100, padding: '10px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800 }}>Notifications</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.length === 0 ? (
                      <span style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', display: 'block', padding: '10px' }}>No notifications</span>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px', fontSize: '0.74rem' }}>
                          <span style={{ fontWeight: 700, display: 'block' }}>{n.title}</span>
                          <span style={{ color: '#64748b' }}>{n.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <ProfilePhotoUpload user={user} onUpdated={setUser} size={34} showLabel={false} />
            <button
              onClick={() => { AuthService.logout(); navigate('/'); }}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Logout"
            >
              <LogOut size={14} /> <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* OFF-CANVAS MOBILE DRAWER SIDEBAR */}
        {mobileSidebarOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 99998 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              zIndex: 99999,
              background: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#ffffff' : '#0f172a',
              boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#0ea5e9', color: '#fff', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>📳</div>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>MamaTrack</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'inherit', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '10px', marginBottom: '20px' }}>
                <ProfilePhotoUpload user={user} onUpdated={setUser} size={42} showLabel={false} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.full_name}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>VHT Field Worker</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                {[
                  { id: 'home', icon: '🏠', label: 'Dashboard' },
                  { id: 'mothers', icon: '🤰', label: 'Assigned Mothers' },
                  { id: 'visits', icon: '📋', label: 'Visit Logs' },
                  { id: 'register', icon: '➕', label: 'Register Mother' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === item.id ? '#0ea5e9' : 'transparent',
                      color: activeTab === item.id ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                      fontWeight: activeTab === item.id ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemeToggle />
                <button
                  onClick={() => { AuthService.logout(); navigate('/'); }}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LogOut size={14} /> Exit
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB: DASHBOARD HOME */}
        {activeTab === 'home' && (
          <div>
            {/* KPI statistics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="card" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🤰</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{mothersList.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Mothers Monitored</span>
                </div>
              </div>
              <div className="card" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📋</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{visitsList.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Home Visits Logged</span>
                </div>
              </div>
              <div className="card" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🚨</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{activeEmergencies.length}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Active SOS Alerts</span>
                </div>
              </div>
            </div>

            {/* Active emergencies list section */}
            <div className="card-glass" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '16px' }}>
                🚨 Active Rescue Alerts (Mukono District)
              </h3>
              {activeEmergencies.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No active emergency rescues in progress.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeEmergencies.map((emg) => {
                    const mother = mothersList.find(m => m.user_id === emg.mother_id);
                    return (
                      <div key={emg.id} style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', display: 'block' }}>{emg.code} (Status: {emg.status})</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', margin: '3px 0' }}>Mother: {mother?.name || 'Unknown Patient'}</span>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Village: {mother?.village || 'Unknown Village'} | Notes: {emg.notes}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '4px' }}>SOS</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: EXPECTANT MOTHERS */}
        {activeTab === 'mothers' && (
          <div>
            {/* Search filter and lists */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="text" placeholder="Search by name, village, or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', fontSize: '0.85rem', borderRadius: '6px', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', background: isDark ? '#1e293b' : '#ffffff', color: 'inherit' }} />
              </div>
            </div>

            {selectedMother ? (
              // Log Visit Form Overlay
              <div className="card-glass" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>📝 Log Home Visit - {selectedMother.name}</h3>
                <form onSubmit={handleLogVisit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Blood Pressure (mmHg)</label>
                      <input type="text" value={bpInput} onChange={e => setBpInput(e.target.value)} className="form-input" placeholder="e.g. 120/80" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Temperature (°C)</label>
                      <input type="text" value={tempInput} onChange={e => setTempInput(e.target.value)} className="form-input" placeholder="e.g. 36.6" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fetal Kicks (last 2h)</label>
                      <input type="number" value={kicksInput} onChange={e => setKicksInput(e.target.value)} className="form-input" placeholder="e.g. 10" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fetal Movements Status</label>
                      <select value={movementInput} onChange={e => setMovementInput(e.target.value as any)} className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }}>
                        <option value="normal">Normal / Active</option>
                        <option value="reduced">Reduced / Sluggish</option>
                        <option value="none">No movement felt</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Observed Complications</label>
                      <select value={compInput} onChange={e => setCompInput(e.target.value)} className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }}>
                        <option value="None">None</option>
                        <option value="Severe Headache">Severe Headache (Preeclampsia risk)</option>
                        <option value="Swollen Feet/Face">Swollen Feet / Face</option>
                        <option value="Vaginal Bleeding">Vaginal Bleeding (Emergency risk)</option>
                        <option value="Water Breaking">Premature Water Breaking</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>VHT Progress Notes</label>
                    <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} className="form-input" placeholder="Write advice given to mother..." style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%', height: '80px', fontFamily: 'inherit' }} required />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setSelectedMother(null)} style={{ background: 'none', border: '1px solid #cbd5e1', color: 'inherit', padding: '8px 16px', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Save Visit Log</button>
                  </div>
                </form>
              </div>
            ) : (
              // Mothers Directory List
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredMothers.map((mother) => (
                  <div key={mother.id} style={{ background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e0f2fe', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>{mother.name}</h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>📞 Phone: {mother.phone} | Village: {mother.village} ({mother.sub_county})</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>🩺 Blood Type: {mother.blood_type} | EDD: {mother.expected_due_date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setSelectedMother(mother)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📝</span> Log Visit
                      </button>
                      <button onClick={() => handleTriggerSOSForMother(mother)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🆘</span> SOS Rescue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: VISIT LOGS HISTORY */}
        {activeTab === 'visits' && (
          <div className="card-glass" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>📋 Monitored Visit Registry</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 800 }}>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Mother Name</th>
                    <th style={{ padding: '12px' }}>Blood Pressure</th>
                    <th style={{ padding: '12px' }}>Fetal Kicks</th>
                    <th style={{ padding: '12px' }}>Complications</th>
                    <th style={{ padding: '12px' }}>Advice Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visitsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No checkup home visits logged by VHT yet.</td>
                    </tr>
                  ) : (
                    visitsList.map(visit => {
                      const mother = mothersList.find(m => m.user_id === visit.mother_id);
                      return (
                        <tr key={visit.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <td style={{ padding: '12px' }}>{visit.visit_date}</td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{mother?.name || 'Mother'}</td>
                          <td style={{ padding: '12px' }}>{visit.blood_pressure}</td>
                          <td style={{ padding: '12px' }}>{visit.fetal_movement}</td>
                          <td style={{ padding: '12px', color: visit.complications_observed !== 'None' ? '#ef4444' : 'inherit', fontWeight: visit.complications_observed !== 'None' ? 700 : 'normal' }}>{visit.complications_observed}</td>
                          <td style={{ padding: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visit.notes}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: REGISTER EXPECTANT MOTHER */}
        {activeTab === 'register' && (
          <div className="card-glass" style={{ padding: '24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', maxWidth: '680px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px' }}>🤰 Expectant Mother Enrollment Form</h3>
            <form onSubmit={handleRegisterMother} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mother Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderColor: regErrors.full_name ? '#ef4444' : undefined }}
                    value={regForm.full_name}
                    onChange={e => {
                      setRegForm({ ...regForm, full_name: e.target.value });
                      if (regErrors.full_name) setRegErrors(prev => ({ ...prev, full_name: '' }));
                    }}
                  />
                  {regErrors.full_name && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.full_name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#cbd5e1' : '#475569',
                      padding: '0 12px',
                      border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                      borderRight: 'none',
                      borderRadius: '6px 0 0 6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      userSelect: 'none'
                    }}>
                      +267
                    </span>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 71234567"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: '0 6px 6px 0',
                        borderLeft: 'none',
                        borderColor: regErrors.phone ? '#ef4444' : undefined
                      }}
                      value={regForm.phone}
                      onChange={e => {
                        setRegForm({ ...regForm, phone: e.target.value });
                        if (regErrors.phone) setRegErrors(prev => ({ ...prev, phone: '' }));
                      }}
                    />
                  </div>
                  {regErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.phone}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderColor: regErrors.email ? '#ef4444' : undefined }}
                    value={regForm.email}
                    onChange={e => {
                      setRegForm({ ...regForm, email: e.target.value });
                      if (regErrors.email) setRegErrors(prev => ({ ...prev, email: '' }));
                    }}
                  />
                  {regErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.email}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date of Birth</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className="form-input"
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.82rem', borderColor: regErrors.date_of_birth ? '#ef4444' : undefined }}
                      value={regDobDay}
                      onChange={(e) => handleRegDobChange('day', e.target.value)}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      className="form-input"
                      style={{ flex: 1.5, padding: '8px 4px', fontSize: '0.82rem', borderColor: regErrors.date_of_birth ? '#ef4444' : undefined }}
                      value={regDobMonth}
                      onChange={(e) => handleRegDobChange('month', e.target.value)}
                    >
                      <option value="">Month</option>
                      {[
                        { val: '01', name: 'Jan' },
                        { val: '02', name: 'Feb' },
                        { val: '03', name: 'Mar' },
                        { val: '04', name: 'Apr' },
                        { val: '05', name: 'May' },
                        { val: '06', name: 'Jun' },
                        { val: '07', name: 'Jul' },
                        { val: '08', name: 'Aug' },
                        { val: '09', name: 'Sep' },
                        { val: '10', name: 'Oct' },
                        { val: '11', name: 'Nov' },
                        { val: '12', name: 'Dec' }
                      ].map(m => (
                        <option key={m.val} value={m.val}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      className="form-input"
                      style={{ flex: 1.2, padding: '8px 4px', fontSize: '0.82rem', borderColor: regErrors.date_of_birth ? '#ef4444' : undefined }}
                      value={regDobYear}
                      onChange={(e) => handleRegDobChange('year', e.target.value)}
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 70 }, (_, i) => String(new Date().getFullYear() - 14 - i)).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {regErrors.date_of_birth && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.date_of_birth}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Blood Group</label>
                  <select className="form-input" style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }} value={regForm.blood_type} onChange={e => setRegForm({ ...regForm, blood_type: e.target.value })}>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="B+">B Positive (B+)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pregnancy Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderColor: regErrors.pregnancy_start_date ? '#ef4444' : undefined }}
                    value={regForm.pregnancy_start_date}
                    onChange={e => {
                      setRegForm({ ...regForm, pregnancy_start_date: e.target.value });
                      if (regErrors.pregnancy_start_date) setRegErrors(prev => ({ ...prev, pregnancy_start_date: '' }));
                    }}
                  />
                  {regErrors.pregnancy_start_date && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.pregnancy_start_date}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Village Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderColor: regErrors.village ? '#ef4444' : undefined }}
                    value={regForm.village}
                    onChange={e => {
                      setRegForm({ ...regForm, village: e.target.value });
                      if (regErrors.village) setRegErrors(prev => ({ ...prev, village: '' }));
                    }}
                  />
                  {regErrors.village && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.village}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sub County</label>
                  <select className="form-input" style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }} value={regForm.sub_county} onChange={e => setRegForm({ ...regForm, sub_county: e.target.value })}>
                    <option value="Goma">Goma</option>
                    <option value="Nama">Nama</option>
                    <option value="Mukono Municipality">Mukono Municipality</option>
                  </select>
                </div>
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', margin: '20px 0 10px' }}>Next of Kin Contact Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kin Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderColor: regErrors.next_of_kin_name ? '#ef4444' : undefined }}
                    value={regForm.next_of_kin_name}
                    onChange={e => {
                      setRegForm({ ...regForm, next_of_kin_name: e.target.value });
                      if (regErrors.next_of_kin_name) setRegErrors(prev => ({ ...prev, next_of_kin_name: '' }));
                    }}
                  />
                  {regErrors.next_of_kin_name && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.next_of_kin_name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kin Phone Number</label>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#cbd5e1' : '#475569',
                      padding: '0 12px',
                      border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                      borderRight: 'none',
                      borderRadius: '6px 0 0 6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      userSelect: 'none'
                    }}>
                      +267
                    </span>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 71234567"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: '0 6px 6px 0',
                        borderLeft: 'none',
                        borderColor: regErrors.next_of_kin_phone ? '#ef4444' : undefined
                      }}
                      value={regForm.next_of_kin_phone}
                      onChange={e => {
                        setRegForm({ ...regForm, next_of_kin_phone: e.target.value });
                        if (regErrors.next_of_kin_phone) setRegErrors(prev => ({ ...prev, next_of_kin_phone: '' }));
                      }}
                    />
                  </div>
                  {regErrors.next_of_kin_phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>{regErrors.next_of_kin_phone}</span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-block" style={{ width: '100%', padding: '12px', fontSize: '0.88rem', fontWeight: 700, color: '#fff', background: '#0284c7', border: 'none', borderRadius: '6px' }}>
                Register Expectant Mother Account
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};
