// MamaTrack GPS — Ambulance Driver Panel

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, DriverService, EmergencyService, SimulationEngine, User, Driver, Emergency, Vehicle, Mother } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { CheckSquare, PlusSquare, CheckCircle, LogOut } from 'lucide-react';
import { ThemeToggle } from '../contexts/ThemeContext';
import '../styles/driver/theme.css';

export const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
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

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '1.5rem', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚑</div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>MamaTrack</h2>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Ambulance Deck</p>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(245, 158, 11, 0.12)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>Ambulance: <strong style={{ color: '#f8fafc' }}>{vehicle.plate_number}</strong></div>
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

          <div className="sidebar-user">
            <ProfilePhotoUpload user={user} onUpdated={setUser} size={38} showLabel={false} />
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{user.full_name.split(' ')[0]}</div>
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
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Panel Workspace */}
        <main className="main-content" style={{ padding: '2rem' }}>
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Ambulance Navigation Panel</h1>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0' }}>Real-time GPS Dispatch & Patient Handoff Telemetry</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ThemeToggle style={{ fontSize: '0.75rem' }} />
              <button
                onClick={handleToggleDuty}
                className={`btn btn-sm ${driver.is_on_duty ? 'btn-amber' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <span>{driver.is_on_duty ? '🟢 Active On-Duty' : '🔴 Go Standby'}</span>
              </button>
              <button
                onClick={() => { AuthService.logout(); navigate('/'); }}
                className="driver-logout-btn"
                style={{ display: 'none', alignItems: 'center', gap: '5px', padding: '8px 16px', fontSize: '0.82rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                title="Logout"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </header>

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
                    theme="light"
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
                    theme="light"
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
