// MamaTrack GPS — Forgot Password Page
//
// Allows users to request a password reset link via Supabase auth,
// or displays instructions when Supabase is not configured.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { showToast } from '../components/toastBus';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });

        if (resetErr) {
          if (resetErr.message.toLowerCase().includes('rate limit') || resetErr.message.toLowerCase().includes('too many')) {
            setError('Too many requests. Please wait a few minutes before trying again.');
          } else {
            setError(resetErr.message);
          }
          setIsLoading(false);
          return;
        }
      } catch {
        setError('A network error occurred. Please check your connection.');
        setIsLoading(false);
        return;
      }
    }

    // Always show success even if Supabase is not configured (prevent email enumeration)
    setSent(true);
    setIsLoading(false);
    showToast('If an account with that email exists, a reset link has been sent.', 'success', 6000, 'Email Sent');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 50%, #f8fafc 100%)',
      padding: '24px',
    }}>
      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        borderRadius: '20px',
        background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
        backdropFilter: 'blur(12px)',
        boxShadow: isDark
          ? '0 25px 50px -12px rgba(0,0,0,0.5)'
          : '0 25px 50px -12px rgba(0,0,0,0.1)',
        animation: 'fadeInUp 0.5s ease',
      }}>
        {!sent ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#fff',
              }}>
                <Mail size={28} />
              </div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: isDark ? '#f1f5f9' : '#0f172a',
                marginBottom: '8px',
              }}>
                Reset Password
              </h1>
              <p style={{
                fontSize: '13px',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.5,
              }}>
                Enter the email address linked to your MamaTrack account and we'll send you a password reset link.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDark ? '#94a3b8' : '#475569',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="mother@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.2)' : '#e2e8f0'}`,
                    background: isDark ? 'rgba(15,23,42,0.5)' : '#f8fafc',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = isDark ? 'rgba(148,163,184,0.2)' : '#e2e8f0'}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                }}
              >
                <Send size={16} />
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/login"
                style={{
                  fontSize: '13px',
                  color: '#6366f1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#10b981',
            }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: isDark ? '#f1f5f9' : '#0f172a',
              marginBottom: '8px',
            }}>
              Check Your Inbox
            </h2>
            <p style={{
              fontSize: '13px',
              color: isDark ? '#94a3b8' : '#64748b',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              If an account with <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{email}</strong> exists,
              we've sent a password reset link. Check your Spam/Junk folder as well.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
