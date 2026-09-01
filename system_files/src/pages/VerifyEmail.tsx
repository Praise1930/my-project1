// MamaTrack GPS — Email Verification & Account Activation Portal

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { CheckCircle, Mail, AlertTriangle, ArrowRight, Send, ShieldCheck, Inbox } from 'lucide-react';
import { showToast } from '../components/toastBus';

export const VerifyEmail: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check email parameter from URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Cooldown countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Check Supabase authentication status and hash token on page mount
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const userEmail = session.user.email || '';
          if (userEmail) {
            setEmail(userEmail);
            markUserVerifiedLocally(userEmail);
            setIsVerified(true);
            showToast(`Account confirmed for ${userEmail}!`, 'success');
          }
        }
      } catch (err) {
        console.warn('VerifyEmail auth check note:', err);
      }
    };

    checkSupabaseAuth();

    // Listen for incoming auth state changes (e.g. magic link token confirmed in URL)
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
          const userEmail = session.user.email;
          setEmail(userEmail);
          markUserVerifiedLocally(userEmail);
          setIsVerified(true);
          showToast(`Account confirmed for ${userEmail}!`, 'success');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const markUserVerifiedLocally = (targetEmail: string) => {
    const clean = targetEmail.toLowerCase().trim();
    const users = db.users;
    const userIndex = users.findIndex(u => u.email.toLowerCase() === clean);

    if (userIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        email_verified: true,
      };
      db.users = updatedUsers;
    }
  };

  const handleVerify = () => {
    if (!email.trim()) {
      setError('Please provide a valid registered email address.');
      return;
    }

    const clean = email.toLowerCase().trim();
    const users = db.users;
    const userIndex = users.findIndex(u => u.email.toLowerCase() === clean);

    if (userIndex === -1) {
      setError('No account was found with this email address. Please verify the address or register a new mother profile.');
      return;
    }

    markUserVerifiedLocally(clean);
    setIsVerified(true);
    setError(null);
    showToast(`Account successfully activated for ${clean}!`, 'success');
  };

  const handleResend = async () => {
    const clean = email.trim();
    if (!clean) {
      setError('Please enter your registered email address first.');
      return;
    }
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);
    setStatusMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const verifyRedirectUrl = `${window.location.origin}/verify-email?email=${encodeURIComponent(clean)}`;
        const { error: resendErr } = await supabase.auth.resend({
          type: 'signup',
          email: clean,
          options: {
            emailRedirectTo: verifyRedirectUrl
          }
        });

        if (resendErr) {
          console.warn('Resend failed:', resendErr.message);
          const msg = resendErr.message.toLowerCase();
          if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('security purposes') || msg.includes('over_email_send_rate_limit')) {
            setStatusMessage('Supabase email hourly limit reached. Please check your Spam/Junk folder, wait a few minutes, or use the instant verification button below.');
            showToast('Email rate limit reached on Supabase. Try again in a few moments or activate instantly.', 'warning', 8000);
          } else {
            setStatusMessage(`Resend response: ${resendErr.message}`);
            showToast(`Could not resend email: ${resendErr.message}`, 'error');
          }
          setResendCooldown(25);
          return;
        }

        setStatusMessage(`A new verification link has been dispatched to ${clean}. Please check your inbox and spam folder.`);
        showToast(`Verification link resent to ${clean}!`, 'success', 7000, 'Link Sent');
        setResendCooldown(45);
      } else {
        setStatusMessage('System running in local simulation mode. You can click "Verify Account Instantly" below.');
        showToast('Running in local mode. Click "Verify Account Instantly" to activate.', 'info');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Network error while requesting verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{
      background: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#1e293b',
      fontFamily: "'Outfit', 'Muli', sans-serif",
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header bar */}
      <header style={{
        background: isDark ? '#1e293b' : '#ffffff',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
        padding: '12px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#ffffff' : '#030431', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/assets/img/icons/logo.png" alt="MamaTrack Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }} />
          <span>Mama<span style={{ color: '#0f61ef' }}>Track</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/login?role=mother" style={{ color: isDark ? '#60a5fa' : '#0f61ef', fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none' }}>
            Go to Login →
          </Link>
        </div>
      </header>

      {/* Main verification card */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: isDark 
          ? 'linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.8)), url("/assets/img/hero/hero2.png") no-repeat center center / cover' 
          : 'linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.85)), url("/assets/img/hero/hero2.png") no-repeat center center / cover',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: '24px',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.06)',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxSizing: 'border-box'
        }}>
          {!isVerified ? (
            <>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(15, 97, 239, 0.08)',
                color: '#0f61ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mail size={36} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                  Account Verification
                </h2>
                <p style={{ fontSize: '0.86rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Confirm your email address below to activate your MamaTrack GPS maternal health profile.
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#4b5563' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. mother@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#1e293b',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '100%',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {statusMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: statusMessage.includes('dispatched') ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: statusMessage.includes('dispatched') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '100%',
                  color: statusMessage.includes('dispatched') ? '#10b981' : '#f59e0b',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0f61ef, #0644b0)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 8px 25px rgba(15, 97, 239, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <CheckCircle size={18} /> Verify Account Instantly
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  style={{
                    width: '100%',
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    color: resendCooldown > 0 ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#e2e8f0' : '#334155'),
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: isResending || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={15} />
                  {isResending ? 'Dispatching Link...' : (resendCooldown > 0 ? `Resend Link in ${resendCooldown}s` : 'Resend Verification Email')}
                </button>
              </div>

              {/* Troubleshooting Tips Accordion / Box */}
              <div style={{
                background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                width: '100%',
                textAlign: 'left',
                fontSize: '0.78rem',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.5,
                boxSizing: 'border-box'
              }}>
                <div style={{ fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Inbox size={14} /> Can't find the verification email?
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Check your <strong>Spam / Junk</strong> folder in case your mail filter redirected it.</li>
                  <li>Ensure the email address matches what you typed during registration.</li>
                  <li>Click <strong>Verify Account Instantly</strong> above to activate directly.</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={38} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                  Account Activated!
                </h2>
                <p style={{ fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Your email address <strong>{email}</strong> has been successfully verified. You can now log in to the MamaTrack Mother Portal.
                </p>
              </div>

              <Link
                to={`/login?role=mother&email=${encodeURIComponent(email)}`}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(244, 63, 94, 0.25)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.transform = 'none'}
              >
                Proceed to Mother Login <ArrowRight size={18} />
              </Link>
            </>
          )}

          <div style={{ fontSize: '0.82rem', color: '#8b96a5', marginTop: '4px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>Back to Home Page</Link>
          </div>
        </div>
      </main>

      <footer style={{
        background: isDark ? '#0f172a' : '#f1f5f9',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #e2e8f0',
        padding: '16px 40px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#8b96a5'
      }}>
        © 2026 MamaTrack GPS · Maternal Health Verification Services · Mukono District
      </footer>
    </div>
  );
};
