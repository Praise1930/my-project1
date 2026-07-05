// MamaTrack GPS — Reusable Profile Photo Upload Component

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
        capture="user"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />

      {/* Avatar Circle — click to open menu */}
      <button
        onClick={() => setMenuOpen(o => !o)}
        title="Change profile photo"
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
          Change Photo
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
            background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            padding: '6px 0',
            minWidth: 180,
            overflow: 'hidden',
          }}>
            <PhotoMenuItem icon="🖼️" label="Choose from Gallery" onClick={() => galleryRef.current?.click()} />
            <PhotoMenuItem icon="📸" label="Take a Photo" onClick={() => cameraRef.current?.click()} />
            {user.avatar && (
              <>
                <div style={{ height: 1, background: 'var(--border-color,#e2e8f0)', margin: '4px 0' }} />
                <PhotoMenuItem icon="🗑️" label="Remove Photo" onClick={handleRemove} danger />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface PhotoMenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}
const PhotoMenuItem: React.FC<PhotoMenuItemProps> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '10px 16px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: danger ? '#ef4444' : 'var(--text-primary, #0f172a)',
      textAlign: 'left',
      transition: 'background 0.15s',
      fontFamily: 'inherit',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.06)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    <span style={{ fontSize: '1rem' }}>{icon}</span>
    {label}
  </button>
);
