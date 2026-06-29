// MamaTrack GPS — Ambulance Driver Panel

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, DriverService, EmergencyService, SimulationEngine, User, Driver, Emergency, Vehicle, Mother } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { CheckSquare, PlusSquare, CheckCircle } from 'lucide-react';

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

    // Local loop to poll for incoming dispatch assignments
    const interval = setInterval(() => {
      const activeEmg = db.emergencies.find(
        e => e.driver_id === user.id && !['completed', 'cancelled'].includes(e.status)
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
    const newVal = DriverService.toggleDuty(user.id);
    setDriver({ ...driver, is_on_duty: newVal });
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
            <div className="logo-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning-400)' }}>🚑</div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>MamaTrack</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ambulance Deck</p>
            </div>
          </div>

          <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Ambulance: {vehicle.plate_number}</div>
            <button
              onClick={handleToggleDuty}
              className={`btn btn-sm ${driver.is_on_duty ? 'btn-amber' : 'btn-ghost'}`}
              style={{ background: driver.is_on_duty ? 'var(--warning-500)' : 'rgba(255,255,255,0.05)', color: driver.is_on_duty ? '#000000' : '#ffffff', fontSize: '0.78rem', width: '100%', padding: '6px' }}
            >
              🚚 {driver.is_on_duty ? 'Duty Status: ACTIVE' : 'Duty Status: OFF'}
            </button>
          </div>

          <nav className="sidebar-nav" style={{ marginTop: '1rem' }}>
            <div className="nav-section">
              <div className="nav-item active">
                <span className="nav-icon">🚑</span>
                <span>Active Mission</span>
              </div>
            </div>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--warning-400), var(--amber-700))', color: '#000' }}>🚑</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name.split(' ')[0]}</div>
              <div className="user-role" style={{ fontSize: '0.7rem', color: 'var(--warning-400)' }}>Ambulance Driver</div>
            </div>
            <button className="btn-logout" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
              🚪
            </button>
          </div>
        </aside>

        {/* Main Panel Workspace */}
        <main className="main-content">
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ambulance Navigation Panel</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time GPS Dispatch Receiver</p>
            </div>
          </header>

          {/* ACTIVE DISPATCH ALERT / MAP */}
          {activeEmergency ? (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
              {/* Mission Control Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card card-glass" style={{ padding: '1.5rem', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--warning-400)' }}>🚨 Active Dispatch Assignment</h3>
                    <span className="badge badge-red">{activeEmergency.code}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                    <div>Patient Name: <strong>{motherUser?.full_name}</strong></div>
                    <div>Location: <strong>{motherData()?.village}, {motherData()?.sub_county}</strong></div>
                    <div>Distress details: <strong style={{ color: 'var(--danger-400)' }}>{activeEmergency.notes}</strong></div>
                    <div>Hospital matched: <strong>{hospitalMatched?.name}</strong></div>
                    <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      Kin Contact: <strong>{motherData()?.next_of_kin_name} ({motherData()?.next_of_kin_phone})</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
                    {activeEmergency.status === 'dispatched' && (
                      <button onClick={handleStartRoute} className="btn btn-amber btn-block" style={{ background: 'var(--warning-500)', color: '#000', fontWeight: 700 }}>
                        🚀 Start Trip & GPS Simulation
                      </button>
                    )}

                    {activeEmergency.status === 'en_route' && (
                      <>
                        <div style={{ fontSize: '0.78rem', color: 'var(--warning-400)', textAlign: 'center', marginBottom: '6px', animation: 'pulse-slow 2s infinite' }}>
                          ⚡ GPS simulator driving toward mother...
                        </div>
                        <button onClick={handleManualArrived} className="btn btn-success btn-block" style={{ background: 'var(--success-500)', color: '#fff', fontWeight: 700 }}>
                          Arrived at Patient & Picked Up
                        </button>
                      </>
                    )}

                    {activeEmergency.status === 'arrived' && (
                      <button onClick={handleHandoffComplete} className="btn btn-success btn-block" style={{ background: 'var(--success-500)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> Clinical Handoff Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Map routing view */}
              <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '12px' }}>
                <div style={{ padding: '4px 8px 12px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>🗺️ GPS Rescue Routing Navigation</h3>
                </div>
                <div style={{ flex: 1, minHeight: '380px' }}>
                  <MapComponent
                    center={[driver.current_latitude, driver.current_longitude]}
                    zoom={13}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                  />
                </div>
              </div>
            </div>
          ) : (
            // STANDBY MODE: Checklists and Logs
            <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              {/* Pre duty safety checklists */}
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={18} /> Pre-Duty Vehicle Inspection
                </h3>
                
                {hasInspectedToday ? (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                    <strong style={{ fontSize: '0.9rem' }}>Inspection Log Registered</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ambulance {vehicle.plate_number} is certified safe and ready for dispatch.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInspectionSubmit}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label">Inspected Fuel Level</label>
                      <select className="form-input" value={inspectionForm.fuel_level} onChange={e => setInspectionForm({ ...inspectionForm, fuel_level: e.target.value as any })}>
                        <option value="full">Full Tank</option>
                        <option value="half">Half Tank</option>
                        <option value="low">Low Tank</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '0.82rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={inspectionForm.siren_ok} onChange={e => setInspectionForm({ ...inspectionForm, siren_ok: e.target.checked })} />
                        Siren & Emergency Beacon fully functional
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={inspectionForm.medical_checked} onChange={e => setInspectionForm({ ...inspectionForm, medical_checked: e.target.checked })} />
                        Obstetric delivery kit & oxygen tanks verified
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={inspectionForm.tires_ok} onChange={e => setInspectionForm({ ...inspectionForm, tires_ok: e.target.checked })} />
                        Tire pressure and suspension ok
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={inspectionForm.engine_ok} onChange={e => setInspectionForm({ ...inspectionForm, engine_ok: e.target.checked })} />
                        Engine fluid, oil, and coolant levels ok
                      </label>
                    </div>

                    <button type="submit" className="btn btn-amber btn-block" style={{ marginTop: '1.5rem', background: 'var(--warning-500)', color: '#000', fontWeight: 700 }}>
                      Submit Inspection Log
                    </button>
                  </form>
                )}
              </div>

              {/* Fuel purchase logs */}
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlusSquare size={18} /> Fuel purchase receipts
                </h3>
                
                <form onSubmit={handleFuelSubmit}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Fuel Quantity (Liters)</label>
                    <input type="number" className="form-input" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Total Cost (UGX)</label>
                    <input type="number" className="form-input" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Filling Station Name</label>
                    <input type="text" className="form-input" value={fuelForm.station} onChange={e => setFuelForm({ ...fuelForm, station: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-amber btn-block" style={{ background: 'var(--warning-500)', color: '#000', fontWeight: 700 }}>
                    Log Fuel Purchase
                  </button>
                </form>
              </div>
            </div>
          )}
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
