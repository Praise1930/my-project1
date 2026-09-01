// MamaTrack GPS — Landing / Home Page
//
// The public-facing entry page for the system. Provides role-based portal
// selection and directs users to login or registration.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';

const ROLES = [
  {
    id: 'mother',
    title: 'Mother Portal',
    icon: 'mother' as const,
    desc: 'Emergency beacons, ANC schedule & doctor chat',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  },
  {
    id: 'doctor',
    title: 'Clinical Portal',
    icon: 'doctor' as const,
    desc: 'Patient diagnostics, bed capacity & triage',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    id: 'admin',
    title: 'Dispatch Center',
    icon: 'ambulance' as const,
    desc: 'Fleet coordination, SOS dispatch & MPDSR',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    id: 'driver',
    title: 'Driver Panel',
    icon: 'navigate' as const,
    desc: 'GPS navigation, fuel logs & trip records',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    id: 'vht',
    title: 'VHT Dashboard',
    icon: 'vht' as const,
    desc: 'Village visits, mother register & referrals',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 50%, #f8fafc 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <header style={{
        textAlign: 'center',
        padding: '80px 24px 40px',
        maxWidth: '640px',
        animation: 'fadeInUp 0.6s ease',
      }}>
        {/* Logo mark */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
        }}>
          <Icon name="heart" size={36} className="" />
          <style>{`.landing-logo-icon { color: #fff; }`}</style>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          background: isDark
            ? 'linear-gradient(135deg, #f1f5f9, #c4b5fd)'
            : 'linear-gradient(135deg, #1e1b4b, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          marginBottom: '12px',
        }}>
          MamaTrack GPS
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 2.5vw, 16px)',
          color: isDark ? '#94a3b8' : '#64748b',
          lineHeight: 1.6,
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          GPS-based maternal emergency response system for Mukono District, Uganda.
          Connecting expectant mothers, ambulance dispatchers, and clinical care facilities.
        </p>
      </header>

      {/* Role Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        maxWidth: '900px',
        width: '100%',
        padding: '0 24px 24px',
        animation: 'fadeInUp 0.7s ease 0.1s both',
      }}>
        {ROLES.map(role => (
          <button
            key={role.id}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => navigate(`/login?role=${role.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              borderRadius: '16px',
              border: `1px solid ${hoveredRole === role.id ? role.color : isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'}`,
              background: isDark
                ? hoveredRole === role.id ? 'rgba(30,41,59,0.9)' : 'rgba(30,41,59,0.5)'
                : hoveredRole === role.id ? '#fff' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.25s ease',
              transform: hoveredRole === role.id ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredRole === role.id
                ? `0 8px 24px ${role.color}20`
                : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: role.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <Icon name={role.icon} size={24} />
            </div>
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#f1f5f9' : '#0f172a',
                marginBottom: '4px',
              }}>
                {role.title}
              </h3>
              <p style={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.4,
              }}>
                {role.desc}
              </p>
            </div>
          </button>
        ))}
      </section>

      {/* Register CTA */}
      <div style={{
        padding: '24px',
        textAlign: 'center',
        animation: 'fadeInUp 0.8s ease 0.2s both',
      }}>
        <p style={{
          fontSize: '14px',
          color: isDark ? '#94a3b8' : '#64748b',
          marginBottom: '12px',
        }}>
          Expectant mother? Register for emergency support.
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(244,63,94,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(244,63,94,0.3)';
          }}
        >
          Register as Mother
        </button>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '24px',
        textAlign: 'center',
        color: isDark ? '#475569' : '#94a3b8',
        fontSize: '12px',
      }}>
        MamaTrack GPS — Mukono District Health Office · Uganda Ministry of Health
      </footer>
    </div>
  );
};
