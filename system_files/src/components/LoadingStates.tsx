// MamaTrack GPS — Loading States & Skeleton Components
//
// Four exported loaders used across the dashboards:
//   HeartbeatLoader    — pulsing heart icon with messaging (mother dashboard, app shell)
//   SkeletonDashboardLoader — shimmer skeleton placeholder (admin, doctor, VHT dashboards)
//   GlassmorphicOverlayLoader — full-screen frosted glass overlay (login)
//   OrbitalLoader      — rotating orbital dots (driver dashboard)

import React from 'react';

/* ─── HeartbeatLoader ────────────────────────────────────────────────────── */

interface HeartbeatLoaderProps {
  message?: string;
  subtitle?: string;
}

export const HeartbeatLoader: React.FC<HeartbeatLoaderProps> = ({
  message = 'Loading…',
  subtitle,
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '32px',
    animation: 'fadeIn 0.4s ease',
  }}>
    {/* Pulsing heart SVG */}
    <div style={{ animation: 'heartbeat 1.4s ease-in-out infinite' }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </div>

    {/* ECG shimmer line */}
    <div style={{
      width: '180px',
      height: '3px',
      borderRadius: '2px',
      background: 'linear-gradient(90deg, transparent 0%, #ef4444 50%, transparent 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s ease-in-out infinite',
    }} />

    <p style={{
      color: '#f1f5f9',
      fontSize: '15px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textAlign: 'center',
    }}>
      {message}
    </p>

    {subtitle && (
      <p style={{
        color: '#94a3b8',
        fontSize: '12px',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: 1.5,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ─── SkeletonDashboardLoader ────────────────────────────────────────────── */

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
}) => (
  <div style={{
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.6s ease-in-out infinite',
  }} />
);

export const SkeletonDashboardLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: '#0f172a',
    animation: 'fadeIn 0.3s ease',
  }}>
    {/* Top bar skeleton */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid rgba(148,163,184,0.1)',
    }}>
      <SkeletonBlock width="140px" height="28px" />
      <div style={{ display: 'flex', gap: '12px' }}>
        <SkeletonBlock width="32px" height="32px" borderRadius="50%" />
        <SkeletonBlock width="32px" height="32px" borderRadius="50%" />
      </div>
    </div>

    {/* Content area */}
    <div style={{ display: 'flex', flex: 1 }}>
      {/* Sidebar skeleton (desktop) */}
      <div style={{
        width: '220px',
        padding: '20px 16px',
        borderRight: '1px solid rgba(148,163,184,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} width={`${70 + Math.random() * 30}%`} height="20px" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(148,163,184,0.05)',
              border: '1px solid rgba(148,163,184,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <SkeletonBlock width="60%" height="14px" />
              <SkeletonBlock width="40%" height="28px" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div style={{
          borderRadius: '12px',
          background: 'rgba(148,163,184,0.05)',
          border: '1px solid rgba(148,163,184,0.08)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <SkeletonBlock width="30%" height="20px" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <SkeletonBlock width="32px" height="32px" borderRadius="50%" />
              <SkeletonBlock width="25%" height="14px" />
              <SkeletonBlock width="20%" height="14px" />
              <SkeletonBlock width="15%" height="14px" />
              <SkeletonBlock width="10%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── GlassmorphicOverlayLoader ──────────────────────────────────────────── */

interface GlassmorphicOverlayLoaderProps {
  message?: string;
  subtitle?: string;
}

export const GlassmorphicOverlayLoader: React.FC<GlassmorphicOverlayLoaderProps> = ({
  message = 'Authenticating…',
  subtitle,
}) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    background: 'rgba(15, 23, 42, 0.75)',
    animation: 'fadeIn 0.25s ease',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '40px 48px',
      borderRadius: '20px',
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Spinner ring */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <p style={{
        color: '#f1f5f9',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        {message}
      </p>

      {subtitle && (
        <p style={{
          color: '#94a3b8',
          fontSize: '12px',
          textAlign: 'center',
          maxWidth: '260px',
          lineHeight: 1.5,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

/* ─── OrbitalLoader ──────────────────────────────────────────────────────── */

interface OrbitalLoaderProps {
  message?: string;
  subtitle?: string;
}

export const OrbitalLoader: React.FC<OrbitalLoaderProps> = ({
  message = 'Loading…',
  subtitle,
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '32px',
    minHeight: '100dvh',
    background: '#0f172a',
    animation: 'fadeIn 0.4s ease',
  }}>
    {/* Orbital ring with dots */}
    <div style={{
      position: 'relative',
      width: '64px',
      height: '64px',
    }}>
      {/* Central dot */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#6366f1',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
      }} />

      {/* Orbiting dots */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '8px',
          height: '8px',
          marginLeft: '-4px',
          marginTop: '-4px',
          borderRadius: '50%',
          background: ['#6366f1', '#ec4899', '#10b981'][i],
          animation: `orbit ${1.8 + i * 0.3}s linear infinite`,
          animationDelay: `${i * -0.6}s`,
          boxShadow: `0 0 8px ${['rgba(99,102,241,0.5)', 'rgba(236,72,153,0.5)', 'rgba(16,185,129,0.5)'][i]}`,
        }} />
      ))}
    </div>

    <p style={{
      color: '#f1f5f9',
      fontSize: '15px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textAlign: 'center',
    }}>
      {message}
    </p>

    {subtitle && (
      <p style={{
        color: '#94a3b8',
        fontSize: '12px',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: 1.5,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);
