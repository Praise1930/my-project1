// MamaTrack GPS — Loading States Showcase
//
// Internal reference page at /loading-states to preview all loading and
// skeleton variations side by side.

import React, { useState } from 'react';
import { HeartbeatLoader, SkeletonDashboardLoader, GlassmorphicOverlayLoader, OrbitalLoader } from '../components/LoadingStates';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type Demo = 'heartbeat' | 'skeleton' | 'glassmorphic' | 'orbital';

export const LoadingShowcase: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [active, setActive] = useState<Demo | null>(null);

  const demos: { key: Demo; label: string; desc: string }[] = [
    { key: 'heartbeat', label: 'Heartbeat Loader', desc: 'Used on the Mother Dashboard and the App shell Suspense fallback.' },
    { key: 'skeleton', label: 'Skeleton Dashboard', desc: 'Shimmer skeleton used by Admin, Doctor, and VHT dashboards while loading user session.' },
    { key: 'glassmorphic', label: 'Glassmorphic Overlay', desc: 'Frosted-glass overlay shown during authentication on the Login page.' },
    { key: 'orbital', label: 'Orbital Loader', desc: 'Animated orbital dots used on the Driver Dashboard while syncing GPS data.' },
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark ? '#0f172a' : '#f8fafc',
      padding: '24px',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '900px',
        margin: '0 auto 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#6366f1',
            fontSize: '13px',
            fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: isDark ? '#f1f5f9' : '#0f172a',
          }}>
            Loading States
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {demos.map(demo => (
          <button
            key={demo.key}
            onClick={() => setActive(active === demo.key ? null : demo.key)}
            style={{
              padding: '20px',
              borderRadius: '14px',
              border: `1px solid ${active === demo.key ? '#6366f1' : isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0'}`,
              background: isDark ? 'rgba(30,41,59,0.6)' : '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <h3 style={{
              fontSize: '15px',
              fontWeight: 700,
              color: isDark ? '#f1f5f9' : '#0f172a',
              marginBottom: '6px',
            }}>
              {demo.label}
            </h3>
            <p style={{
              fontSize: '12px',
              color: isDark ? '#94a3b8' : '#64748b',
              lineHeight: 1.5,
            }}>
              {demo.desc}
            </p>
            <span style={{
              display: 'inline-block',
              marginTop: '10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6366f1',
            }}>
              {active === demo.key ? 'Hide Preview ↑' : 'Show Preview ↓'}
            </span>
          </button>
        ))}
      </div>

      {/* Preview area */}
      {active && (
        <div style={{
          maxWidth: '900px',
          margin: '24px auto 0',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0'}`,
          overflow: 'hidden',
          position: 'relative',
          minHeight: active === 'skeleton' ? '500px' : '300px',
          background: '#0f172a',
        }}>
          {active === 'heartbeat' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <HeartbeatLoader message="Syncing Maternal Health Record..." subtitle="Connecting to Mukono General Hospital emergency node" />
            </div>
          )}
          {active === 'skeleton' && <SkeletonDashboardLoader />}
          {active === 'glassmorphic' && (
            <div style={{ position: 'relative', minHeight: '300px' }}>
              <GlassmorphicOverlayLoader message="Authenticating Mother Portal..." subtitle="Establishing secure Mukono District emergency session token" />
            </div>
          )}
          {active === 'orbital' && <OrbitalLoader message="Syncing Driver GPS Unit..." subtitle="Connecting Mukono District emergency dispatch server" />}
        </div>
      )}
    </div>
  );
};
