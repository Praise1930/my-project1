// MamaTrack GPS — PWA Install Banner Component

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const win = window as unknown as { deferredPWAInstallPrompt?: Event };
    if (win.deferredPWAInstallPrompt) {
      handler(win.deferredPWAInstallPrompt);
    }

    // Fallback: show iOS Safari guide after 3s if no prompt fires and on iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (isIos && isSafari && !sessionStorage.getItem('pwa-banner-dismissed')) {
        setVisible(true);
      }
    }, 3000);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setTimeout(() => setVisible(false), 3000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    } else {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    if (!sessionStorage.getItem('pwa-banner-dismissed')) {
      sessionStorage.setItem('pwa-banner-dismissed', '1');
    }
    setVisible(false);
  };

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isIosGuide = isIos && !deferredPrompt;

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install MamaTrack app"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '0 16px 20px',
        animation: 'pwa-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`
        @keyframes pwa-slide-up {
          from { transform: translateY(120%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 20,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        boxShadow: isDark
          ? '0 -4px 30px rgba(0,0,0,0.4), 0 20px 60px rgba(99,102,241,0.2)'
          : '0 10px 30px rgba(15, 23, 42, 0.12), 0 20px 60px rgba(99,102,241,0.15)',
        border: isDark
          ? '1px solid rgba(99,102,241,0.35)'
          : '1px solid rgba(99,102,241,0.25)',
        backdropFilter: 'blur(16px)',
        maxWidth: 500,
        margin: '0 auto',
        transition: 'all 0.3s ease',
      }}>
        {/* App Icon */}
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
        }}>
          🚑
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {installed ? (
            <>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#34d399' : '#059669' }}>
                ✅ MamaTrack Installed!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                Open from your home screen anytime.
              </p>
            </>
          ) : isIosGuide ? (
            <>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                Add MamaTrack to Home Screen
              </p>
              <p style={{ margin: '4px 0 8px', fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                Tap <strong style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>Share ↑</strong> then{' '}
                <strong style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>Add to Home Screen</strong> for the best experience.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                Install MamaTrack GPS
              </p>
              <p style={{ margin: '3px 0 10px', fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                Add to your home screen for instant access — works offline too.
              </p>
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  fontFamily: 'inherit',
                  transition: 'opacity 0.2s',
                  opacity: installing ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                {installing ? 'Installing…' : '⬇ Install App'}
              </button>
            </>
          )}
        </div>

        {/* Close */}
        {!installed && (
          <button
            onClick={handleDismiss}
            title="Dismiss"
            aria-label="Dismiss install banner"
            style={{
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.85rem',
              flexShrink: 0,
              fontFamily: 'inherit',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
