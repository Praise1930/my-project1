// MamaTrack GPS — Simulated Email Verification Portal

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { CheckCircle, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { Icon } from '../components/Icon';

export const VerifyEmail: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = () => {
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    const users = db.users;
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (userIndex === -1) {
      setError('No registered account was found with this email address.');
      return;
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      email_verified: true,
    };

    db.users = updatedUsers;
    setIsVerified(true);
    setError(null);
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
          <span style={{ color: '#f43f5e' }}><Icon name="mother" size={18} /></span> Mama<span style={{ color: '#0f61ef' }}>Track</span>
        </Link>
        <ThemeToggle />
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
          padding: '40px',
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
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
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 10px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                  Verify Your Account
                </h2>
                <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Thank you for creating a MamaTrack GPS account. Please confirm your email address below to activate your maternal profile.
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#4b5563' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#1e293b',
                    fontSize: '0.9rem',
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
                  fontSize: '0.78rem',
                  textAlign: 'left'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleVerify}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0f61ef, #0644b0)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 8px 25px rgba(15, 97, 239, 0.25)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                Verify Email Address
              </button>
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
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 10px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                  Verification Successful!
                </h2>
                <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Your email address <strong>{email}</strong> has been successfully verified. You may now sign in to your dashboard.
                </p>
              </div>

              <Link
                to="/login?role=mother"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.9rem',
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
                Proceed to Login <ArrowRight size={16} />
              </Link>
            </>
          )}

          <div style={{ fontSize: '0.78rem', color: '#8b96a5' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>Back to Home Page</Link>
          </div>
        </div>
      </main>

      <footer style={{
        background: isDark ? '#0f172a' : '#f1f5f9',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #e2e8f0',
        padding: '20px 40px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#8b96a5'
      }}>
        © 2026 MamaTrack GPS · Simulated Health Verification Services.
      </footer>
    </div>
  );
};
