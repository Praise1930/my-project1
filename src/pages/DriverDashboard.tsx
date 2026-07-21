// MamaTrack GPS — Ambulance Driver Panel

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, DriverService, EmergencyService, SimulationEngine, User, Driver, Emergency, Vehicle, Mother } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { CheckSquare, PlusSquare, CheckCircle, LogOut } from 'lucide-react';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import '../styles/driver/theme.css';

export const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // active emergency states
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState({
    liters: 15,
    cost: 80000,
    station: 'Shell Mukono'
  });

  const [inspectionForm, setInspectionForm] = useState({
    fuel_level: 'full' as 'full' | 'half' | 'low',
    siren_ok: true,
    medical_checked: true,
    tires_ok: true,
    engine_ok: true
  });

  const [hasInspectedToday, setHasInspectedToday] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toggle body class when driver theme is active
  useEffect(() => {
    document.body.classList.add('driver-theme-active');
    return () => {
      document.body.classList.remove('driver-theme-active');
    };
  }, []);

  // 1. Auth check and initial load
  useEffect(() => {
    const sessionUser = db.getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== 'driver') {
      navigate('/login?role=driver');
      return;
    }
    setUser(sessionUser);

    const drvProfile = DriverService.getDriverByUserId(sessionUser.id);
    if (drvProfile) {
      setDriver(drvProfile);
      setVehicle(db.vehicles.find(v => v.id === drvProfile.vehicle_id) || null);
      
      // Load active emergency dispatch matching driver's user id
      const activeEmg = db.emergencies.find(
        e => e.driver_id === sessionUser.id && !['completed', 'cancelled'].includes(e.status)
      );
      setActiveEmergency(activeEmg || null);
    }
  }, [navigate]);

  // 2. Poll dispatch changes or simulation updates
  useEffect(() => {
    if (!user || !driver) return;
    const userId = user.id;

    // Local loop to poll for incoming dispatch assignments
    const interval = setInterval(() => {
      const activeEmg = db.emergencies.find(
        e => e.driver_id === userId && !['completed', 'cancelled'].includes(e.status)
      );
      
      // Only set if changed
      if (JSON.stringify(activeEmg) !== JSON.stringify(activeEmergency)) {
        setActiveEmergency(activeEmg || null);
        if (!activeEmg) {
          setIsSimulating(false);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, driver, activeEmergency]);

  // 3. Connect simulation engine updates
  useEffect(() => {
    if (!activeEmergency || !isSimulating) return;

    SimulationEngine.startAmbulanceSimulation(activeEmergency.id, (updatedEmg) => {
      setActiveEmergency(updatedEmg);
      if (updatedEmg.status === 'arrived') {
        setIsSimulating(false);
      }
      // Reload vehicle lat/lng
      if (driver) {
        const freshDriver = db.drivers.find(d => d.user_id === driver.user_id);
        if (freshDriver) setDriver(freshDriver);
      }
    });

    return () => {
      if (activeEmergency) {
        SimulationEngine.stopSimulation(activeEmergency.id);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmergency?.id, isSimulating]);

  if (!user || !driver || !vehicle) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Loading Driver Profile...</div>;
  }

  // Map markers
  const motherUser = activeEmergency ? db.users.find(u => u.id === activeEmergency.mother_id) : null;
  const hospitalMatched = activeEmergency ? db.hospitals.find(h => h.id === activeEmergency.hospital_id) : null;

  const getMapMarkers = (): MapMarker[] => {
    const list: MapMarker[] = [
      { id: 'driver', lat: driver.current_latitude, lng: driver.current_longitude, type: 'driver', label: 'My Ambulance', sublabel: vehicle.plate_number }
    ];

    if (activeEmergency) {
      list.push({ id: 'mother', lat: activeEmergency.latitude, lng: activeEmergency.longitude, type: 'mother', label: `Patient: ${motherUser?.full_name || 'Expectant Mother'}` });
      if (hospitalMatched) {
        list.push({ id: 'hospital', lat: hospitalMatched.latitude, lng: hospitalMatched.longitude, type: 'hospital', label: `Matched Hospital: ${hospitalMatched.name}` });
      }
    } else {
      // show hospital by default
      const hosp = db.hospitals.find(h => h.id === driver.hospital_id);
      if (hosp) {
        list.push({ id: 'hospital', lat: hosp.latitude, lng: hosp.longitude, type: 'hospital', label: hosp.name });
      }
    }

    return list;
  };

  const getRoutePoints = (): [number, number][] => {
    if (activeEmergency) {
      return [
        [driver.current_latitude, driver.current_longitude],
        [activeEmergency.latitude, activeEmergency.longitude]
      ];
    }
    return [];
  };

  // Toggle Duty
  const handleToggleDuty = () => {
    if (activeEmergency && driver.is_on_duty) {
      alert('⚠️ Active emergency dispatch in progress! You cannot go off-duty or standby until the current maternal patient rescue is completed.');
      return;
    }
    const newVal = DriverService.toggleDuty(user.id);
    setDriver({ ...driver, is_on_duty: newVal });
    // Reload vehicle status from local db to keep UI synchronized
    const freshVehicle = db.vehicles.find(v => v.id === driver.vehicle_id);
    if (freshVehicle) {
      setVehicle(freshVehicle);
    }
  };

  // Pre-duty Checklist
  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DriverService.submitInspection(
      user.id,
      vehicle.id,
      inspectionForm.fuel_level,
      inspectionForm.siren_ok,
      inspectionForm.medical_checked,
      inspectionForm.tires_ok,
      inspectionForm.engine_ok
    );
    setHasInspectedToday(true);
    alert('Vehicle pre-duty inspection logged. Ready for emergency dispatches.');
  };

  // Fuel Log
  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DriverService.submitFuelLog(
      user.id,
      vehicle.id,
      fuelForm.liters,
      fuelForm.cost,
      fuelForm.station
    );
    setFuelForm({ liters: 15, cost: 80000, station: 'Shell Mukono' });
    alert('Fuel purchase transaction registered successfully.');
  };

  // Dispatch lifecycle triggers
  const handleStartRoute = () => {
    setIsSimulating(true);
    EmergencyService.updateStatus(activeEmergency!.id, 'en_route', user.id, 'Driver started navigation simulation');
  };

  const handleManualArrived = () => {
    setIsSimulating(false);
    if (activeEmergency) {
      SimulationEngine.stopSimulation(activeEmergency.id);
    }
    const updated = EmergencyService.updateStatus(activeEmergency!.id, 'arrived', user.id, 'Driver verified arrival at patient coordinate.');
    setActiveEmergency(updated);
  };

  const handleHandoffComplete = () => {
    EmergencyService.updateStatus(activeEmergency!.id, 'completed', user.id, 'Patient handed over to clinical reception. Rescue mission complete.');
    setActiveEmergency(null);
    alert('Maternal rescue mission logged as complete. Ready for next dispatch.');
  };

  return (
    <div className="driver-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="driver-bg" />

      {/* SCOPED THEME OVERRIDES FOR SIDEBAR */}
      <style>{`
        /* Default/Light mode styles for driver sidebar */
        .dashboard-layout aside.sidebar {
          background: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
        }
        .dashboard-layout aside.sidebar h2,
        .dashboard-layout aside.sidebar strong,
        .dashboard-layout aside.sidebar .user-name {
          color: #0f172a !important;
        }
        .dashboard-layout aside.sidebar p,
        .dashboard-layout aside.sidebar .user-role {
          color: #475569 !important;
        }
        .dashboard-layout aside.sidebar .logo-icon {
          background: rgba(245,158,11,0.08) !important;
        }
        .dashboard-layout aside.sidebar div[style*="border-bottom"],
        .dashboard-layout aside.sidebar div[style*="border-top"] {
          border-color: #cbd5e1 !important;
        }
        .dashboard-layout aside.sidebar .nav-item {
          color: #475569 !important;
        }
        .dashboard-layout aside.sidebar .nav-item.active {
          color: #b45309 !important;
          background: rgba(245,158,11,0.08) !important;
        }

        /* Dark mode overrides for driver sidebar */
        html[data-theme="dark"] .dashboard-layout aside.sidebar,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar {
          background: #11151d !important;
          border-right: 1px solid rgba(255,255,255,0.08) !important;
        }
        html[data-theme="dark"] .dashboard-layout aside.sidebar h2,
        html[data-theme="dark"] .dashboard-layout aside.sidebar strong,
        html[data-theme="dark"] .dashboard-layout aside.sidebar .user-name,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar h2,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar strong,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar .user-name {
          color: #f8fafc !important;
        }
        html[data-theme="dark"] .dashboard-layout aside.sidebar p,
        html[data-theme="dark"] .dashboard-layout aside.sidebar .user-role,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar p,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar .user-role {
          color: #94a3b8 !important;
        }
        html[data-theme="dark"] .dashboard-layout aside.sidebar div[style*="border-bottom"],
        html[data-theme="dark"] .dashboard-layout aside.sidebar div[style*="border-top"],
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar div[style*="border-bottom"],
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar div[style*="border-top"] {
          border-color: rgba(245,158,11,0.12) !important;
        }
        html[data-theme="dark"] .dashboard-layout aside.sidebar .nav-item.active,
        [data-bs-theme="dark"] .dashboard-layout aside.sidebar .nav-item.active {
          color: #fbbf24 !important;
          background: rgba(245,158,11,0.15) !important;
        }

        @media (max-width: 768px) {
          .dashboard-layout aside.sidebar {
            display: none !important;
          }
          .dashboard-layout .main-content {
            margin-left: 0 !important;
            padding-bottom: 20px !important;
          }
        }
      `}</style>

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="sidebar" style={{
          background: theme === 'light' ? '#ffffff' : '#11151d',
          borderRight: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'
        }}>
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '1.5rem', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚑</div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>MamaTrack</h2>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Ambulance Deck</p>
            </div>
          </div>

          {/* Relocated Profile Section to the Top */}
          <div className="sidebar-user" style={{
            borderBottom: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: 'none',
            background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ProfilePhotoUpload user={user} onUpdated={setUser} size={38} showLabel={false} />
            <div className="user-info" style={{ flex: 1 }}>
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>{user.full_name.split(' ')[0]}</div>
              <div className="user-role" style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Ambulance Driver</div>
            </div>
            <button
              onClick={() => { AuthService.logout(); navigate('/'); }}
              title="Logout"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <LogOut size={13} />
            </button>
          </div>

          <div style={{
            padding: '1.25rem 1rem',
            borderBottom: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(245, 158, 11, 0.12)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>
              Ambulance: <strong style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>{vehicle.plate_number}</strong>
            </div>
            <div
              style={{
                display: 'inline-block',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: driver.is_on_duty ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: driver.is_on_duty ? '#fbbf24' : '#94a3b8',
                border: driver.is_on_duty ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {driver.is_on_duty ? '🟢 ACTIVE ON-DUTY' : '🔴 STANDBY MODE'}
            </div>
          </div>

          <nav className="sidebar-nav" style={{ marginTop: '1rem', flex: 1 }}>
            <div className="nav-section">
              <div className="nav-item active">
                <span className="nav-icon">🚑</span>
                <span>Active Mission</span>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Panel Workspace */}
        <main className="main-content" style={{ padding: '2rem' }}>
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: theme === 'light' ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
                  background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                  color: theme === 'light' ? '#0f172a' : '#f8fafc',
                  fontSize: '1.75rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                className="d-inline-flex d-md-none"
                title="Open Navigation Menu"
              >
                ☰
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc', lineHeight: 1.25 }}>Ambulance Navigation Panel</h1>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>Real-time GPS Dispatch & Patient Handoff Telemetry</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <ThemeToggle style={{ fontSize: '0.75rem' }} />
              <button
                onClick={handleToggleDuty}
                className={`btn btn-sm ${driver.is_on_duty ? 'btn-amber' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <span>{driver.is_on_duty ? '🟢 Active On-Duty' : '🔴 Standby'}</span>
              </button>
              <ProfilePhotoUpload user={user} onUpdated={setUser} size={34} showLabel={false} />
              <button
                onClick={() => { AuthService.logout(); navigate('/'); }}
                className="driver-logout-btn d-none d-md-inline-flex"
                style={{ alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '0.82rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                title="Logout"
              >
                <LogOut size={14} /> <span>Exit</span>
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
                background: theme === 'light' ? '#ffffff' : '#0f172a',
                color: theme === 'light' ? '#0f172a' : '#ffffff',
                boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#f59e0b', color: '#fff', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>🚑</div>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>MamaTrack</span>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'inherit', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Profile Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '16px' }}>
                  <ProfilePhotoUpload user={user} onUpdated={setUser} size={42} showLabel={false} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.full_name}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ambulance Driver</span>
                  </div>
                </div>

                {/* Duty Toggle Button */}
                <button
                  onClick={handleToggleDuty}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: driver.is_on_duty ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                    background: driver.is_on_duty ? 'rgba(245,158,11,0.15)' : 'transparent',
                    color: driver.is_on_duty ? '#f59e0b' : 'inherit',
                    fontWeight: 700,
                    marginBottom: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {driver.is_on_duty ? '🟢 ACTIVE ON-DUTY' : '🔴 STANDBY MODE'}
                </button>

                {/* Navigation Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚑</span> Active Mission
                  </div>
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

          {/* DRIVER REFERENCE BANNER */}
          <div style={{
            background: theme === 'light' ? '#ffffff' : '#1e293b',
            borderRadius: '12px',
            overflow: 'hidden',
            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            color: theme === 'light' ? '#334155' : '#cbd5e1'
          }}>
            <div style={{ flex: '1.2', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
              <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Ambulance Response Deck</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Emergency Dispatch Response Protocol</h3>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: theme === 'light' ? '#64748b' : '#94a3b8', margin: '0 0 12px' }}>
                Ensure your siren and beacons are fully operational. Drive with caution along rural pathways. Transmit GPS telemetry to the regional hospital dispatch team automatically, and review next of kin contact information before picking up the patient.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                <span style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>🚨 High Priority Response</span>
                <span style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>📞 Help Center: 0800-MAMATRACK</span>
              </div>
            </div>
            <div style={{
              flex: '0.8',
              backgroundImage: 'url(/assets/img/gallery/blog1.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              minHeight: '140px',
              minWidth: '240px'
            }} />
          </div>

          {/* ACTIVE DISPATCH ALERT / MAP */}
          {activeEmergency ? (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
              {/* Mission Control Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card card-glass active-dispatch-glow" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.25)', paddingBottom: '10px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🚨 Active Dispatch Assignment
                    </h3>
                    <span className="badge badge-red">{activeEmergency.code}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Patient Name:</span>
                      <strong style={{ color: '#f8fafc' }}>{motherUser?.full_name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Location (GPS Target):</span>
                      <strong style={{ color: '#f8fafc' }}>{motherData()?.village}, {motherData()?.sub_county}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Distress Symptoms:</span>
                      <strong style={{ color: '#ef4444' }}>{activeEmergency.notes}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Destination Hospital:</span>
                      <strong style={{ color: '#fbbf24' }}>{hospitalMatched?.name}</strong>
                    </div>
                    <div style={{ marginTop: '6px', background: 'rgba(239, 68, 68, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Kin Emergency Contact:</div>
                      <strong style={{ color: '#f8fafc' }}>{motherData()?.next_of_kin_name} ({motherData()?.next_of_kin_phone})</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
                    {activeEmergency.status === 'dispatched' && (
                      <button onClick={handleStartRoute} className="btn btn-amber btn-block" style={{ height: '48px', fontSize: '0.95rem' }}>
                        🚀 Start Trip & GPS Simulation
                      </button>
                    )}

                    {activeEmergency.status === 'en_route' && (
                      <>
                        <div className="telemetry-pulsing" style={{ fontSize: '0.78rem', color: '#fbbf24', textAlign: 'center', marginBottom: '4px', fontWeight: 600 }}>
                          ⚡ GPS simulator driving toward mother...
                        </div>
                        <button onClick={handleManualArrived} className="btn btn-success btn-block" style={{ height: '48px', fontSize: '0.95rem' }}>
                          Arrived at Patient & Picked Up
                        </button>
                      </>
                    )}

                    {activeEmergency.status === 'arrived' && (
                      <button onClick={handleHandoffComplete} className="btn btn-success btn-block" style={{ height: '48px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle size={18} /> Clinical Handoff Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Map routing view */}
              <div className="card card-glass map-hud-container" style={{ display: 'flex', flexDirection: 'column', padding: '12px' }}>
                <div style={{ padding: '6px 10px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>🗺️ GPS Rescue Routing Navigation</h3>
                  <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em' }}>● HUD ACTIVE</span>
                </div>
                <div style={{ flex: 1, minHeight: '380px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
                  <MapComponent
                    center={[driver.current_latitude, driver.current_longitude]}
                    zoom={13}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          ) : (
            // STANDBY MODE: Checklists and Logs
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                {/* Pre duty safety checklists */}
                <div className="card card-glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245, 158, 11, 0.12)', paddingBottom: '8px' }}>
                    <CheckSquare size={20} style={{ color: '#fbbf24' }} /> Pre-Duty Vehicle Inspection
                  </h3>
                  
                  {hasInspectedToday ? (
                    <div className="inspection-success-box" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛡️</div>
                      <strong style={{ fontSize: '1rem', color: '#34d399' }}>Inspection Log Certified</strong>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
                        Ambulance <strong>{vehicle.plate_number}</strong> is fully authorized safe and standing by for regional emergency dispatches.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleInspectionSubmit}>
                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label">Inspected Fuel Level</label>
                        <select className="form-input" style={{ width: '100%' }} value={inspectionForm.fuel_level} onChange={e => setInspectionForm({ ...inspectionForm, fuel_level: e.target.value as 'full' | 'half' | 'low' })}>
                          <option value="full">Full Tank</option>
                          <option value="half">Half Tank</option>
                          <option value="low">Low Tank</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '0.85rem' }}>
                        <label className="checklist-item">
                          <input type="checkbox" checked={inspectionForm.siren_ok} onChange={e => setInspectionForm({ ...inspectionForm, siren_ok: e.target.checked })} />
                          <span>Siren & Emergency Beacon fully functional</span>
                        </label>
                        <label className="checklist-item">
                          <input type="checkbox" checked={inspectionForm.medical_checked} onChange={e => setInspectionForm({ ...inspectionForm, medical_checked: e.target.checked })} />
                          <span>Obstetric delivery kit & oxygen tanks verified</span>
                        </label>
                        <label className="checklist-item">
                          <input type="checkbox" checked={inspectionForm.tires_ok} onChange={e => setInspectionForm({ ...inspectionForm, tires_ok: e.target.checked })} />
                          <span>Tire pressure and suspension ok</span>
                        </label>
                        <label className="checklist-item">
                          <input type="checkbox" checked={inspectionForm.engine_ok} onChange={e => setInspectionForm({ ...inspectionForm, engine_ok: e.target.checked })} />
                          <span>Engine fluid, oil, and coolant levels ok</span>
                        </label>
                      </div>

                      <button type="submit" className="btn btn-amber btn-block" style={{ marginTop: '1.5rem', width: '100%', height: '42px' }}>
                        Submit Inspection Log
                      </button>
                    </form>
                  )}
                </div>

                {/* Fuel purchase logs */}
                <div className="card card-glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245, 158, 11, 0.12)', paddingBottom: '8px' }}>
                    <PlusSquare size={20} style={{ color: '#fbbf24' }} /> Fuel Purchase receipts
                  </h3>
                  
                  <form onSubmit={handleFuelSubmit}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Fuel Quantity (Liters)</label>
                      <input type="number" className="form-input" style={{ width: '100%' }} value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Total Cost (UGX)</label>
                      <input type="number" className="form-input" style={{ width: '100%' }} value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Filling Station Name</label>
                      <input type="text" className="form-input" style={{ width: '100%' }} value={fuelForm.station} onChange={e => setFuelForm({ ...fuelForm, station: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-amber btn-block" style={{ width: '100%', height: '42px' }}>
                      Log Fuel Purchase
                    </button>
                  </form>
                </div>
              </div>

              {/* Standby Map routing view */}
              <div className="card card-glass map-hud-container" style={{ display: 'flex', flexDirection: 'column', padding: '12px' }}>
                <div style={{ padding: '6px 10px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>🗺️ Region Standby Monitor Map</h3>
                  <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em' }}>● STANDBY MONITOR</span>
                </div>
                <div style={{ flex: 1, minHeight: '380px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
                  <MapComponent
                    center={[driver.current_latitude, driver.current_longitude]}
                    zoom={13}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <p>© 2026 MamaTrack GPS · Regional Maternal Emergency Response System. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );

  // Quick helper to fetch active patient mother data
  function motherData(): Mother | undefined {
    if (!activeEmergency) return undefined;
    return db.mothers.find(m => m.user_id === activeEmergency.mother_id);
  }
};
