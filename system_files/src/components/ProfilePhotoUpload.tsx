// MamaTrack GPS — Reusable Profile Photo Upload & View Component
import React, { useRef, useState } from 'react';
import { UserService, User } from '../services/db';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';

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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
          border: '3px solid rgba(244, 63, 94, 0.4)',
          overflow: 'hidden',
          cursor: 'pointer',
          background: user.avatar ? 'transparent' : 'linear-gradient(135deg,#fb7185,#f43f5e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          position: 'relative',
          transition: 'border-color 0.2s',
          boxShadow: '0 4px 14px rgba(244, 63, 94, 0.15)',
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
          background: '#f43f5e',
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
        <span style={{ fontSize: '0.7rem', color: isDark ? '#cbd5e1' : '#64748b', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}
          onClick={() => setMenuOpen(o => !o)}>
          Manage Photo
        </span>
      )}

      {/* Dropdown Menu Popup */}
      {menuOpen && (
        <>
          {/* Click-away backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999998 }}
            onClick={() => setMenuOpen(false)}
          />
          <div 
            className="profile-upload-dropdown"
            style={{
              position: 'absolute',
              top: size + 8,
              right: 0,
              left: 'auto',
              zIndex: 999999,
              background: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: isDark ? '0 12px 35px rgba(0,0,0,0.5)' : '0 12px 35px rgba(0,0,0,0.18)',
              padding: '16px',
              width: '260px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* View Profile Image at the top of the menu itself */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: '12px',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
              gap: '8px'
            }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid rgba(244, 63, 94, 0.25)'
                  }}
                />
              ) : (
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#fb7185,#f43f5e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2rem',
                  fontWeight: 800
                }}>
                  {initials}
                </div>
              )}
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#ffffff' : '#1f2937' }}>
                Your Profile Photo
              </span>
            </div>

            {/* Change options below the profile picture */}
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
                  border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isDark ? '#cbd5e1' : '#334155',
                  fontFamily: 'inherit'
                }}
              >
                <ImageIcon size={14} /> Choose from Gallery
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
                  border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isDark ? '#cbd5e1' : '#334155',
                  fontFamily: 'inherit'
                }}
              >
                <Camera size={14} /> Take a Photo
              </button>
            </div>

            {/* Remove Profile Photo option at the very bottom */}
            {user.avatar && (
              <button
                onClick={handleRemove}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
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
                <Trash2 size={13} /> Remove Photo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
