// MamaTrack GPS — Expectant Mother Registration Portal (With Medical Center UI Theme)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/db';
import { User, Phone, Mail, Calendar, MapPin, Heart, Users, Lock } from 'lucide-react';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';

// Import template stylesheets
import '../styles/medical-center/bootstrap.min.css';
import '../styles/medical-center/flaticon.css';
import '../styles/medical-center/themify-icons.css';
import '../styles/medical-center/fontawesome-all.min.css';
import '../styles/medical-center/style.css';

import { auth, isFirebaseConfigured } from '../services/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';

export const Register: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password_hash: '',
    date_of_birth: '',
    blood_type: 'O+',
    pregnancy_start_date: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: 'Husband',
    village: '',
    sub_county: 'Goma'
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const handleDobChange = (part: 'day' | 'month' | 'year', value: string) => {
    let d = dobDay;
    let m = dobMonth;
    let y = dobYear;
    if (part === 'day') {
      setDobDay(value);
      d = value;
    } else if (part === 'month') {
      setDobMonth(value);
      m = value;
    } else if (part === 'year') {
      setDobYear(value);
      y = value;
    }
    
    const nextDob = (d && m && y) ? `${y}-${m}-${d}` : '';
    setFormData(prev => ({
      ...prev,
      date_of_birth: nextDob
    }));

    if (nextDob) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.date_of_birth;
        return copy;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setIsLoading(true);

    const errors: Record<string, string> = {};
    const phoneRegex = /^7\d{7}$/;

    if (!formData.full_name.trim()) errors.full_name = "Full name is required.";
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format.";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = "Invalid format. Must start with 7 and have exactly 8 digits (e.g. 71234567).";
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = "Date of birth is required.";
    }

    if (!formData.password_hash) {
      errors.password_hash = "Password is required.";
    } else if (formData.password_hash.length < 6) {
      errors.password_hash = "Password must be at least 6 characters long.";
    }

    if (formData.password_hash !== confirmPassword) {
      errors.confirm_password = "Passwords do not match.";
    }

    if (!formData.pregnancy_start_date) {
      errors.pregnancy_start_date = "Pregnancy start date is required.";
    }

    if (!formData.next_of_kin_name.trim()) {
      errors.next_of_kin_name = "Kin name is required.";
    }

    if (!formData.next_of_kin_phone.trim()) {
      errors.next_of_kin_phone = "Kin phone number is required.";
    } else if (!phoneRegex.test(formData.next_of_kin_phone)) {
      errors.next_of_kin_phone = "Invalid format. Must start with 7 and have exactly 8 digits (e.g. 71234567).";
    }

    if (!formData.village.trim()) {
      errors.village = "Village name is required.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix the highlighted fields before submitting.");
      setIsLoading(false);
      return;
    }

    const submissionData = {
      ...formData,
      phone: `+267${formData.phone}`,
      next_of_kin_phone: `+267${formData.next_of_kin_phone}`
    };

    try {
      let registeredInFirebase = false;
      // 1. Register with Firebase Authentication if configured
      if (isFirebaseConfigured && auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, submissionData.email, submissionData.password_hash);
          // 2. Send Email Verification
          await sendEmailVerification(userCredential.user);
          registeredInFirebase = true;
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth registration failed. Attempting local-only registration fallback:", firebaseErr);
          if (firebaseErr.code === 'auth/email-already-in-use') {
            setError('This email is already in use by another cloud account.');
            setIsLoading(false);
            return;
          }
          // Do not fail hard on firebase setup/network errors; fallback to local db
        }
      }
      
      // 3. Register user in the local simulated database
      const res = AuthService.registerMother(submissionData);
      
      if (res.success) {
        if (isFirebaseConfigured && auth && registeredInFirebase) {
          await signOut(auth);
          alert('Registration successful! Please check your email to verify your account before logging in.');
        } else {
          alert('Registration successful! (Running in mock database mode)');
        }
        navigate('/login?role=mother');
      } else {
        setError(res.error || 'Failed to create local account profile');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="medical-register-root" style={{ background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#757575', fontFamily: "'Muli', sans-serif", minHeight: '100vh', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* HEADER START */}
      <header>
        <div className="header-area">
          <div className="main-header header-sticky" style={{ background: isDark ? '#1e293b' : '#ffffff', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div className="container-fluid" style={{ padding: '0 40px' }}>
              <div className="row align-items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0' }}>
                <div className="logo">
                  <Link to="/" style={{ fontSize: '1.7rem', fontWeight: 800, color: isDark ? '#ffffff' : '#030431', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <img src="/assets/img/icons/logo.png" alt="MamaTrack Logo" style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '10px' }} />
                    <span>Mama<span style={{ color: '#0f61ef' }}>Track</span></span>
                  </Link>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ThemeToggle />
                  <Link to="/" className="d-none d-sm-inline-block" style={{ color: isDark ? '#f1f5f9' : '#102039', fontWeight: 600, fontSize: '15px' }}>← Back to Home</Link>
                  <Link to="/" className="d-inline-block d-sm-none" style={{ color: isDark ? '#f1f5f9' : '#102039', fontSize: '18px', padding: '4px' }} title="Back to Home">
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
      <section className="register-form-section" style={{ minHeight: 'calc(100vh - 72px - 280px)', background: isDark ? 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.6)), url("/assets/img/hero/hero2.png") no-repeat center center / cover' : 'linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.75)), url("/assets/img/hero/hero2.png") no-repeat center center / cover', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', position: 'relative' }}>
        
        {/* Scoped card styling overrides */}
        <style>{`
          .health-register-card {
            max-width: 780px !important;
            padding: 0px !important;
            border-radius: 6px !important;
            border: ${isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.12)'} !important;
            box-shadow: ${isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0,0,0,0.08)'} !important;
            background: ${isDark ? '#1e293b' : '#ffffff'} !important;
            overflow: hidden !important;
          }
          .health-register-card h2 {
            font-size: 2.2rem !important;
            font-weight: 800 !important;
            color: ${isDark ? '#ffffff' : '#1f2937'} !important;
          }
          .health-register-card p.subtitle-desc {
            font-size: 1.05rem !important;
            color: ${isDark ? '#cbd5e1' : '#6b7280'} !important;
          }
          .health-register-card h3 {
            font-size: 1.15rem !important;
            margin-top: 1.5rem !important;
            color: ${isDark ? '#ffffff' : '#1f2937'} !important;
          }
          .health-register-card .form-label {
            font-size: 1.02rem !important;
            font-weight: 600 !important;
            color: ${isDark ? '#cbd5e1' : '#374151'} !important;
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
            border: ${isDark ? '1px solid #475569' : '1px solid #d1d5db'} !important;
            background: ${isDark ? '#0f172a' : '#f9fafb'} !important;
            color: ${isDark ? '#f1f5f9' : '#1f2937'} !important;
          }
          .health-register-card .phone-input-group {
            display: flex !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          .health-register-card .phone-input-group .phone-prefix {
            display: flex !important;
            align-items: center !important;
            background: ${isDark ? '#334155' : '#e2e8f0'} !important;
            color: ${isDark ? '#cbd5e1' : '#475569'} !important;
            padding: 0 12px !important;
            border: ${isDark ? '1px solid #475569' : '1px solid #d1d5db'} !important;
            border-right: none !important;
            border-radius: 4px 0 0 4px !important;
            font-weight: 600 !important;
            font-size: 0.95rem !important;
            user-select: none !important;
          }
          .health-register-card .phone-input-group .form-input {
            border-radius: 0 4px 4px 0 !important;
            border-left: none !important;
          }
          .health-register-card .form-input.has-error {
            border: 1px solid #ef4444 !important;
            background: ${isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)'} !important;
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
            color: #ffffff !important;
          }
          .health-register-card .footer-link-text {
            font-size: 0.98rem !important;
            color: ${isDark ? '#cbd5e1' : '#6b7280'} !important;
          }
          /* Prevent button hover effect overlay from covering button text */
          .btn::before, .header-btn::before, .btn-rose::before {
            z-index: -1 !important;
          }
        `}</style>

        {/* Floating Orbs inside the section wrapper */}
        <div className="bg-orbs" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
          <div className="orb orb-1" style={{ background: '#fb7185', opacity: 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', top: '10%', left: '10%' }} />
          <div className="orb orb-3" style={{ background: '#fda4af', opacity: 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', bottom: '10%', right: '10%' }} />
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
          <div style={{ padding: '36px 30px', background: isDark ? '#1e293b' : '#ffffff' }}>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1: User details */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Personal Account Info
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label"><User size={13} /> Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className={`form-input ${validationErrors.full_name ? 'has-error' : ''}`}
                    placeholder="e.g. Nabosa Sarah"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                  {validationErrors.full_name && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.full_name}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={13} /> Phone Number</label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+267</span>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-input ${validationErrors.phone ? 'has-error' : ''}`}
                      placeholder="e.g. 71234567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  {validationErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label"><Mail size={13} /> Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${validationErrors.email ? 'has-error' : ''}`}
                    placeholder="e.g. sarah@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {validationErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.email}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label"><Calendar size={13} /> Date of Birth</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      name="dob_day"
                      className={`form-input ${validationErrors.date_of_birth ? 'has-error' : ''}`}
                      style={{ flex: 1 }}
                      value={dobDay}
                      onChange={(e) => handleDobChange('day', e.target.value)}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      name="dob_month"
                      className={`form-input ${validationErrors.date_of_birth ? 'has-error' : ''}`}
                      style={{ flex: 1.5 }}
                      value={dobMonth}
                      onChange={(e) => handleDobChange('month', e.target.value)}
                    >
                      <option value="">Month</option>
                      {[
                        { val: '01', name: 'January' },
                        { val: '02', name: 'February' },
                        { val: '03', name: 'March' },
                        { val: '04', name: 'April' },
                        { val: '05', name: 'May' },
                        { val: '06', name: 'June' },
                        { val: '07', name: 'July' },
                        { val: '08', name: 'August' },
                        { val: '09', name: 'September' },
                        { val: '10', name: 'October' },
                        { val: '11', name: 'November' },
                        { val: '12', name: 'December' }
                      ].map(m => (
                        <option key={m.val} value={m.val}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      name="dob_year"
                      className={`form-input ${validationErrors.date_of_birth ? 'has-error' : ''}`}
                      style={{ flex: 1.2 }}
                      value={dobYear}
                      onChange={(e) => handleDobChange('year', e.target.value)}
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 70 }, (_, i) => String(new Date().getFullYear() - 14 - i)).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {validationErrors.date_of_birth && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.date_of_birth}</span>
                  )}
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label"><Lock size={13} /> Choose Password</label>
                  <input
                    type="password"
                    name="password_hash"
                    className={`form-input ${validationErrors.password_hash ? 'has-error' : ''}`}
                    placeholder="Min 6 characters"
                    value={formData.password_hash}
                    onChange={handleChange}
                  />
                  {validationErrors.password_hash && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.password_hash}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label"><Lock size={13} /> Confirm Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    className={`form-input ${validationErrors.confirm_password ? 'has-error' : ''}`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirm_password) {
                        setValidationErrors(prev => {
                          const copy = { ...prev };
                          delete copy.confirm_password;
                          return copy;
                        });
                      }
                    }}
                  />
                  {validationErrors.confirm_password && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.confirm_password}</span>
                  )}
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
                  <input
                    type="date"
                    name="pregnancy_start_date"
                    className={`form-input ${validationErrors.pregnancy_start_date ? 'has-error' : ''}`}
                    value={formData.pregnancy_start_date}
                    onChange={handleChange}
                  />
                  {validationErrors.pregnancy_start_date && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.pregnancy_start_date}</span>
                  )}
                </div>
              </div>

              {/* Section 3: Next of Kin */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                Next of Kin Contact
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label"><Users size={13} /> Kin Full Name</label>
                  <input
                    type="text"
                    name="next_of_kin_name"
                    className={`form-input ${validationErrors.next_of_kin_name ? 'has-error' : ''}`}
                    placeholder="e.g. Ssemanda Dan"
                    value={formData.next_of_kin_name}
                    onChange={handleChange}
                  />
                  {validationErrors.next_of_kin_name && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.next_of_kin_name}</span>
                  )}
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
                <div className="phone-input-group">
                  <span className="phone-prefix">+267</span>
                  <input
                    type="tel"
                    name="next_of_kin_phone"
                    className={`form-input ${validationErrors.next_of_kin_phone ? 'has-error' : ''}`}
                    placeholder="e.g. 71234567"
                    value={formData.next_of_kin_phone}
                    onChange={handleChange}
                  />
                </div>
                {validationErrors.next_of_kin_phone && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.next_of_kin_phone}</span>
                )}
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
                  <input
                    type="text"
                    name="village"
                    className={`form-input ${validationErrors.village ? 'has-error' : ''}`}
                    placeholder="e.g. Seeta Ward"
                    value={formData.village}
                    onChange={handleChange}
                  />
                  {validationErrors.village && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{validationErrors.village}</span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-rose btn-block" disabled={isLoading} style={{ fontWeight: 700, padding: '12px 20px', background: 'var(--rose-500)', color: '#ffffff' }}>
                {isLoading ? 'Processing...' : 'Complete Account Setup'}
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
      <footer style={{
        padding: '40px 0 20px',
        background: isDark ? '#0b162b' : '#f8fafc',
        color: isDark ? '#909090' : '#475569',
        borderTop: isDark ? 'none' : '1px solid #e2e8f0',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}>
        <div className="container">
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between' }}>
            <div className="col-md-5">
              <h4 style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>MamaTrack Mother Registration</h4>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                By registering, your residential sub-county and clinical parameters are mapped to the local GPS rescue responder dispatch network. Keep your profile updated for safe ANC transport tracking.
              </p>
            </div>
            <div className="col-md-4">
              <h4 style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Helpline Info</h4>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ marginRight: '5px' }}></i> Emergency Helpline: 0800-MAMATRACK</p>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ marginRight: '5px' }}></i> support@mamatrack.go.ug</p>
            </div>
          </div>
          <div className="row border-top" style={{ borderTop: isDark ? '1px solid #16243d' : '1px solid #e2e8f0', marginTop: '30px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#909090' : '#64748b' }}>
              Copyright &copy; 2026 MamaTrack GPS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
