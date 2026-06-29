// MamaTrack GPS — Clinical Doctor Portal

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, DoctorService, User, Doctor, Emergency, Hospital, ClinicalAssessment, BloodRequest } from '../services/db';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  
  // Dashboard lists
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [assessments, setAssessments] = useState<ClinicalAssessment[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);

  // Forms
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    bp: '120/80',
    hr: 75,
    temp: 36.8,
    findings: '',
    treatment: '',
    outcome: 'admitted' as ClinicalAssessment['outcome']
  });

  const [bloodRequestForm, setBloodRequestForm] = useState({
    blood_type: 'O+',
    units: 2
  });

  // Toggles
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);

  // 1. Authentication Check
  useEffect(() => {
    const sessionUser = db.getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== 'doctor') {
      navigate('/login?role=doctor');
      return;
    }
    setUser(sessionUser);

    const docProfile = DoctorService.getDoctorByUserId(sessionUser.id);
    if (docProfile) {
      setDoctor(docProfile);
      setHospital(db.hospitals.find(h => h.id === docProfile.hospital_id) || null);
    }
    
    loadData(sessionUser.id, docProfile?.hospital_id || 1);
  }, [navigate]);

  const loadData = (docUserId: number, hospitalId: number) => {
    setEmergencies(db.emergencies.filter(e => e.hospital_id === hospitalId).reverse());
    setAssessments(db.clinicalAssessments.filter(a => a.doctor_id === docUserId));
    setBloodRequests(db.bloodRequests.filter(b => b.doctor_id === docUserId));
  };

  // Poll for inbound transfers
  useEffect(() => {
    if (!user || !doctor) return;
    const interval = setInterval(() => {
      loadData(user.id, doctor.hospital_id);
    }, 4000);
    return () => clearInterval(interval);
  }, [user, doctor]);

  if (!user || !doctor || !hospital) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Loading Clinical Profile...</div>;
  }

  // Metric aggregates
  const inboundCount = emergencies.filter(e => ['dispatched', 'en_route', 'arrived'].includes(e.status)).length;
  const totalTreated = emergencies.filter(e => e.status === 'completed').length;
  const pendingBloodReqs = bloodRequests.filter(r => r.status === 'pending').length;

  // Toggle Duty Status
  const handleToggleDuty = () => {
    const newVal = DoctorService.toggleDuty(user.id);
    setDoctor({ ...doctor, is_on_duty: newVal });
  };

  // Submit assessment
  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmergency) return;

    DoctorService.recordAssessment(
      activeEmergency.id,
      user.id,
      assessmentForm.bp,
      assessmentForm.hr,
      assessmentForm.temp,
      assessmentForm.findings,
      assessmentForm.treatment,
      assessmentForm.outcome
    );

    // Update beds if admitted/discharged
    if (assessmentForm.outcome === 'admitted' && hospital.available_beds > 0) {
      const updatedHospitals = db.hospitals.map(h => h.id === hospital.id ? { ...h, available_beds: h.available_beds - 1 } : h);
      db.hospitals = updatedHospitals;
      setHospital({ ...hospital, available_beds: hospital.available_beds - 1 });
    }

    setShowTriageModal(false);
    setActiveEmergency(null);
    setAssessmentForm({
      bp: '120/80',
      hr: 75,
      temp: 36.8,
      findings: '',
      treatment: '',
      outcome: 'admitted'
    });
    loadData(user.id, doctor.hospital_id);
    alert('Patient clinical assessment registered. Emergency status resolved.');
  };

  // Bed increments
  const handleModifyBeds = (delta: number) => {
    const newVal = Math.max(0, Math.min(hospital.total_beds, hospital.available_beds + delta));
    const updated = db.hospitals.map(h => h.id === hospital.id ? { ...h, available_beds: newVal } : h);
    db.hospitals = updated;
    setHospital({ ...hospital, available_beds: newVal });
  };

  // Blood Request
  const handleBloodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DoctorService.submitBloodRequest(
      user.id,
      hospital.id,
      bloodRequestForm.blood_type,
      bloodRequestForm.units
    );
    setShowBloodModal(false);
    setBloodRequestForm({ blood_type: 'O+', units: 2 });
    loadData(user.id, doctor.hospital_id);
    alert('Emergency Blood Request dispatched to Admin Center.');
  };

  return (
    <div className="doctor-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="doctor-bg" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success-400)' }}>🩺</div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>MamaTrack</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clinical Desk</p>
            </div>
          </div>

          <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Facility: {hospital.name}</div>
            <button
              onClick={handleToggleDuty}
              className={`btn btn-sm ${doctor.is_on_duty ? 'btn-success' : 'btn-ghost'}`}
              style={{ background: doctor.is_on_duty ? 'var(--success-500)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', width: '100%', padding: '6px' }}
            >
              🟢 {doctor.is_on_duty ? 'Active On-Duty' : 'Off-Duty (Standby)'}
            </button>
          </div>

          <nav className="sidebar-nav" style={{ marginTop: '1rem' }}>
            <div className="nav-section">
              <div className="nav-item active">
                <span className="nav-icon">🩺</span>
                <span>Clinical Triage</span>
              </div>
            </div>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--success-400), var(--green-700))' }}>🩺</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name.split(' ')[0]}</div>
              <div className="user-role" style={{ fontSize: '0.7rem', color: 'var(--success-400)' }}>Clinical Doctor</div>
            </div>
            <button className="btn-logout" onClick={() => { AuthService.logout(); navigate('/'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
              🚪
            </button>
          </div>
        </aside>

        {/* Main Console Workspace */}
        <main className="main-content">
          <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Clinical Desk Console</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Incoming Transfer Management Hub</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowBloodModal(true)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger-400)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.78rem' }}>
                🩸 Request Blood
              </button>
            </div>
          </header>

          {/* Quick clinical stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success-400)' }}>{hospital.available_beds} / {hospital.total_beds}</div>
              <div className="stat-label">Available Ward Beds</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warning-400)' }}>{inboundCount}</div>
              <div className="stat-label">Inbound Transfers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalTreated}</div>
              <div className="stat-label">My Handled Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--rose-400)' }}>{pendingBloodReqs}</div>
              <div className="stat-label">Pending Blood Requests</div>
            </div>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
            {/* Triage transfers list */}
            <div className="card card-glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>Inbound Maternal Transfers Queue</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    🟢 No inbound transfers scheduled for this facility.
                  </div>
                ) : (
                  emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).map(e => {
                    const motherData = db.mothers.find(m => m.user_id === e.mother_id);
                    const patientUser = db.users.find(u => u.id === e.mother_id);
                    return (
                      <div key={e.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--success-400)' }}>{e.code}</span>
                          <span className={`badge ${e.status === 'arrived' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                            {e.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '0.82rem' }}>
                          Patient: <strong>{patientUser?.full_name}</strong> (Blood: {motherData?.blood_type})
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Distress: {e.notes}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {e.status === 'arrived' ? '🚑 Ambulance Arrived' : `⏱️ ETA: ${e.eta_minutes || 'Calculating'} mins`}
                          </span>
                          
                          <button
                            onClick={() => {
                              setActiveEmergency(e);
                              setShowTriageModal(true);
                            }}
                            className={`btn btn-sm ${e.status === 'arrived' ? 'btn-success' : 'btn-ghost'}`}
                            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                          >
                            Clinical Triage →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bed configuration and historical assessments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Bed console */}
              <div className="card card-glass" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>Beds Allocation Panel</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{hospital.available_beds}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Available beds</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleModifyBeds(-1)} style={{ background: 'var(--border)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>-</button>
                    <button onClick={() => handleModifyBeds(1)} style={{ background: 'var(--success-700)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>+</button>
                  </div>
                </div>
              </div>

              {/* Assessment log */}
              <div className="card card-glass" style={{ padding: '1.25rem', flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>My Assessment Logs</h3>
                <div style={{ maxHeight: '240px', overflowY: 'auto', fontSize: '0.78rem' }}>
                  {assessments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>No logs compiled.</div>
                  ) : (
                    assessments.map(a => {
                      const emg = db.emergencies.find(e => e.id === a.emergency_id);
                      return (
                        <div key={a.id} style={{ borderBottom: '1px solid var(--border)', padding: '6px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{emg?.code || 'EMG'}</strong>
                            <span className="badge badge-gray" style={{ fontSize: '0.6rem' }}>{a.outcome.toUpperCase()}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                            BP: {a.blood_pressure} | Temp: {a.temperature}°C | Heart: {a.heart_rate} bpm
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* BLOOD REQUEST MODAL */}
      {showBloodModal && (
        <div className="modal-overlay active">
          <div className="modal" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger-400)' }}>Submit Blood Supply Request</h3>
              <button onClick={() => setShowBloodModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleBloodSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Requested Blood Type</label>
                  <select className="form-input" value={bloodRequestForm.blood_type} onChange={e => setBloodRequestForm({ ...bloodRequestForm, blood_type: e.target.value })}>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Volume (Units / Bags)</label>
                  <input type="number" className="form-input" value={bloodRequestForm.units} onChange={e => setBloodRequestForm({ ...bloodRequestForm, units: Number(e.target.value) })} min={1} max={10} required />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '14px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBloodModal(false)}>Close</button>
                <button type="submit" className="btn btn-danger" style={{ background: 'var(--danger-500)' }}>Send Blood Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLINICAL TRIAGE ASSESSMENT MODAL */}
      {showTriageModal && activeEmergency && (
        <div className="modal-overlay active">
          <div className="modal" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success-400)' }}>Clinical Triage Triage: {activeEmergency.code}</h3>
              <button onClick={() => { setShowTriageModal(false); setActiveEmergency(null); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleAssessmentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>BP (Syst/Diast)</label>
                    <input type="text" className="form-input" value={assessmentForm.bp} onChange={e => setAssessmentForm({ ...assessmentForm, bp: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Pulse Rate (bpm)</label>
                    <input type="number" className="form-input" value={assessmentForm.hr} onChange={e => setAssessmentForm({ ...assessmentForm, hr: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Temp (°C)</label>
                    <input type="number" className="form-input" value={assessmentForm.temp} onChange={e => setAssessmentForm({ ...assessmentForm, temp: Number(e.target.value) })} step={0.1} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Clinical Findings / Diagnosis</label>
                  <textarea className="form-input" style={{ minHeight: '60px', padding: '8px' }} placeholder="Detail clinical presentation..." value={assessmentForm.findings} onChange={e => setAssessmentForm({ ...assessmentForm, findings: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Treatment Administered</label>
                  <textarea className="form-input" style={{ minHeight: '60px', padding: '8px' }} placeholder="Drugs, fluids, surgical theater procedures..." value={assessmentForm.treatment} onChange={e => setAssessmentForm({ ...assessmentForm, treatment: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Clinical Handoff Outcome</label>
                  <select className="form-input" value={assessmentForm.outcome} onChange={e => setAssessmentForm({ ...assessmentForm, outcome: e.target.value as ClinicalAssessment['outcome'] })}>
                    <option value="admitted">Admit to General Ward (Occupies Bed)</option>
                    <option value="referred">Refer to Specialized Facility (Mulago)</option>
                    <option value="discharged">Discharge Home (Normal delivery/Stable)</option>
                    <option value="deceased">Deceased / Fatal complication</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '14px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowTriageModal(false); setActiveEmergency(null); }}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ background: 'var(--success-500)' }}>Complete Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
