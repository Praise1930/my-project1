// MamaTrack GPS — Floating Welcome Toast Notification

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface WelcomeToastProps {
  userName: string;
  roleName: string;
  subtitle?: string;
  icon?: string;
  durationSeconds?: number;
}

export const WelcomeToast: React.FC<WelcomeToastProps> = ({
  userName,
  roleName,
  subtitle = 'System synchronized & active in Mukono District Network',
  icon = '👋',
  durationSeconds = 7
}) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 500); // 500ms fade-out transition
    }, durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [durationSeconds]);

  if (!visible) return null;

  const formattedName = userName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Hon\.)\s+/i, '').split(' ')[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        minWidth: '300px',
        maxWidth: '380px',
        background: isDark
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
        color: isDark ? '#ffffff' : '#0f172a',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '14px',
        boxShadow: isDark
          ? '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15)'
          : '0 10px 30px rgba(0, 0, 0, 0.12), 0 0 20px rgba(15, 97, 239, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(-10px) scale(0.95)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
            Hello, {formattedName}!
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.04em' }}>
            {roleName}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.4 }}>
          {subtitle}
        </p>
      </div>

      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: '1.1rem',
          cursor: 'pointer',
          padding: '2px 4px',
          lineHeight: 1,
          alignSelf: 'flex-start'
        }}
        title="Dismiss Notification"
      >
        ✕
      </button>
    </div>
  );
};
