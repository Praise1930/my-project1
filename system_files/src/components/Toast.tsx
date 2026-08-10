// MamaTrack GPS — Non-blocking toast notifications
// Replaces window.alert() for in-workflow feedback so real-time GPS simulation
// timers and cross-dashboard polling never stall behind a modal dialog.

import React, { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let nextId = 1;

export function showToast(message: string, variant: ToastVariant = 'info', durationMs = 5000) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('mamatrack_toast', { detail: { id: nextId++, message, variant, durationMs } }));
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: '#0f5132', border: '#22c55e', icon: '✅' },
  error: { bg: '#7f1d1d', border: '#ef4444', icon: '⚠️' },
  info: { bg: '#0f172a', border: '#3b82f6', icon: 'ℹ️' },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem & { durationMs: number };
      setToasts(prev => [...prev, detail]);
      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id));
      }, detail.durationMs || 5000);
    };
    window.addEventListener('mamatrack_toast', handler);
    return () => window.removeEventListener('mamatrack_toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: '#ffffff',
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              fontSize: 14,
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              animation: 'mamatrack-toast-in 0.2s ease-out',
            }}
          >
            <span style={{ fontSize: 16 }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.7, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes mamatrack-toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
