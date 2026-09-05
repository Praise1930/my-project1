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

import { supabase, isSupabaseConfigured } from '../services/supabase';

import { Plus } from 'lucide-react';
import { GlassmorphicOverlayLoader } from '../components/LoadingStates';
import { Icon } from '../components/Icon';

import { showToast } from '../components/toastBus';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRole = searchParams.get('role') || 'mother';
  const role = ['mother', 'admin', 'doctor', 'driver', 'vht'].includes(rawRole)
    ? (rawRole as 'mother' | 'admin' | 'doctor' | 'driver' | 'vht')
    : 'mother';

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Email verification resend states
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const rolesList = [
    { id: 'mother', title: 'Mother portal', icon: 'mother', desc: 'Emergency beacons, ANC schedule & doctor chat', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
    { id: 'doctor', title: 'Clinical portal', icon: 'doctor', desc: 'Patient diagnostics, bed capacity & triage', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { id: 'driver', title: 'Ambulance portal', icon: 'ambulance', desc: 'GPS dispatches & vehicle safety checklists', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { id: 'vht', title: 'Village Health Team (VHT)', icon: 'vht', desc: 'Community maternal tracking & SOS alerts', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
    { id: 'admin', title: 'Administrator portal', icon: 'signal', desc: 'Fleet dispatch, facility & system administration', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
  ];

  // Cooldown countdown timer for resend
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset inputs when role changes
  React.useEffect(() => {
    setError(null);
    setEmailError(null);
    setUnverifiedEmail(null);
    setResendStatus(null);
    if (!searchParams.get('email')) {
      setEmail('');
    }
    setPassword('');
  }, [role, searchParams]);

  const handleResendVerification = async (targetEmail?: string) => {
    const toEmail = (targetEmail || unverifiedEmail || email).trim();
    if (!toEmail) {
      showToast('Please enter an email address to resend the verification link.', 'warning');
      return;
    }
    if (resendCooldown > 0) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const verifyRedirectUrl = `${window.location.origin}/verify-email?email=${encodeURIComponent(toEmail)}`;
        const { error: resendErr } = await supabase.auth.resend({
          type: 'signup',
          email: toEmail,
          options: {
            emailRedirectTo: verifyRedirectUrl
          }
        });

        if (resendErr) {
          console.warn('Resend verification error:', resendErr.message);
          const msg = resendErr.message.toLowerCase();
          if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('security purposes') || msg.includes('over_email_send_rate_limit')) {
            setResendStatus('Supabase hourly email limit reached. Please wait a few moments or activate directly via the Verification Portal.');
            showToast('Email rate limit reached on Supabase. Try again in a few moments or open the verification portal.', 'warning', 8000);
          } else {
            setResendStatus(`Resend note: ${resendErr.message}`);
            showToast(`Could not resend email: ${resendErr.message}`, 'error');
          }
          setResendCooldown(25);
          return;
        }

        setResendStatus(`Verification email dispatched to ${toEmail}! Check your inbox and spam folder.`);
        showToast(`Verification email resent to ${toEmail}!`, 'success', 7000, 'Email Sent');
        setResendCooldown(45);
      } else {
        setResendStatus('Simulated mode: You can verify your account instantly on the Verification Portal.');
        showToast('Running in local mode. Open the verification portal to activate.', 'info');
      }
    } catch (err) {
      console.error('Failed to resend verification:', err);
      setResendStatus('Network error while requesting verification email.');
      showToast('Network error while requesting verification email.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setUnverifiedEmail(null);
    setResendStatus(null);
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError("Email is required.");
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    } else if (!emailRegex.test(cleanEmail)) {
      setEmailError("Invalid email format.");
      setError("Invalid email format (e.g. user@example.com).");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Try Supabase Authentication first (if configured)
      if (isSupabaseConfigured && supabase) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!authErr && data.user) {
          // Supabase only issues a session once the email link is confirmed, but
          // check explicitly so the user gets a clear message either way.
          if (!data.user.email_confirmed_at) {
            setUnverifiedEmail(cleanEmail);
            setError(`Your email address has not been verified yet. We sent a verification link to ${cleanEmail}.`);
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          const res = AuthService.login(cleanEmail, password, role, true);
          if (res.success) {
            navigate(`/${role}`);
            return;
          }
          setError(res.error || 'Account not found for this role portal. Please select the correct role.');
          setIsLoading(false);
          return;
        }

        if (authErr) {
          console.warn('Supabase authentication note:', authErr.message);
          const msg = authErr.message.toLowerCase();
          if (msg.includes('email not confirmed') || msg.includes('not verified')) {
            setUnverifiedEmail(cleanEmail);
            setError(`Your email address has not been verified yet. Please check your inbox or spam folder for the link sent to ${cleanEmail}.`);
            setIsLoading(false);
            return;
          }
          // Seeded demo accounts do not exist in Supabase Auth, so fall through
          // to the local database login below rather than failing outright.
        }
      }

      // 2. Fallback to Local Database (Demo & Seeded Accounts)
      const res = AuthService.login(cleanEmail, password, role);
      if (res.success) {
        navigate(`/${role}`);
      } else {
        const errMsg = res.error || 'Invalid email or password for the selected portal role.';
        if (errMsg.toLowerCase().includes('email') && errMsg.toLowerCase().includes('verifi')) {
          setUnverifiedEmail(cleanEmail);
        }
        setError(errMsg);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  const roleLabels = {
    mother: { title: 'Mother portal', icon: 'mother', color: '#f43f5e' },
    admin: { title: 'Administrator portal', icon: 'signal', color: '#0f172a' },
    doctor: { title: 'Clinical portal', icon: 'doctor', color: '#10b981' },
    driver: { title: 'Ambulance portal', icon: 'ambulance', color: '#d97706' },
    vht: { title: 'Village Health Team Portal', icon: 'vht', color: '#0284c7' }
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
    },
    vht: {
      bgGradient: 'radial-gradient(circle at 10% 20%, rgba(224, 242, 254, 0.6) 0%, rgba(255, 255, 255, 1) 90%)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: '1px solid rgba(14, 165, 233, 0.25)',
      textColor: '#1f2937',
      labelColor: '#374151',
      inputBg: '#ffffff',
      shadow: '0 20px 50px rgba(14, 165, 233, 0.08)',
      orbColor: '#0ea5e9',
    }
  };

  return (
    <div className="medical-login-root" style={{ background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#757575', fontFamily: "'Muli', sans-serif", minHeight: '100dvh' }}>
      <style>{`
        /* Prevent button hover effect overlay from covering button text */
        .btn::before {
          z-index: -1 !important;
        }
      `}</style>
      
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
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'nowrap' }}>
                  <ThemeToggle />
                  <Link to="/" className="d-none d-sm-inline-block" style={{ color: isDark ? '#f1f5f9' : '#102039', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap' }}>← Back to Home</Link>
                  <Link to="/" className="d-inline-block d-sm-none" style={{ color: isDark ? '#f1f5f9' : '#102039', fontSize: '18px', padding: '4px' }} title="Back to Home">
                    <i className="fa fa-home"></i>
                  </Link>
                  <Link to="/register" className="btn header-btn d-none d-md-inline-flex" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', color: '#ffffff', background: 'linear-gradient(135deg, #0f61ef, #0046c7)', boxShadow: '0 4px 14px rgba(15, 97, 239, 0.4)', fontWeight: 700, textDecoration: 'none', alignItems: 'center', gap: '6px', marginLeft: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <Plus size={16} color="#ffffff" style={{ background: 'transparent' }} />
                    <span style={{ color: '#ffffff', fontWeight: 700, background: 'transparent' }}>Register Mother</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CENTERED LOGIN FORM SECTION */}
      <section className="login-form-section" style={{ minHeight: 'calc(100dvh - 72px - 280px)', background: isDark ? 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.6)), url("/assets/img/hero/hero2.png") no-repeat center center / cover' : 'linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.75)), url("/assets/img/hero/hero2.png") no-repeat center center / cover', backgroundAttachment: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', position: 'relative' }}>
        
        {/* Floating Orbs inside the section wrapper */}
        <div className="bg-orbs" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
          <div className="orb orb-1" style={{ background: themeSettings[role].orbColor, opacity: role === 'admin' ? 0.12 : 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', top: '10%', left: '10%' }} />
          <div className="orb orb-2" style={{ background: themeSettings[role].orbColor, opacity: role === 'admin' ? 0.12 : 0.08, width: '300px', height: '300px', borderRadius: '50%', position: 'absolute', bottom: '10%', right: '10%' }} />
        </div>

        {/* Card Component (cloudbau Bootstrap Login Style) */}
        <div className="card" style={{ width: '100%', maxWidth: '440px', minHeight: '560px', padding: 0, position: 'relative', zIndex: 10, background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.12)', boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* cloudbau themed header block */}
          <div style={{ background: role === 'admin' ? '#0f172a' : roleLabels[role].color, padding: '28px 24px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              MAMATRACK
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.85, textTransform: 'uppercase' }}>
              {roleLabels[role].title}
            </div>
          </div>

          {/* Quick Role-Switcher Bar */}
          <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', background: isDark ? '#0f172a' : '#f8fafc', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { id: 'mother', label: 'Mother', icon: 'mother' },
              { id: 'doctor', label: 'Doctor', icon: 'doctor' },
              { id: 'driver', label: 'Driver', icon: 'ambulance' },
              { id: 'vht', label: 'VHT', icon: 'vht' },
              { id: 'admin', label: 'Admin', icon: 'signal' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/login?role=${item.id}`)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: role === item.id ? `1px solid ${roleLabels[item.id as keyof typeof roleLabels].color}` : '1px solid transparent',
                  background: role === item.id ? (item.id === 'admin' ? '#0f172a' : roleLabels[item.id as keyof typeof roleLabels].color) : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                  color: role === item.id ? '#ffffff' : (isDark ? '#cbd5e1' : '#4b5563'),
                  fontWeight: role === item.id ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: role === item.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon name={item.icon} size={16} /> {item.label}
              </button>
            ))}
          </div>

          {/* Form Content Body */}
          <div style={{ padding: '30px 30px 36px', background: isDark ? '#1e293b' : '#ffffff' }}>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px 14px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.4 }}>{error}</span>
                </div>

                {unverifiedEmail && (
                  <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.78rem', color: isDark ? '#cbd5e1' : '#4b5563', lineHeight: 1.4 }}>
                      Didn't receive the email? Check your <strong>Spam / Junk</strong> folder, or click below:
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleResendVerification(unverifiedEmail)}
                        disabled={isResending || resendCooldown > 0}
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: resendCooldown > 0 ? (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0') : '#0f61ef',
                          color: resendCooldown > 0 ? (isDark ? '#94a3b8' : '#64748b') : '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: resendCooldown > 0 || isResending ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Mail size={13} />
                        {isResending ? 'Sending...' : (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email')}
                      </button>

                      <Link
                        to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                          color: isDark ? '#ffffff' : '#0f172a',
                          border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={13} color="#10b981" />
                        Verify Portal →
                      </Link>
                    </div>

                    {resendStatus && (
                      <div style={{ fontSize: '0.75rem', color: resendStatus.includes('dispatched') ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                        {resendStatus}
                      </div>
                    )}
                  </div>
                )}
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
                  style={{
                    padding: '12px 16px',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    background: isDark ? '#0f172a' : '#f9fafb',
                    color: isDark ? '#f1f5f9' : '#1f2937',
                    border: emailError ? '1px solid #ef4444' : (isDark ? '1px solid #475569' : '1px solid #d1d5db'),
                    width: '100%'
                  }}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="e.g. email@example.com"
                />
                {emailError && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{emailError}</span>
                )}
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

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
              {role === 'mother' ? (
                <div style={{ width: '100%', minHeight: '82px', padding: '12px 14px', background: isDark ? 'rgba(244, 63, 94, 0.12)' : '#fff1f2', borderRadius: '8px', border: isDark ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid #fecdd3', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#fda4af' : '#9f1239', display: 'block', marginBottom: '6px', fontWeight: 600 }}>New Expectant Mother?</span>
                  <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px 16px', background: 'linear-gradient(135deg, #0f61ef, #0046c7)', color: '#ffffff', fontWeight: 700, borderRadius: '6px', fontSize: '0.84rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(15, 97, 239, 0.35)' }}>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}><Icon name="add" size={14} /></span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>Register Mother Account</span>
                  </Link>
                </div>
              ) : (
                <div style={{ width: '100%', minHeight: '82px', padding: '12px 14px', background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#4b5563', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Authorized Portal Gateway</span>
                  <span style={{ fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b' }}>Enter your verified login credentials above to access the {roleLabels[role].title}.</span>
                </div>
              )}
              
              <div style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#6b7280', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(true)}
                  style={{ background: 'none', border: 'none', color: isDark ? '#60a5fa' : '#2563eb', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'underline', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span><Icon name="refresh" size={14} /></span> Change Portal Role
                </button>
                <span style={{ opacity: 0.5 }}>•</span>
                <Link to="/" style={{ color: isDark ? '#cbd5e1' : '#4b5563', fontSize: '0.85rem', textDecoration: 'underline' }}>
                  ← Main Home Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '40px 0 20px',
        background: isDark ? '#0b162b' : '#f8fafc',
        color: isDark ? '#909090' : '#475569',
        borderTop: isDark ? 'none' : '1px solid #e2e8f0'
      }}>
        <div className="container">
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between' }}>
            <div className="col-md-5">
              <h4 style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>MamaTrack System Access</h4>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                Secure gateway portal for Mukono District responders. Ensure your credentials are kept confidential and your GPS location receiver status is active.
              </p>
            </div>
            <div className="col-md-4">
              <h4 style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Helpline Info</h4>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ marginRight: '5px' }}></i> Emergency Helpline: 0800-MAMATRACK</p>
              <p style={{ color: isDark ? '#909090' : '#64748b', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ marginRight: '5px' }}></i> mamatrack6@gmail.com</p>
            </div>
          </div>
          <div className="row border-top" style={{ borderTop: isDark ? '1px solid #16243d' : '1px solid #e2e8f0', marginTop: '30px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#909090' : '#64748b' }}>
              Copyright &copy; 2026 MamaTrack GPS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE PORTAL DASHBOARD SELECTION MODAL */}
      {showRoleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: isDark ? '#0f172a' : '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="refresh" size={14} /></span> Select Portal Dashboard
                </h3>
                <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>Select a portal to switch login authentication</span>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: isDark ? '#cbd5e1' : '#64748b', padding: '0 4px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Role Options List */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '65vh', overflowY: 'auto' }}>
              {rolesList.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(`/login?role=${r.id}`);
                    setShowRoleModal(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: role === r.id ? `2px solid ${r.color}` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                    background: role === r.id ? r.bg : (isDark ? '#0f172a' : '#ffffff'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', width: '42px', height: '42px', borderRadius: '10px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={r.icon} size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.title}
                      {role === r.id && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: r.color, color: '#fff', fontWeight: 700 }}>Active</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                      {r.desc}
                    </div>
                  </div>
                  <span style={{ color: r.color, fontWeight: 700, fontSize: '1.1rem' }}>→</span>
                </button>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: isDark ? '#0f172a' : '#f8fafc', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/" onClick={() => setShowRoleModal(false)} style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.82rem', textDecoration: 'underline' }}>
                ← Main Home Page
              </Link>
              <button
                onClick={() => setShowRoleModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: isDark ? '#334155' : '#ffffff', color: isDark ? '#ffffff' : '#374151', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLASSMORPHIC AUTHENTICATION OVERLAY LOADER */}
      {isLoading && (
        <GlassmorphicOverlayLoader
          message={`Authenticating ${roleLabels[role].title}...`}
          subtitle="Establishing secure Mukono District emergency session token"
        />
      )}

    </div>
  );
};
