// MamaTrack GPS — System Admin Command Center

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, EmergencyService, User, Emergency, Hospital, Driver, Doctor, Vehicle } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'facilities' | 'personnel' | 'reports'>('dispatch');

  // Database states
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Dispatch control states
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [dispatchDriver, setDispatchDriver] = useState<number>(0);
  const [dispatchDoctor, setDispatchDoctor] = useState<number>(0);
  const [dispatchHospital, setDispatchHospital] = useState<number>(0);
  const [dispatchEta, setDispatchEta] = useState<number>(20);

  // 1. Auth & Data loading
  useEffect(() => {
    const sessionUser = db.getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      navigate('/login?role=admin');
      return;
    }
    setUser(sessionUser);
    loadData();
  }, [navigate]);

  const loadData = () => {
    setEmergencies([...db.emergencies].reverse());
    setHospitals(db.hospitals);
    setDrivers(db.drivers);
    setDoctors(db.doctors);
    setVehicles(db.vehicles);
  };

  // Simple state poller to keep dispatch screen live
  useEffect(() => {
    const timer = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Admin Workspace...</div>;

  // Stats calculation
  const pendingCount = emergencies.filter(e => e.status === 'pending').length;
  const activeDispatchCount = emergencies.filter(e => ['dispatched', 'en_route', 'arrived'].includes(e.status)).length;
  const onDutyDrivers = drivers.filter(d => d.is_on_duty).length;
  const onDutyDoctors = doctors.filter(doc => doc.is_on_duty).length;
  const totalAvailableBeds = hospitals.reduce((sum, h) => sum + h.available_beds, 0);

  // Map markers
  const getMapMarkers = (): MapMarker[] => {
    const list: MapMarker[] = [];

    // Add hospitals
    hospitals.forEach(h => {
      list.push({ id: `hosp-${h.id}`, lat: h.latitude, lng: h.longitude, type: 'hospital', label: h.name, sublabel: `Beds: ${h.available_beds}/${h.total_beds}` });
    });

    // Add active drivers
    drivers.forEach(d => {
      const u = db.users.find(usr => usr.id === d.user_id);
      if (d.is_on_duty) {
        list.push({ id: `driver-${d.id}`, lat: d.current_latitude, lng: d.current_longitude, type: 'driver', label: `Ambulance: ${u?.full_name || 'Driver'}` });
      }
    });

    // Add active emergencies
    emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).forEach(e => {
      const m = db.users.find(usr => usr.id === e.mother_id);
      list.push({ id: `emg-${e.id}`, lat: e.latitude, lng: e.longitude, type: 'emergency', label: `🚨 Distress: ${m?.full_name || 'Patient'}`, sublabel: e.notes });
    });

    return list;
  };

  const getRoutePoints = (): [number, number][] => {
    if (selectedEmergency && selectedEmergency.driver_id) {
      const driver = drivers.find(d => d.user_id === selectedEmergency.driver_id);
      if (driver) {
        return [
          [driver.current_latitude, driver.current_longitude],
          [selectedEmergency.latitude, selectedEmergency.longitude]
        ];
      }
    }
    return [];
  };

  // Dispatch Action
  const handleAssignDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergency) return;
    if (!dispatchDriver || !dispatchHospital) {
      alert('Please select both a driver and a matched hospital.');
      return;
    }

    try {
      EmergencyService.assignDispatch(
        selectedEmergency.id,
        dispatchDriver,
        dispatchDoctor || null,
        dispatchHospital,
        user.id,
        dispatchEta
      );
      setSelectedEmergency(null);
      setDispatchDriver(0);
      setDispatchDoctor(0);
      setDispatchHospital(0);
      loadData();
      alert('Ambulance driver has been dispatched successfully!');
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('Reset all databases and tables to default seed parameters? (This clears custom logs)')) {
      db.resetDatabase();
      loadData();
      alert('Database restored back to seeds. Please log in again.');
      navigate('/');
    }
  };

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="admin-bg" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary-400)' }}>📡</div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>MamaTrack</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Command Center</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className={`nav-item ${activeTab === 'dispatch' ? 'active' : ''}`} onClick={() => setActiveTab('dispatch')}>
                <span className="nav-icon">🚨</span>
                <span>Active Dispatch</span>
              </div>
              <div className={`nav-item ${activeTab === 'facilities' ? 'active' : ''}`} onClick={() => setActiveTab('facilities')}>
                <span className="nav-icon">🏥</span>
                <span>Health Facilities</span>
              </div>
              <div className={`nav-item ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
                <span className="nav-icon">👥</span>
                <span>Duty Personnel</span>
              </div>
              <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                <span className="nav-icon">📊</span>
                <span>Audit & Fuel Logs</span>
              </div>
            </div>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--blue-600))' }}>📡</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name.split(' ')[0]}</div>
              <div className="user-role" style={{ fontSize: '0.7rem', color: 'var(--primary-400)' }}>System Admin</div>
            </div>
            <button className="btn-logout" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
              🚪
            </button>
          </div>
        </aside>

        {/* Main Panel Workspace */}
        <main className="main-content">
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Regional Dispatch Console</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mukono Municipality Command Center</p>
            </div>
            <button onClick={handleResetDatabase} className="btn btn-sm btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <RefreshCw size={12} /> Reset Database
            </button>
          </header>

          {/* Quick Metrics */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger-400)' }}>{pendingCount}</div>
              <div className="stat-label">Pending SOS Alerts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary-400)' }}>{activeDispatchCount}</div>
              <div className="stat-label">Active Missions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{onDutyDrivers}</div>
              <div className="stat-label">Drivers On Duty</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{onDutyDoctors}</div>
              <div className="stat-label">Specialists On Duty</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success-400)' }}>{totalAvailableBeds}</div>
              <div className="stat-label">Available Beds</div>
            </div>
          </div>

          {/* TAB 1: ACTIVE DISPATCH BOARD */}
          {activeTab === 'dispatch' && (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Emergency distress list */}
                <div className="card card-glass" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Distress Triage Queue
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                    {emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        🟢 No active emergencies reported in the region
                      </div>
                    ) : (
                      emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).map(e => {
                        const m = db.users.find(usr => usr.id === e.mother_id);
                        return (
                          <div
                            key={e.id}
                            className={`emergency-card ${selectedEmergency?.id === e.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedEmergency(e);
                              setDispatchHospital(e.hospital_id || 1);
                              // Auto set first duty driver
                              const availableDrv = drivers.find(d => d.is_on_duty && d.vehicle_id);
                              if (availableDrv) setDispatchDriver(availableDrv.user_id);
                            }}
                            style={{ cursor: 'pointer', border: selectedEmergency?.id === e.id ? '1.5px solid var(--primary-500)' : '1px solid var(--border)' }}
                          >
                            <div className="emergency-card-header">
                              <span className="emergency-code">{e.code}</span>
                              <span className={`badge ${e.status === 'pending' ? 'badge-red' : 'badge-amber'}`}>{e.status.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Patient: {m?.full_name || 'Mother'}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Notes: {e.notes}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Dispatch form panel */}
                {selectedEmergency && selectedEmergency.status === 'pending' && (
                  <div className="card card-glass" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-400)', marginBottom: '1rem' }}>
                      Dispatch Ambulance to {db.users.find(u => u.id === selectedEmergency.mother_id)?.full_name}
                    </h3>
                    
                    <form onSubmit={handleAssignDispatch}>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Nearest Hospital Facility</label>
                        <select className="form-input" value={dispatchHospital} onChange={e => setDispatchHospital(Number(e.target.value))}>
                          {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Beds: {h.available_beds})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Ambulance Driver (On-Duty)</label>
                        <select className="form-input" value={dispatchDriver} onChange={e => setDispatchDriver(Number(e.target.value))}>
                          <option value="0">-- Select Available Driver --</option>
                          {drivers.filter(d => d.is_on_duty).map(d => {
                            const u = db.users.find(usr => usr.id === d.user_id);
                            const v = vehicles.find(veh => veh.id === d.vehicle_id);
                            return (
                              <option key={d.id} value={d.user_id}>
                                {u?.full_name} - {v?.plate_number || 'No vehicle'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Assign Receiving Specialist Doctor (Optional)</label>
                        <select className="form-input" value={dispatchDoctor} onChange={e => setDispatchDoctor(Number(e.target.value))}>
                          <option value="0">-- Standby Triage Doctor --</option>
                          {doctors.filter(doc => doc.is_on_duty && doc.hospital_id === dispatchHospital).map(doc => {
                            const u = db.users.find(usr => usr.id === doc.user_id);
                            return (
                              <option key={doc.id} value={doc.user_id}>
                                {u?.full_name} ({doc.specialization})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Estimated Arrival (ETA - Minutes)</label>
                        <input type="number" className="form-input" value={dispatchEta} onChange={e => setDispatchEta(Number(e.target.value))} min={5} max={120} required />
                      </div>

                      <button type="submit" className="btn btn-block" style={{ background: 'var(--primary-500)', color: '#fff', fontWeight: 700 }}>
                        Dispatch Rescue Mission →
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Map Tracker view */}
              <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '12px' }}>
                <div style={{ padding: '4px 8px 12px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>📡 Live Region Fleet Monitor</h3>
                </div>
                <div style={{ flex: 1, minHeight: '400px' }}>
                  <MapComponent
                    center={[0.3536, 32.7554]} // Mukono town centre
                    zoom={12}
                    markers={getMapMarkers()}
                    routePoints={getRoutePoints()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEALTH FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="card card-glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Hospital Facilities Directory</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {hospitals.map(h => (
                  <div key={h.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{h.name}</strong>
                      <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{h.type.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📍 {h.address}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.78rem' }}>
                      <div>Available Beds: <strong>{h.available_beds} / {h.total_beds}</strong></div>
                      <div>Contact: <strong>{h.phone}</strong></div>
                      <div>Surgery Capacity: <strong>{h.has_surgical_capacity ? '✅ Yes' : '❌ No'}</strong></div>
                      <div>CEmONC capability: <strong>{h.has_cemonc ? '✅ Yes' : '❌ No'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONNEL STATUS */}
          {activeTab === 'personnel' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Doctors list */}
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Specialist Doctors Shift</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {doctors.map(d => {
                    const u = db.users.find(usr => usr.id === d.user_id);
                    const h = hospitals.find(hosp => hosp.id === d.hospital_id);
                    return (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{u?.full_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.specialization} · {h?.name}</div>
                        </div>
                        <span className={`badge ${d.is_on_duty ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {d.is_on_duty ? 'ON DUTY' : 'STANDBY'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drivers list */}
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Ambulance Drivers Shift</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {drivers.map(d => {
                    const u = db.users.find(usr => usr.id === d.user_id);
                    const v = vehicles.find(veh => veh.id === d.vehicle_id);
                    return (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{u?.full_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vehicle: {v?.plate_number || 'None'} ({v?.vehicle_type})</div>
                        </div>
                        <span className={`badge ${d.is_on_duty ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {d.is_on_duty ? 'ON DUTY' : 'OFF DUTY'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS & REPORTS */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card card-glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Maternal Emergency Historical Logs</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Code</th>
                        <th style={{ padding: '8px' }}>Patient</th>
                        <th style={{ padding: '8px' }}>Hospital</th>
                        <th style={{ padding: '8px' }}>Driver</th>
                        <th style={{ padding: '8px' }}>Triggered At</th>
                        <th style={{ padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emergencies.map(e => {
                        const m = db.users.find(u => u.id === e.mother_id);
                        const h = hospitals.find(hosp => hosp.id === e.hospital_id);
                        const d = db.users.find(u => u.id === e.driver_id);
                        return (
                          <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px', fontWeight: 700, color: 'var(--primary-400)' }}>{e.code}</td>
                            <td style={{ padding: '8px' }}>{m?.full_name || 'Mother'}</td>
                            <td style={{ padding: '8px' }}>{h?.name || '-'}</td>
                            <td style={{ padding: '8px' }}>{d?.full_name || '-'}</td>
                            <td style={{ padding: '8px' }}>{new Date(e.triggered_at).toLocaleDateString()} {new Date(e.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '8px' }}>
                              <span className={`badge ${e.status === 'completed' ? 'badge-green' : e.status === 'cancelled' ? 'badge-gray' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                                {e.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pre-duty and Fuel logs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Inspections */}
                <div className="card card-glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>Safety Inspections log</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '0.78rem' }}>
                    {db.inspections.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No inspection records logged.</div>
                    ) : (
                      db.inspections.map(i => {
                        const drv = db.users.find(u => u.id === i.driver_id);
                        const veh = db.vehicles.find(v => v.id === i.vehicle_id);
                        return (
                          <div key={i.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                            <div>Ambulance: <strong>{veh?.plate_number}</strong> by {drv?.full_name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              Fuel: {i.fuel_level.toUpperCase()} | Siren: {i.siren_ok ? '✅' : '❌'} | Tires: {i.tires_ok ? '✅' : '❌'} | Engine: {i.engine_ok ? '✅' : '❌'}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(i.checked_at).toLocaleString()}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Fuel Purchase */}
                <div className="card card-glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>Fuel Purchases Log</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '0.78rem' }}>
                    {db.fuelLogs.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No fuel records logged.</div>
                    ) : (
                      db.fuelLogs.map(f => {
                        const drv = db.users.find(u => u.id === f.driver_id);
                        const veh = db.vehicles.find(v => v.id === f.vehicle_id);
                        return (
                          <div key={f.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div>Plate: <strong>{veh?.plate_number}</strong> ({drv?.full_name.split(' ')[0]})</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Station: {f.station} · {f.liters} Liters</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'var(--success-400)' }}>{f.cost.toLocaleString()} UGX</strong>
                              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(f.logged_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
