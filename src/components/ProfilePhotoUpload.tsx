// MamaTrack GPS — Reusable Profile Photo Upload & View Component

import React, { useRef, useState } from 'react';
import { UserService, User } from '../services/db';

interface ProfilePhotoUploadProps {
  user: User;
  onUpdated: (updated: User) => void;
  size?: number;       // avatar circle size in px (default 80)
  showLabel?: boolean; // show "Change Photo" text below (default true)
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  user,
  onUpdated,
  size = 80,
  showLabel = true,
}) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const processFile = (file: File) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Resize to max 400x400 to keep localStorage small
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        const updated = UserService.updateProfile(user.id, { avatar: compressed });
        onUpdated(updated);
        setLoading(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
  };

  const handleRemove = () => {
    const updated = UserService.updateProfile(user.id, { avatar: null });
    onUpdated(updated);
    setMenuOpen(false);
  };

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />

      {/* Avatar Circle — click to open menu */}
      <button
        onClick={() => setMenuOpen(o => !o)}
        title="Manage profile photo"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.4)',
          overflow: 'hidden',
          cursor: 'pointer',
          background: user.avatar ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          position: 'relative',
          transition: 'border-color 0.2s',
          boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
          flexShrink: 0,
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: size * 0.35, fontWeight: 700, color: '#fff', userSelect: 'none' }}>
            {initials}
          </span>
        )}

        {/* Camera overlay badge */}
        <span style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.32,
          height: size * 0.32,
          background: '#6366f1',
          borderRadius: '50%',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.16,
        }}>
          📷
        </span>

        {/* Loading spinner */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', color: '#fff', fontSize: 18,
          }}>
            ⏳
          </div>
        )}
      </button>

      {showLabel && (
        <span style={{ fontSize: '0.7rem', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setMenuOpen(o => !o)}>
          Manage Photo
        </span>
      )}

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Click-away backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: size + 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 14,
            boxShadow: '0 10px 35px rgba(0,0,0,0.18)',
            padding: '10px',
            minWidth: 260,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* View photo option if avatar exists */}
            {user.avatar && (
              <button
                onClick={() => { setShowViewModal(true); setMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#4f46e5',
                  justifyContent: 'center',
                  fontFamily: 'inherit'
                }}
              >
                <span>👁️</span> View Profile Picture
              </button>
            )}

            {/* Vertical flex column for Choose from Gallery and Take a Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button
                onClick={() => galleryRef.current?.click()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  background: 'none',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  fontFamily: 'inherit'
                }}
              >
                <span>🖼️</span> Choose from Gallery
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  background: 'none',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  fontFamily: 'inherit'
                }}
              >
                <span>📸</span> Take a Photo
              </button>
            </div>

            {user.avatar && (
              <button
                onClick={handleRemove}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(239,68,68,0.06)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#ef4444',
                  fontFamily: 'inherit'
                }}
              >
                <span>🗑️</span> Remove Photo
              </button>
            )}
          </div>
        </>
      )}

      {/* Full Size Profile Picture Lightbox View Modal */}
      {showViewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              position: 'relative',
              background: '#0f172a',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                {user.full_name}'s Profile Photo
              </span>
              <button
                onClick={() => setShowViewModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                style={{ maxWidth: '340px', maxHeight: '340px', borderRadius: '12px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3rem', fontWeight: 800 }}>
                {initials}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
