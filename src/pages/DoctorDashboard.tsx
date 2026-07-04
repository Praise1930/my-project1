// MamaTrack GPS — Clinical Doctor Portal (MediLab Theme Redesign)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, DoctorService, User, Doctor, Emergency, Hospital, ClinicalAssessment, BloodRequest } from '../services/db';
import { ThemeToggle } from '../contexts/ThemeContext';

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

  // Dynamic Stylesheet Loading for isolating theme CSS
  useEffect(() => {
    // Add Medilab CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/medilab/main.css';
    link.id = 'medilab-theme-css';
    document.head.appendChild(link);

    // Add Bootstrap icons
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    iconsLink.id = 'bootstrap-icons-css';
    document.head.appendChild(iconsLink);

    return () => {
      // Unload on exit
      const linkEl = document.getElementById('medilab-theme-css');
      if (linkEl) linkEl.remove();
      const iconsEl = document.getElementById('bootstrap-icons-css');
      if (iconsEl) iconsEl.remove();
    };
  }, []);

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
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#102039' }}>Loading Clinical Profile...</div>;
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
    <div className="medilab-dashboard" style={{ background: '#f6f9fe', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#444444', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* SCOPED OVERRIDES */}
      <style>{`
        .medilab-dashboard header.medilab-navbar {
          background: #ffffff;
          border-bottom: 2px solid #eef2f7;
          padding: 15px 30px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
        }
        .medilab-dashboard .nav-logo {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1977cc;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .medilab-dashboard .btn-medilab {
          background: #1977cc;
          color: #ffffff;
          border-radius: 50px;
          padding: 8px 25px;
          border: none;
          font-weight: 500;
          font-size: 14px;
          transition: 0.4s;
        }
        .medilab-dashboard .btn-medilab:hover {
          background: #166ab5;
        }
        .medilab-dashboard .btn-blood-req {
          background: #dc3545;
          color: #ffffff;
          border-radius: 50px;
          padding: 8px 25px;
          border: none;
          font-weight: 500;
          font-size: 14px;
        }
        .medilab-dashboard .btn-blood-req:hover {
          background: #c82333;
        }
        .medilab-dashboard .medical-card {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #eef2f7;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
          overflow: hidden;
        }
        .medilab-dashboard .medical-card-header {
          background: #f8fafc;
          padding: 16px 20px;
          border-bottom: 1px solid #eef2f7;
          font-weight: 700;
          color: #2c4964;
          font-size: 15px;
        }
        .medilab-dashboard .medical-card-body {
          padding: 20px;
        }
        .medilab-dashboard .metric-box {
          background: #ffffff;
          border-radius: 8px;
          padding: 20px;
          border-bottom: 3px solid #1977cc;
          box-shadow: 0px 2px 15px rgba(0, 0, 0, 0.05);
        }
        .medilab-dashboard .metric-title {
          font-size: 13px;
          color: #777777;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .medilab-dashboard .metric-number {
          font-size: 24px;
          font-weight: 700;
          color: #2c4964;
        }
        .medilab-dashboard .badge-status-arrived {
          background: #d4edda;
          color: #155724;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .medilab-dashboard .badge-status-enroute {
          background: #fff3cd;
          color: #856404;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .medilab-dashboard .form-control-medilab {
          border-radius: 4px;
          border: 1px solid #dcdcdc;
          padding: 10px 14px;
          font-size: 14px;
          width: 100%;
        }
        /* Custom modal */
        .medilab-dashboard .medilab-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(44, 73, 100, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .medilab-dashboard .medilab-modal-container {
          background: #ffffff;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
        }
      `}</style>

      {/* HEADER NAVBAR */}
      <header className="medilab-navbar d-flex align-items-center justify-content-between">
        <div className="nav-logo">
          <i className="bi bi-heart-pulse-fill" style={{ color: '#1977cc' }}></i>
          <span>Mama<span style={{ color: '#2c4964' }}>Track GPS</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px', color: '#555555' }}>
            🏥 Facility: <strong>{hospital.name}</strong>
          </div>
          
          <button
            onClick={handleToggleDuty}
            className={`btn-medilab`}
            style={{
              background: doctor.is_on_duty ? '#1977cc' : '#6c757d',
              fontSize: '13px',
              padding: '6px 18px'
            }}
          >
            {doctor.is_on_duty ? '🟢 Active On-Duty' : '🔴 Standby'}
          </button>

          <button className="btn-blood-req" onClick={() => setShowBloodModal(true)} style={{ fontSize: '13px', padding: '6px 18px' }}>
            🩸 Request Blood
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <ThemeToggle />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2c4964' }}>{user.full_name}</div>
            <div style={{ fontSize: '11px', color: '#777777' }}>Clinical Specialist</div>
          </div>
          <button 
            onClick={() => { AuthService.logout(); navigate('/'); }}
            style={{ border: 'none', background: 'rgba(220,53,69,0.1)', color: '#dc3545', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sign Out"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      {/* METRIC COUNTERS BAR */}
      <div style={{ padding: '30px 40px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div className="metric-box" style={{ borderBottomColor: '#22c55e' }}>
            <div className="metric-title">Available Ward Beds</div>
            <div className="metric-number" style={{ color: '#22c55e' }}>{hospital.available_beds} <span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/ {hospital.total_beds}</span></div>
          </div>
          <div className="metric-box" style={{ borderBottomColor: '#f59e0b' }}>
            <div className="metric-title">Inbound Transfers</div>
            <div className="metric-number" style={{ color: '#f59e0b' }}>{inboundCount}</div>
          </div>
          <div className="metric-box" style={{ borderBottomColor: '#3b82f6' }}>
            <div className="metric-title">My Treated Cases</div>
            <div className="metric-number" style={{ color: '#3b82f6' }}>{totalTreated}</div>
          </div>
          <div className="metric-box" style={{ borderBottomColor: '#ef4444' }}>
            <div className="metric-title">Pending Blood Orders</div>
            <div className="metric-number" style={{ color: '#ef4444' }}>{pendingBloodReqs}</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div style={{ flex: 1, padding: '20px 40px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: ACTIVE MATERNAL TRANSFERS QUEUE */}
        <div className="medical-card">
          <div className="medical-card-header d-flex justify-content-between align-items-center">
            <span>🩺 Inbound Obstetric Transfers Queue</span>
            <i className="bi bi-activity" style={{ color: '#1977cc', fontSize: '18px' }}></i>
          </div>

          <div className="medical-card-body" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888888', fontSize: '14px' }}>
                <i className="bi bi-check-circle" style={{ fontSize: '2.5rem', color: '#28a745', display: 'block', marginBottom: '12px' }}></i>
                No active ambulance dispatches scheduled for this facility.
              </div>
            ) : (
              emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).map(e => {
                const motherData = db.mothers.find(m => m.user_id === e.mother_id);
                const patientUser = db.users.find(u => u.id === e.mother_id);
                return (
                  <div key={e.id} style={{ border: '1px solid #eef2f7', borderRadius: '6px', padding: '16px', marginBottom: '14px', background: '#fdfdfd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1977cc' }}>{e.code}</span>
                      <span className={e.status === 'arrived' ? 'badge-status-arrived' : 'badge-status-enroute'}>
                        {e.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#2c4964', marginBottom: '6px' }}>
                      Patient Name: <strong>{patientUser?.full_name}</strong> · Blood Type: <span style={{ background: '#fbeee6', color: '#b93e00', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>{motherData?.blood_type || 'O+'}</span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#666666', marginBottom: '12px' }}>
                      Distress Symptoms: {e.notes}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #eef2f7', paddingTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#888888' }}>
                        {e.status === 'arrived' ? '🚑 Ambulance Arrived at ER' : `⏱️ ETA: ${e.eta_minutes || 'Calculating'} mins`}
                      </span>

                      <button
                        onClick={() => {
                          setActiveEmergency(e);
                          setShowTriageModal(true);
                        }}
                        className="btn btn-sm btn-medilab"
                        style={{ padding: '4px 14px', fontSize: '12px' }}
                      >
                        Clinical Triage Handover
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BED MANAGEMENT & TRIAGE LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Bed allocation console */}
          <div className="medical-card">
            <div className="medical-card-header">
              🏨 Ward Bed Allocation Management
            </div>
            <div className="medical-card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '15px 20px', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1977cc' }}>{hospital.available_beds}</div>
                  <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>Active vacant beds</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleModifyBeds(-1)} style={{ background: '#eef2f7', color: '#2c4964', border: 'none', width: '36px', height: '36px', borderRadius: '4px', fontWeight: 700, fontSize: '16px' }}>-</button>
                  <button onClick={() => handleModifyBeds(1)} style={{ background: '#1977cc', color: '#ffffff', border: 'none', width: '36px', height: '36px', borderRadius: '4px', fontWeight: 700, fontSize: '16px' }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Historic triages logs */}
          <div className="medical-card" style={{ flex: 1 }}>
            <div className="medical-card-header">
              📋 My Diagnostic Handover Logs
            </div>
            <div className="medical-card-body" style={{ maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
              {assessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#888888' }}>No triage reports compiled.</div>
              ) : (
                assessments.map(a => {
                  const emg = db.emergencies.find(e => e.id === a.emergency_id);
                  return (
                    <div key={a.id} style={{ borderBottom: '1px solid #eef2f7', padding: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Distress: {emg?.code || 'EMG-LOG'}</strong>
                        <span style={{ fontSize: '11px', background: '#eef2f7', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{a.outcome}</span>
                      </div>
                      <div style={{ color: '#666666', fontSize: '12px' }}>
                        BP: {a.blood_pressure} | Temp: {a.temperature}°C | Heart Rate: {a.heart_rate} bpm
                      </div>
                      <div style={{ color: '#777777', fontSize: '11px', marginTop: '2px', fontStyle: 'italic' }}>
                        Findings: {a.clinical_findings}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="dashboard-footer" style={{ borderTop: '1px solid #eef2f7' }}>
        <p>© 2026 MamaTrack GPS · Regional Maternal Emergency Response System. All rights reserved.</p>
      </footer>

      {/* BLOOD REQUEST MODAL */}
      {showBloodModal && (
        <div className="medilab-modal-overlay">
          <div className="medilab-modal-container">
            <div style={{ background: '#dc3545', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignSelf: 'stretch', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>🚨 Submit Emergency Blood Supply Order</h5>
              <button onClick={() => setShowBloodModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleBloodSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '6px' }}>Requested Blood Group</label>
                <select className="form-control-medilab" value={bloodRequestForm.blood_type} onChange={e => setBloodRequestForm({ ...bloodRequestForm, blood_type: e.target.value })}>
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
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '6px' }}>Requested Volume (Units/Bags)</label>
                <input type="number" className="form-control-medilab" value={bloodRequestForm.units} onChange={e => setBloodRequestForm({ ...bloodRequestForm, units: Number(e.target.value) })} min={1} max={10} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eef2f7', paddingTop: '15px' }}>
                <button type="button" className="btn-medilab" style={{ background: '#6c757d' }} onClick={() => setShowBloodModal(false)}>Cancel</button>
                <button type="submit" className="btn-blood-req">Dispatch Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLINICAL ASSESSMENT MODAL */}
      {showTriageModal && activeEmergency && (
        <div className="medilab-modal-overlay">
          <div className="medilab-modal-container" style={{ maxWidth: '520px' }}>
            <div style={{ background: '#1977cc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>📋 Clinical Triage Triage: {activeEmergency.code}</h5>
              <button onClick={() => { setShowTriageModal(false); setActiveEmergency(null); }} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleAssessmentSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>BP (e.g. 120/80)</label>
                  <input type="text" className="form-control-medilab" value={assessmentForm.bp} onChange={e => setAssessmentForm({ ...assessmentForm, bp: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>Pulse (bpm)</label>
                  <input type="number" className="form-control-medilab" value={assessmentForm.hr} onChange={e => setAssessmentForm({ ...assessmentForm, hr: Number(e.target.value) })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>Temp (°C)</label>
                  <input type="number" className="form-control-medilab" value={assessmentForm.temp} onChange={e => setAssessmentForm({ ...assessmentForm, temp: Number(e.target.value) })} step={0.1} required />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>Clinical Diagnosis / Findings</label>
                <textarea className="form-control-medilab" style={{ minHeight: '60px' }} placeholder="Enter medical observations..." value={assessmentForm.findings} onChange={e => setAssessmentForm({ ...assessmentForm, findings: e.target.value })} required />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>Treatment Plan Administered</label>
                <textarea className="form-control-medilab" style={{ minHeight: '60px' }} placeholder="e.g., C-section, IV drip details..." value={assessmentForm.treatment} onChange={e => setAssessmentForm({ ...assessmentForm, treatment: e.target.value })} required />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '4px' }}>Handoff Outcome</label>
                <select className="form-control-medilab" value={assessmentForm.outcome} onChange={e => setAssessmentForm({ ...assessmentForm, outcome: e.target.value as ClinicalAssessment['outcome'] })}>
                  <option value="admitted">Admit to General Ward (Occupies Bed)</option>
                  <option value="referred">Refer to Specialized Facility (Mulago)</option>
                  <option value="discharged">Discharge Home (Normal delivery/Stable)</option>
                  <option value="deceased">Deceased / Fatal complication</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eef2f7', paddingTop: '15px' }}>
                <button type="button" className="btn-medilab" style={{ background: '#6c757d' }} onClick={() => { setShowTriageModal(false); setActiveEmergency(null); }}>Cancel</button>
                <button type="submit" className="btn-medilab">Complete Handover</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
