// MamaTrack GPS — Session banner
//
// A brief confirmation of who is signed in and to which portal, shown on entry
// to a dashboard and then dismissed. Deliberately quiet: it carries no action,
// so it should not compete with a live SOS alert for attention.

import React, { useEffect, useState } from 'react';
import { CloseIcon } from './OverlayIcons';
import '../styles/overlays.css';

interface WelcomeToastProps {
  userName: string;
  roleName: string;
  subtitle?: string;
  durationSeconds?: number;
}

// "Dr. Sarah Nakato" -> "SN". Titles are stripped so they do not become the
// initial, which would give every clinician the same monogram.
function initialsOf(fullName: string): string {
  const parts = fullName
    .replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Hon\.?)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const WelcomeToast: React.FC<WelcomeToastProps> = ({
  userName,
  roleName,
  subtitle,
  durationSeconds = 6,
}) => {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = window.setTimeout(() => setLeaving(true), durationSeconds * 1000);
    return () => window.clearTimeout(hide);
  }, [durationSeconds]);

  useEffect(() => {
    if (!leaving) return;
    const remove = window.setTimeout(() => setVisible(false), 300);
    return () => window.clearTimeout(remove);
  }, [leaving]);

  if (!visible) return null;

  return (
    <div className={`ov-banner${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <span className="ov-banner__initials" aria-hidden="true">{initialsOf(userName)}</span>
      <div className="ov-banner__body">
        <div className="ov-banner__name">{userName}</div>
        <div className="ov-banner__role" title={subtitle || roleName}>
          {subtitle ? `${roleName} · ${subtitle}` : roleName}
        </div>
      </div>
      <button
        type="button"
        className="ov-close"
        onClick={() => setLeaving(true)}
        aria-label="Dismiss"
      >
        <CloseIcon />
      </button>
    </div>
  );
};
