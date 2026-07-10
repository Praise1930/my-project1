// MamaTrack GPS — Expectant Mother Registration Portal (With Medical Center UI Theme)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/db';
import { User, Phone, Mail, Calendar, MapPin, Heart, Users } from 'lucide-react';
import { ThemeToggle } from '../contexts/ThemeContext';

// Import template stylesheets
import '../styles/medical-center/bootstrap.min.css';
import '../styles/medical-center/flaticon.css';
import '../styles/medical-center/themify-icons.css';
import '../styles/medical-center/fontawesome-all.min.css';
import '../styles/medical-center/style.css';

import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password_hash: 'password123', // default demo password
    date_of_birth: '',
    blood_type: 'O+',
    pregnancy_start_date: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: 'Husband',
    village: '',
    sub_county: 'Goma'
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Register with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password_hash);
      
      // 2. Send Email Verification
      await sendEmailVerification(userCredential.user);
      
      // 3. Register user in the local simulated database
      const res = AuthService.registerMother(formData);
      
      if (res.success) {
        // Force sign out until email is verified
        await signOut(auth);
        alert('Registration successful! Please check your email to verify your account before logging in.');
        navigate('/login?role=mother');
      } else {
        setError(res.error || 'Failed to create local account profile');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Failed to register account via Firebase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="medical-register-root" style={{ background: '#ffffff', color: '#757575', fontFamily: "'Muli', sans-serif" }}>
      
      {/* HEADER START */}
      <header>
        <div className="header-area">
          <div className="main-header header-sticky" style={{ background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div className="container-fluid" style={{ padding: '0 40px' }}>
              <div className="row align-items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0' }}>
                <div className="logo">
                  <Link to="/" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#030431', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#0f61ef', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      <i className="fa fa-h-square"></i>
                    </span>
                    <span>Mama<span style={{ color: '#0f61ef' }}>Track</span></span>
                  </Link>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ThemeToggle />
                  <Link to="/" className="d-none d-sm-inline-block" style={{ color: '#102039', fontWeight: 600, fontSize: '15px' }}>← Back to Home</Link>
                  <Link to="/" className="d-inline-block d-sm-none" style={{ color: '#102039', fontSize: '18px', padding: '4px' }} title="Back to Home">
                    <i className="fa fa-home"></i>
                  </Link>
                  <Link to="/login?role=mother" className="btn header-btn d-none d-md-inline-block" style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '6px', color: '#ffffff', textDecoration: 'none' }}>
                    Login Mother
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CENTERED REGISTRATION FORM SECTION */}
      <section className="register-form-section" style={{ minHeight: 'calc(100vh - 72px - 280px)', background: `linear-gradient(rgba(255, 241, 242, 0.82), rgba(255, 241, 242, 0.82)), url('/assets/img/hero/hero2.png') no-repeat center center / cover`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', position: 'relative' }}>
        
        {/* Scoped card styling overrides */}
        <style>{`
          .health-register-card {
            max-width: 780px !important;
            padding: 0px !important;
            border-radius: 6px !important;
            border: 1px solid rgba(0, 0, 0, 0.12) !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .health-register-card h2 {
            font-size: 2.2rem !important;
            font-weight: 800 !important;
            color: #1f2937 !important;
          }
          .health-register-card p.subtitle-desc {
            font-size: 1.05rem !important;
          }
          .health-register-card h3 {
            font-size: 1.15rem !important;
            margin-top: 1.5rem !important;
          }
          .health-register-card .form-label {
            font-size: 1.02rem !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin-bottom: 6px !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .health-register-card .form-input {
            padding: 12px 16px !important;
            font-size: 1rem !important;
            border-radius: 4px !important;
            width: 100% !important;
            border: 1px solid #d1d5db !important;
            background: #f9fafb !important;
            color: #1f2937 !important;
          }
          .health-register-card select.form-input {
            height: auto !important;
          }
          .health-register-card .btn-rose {
            padding: 12px 20px !important;
            font-size: 1.05rem !important;
            border-radius: 4px !important;
            width: 100% !important;
            border: none !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
          }
          .health-register-card .footer-link-text {
            font-size: 0.98rem !important;
          }
        `}</style>

        {/* Floating Orbs inside the section wrapper */}
        <div className="bg-orbs" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
          <div className="orb orb-1" style={{ background: '#fb7185', opacity: 0.12, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', top: '10%', left: '10%', filter: 'blur(80px)' }} />
          <div className="orb orb-3" style={{ background: '#fda4af', opacity: 0.12, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', bottom: '10%', right: '10%', filter: 'blur(80px)' }} />
        </div>

        {/* Card Component (cloudbau Bootstrap Login Style) */}
        <div className="card health-register-card" style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          
          {/* cloudbau themed header block */}
          <div style={{ background: '#be123c', padding: '28px 24px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              MAMATRACK
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.85, textTransform: 'uppercase' }}>
              Expectant Mother Registration
            </div>
          </div>

          {/* Form Content Body */}
          <div style={{ padding: '36px 30px', background: '#ffffff' }}>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger-600)', padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Section 1: User details */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Personal Account Info
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label"><User size={13} /> Full Name</label>
                  <input type="text" name="full_name" className="form-input" placeholder="e.g. Nabosa Sarah" value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={13} /> Phone Number</label>
                  <input type="tel" name="phone" className="form-input" placeholder="e.g. +256-772-000-000" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label"><Mail size={13} /> Email Address</label>
                  <input type="email" name="email" className="form-input" placeholder="e.g. sarah@gmail.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Calendar size={13} /> Date of Birth</label>
                  <input type="date" name="date_of_birth" className="form-input" value={formData.date_of_birth} onChange={handleChange} required />
                </div>
              </div>

              {/* Section 2: Clinical Details */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Pregnancy & Clinical Details
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label"><Heart size={13} /> Blood Group</label>
                  <select name="blood_type" className="form-input" value={formData.blood_type} onChange={handleChange}>
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
                  <label className="form-label"><Calendar size={13} /> Pregnancy Confirm/Start Date</label>
                  <input type="date" name="pregnancy_start_date" className="form-input" value={formData.pregnancy_start_date} onChange={handleChange} required />
                </div>
              </div>

              {/* Section 3: Next of Kin */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Next of Kin Contact
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label"><Users size={13} /> Kin Full Name</label>
                  <input type="text" name="next_of_kin_name" className="form-input" placeholder="e.g. Ssemanda Dan" value={formData.next_of_kin_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Users size={13} /> Relationship</label>
                  <select name="next_of_kin_relationship" className="form-input" value={formData.next_of_kin_relationship} onChange={handleChange}>
                    <option value="Husband">Husband</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="VHT Worker">VHT Worker</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label"><Phone size={13} /> Kin Phone Number</label>
                <input type="tel" name="next_of_kin_phone" className="form-input" placeholder="e.g. +256-751-000-000" value={formData.next_of_kin_phone} onChange={handleChange} required />
              </div>

              {/* Section 4: Location */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Residential Location
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label"><MapPin size={13} /> Sub County</label>
                  <select name="sub_county" className="form-input" value={formData.sub_county} onChange={handleChange}>
                    <option value="Goma">Goma</option>
                    <option value="Nama">Nama</option>
                    <option value="Mukono Municipality">Mukono Municipality</option>
                    <option value="Koome">Koome</option>
                    <option value="Ntenjeru">Ntenjeru</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><MapPin size={13} /> Village / Ward</label>
                  <input type="text" name="village" className="form-input" placeholder="e.g. Seeta Ward" value={formData.village} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn btn-rose btn-block" style={{ fontWeight: 700, padding: '12px 20px', background: 'var(--rose-500)', color: '#ffffff' }}>
                Complete Account Setup
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p className="footer-link-text" style={{ color: 'var(--text-muted)', margin: 0 }}>
                Already have an account? <Link to="/login?role=mother" style={{ color: 'var(--rose-400)', fontWeight: 700, textDecoration: 'underline' }}>Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 0 20px', background: '#0b162b', color: '#909090' }}>
        <div className="container">
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between' }}>
            <div className="col-md-5">
              <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>MamaTrack Mother Registration</h4>
              <p style={{ color: '#909090', fontSize: '13px', lineHeight: 1.6 }}>
                By registering, your residential sub-county and clinical parameters are mapped to the local GPS rescue responder dispatch network. Keep your profile updated for safe ANC transport tracking.
              </p>
            </div>
            <div className="col-md-4">
              <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Helpline Info</h4>
              <p style={{ color: '#909090', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ marginRight: '5px' }}></i> Emergency Helpline: 0800-MAMATRACK</p>
              <p style={{ color: '#909090', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ marginRight: '5px' }}></i> support@mamatrack.go.ug</p>
            </div>
          </div>
          <div className="row border-top" style={{ borderTop: '1px solid #16243d', marginTop: '30px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>
              Copyright &copy; 2026 MamaTrack GPS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
