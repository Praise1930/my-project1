// MamaTrack GPS — System Admin Command Center (Dasher Theme Redesign)

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

  // Dynamic Stylesheet Loading for isolating theme CSS
  useEffect(() => {
    // Add Dasher CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/dasher/theme.css';
    link.id = 'dasher-theme-css';
    document.head.appendChild(link);

    // Add Tabler icons Webfont
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css';
    iconsLink.id = 'tabler-icons-css';
    document.head.appendChild(iconsLink);

    // Add Google font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap';
    fontLink.id = 'public-sans-css';
    document.head.appendChild(fontLink);

    return () => {
      // Unload on exit
      const linkEl = document.getElementById('dasher-theme-css');
      if (linkEl) linkEl.remove();
      const iconsEl = document.getElementById('tabler-icons-css');
      if (iconsEl) iconsEl.remove();
      const fontEl = document.getElementById('public-sans-css');
      if (fontEl) fontEl.remove();
    };
  }, []);

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
    <div className="dasher-dashboard" style={{ background: '#f8fafd', minHeight: '100vh', fontFamily: "'Public Sans', sans-serif", display: 'flex' }}>
      
      {/* SCOPED OVERRIDES */}
      <style>{`
        .dasher-dashboard aside.sidebar-admin {
          width: 260px;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.08);
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
        }
        .dasher-dashboard .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          color: #94a3b8;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .dasher-dashboard .sidebar-nav-item:hover,
        .dasher-dashboard .sidebar-nav-item.active {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
          border-left: 4px solid #3b82f6;
        }
        .dasher-dashboard .main-content-area {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
          background: #f8fafc;
        }
        .dasher-dashboard .bg-gradient-mixed {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #ffffff;
        }
        .dasher-dashboard .card-metric {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .dasher-dashboard .metric-val {
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .dasher-dashboard .triage-card {
          padding: 16px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .dasher-dashboard .triage-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.06);
        }
        .dasher-dashboard .triage-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .dasher-dashboard .badge-alert-pending {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dasher-dashboard .badge-alert-dispatch {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid rgba(217,119,6,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dasher-dashboard .badge-alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid rgba(22,163,74,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
      `}</style>

      {/* VERTICAL SIDEBAR */}
      <aside className="sidebar-admin">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#3b82f6', color: '#ffffff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
            M
          </div>
          <div>
            <h5 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>MamaTrack</h5>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Command Desk</span>
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: '20px' }}>
          <div className={`sidebar-nav-item ${activeTab === 'dispatch' ? 'active' : ''}`} onClick={() => setActiveTab('dispatch')}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '18px' }}></i>
            <span>Active Dispatch</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'facilities' ? 'active' : ''}`} onClick={() => setActiveTab('facilities')}>
            <i className="ti ti-building-hospital" style={{ fontSize: '18px' }}></i>
            <span>Health Facilities</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
            <i className="ti ti-users" style={{ fontSize: '18px' }}></i>
            <span>Duty Personnel</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <i className="ti ti-file-analytics" style={{ fontSize: '18px' }}></i>
            <span>Audit & Fuel Logs</span>
          </div>
        </nav>

        {/* Sidebar Footer User profile */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
              {user.full_name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{user.full_name.split(' ')[0]}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>System Admin</div>
            </div>
          </div>
          <button 
            onClick={() => { AuthService.logout(); navigate('/'); }}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Logout"
          >
            <i className="ti ti-logout" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT AREA */}
      <main className="main-content-area">
        
        {/* TOPBAR HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Command Center Workspace</h4>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Mukono Regional Ambulance Dispatch Fleet Monitor</span>
          </div>
          
          <button 
            onClick={handleResetDatabase} 
            className="btn btn-outline-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <RefreshCw size={13} /> Reset Database
          </button>
        </header>

        {/* GREETING BANNER WIDGET */}
        <div className="bg-gradient-mixed rounded-3 p-6 mb-6" style={{ padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px', color: '#ffffff' }}>👋 Hello, {user.full_name.split(' ')[0]}!</h2>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '14px', lineHeight: 1.5 }}>
            Welcome to the regional command console. Coordinate emergency obstetric dispatches, monitor safety parameters, and manage clinic facility status parameters in Mukono District.
          </p>
        </div>

        {/* STATS COUNT METRICS ROW */}
        <div className="row mb-6 g-4" style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="metric-val" style={{ color: '#ef4444' }}>{pendingCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Pending SOS Alerts</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="metric-val" style={{ color: '#3b82f6' }}>{activeDispatchCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Active Missions</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="metric-val" style={{ color: '#10b981' }}>{onDutyDrivers}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Drivers On Duty</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="metric-val" style={{ color: '#6366f1' }}>{onDutyDoctors}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Specialists On Duty</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="metric-val" style={{ color: '#22c55e' }}>{totalAvailableBeds}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Available Ward Beds</div>
            </div>
          </div>
        </div>

        {/* TAB WORKSPACE CONTENT */}

        {/* TAB 1: ACTIVE DISPATCH BOARD */}
        {activeTab === 'dispatch' && (
          <div className="row g-4" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            
            {/* Distress Triage Queue column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>🚨 Distress Triage Queue</h5>
                </div>
                
                <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                  {emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: '#64748b' }}>
                      🟢 No active emergencies reported in the region
                    </div>
                  ) : (
                    emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).map(e => {
                      const m = db.users.find(usr => usr.id === e.mother_id);
                      return (
                        <div
                          key={e.id}
                          className={`triage-card ${selectedEmergency?.id === e.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedEmergency(e);
                            setDispatchHospital(e.hospital_id || 1);
                            const availableDrv = drivers.find(d => d.is_on_duty && d.vehicle_id);
                            if (availableDrv) setDispatchDriver(availableDrv.user_id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{e.code}</strong>
                            <span className={e.status === 'pending' ? 'badge-alert-pending' : 'badge-alert-dispatch'}>
                              {e.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Patient: {m?.full_name || 'Mother'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Distress: {e.notes}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dispatch Action Panel */}
              {selectedEmergency && selectedEmergency.status === 'pending' && (
                <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                      Dispatch Rescue to {db.users.find(u => u.id === selectedEmergency.mother_id)?.full_name}
                    </h5>
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    <form onSubmit={handleAssignDispatch}>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Target Hospital Facility</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchHospital} onChange={e => setDispatchHospital(Number(e.target.value))}>
                          {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Beds: {h.available_beds})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Ambulance Driver (On-Duty)</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchDriver} onChange={e => setDispatchDriver(Number(e.target.value))}>
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

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Receiving Medical Specialist (Optional)</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchDoctor} onChange={e => setDispatchDoctor(Number(e.target.value))}>
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

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Estimated Rescue Arrival (ETA - Mins)</label>
                        <input type="number" className="form-control" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchEta} onChange={e => setDispatchEta(Number(e.target.value))} min={5} max={120} required />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontWeight: 700, fontSize: '14px', background: '#3b82f6', border: 'none' }}>
                        Dispatch Rescue Mission →
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Map Fleet Monitor column */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}><i className="ti ti-map-pin" style={{ color: '#3b82f6' }}></i> GPS Fleet monitor Map</h5>
              </div>
              <div style={{ flex: 1, minHeight: '440px', borderRadius: '6px', overflow: 'hidden' }}>
                <MapComponent
                  center={[0.3536, 32.7554]} 
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
          <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Hospital Referral Network Directory</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {hospitals.map(h => (
                <div key={h.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{h.name}</strong>
                    <span className="badge-alert-success">{h.type.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>📍 {h.address}</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#334155', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                    <div>Ward Beds: <strong>{h.available_beds} / {h.total_beds}</strong></div>
                    <div>Clinic Hotline: <strong>{h.phone}</strong></div>
                    <div>Surgical Capacity: <strong>{h.has_surgical_capacity ? '✅ Available' : '❌ None'}</strong></div>
                    <div>CEmONC capability: <strong>{h.has_cemonc ? '✅ Yes' : '❌ No'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONNEL STATUS */}
        {activeTab === 'personnel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Doctors roster */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Medical Specialists Duty Schedule</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctors.map(d => {
                  const u = db.users.find(usr => usr.id === d.user_id);
                  const h = hospitals.find(hosp => hosp.id === d.hospital_id);
                  return (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#f8fafc' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{u?.full_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{d.specialization} · {h?.name}</div>
                      </div>
                      <span className={d.is_on_duty ? 'badge-alert-success' : 'badge-alert-dispatch'}>
                        {d.is_on_duty ? 'ON SHIFT' : 'STANDBY'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drivers roster */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Ambulance Drivers Duty Schedule</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {drivers.map(d => {
                  const u = db.users.find(usr => usr.id === d.user_id);
                  const v = vehicles.find(veh => veh.id === d.vehicle_id);
                  return (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#f8fafc' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{u?.full_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Plate: {v?.plate_number || 'No vehicle'} ({v?.vehicle_type})</div>
                      </div>
                      <span className={d.is_on_duty ? 'badge-alert-success' : 'badge-alert-dispatch'}>
                        {d.is_on_duty ? 'ACTIVE SHIFT' : 'OFF SHIFT'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: REPORTS & HISTORICAL LOGS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Historical SOS table */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Historical Rescue Referral Audit Logs</h5>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-bordered" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Code</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Patient</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Hospital</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Assigned Driver</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Triggered At</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map(e => {
                      const m = db.users.find(u => u.id === e.mother_id);
                      const h = hospitals.find(hosp => hosp.id === e.hospital_id);
                      const d = db.users.find(u => u.id === e.driver_id);
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#3b82f6' }}>{e.code}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{m?.full_name || 'Mother'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{h?.name || '-'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{d?.full_name || '-'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1', color: '#64748b' }}>
                            {new Date(e.triggered_at).toLocaleDateString()} {new Date(e.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                            <span className={e.status === 'completed' ? 'badge-alert-success' : e.status === 'cancelled' ? 'badge-alert-dispatch' : 'badge-alert-pending'}>
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

            {/* Inspections and Fuel Logs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Safety inspections */}
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Pre-duty Safety Inspections</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
                  {db.inspections.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No inspection records logged.</div>
                  ) : (
                    db.inspections.map(i => {
                      const drv = db.users.find(u => u.id === i.driver_id);
                      const veh = db.vehicles.find(v => v.id === i.vehicle_id);
                      return (
                        <div key={i.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>Ambulance: {veh?.plate_number} ({drv?.full_name})</div>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                            Fuel: {i.fuel_level.toUpperCase()} | Siren: {i.siren_ok ? '✅ OK' : '❌ Fail'} | Tires: {i.tires_ok ? '✅ OK' : '❌ Fail'} | Engine: {i.engine_ok ? '✅ OK' : '❌ Fail'}
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(i.checked_at).toLocaleString()}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Fuel purchase logs */}
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Ambulance Fuel Purchases</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
                  {db.fuelLogs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No fuel records logged.</div>
                  ) : (
                    db.fuelLogs.map(f => {
                      const drv = db.users.find(u => u.id === f.driver_id);
                      const veh = db.vehicles.find(v => v.id === f.vehicle_id);
                      return (
                        <div key={f.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#334155' }}>Plate: {veh?.plate_number}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>Station: {f.station} · {f.liters} Liters (Drv: {drv?.full_name.split(' ')[0]})</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#10b981' }}>{f.cost.toLocaleString()} UGX</strong>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(f.logged_at).toLocaleDateString()}</div>
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
  );
};
