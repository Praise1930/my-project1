// MamaTrack GPS — Login Portal (With Medical Center UI Theme)

import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/db';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';

// Import template stylesheets
import '../styles/medical-center/bootstrap.min.css';
import '../styles/medical-center/flaticon.css';
import '../styles/medical-center/themify-icons.css';
import '../styles/medical-center/fontawesome-all.min.css';
import '../styles/medical-center/style.css';

import { auth, isFirebaseConfigured } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const Login: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRole = searchParams.get('role') || 'mother';
  const role = ['mother', 'admin', 'doctor', 'driver'].includes(rawRole)
    ? (rawRole as 'mother' | 'admin' | 'doctor' | 'driver')
    : 'mother';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear error when role changes
  React.useEffect(() => {
    setError(null);
  }, [role]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // If Firebase is not configured, directly fall back to local mock DB login
      if (!isFirebaseConfigured || !auth) {
        const res = AuthService.login(email, password, role);
        if (res.success) {
          navigate(`/${role}`);
        } else {
          setError('Invalid credentials.');
        }
        return;
      }

      // 1. Try Firebase Authentication First
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. Enforce Email Verification for Firebase Users
        if (!userCredential.user.emailVerified) {
          setError('Please verify your email address. Check your inbox for the verification link.');
          await signOut(auth);
          setIsLoading(false);
          return;
        }

        // 3. If Firebase auth succeeds and is verified, sign into local mock DB for session/role
        const res = AuthService.login(email, password, role);
        if (res.success) {
          navigate(`/${role}`);
        } else {
          setError('Local mock profile not found. Please contact an administrator.');
        }

      } catch (firebaseErr: any) {
        // If Firebase login fails (e.g. user not found), it might be a legacy mock user
        if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/invalid-login-credentials') {
          // Fallback to local mock DB login
          const res = AuthService.login(email, password, role);
          if (res.success) {
            navigate(`/${role}`);
          } else {
             setError('Invalid credentials.');
          }
        } else {
          setError(firebaseErr.message || 'Authentication failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  const roleLabels = {
    mother: { title: 'Expectant Mother Portal', icon: '🤰', color: 'var(--rose-500)' },
    admin: { title: 'Command Control Center', icon: '📡', color: 'var(--primary-500)' },
    doctor: { title: 'Clinical Care Console', icon: '🩺', color: 'var(--success-500)' },
    driver: { title: 'Ambulance Navigation Panel', icon: '🚑', color: 'var(--warning-500)' }
  };

  const themeSettings = {
    mother: {
      bgGradient: 'radial-gradient(circle at 10% 20%, rgba(255, 241, 242, 0.6) 0%, rgba(255, 255, 255, 1) 90%)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: '1px solid rgba(244, 63, 94, 0.25)',
      textColor: '#1f2937',
      labelColor: '#374151',
      inputBg: '#ffffff',
      shadow: '0 20px 50px rgba(244, 63, 94, 0.08)',
      orbColor: '#fb7185',
    },
    doctor: {
      bgGradient: 'radial-gradient(circle at 10% 20%, rgba(236, 253, 245, 0.6) 0%, rgba(255, 255, 255, 1) 90%)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: '1px solid rgba(16, 185, 129, 0.25)',
      textColor: '#111827',
      labelColor: '#374151',
      inputBg: '#ffffff',
      shadow: '0 20px 50px rgba(16, 185, 129, 0.08)',
      orbColor: '#10b981',
    },
    driver: {
      bgGradient: 'radial-gradient(circle at 10% 20%, rgba(255, 251, 235, 0.6) 0%, rgba(255, 255, 255, 1) 90%)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: '1px solid rgba(245, 158, 11, 0.25)',
      textColor: '#1f2937',
      labelColor: '#374151',
      inputBg: '#ffffff',
      shadow: '0 20px 50px rgba(245, 158, 11, 0.08)',
      orbColor: '#f59e0b',
    },
    admin: {
      bgGradient: 'radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%)',
      cardBg: 'rgba(15, 23, 42, 0.95)',
      cardBorder: '1px solid rgba(59, 130, 246, 0.35)',
      textColor: '#f8fafc',
      labelColor: '#cbd5e1',
      inputBg: '#1e293b',
      shadow: '0 20px 50px rgba(59, 130, 246, 0.15)',
      orbColor: '#3b82f6',
    }
  };

  return (
    <div className="medical-login-root" style={{ background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#757575', fontFamily: "'Muli', sans-serif", minHeight: '100vh', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* HEADER START */}
      <header>
        <div className="header-area">
          <div className="main-header header-sticky" style={{ background: isDark ? '#1e293b' : '#ffffff', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'background-color 0.3s ease' }}>
            <div className="container-fluid" style={{ padding: '0 40px' }}>
              <div className="row align-items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0' }}>
                <div className="logo">
                  <Link to="/" style={{ fontSize: '1.9rem', fontWeight: 800, color: isDark ? '#ffffff' : '#030431', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#0f61ef', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      <i className="fa fa-h-square"></i>
                    </span>
                    <span>Mama<span style={{ color: '#0f61ef' }}>Track</span></span>
                  </Link>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ThemeToggle />
                  <Link to="/" className="d-none d-sm-inline-block" style={{ color: isDark ? '#f1f5f9' : '#102039', fontWeight: 600, fontSize: '15px' }}>← Back to Home</Link>
                  <Link to="/" className="d-inline-block d-sm-none" style={{ color: isDark ? '#f1f5f9' : '#102039', fontSize: '18px', padding: '4px' }} title="Back to Home">
                    <i className="fa fa-home"></i>
                  </Link>
                  {role === 'mother' && (
                    <Link to="/register" className="btn header-btn d-none d-md-inline-block" style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '6px', color: '#ffffff', textDecoration: 'none' }}>
                      Register Mother
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CENTERED LOGIN FORM SECTION */}
      <section className="login-form-section" style={{ minHeight: 'calc(100vh - 72px - 280px)', background: `url('/assets/img/hero/hero2.png') no-repeat center center / cover`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', position: 'relative' }}>
        
        {/* Floating Orbs inside the section wrapper */}
        <div className="bg-orbs" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
          <div className="orb orb-1" style={{ background: themeSettings[role].orbColor, opacity: role === 'admin' ? 0.12 : 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', top: '10%', left: '10%' }} />
          <div className="orb orb-2" style={{ background: themeSettings[role].orbColor, opacity: role === 'admin' ? 0.12 : 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', bottom: '10%', right: '10%' }} />
        </div>

        {/* Card Component (cloudbau Bootstrap Login Style) */}
        <div className="card" style={{ width: '100%', maxWidth: '440px', padding: 0, position: 'relative', zIndex: 10, background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.12)', boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
          
          {/* cloudbau themed header block */}
          <div style={{ background: role === 'admin' ? '#0f172a' : roleLabels[role].color, padding: '28px 24px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              MAMATRACK
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.85, textTransform: 'uppercase' }}>
              {roleLabels[role].title}
            </div>
          </div>

          {/* Form Content Body */}
          <div style={{ padding: '36px 30px', background: isDark ? '#1e293b' : '#ffffff' }}>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger-600)', padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 600, color: isDark ? '#cbd5e1' : '#4b5563', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  style={{ padding: '12px 16px', fontSize: '1rem', borderRadius: '4px', background: isDark ? '#0f172a' : '#f9fafb', color: isDark ? '#f1f5f9' : '#1f2937', border: isDark ? '1px solid #475569' : '1px solid #d1d5db', width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. email@example.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 600, color: isDark ? '#cbd5e1' : '#4b5563', margin: 0 }}>
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{ background: 'none', border: 'none', color: isDark ? '#60a5fa' : '#6b7280', fontSize: '0.82rem', textDecoration: 'underline', cursor: 'pointer', outline: 'none', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ padding: '12px 45px 12px 16px', fontSize: '1rem', borderRadius: '4px', background: isDark ? '#0f172a' : '#f9fafb', color: isDark ? '#f1f5f9' : '#1f2937', border: isDark ? '1px solid #475569' : '1px solid #d1d5db', width: '100%' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDark ? '#cbd5e1' : '#6b7280',
                      fontSize: '1rem',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                style={{
                  background: role === 'admin' ? '#0f172a' : roleLabels[role].color,
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '12px 20px',
                  fontSize: '1.05rem',
                  borderRadius: '4px',
                  width: '100%',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Authenticate Portal →'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#6b7280', display: 'flex', gap: '12px' }}>
                <Link to="/" style={{ color: isDark ? '#cbd5e1' : '#4b5563', textDecoration: 'underline' }}>← Change Role</Link>
                {role === 'mother' && (
                  <>
                    <span>•</span>
                    <Link to="/register" style={{ color: 'var(--rose-500)', fontWeight: 700, textDecoration: 'underline' }}>Create Account</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 0 20px', background: '#0b162b', color: '#909090' }}>
        <div className="container">
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between' }}>
            <div className="col-md-5">
              <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>MamaTrack System Access</h4>
              <p style={{ color: '#909090', fontSize: '13px', lineHeight: 1.6 }}>
                Secure gateway portal for Mukono District responders. Ensure your credentials are kept confidential and your GPS location receiver status is active.
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
