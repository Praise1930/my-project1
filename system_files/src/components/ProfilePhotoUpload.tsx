// MamaTrack GPS — Reusable Profile Photo Upload & View Component
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserService, User } from '../services/db';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, Image as ImageIcon, Trash2, Eye, Check, X } from 'lucide-react';

interface ProfilePhotoUploadProps {
  user: User;
  onUpdated: (updated: User) => void;
  size?: number;       // avatar circle size in px (default 80)
  showLabel?: boolean; // show "Manage Photo" text below (default true)
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading]   = useState(false);

  const avatarRef = useRef<HTMLButtonElement>(null);
  // Viewport coordinates for the menu, worked out from the avatar when it opens.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [menuMaxHeight, setMenuMaxHeight] = useState(340);

  const MENU_WIDTH = 260;
  const MENU_MAX_HEIGHT = 340;
  const EDGE = 12;

  /** Place the menu next to the avatar, then pull it back inside the screen. */
  /** Device inset in px, e.g. the status bar an installed PWA draws under. */
  const inset = (name: string) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    return parseFloat(raw) || 0;
  };

  const updatePosition = () => {
    const trigger = avatarRef.current?.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    if (trigger && trigger.width > 0) {
      const safeTop = inset('--safe-top') + EDGE;
      const safeBottom = inset('--safe-bottom') + EDGE;
      const safeLeft = inset('--safe-left') + EDGE;
      const safeRight = inset('--safe-right') + EDGE;

      const width = Math.min(MENU_WIDTH, vw - safeLeft - safeRight);

      // Smart positioning:
      // If the avatar is on the left half of the viewport (e.g. sidebar), align left edge of menu to left edge of avatar.
      // If it's on the right half (e.g. topbar right), align right edge of menu to right edge of avatar.
      let left = trigger.left < vw / 2 ? trigger.left : trigger.right - width;

      // On narrow mobile screens (<500px), center horizontally if alignment feels off
      if (vw < 500) {
        left = (vw - width) / 2;
      }

      left = Math.max(safeLeft, Math.min(left, vw - width - safeRight));

      const available = vh - safeTop - safeBottom;
      const height = Math.min(MENU_MAX_HEIGHT, available);

      const below = trigger.bottom + 8;
      let top = (vh - safeBottom) - below >= height ? below : trigger.top - height - 8;
      top = Math.min(Math.max(safeTop, top), vh - safeBottom - height);

      setMenuPos({ top, left });
      setMenuMaxHeight(height);
    }
  };

  const openMenu = () => {
    if (!menuOpen) {
      updatePosition();
    }
    setMenuOpen(o => !o);
  };

  React.useEffect(() => {
    if (!menuOpen) return;
    updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [menuOpen]);

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
    setShowPreviewModal(false);
  };

  const handleRemove = () => {
    const updated = UserService.updateProfile(user.id, { avatar: null });
    onUpdated(updated);
    setMenuOpen(false);
    setShowPreviewModal(false);
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
        aria-label="Choose a profile photo from your device"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take a profile photo with the camera"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
      />

      {/* Avatar Circle — click to open menu */}
      <button
        ref={avatarRef}
        onClick={openMenu}
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

        {/* Camera overlay badge using Lucide icon */}
        <span style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.34,
          height: size * 0.34,
          background: '#f43f5e',
          borderRadius: '50%',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Camera size={Math.max(10, Math.round(size * 0.18))} />
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

      {/* Dropdown menu.
          Rendered into <body> rather than in place. The headers that host this
          avatar use backdrop-filter, and a filtered ancestor becomes the
          containing block for position:fixed descendants — so a menu centred
          with top:50% was centring inside the 114px header and hanging off the
          top of the screen. Several of those ancestors also set overflow:clip,
          which would cut the menu off. A portal escapes both. */}
      {menuOpen && createPortal(
        <>
          {/* Click-away backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999998 }}
            onClick={() => setMenuOpen(false)}
          />
          <div 
            className="profile-upload-dropdown"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              right: 'auto',
              bottom: 'auto',
              transform: 'none',
              zIndex: 999999,
              background: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: isDark ? '0 12px 35px rgba(0,0,0,0.5)' : '0 12px 35px rgba(0,0,0,0.18)',
              padding: '16px',
              width: `min(${MENU_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
              maxHeight: menuMaxHeight,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* View Profile Image at the top of the menu itself */}
            <div 
              onClick={() => { setMenuOpen(false); setShowPreviewModal(true); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
                gap: '8px',
                cursor: 'pointer'
              }}
              title="Click to view full photo"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid rgba(244, 63, 94, 0.35)'
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
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#ffffff' : '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} style={{ color: '#f43f5e' }} /> View Full Photo
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

            {/* Remove Profile Photo option */}
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
        </>,
        document.body,
      )}

      {/* FULL PHOTO VIEW & DECISION MODAL */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            color: isDark ? '#f8fafc' : '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Profile Photo Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo preview container */}
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #f43f5e',
              boxShadow: '0 10px 25px rgba(244, 63, 94, 0.3)',
              marginBottom: '20px',
              background: 'linear-gradient(135deg,#fb7185,#f43f5e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '4rem', fontWeight: 800, color: '#ffffff' }}>{initials}</span>
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{user.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                {user.avatar ? 'Decide whether to keep, change, or remove your picture.' : 'No photo uploaded. Set a profile picture below.'}
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                onClick={() => galleryRef.current?.click()}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ImageIcon size={16} /> Upload / Change Photo
              </button>

              {user.avatar && (
                <button
                  onClick={handleRemove}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Trash2 size={16} /> Remove Photo
                </button>
              )}

              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  background: 'transparent',
                  color: isDark ? '#cbd5e1' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Check size={16} /> Keep Current Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
