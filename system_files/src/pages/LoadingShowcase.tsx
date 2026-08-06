import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import {
  HeartbeatLoader,
  MedicalSpinner,
  SkeletonDashboardLoader,
  OrbitalLoader,
  TopProgressBarLoader,
  GlassmorphicOverlayLoader
} from '../components/LoadingStates';
import { ThemeToggle } from './Landing';
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const LoadingShowcase: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<number>(1);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  const options = [
    { id: 1, name: '1. Emergency Heartbeat Pulse', desc: 'Glowing radar ring with pulse animation, ideal for SOS beacons & emergency dispatches.', tag: 'Emergency SOS' },
    { id: 2, name: '2. Rotating Gradient Spinner', desc: 'Conic gradient spinner surrounding a medical icon, sleek for dashboard data fetching.', tag: 'General Data' },
    { id: 3, name: '3. Skeleton Wireframe Shimmer', desc: 'Glassmorphic card skeleton with animated shimmer wave for loading tables & metrics.', tag: 'Content Wireframe' },
    { id: 4, name: '4. Satellite Orbital Radar', desc: 'Dual-ring rotating orbital dots with central badge for GPS route calculation & tracking.', tag: 'GPS Navigation' },
    { id: 5, name: '5. Minimal Top Progress Bar', desc: 'Animated top accent bar with floating status pill, non-intrusive background sync.', tag: 'Background Sync' },
    { id: 6, name: '6. Glassmorphism Full Overlay', desc: 'Blurred backdrop overlay with dynamic status updates & animated audio/pulse bars.', tag: 'Portal Initialization' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontFamily: "'Muli', 'Segoe UI', sans-serif",
      padding: '30px 20px 60px'
    }}>
      {/* Header Bar */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#60a5fa' : '#2563eb', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
          <ArrowLeft size={18} /> Back to Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Title */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 30px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: isDark ? 'rgba(15, 97, 239, 0.15)' : '#eff6ff', color: '#0f61ef', fontWeight: 700, fontSize: '0.8rem', marginBottom: '12px' }}>
          <Sparkles size={14} /> BUFFERS & LOADING Showcase
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Select Your Preferred Buffering / Loading State
        </h1>
        <p style={{ fontSize: '0.98rem', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '640px', margin: '0 auto' }}>
          Choose from 6 state-of-the-art medical buffering animations tailored for MamaTrack emergency dispatches, patient data sync, and portal navigation.
        </p>
      </div>

      {/* Main Grid: Option Selector + Live Interactive Preview */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
        
        {/* Left Side: Option Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => {
                setActiveTab(opt.id);
                if (opt.id === 6) setShowOverlay(true);
              }}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: activeTab === opt.id ? (isDark ? '#1e293b' : '#ffffff') : (isDark ? 'rgba(30, 41, 59, 0.5)' : '#ffffff'),
                border: activeTab === opt.id ? '2px solid #0f61ef' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                boxShadow: activeTab === opt.id ? '0 8px 24px rgba(15, 97, 239, 0.15)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: activeTab === opt.id ? '#0f61ef' : (isDark ? '#ffffff' : '#0f172a'), marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {opt.name}
                  {activeTab === opt.id && <CheckCircle2 size={16} color="#0f61ef" />}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
                  {opt.desc}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {opt.tag}
              </span>
            </div>
          ))}
        </div>

        {/* Right Side: Live Animation Preview Box */}
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 12px 32px rgba(0,0,0,0.06)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '420px',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Live Animation Preview
          </div>

          <div style={{ width: '100%', marginTop: '20px' }}>
            {activeTab === 1 && <HeartbeatLoader />}
            {activeTab === 2 && <MedicalSpinner />}
            {activeTab === 3 && <SkeletonDashboardLoader />}
            {activeTab === 4 && <OrbitalLoader />}
            {activeTab === 5 && <TopProgressBarLoader />}
            {activeTab === 6 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '0.9rem', color: isDark ? '#cbd5e1' : '#475569', marginBottom: '16px' }}>
                  Option 6 renders as a full-screen blurred glassmorphic overlay.
                </p>
                <button
                  onClick={() => setShowOverlay(true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0f61ef, #0046c7)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 97, 239, 0.35)'
                  }}
                >
                  🚀 Launch Glassmorphism Full Overlay
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Full Overlay Modal Trigger */}
      {showOverlay && (
        <GlassmorphicOverlayLoader onClose={() => setShowOverlay(false)} />
      )}
    </div>
  );
};
