import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Activity, ShieldAlert, Heart, Radio, RefreshCw, Zap } from 'lucide-react';

interface LoadingProps {
  message?: string;
  subtitle?: string;
}

// ============================================================================
// OPTION 1: PULSE HEARTBEAT EMERGENCY RADAR
// ============================================================================
export const HeartbeatLoader: React.FC<LoadingProps> = ({
  message = "Syncing Emergency GPS Network...",
  subtitle = "Connecting Mukono District Dispatch Server"
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <style>{`
        @keyframes heartbeatPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 24px rgba(244, 63, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Radar Outer Ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px dashed rgba(244, 63, 94, 0.4)',
          animation: 'radarSweep 6s linear infinite'
        }} />
        
        {/* Heartbeat Pulse Core */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          animation: 'heartbeatPulse 1.8s ease-in-out infinite',
          boxShadow: '0 8px 24px rgba(244, 63, 94, 0.4)'
        }}>
          <Heart size={30} fill="#ffffff" />
        </div>
      </div>

      <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
        {message}
      </h4>
      <p style={{ margin: 0, fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
        {subtitle}
      </p>
    </div>
  );
};

// ============================================================================
// OPTION 2: ROTATING GRADIENT MEDICAL SPINNER
// ============================================================================
export const MedicalSpinner: React.FC<LoadingProps> = ({
  message = "Loading Portal Data...",
  subtitle = "Retrieving latest patient records & bed metrics"
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <style>{`
        @keyframes gradientSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ position: 'relative', width: '70px', height: '70px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          padding: '4px',
          background: 'conic-gradient(from 0deg, #0f61ef, #10b981, #f59e0b, #0f61ef)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #fff 0)',
          animation: 'gradientSpin 1.2s linear infinite'
        }} />
        <div style={{ color: isDark ? '#60a5fa' : '#0f61ef' }}>
          <Activity size={26} />
        </div>
      </div>

      <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
        {message}
      </h4>
      <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
        {subtitle}
      </p>
    </div>
  );
};

// ============================================================================
// OPTION 3: SKELETON WIREFRAME SHIMMER
// ============================================================================
export const SkeletonDashboardLoader: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const skeletonBg = isDark ? '#1e293b' : '#e2e8f0';
  const shimmerColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <style>{`
        @keyframes shimmerEffect {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-item {
          position: relative;
          overflow: hidden;
          background: ${skeletonBg};
          border-radius: 8px;
        }
        .skeleton-item::after {
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            ${shimmerColor} 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmerEffect 1.6s infinite;
          content: '';
        }
      `}</style>

      {/* Top Banner Skeleton */}
      <div className="skeleton-item" style={{ height: '60px', width: '100%', marginBottom: '20px' }} />

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="skeleton-item" style={{ height: '100px', borderRadius: '12px' }} />
        ))}
      </div>

      {/* Main Content & Table Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="skeleton-item" style={{ height: '240px', borderRadius: '12px' }} />
        <div className="skeleton-item" style={{ height: '240px', borderRadius: '12px' }} />
      </div>
    </div>
  );
};

// ============================================================================
// OPTION 4: ORBITAL SATELLITE DISPATCH LOADER
// ============================================================================
export const OrbitalLoader: React.FC<LoadingProps> = ({
  message = "Acquiring GPS Satellite Signal...",
  subtitle = "Calculating fastest ambulance response route"
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <style>{`
        @keyframes orbitSpin1 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitSpin2 {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Orbit */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.5px solid rgba(14, 165, 233, 0.25)',
          animation: 'orbitSpin1 3s linear infinite'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0ea5e9', position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 8px #0ea5e9' }} />
        </div>

        {/* Inner Orbit */}
        <div style={{
          position: 'absolute',
          inset: '12px',
          borderRadius: '50%',
          border: '1.5px solid rgba(245, 158, 11, 0.25)',
          animation: 'orbitSpin2 2s linear infinite'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 8px #f59e0b' }} />
        </div>

        {/* Center Icon */}
        <div style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
          <Radio size={24} />
        </div>
      </div>

      <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
        {message}
      </h4>
      <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
        {subtitle}
      </p>
    </div>
  );
};

// ============================================================================
// OPTION 5: TOP PROGRESS BAR + STATUS BADGE
// ============================================================================
export const TopProgressBarLoader: React.FC<LoadingProps> = ({
  message = "Updating VHT Field Signals..."
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <style>{`
        @keyframes topProgressMove {
          0% { left: -30%; width: 30%; }
          50% { left: 30%; width: 50%; }
          100% { left: 100%; width: 30%; }
        }
      `}</style>
      
      {/* Top Animated Bar */}
      <div style={{ position: 'relative', width: '100%', height: '4px', background: isDark ? '#334155' : '#e2e8f0', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          background: 'linear-gradient(90deg, #0f61ef, #10b981)',
          borderRadius: '4px',
          animation: 'topProgressMove 1.5s ease-in-out infinite',
          boxShadow: '0 0 10px #0f61ef'
        }} />
      </div>

      {/* Floating Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: isDark ? '#1e293b' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: isDark ? '#cbd5e1' : '#334155'
        }}>
          <RefreshCw size={13} className="spin-icon" style={{ animation: 'gradientSpin 1s linear infinite' }} />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// OPTION 6: GLASSMORPHISM FULL OVERLAY LOADER
// ============================================================================
export const GlassmorphicOverlayLoader: React.FC<LoadingProps & { onClose?: () => void }> = ({
  message = "Establishing Mukono Emergency Node...",
  subtitle = "Verifying ambulance availability and hospital triage status",
  onClose
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '36px 28px',
        background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: isDark ? '#cbd5e1' : '#64748b' }}
          >
            ×
          </button>
        )}

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f61ef, #0046c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 8px 24px rgba(15, 97, 239, 0.4)',
            position: 'relative'
          }}>
            <Zap size={32} />
          </div>
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
          {message}
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
          {subtitle}
        </p>

        {/* Dynamic Animated Pulse Bars */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {[0, 0.2, 0.4, 0.6].map((delay, idx) => (
            <div key={idx} style={{
              width: '8px', height: '24px', borderRadius: '4px',
              background: '#0f61ef',
              animation: `pulseBar 1s ease-in-out ${delay}s infinite alternate`
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulseBar {
            0% { transform: scaleY(0.4); opacity: 0.4; }
            100% { transform: scaleY(1.3); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};
