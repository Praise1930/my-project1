// MamaTrack GPS — Toast notifications

import React, { useCallback, useEffect, useState } from 'react';
import { TOAST_EVENT, ToastItem, ToastVariant } from './toastBus';
import { AlertIcon, CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from './OverlayIcons';
import '../styles/overlays.css';

const ICONS: Record<ToastVariant, React.FC<{ size?: number }>> = {
  success: CheckIcon,
  warning: AlertIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

// Fallback headings, used when the caller does not supply one.
const TITLES: Record<ToastVariant, string> = {
  success: 'Done',
  warning: 'Check this',
  error: 'Not completed',
  info: 'Notice',
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [leaving, setLeaving] = useState<number[]>([]);

  // Play the exit animation before the item leaves the list, so a dismissed
  // toast does not simply vanish and pull the stack upward.
  const dismiss = useCallback((id: number) => {
    setLeaving((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setLeaving((prev) => prev.filter((x) => x !== id));
    }, 160);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const toast = (event as CustomEvent<ToastItem>).detail;
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => dismiss(toast.id), toast.durationMs || 5000);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="ov-toasts" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant] || InfoIcon;
        return (
          <div
            key={toast.id}
            className={`ov-toast${leaving.includes(toast.id) ? ' is-leaving' : ''}`}
            data-variant={toast.variant}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
          >
            <span className="ov-toast__icon"><Icon /></span>
            <div className="ov-toast__body">
              <p className="ov-toast__title">{toast.title || TITLES[toast.variant]}</p>
              <p className="ov-toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="ov-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <CloseIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
};
