// MamaTrack GPS — SMS Gateway Simulator Console

import React, { useState, useEffect, useRef } from 'react';
import { db, SmsService } from '../services/db';

export const SMSSimulator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [smsLogs, setSmsLogs] = useState(db.smsLogs);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 640);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Dragging state along the side (vertical)
  const [yPos, setYPos] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);
  const hasDragged = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const diffY = clientY - startY.current;
      
      if (Math.abs(diffY) > 5) {
        hasDragged.current = true;
      }
      
      let newTop = startTop.current + diffY;
      // Clamp bounds: stay within top 10px and bottom 60px
      newTop = Math.max(10, Math.min(window.innerHeight - 60, newTop));
      setYPos(newTop);
    };

    const handleEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setTimeout(() => {
          hasDragged.current = false;
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDragging.current = true;
    hasDragged.current = false;
    startY.current = clientY;
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startTop.current = rect.top;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
  };

  // Poll for SMS logs to ensure real-time reactive display
  useEffect(() => {
    const timer = setInterval(() => {
      const currentLogs = db.smsLogs;
      if (currentLogs.length !== smsLogs.length) {
        setSmsLogs(currentLogs);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [smsLogs]);

  // Auto-scroll SMS logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [smsLogs, isOpen]);

  const clearLogs = () => {
    SmsService.clearLogs();
    setSmsLogs([]);
  };

  const renderSmsLogs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* SMS Logs List */}
      <div style={{
        flex: 1,
        minHeight: '260px',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '14px',
        marginBottom: '12px'
      }}>
        {smsLogs.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem', textAlign: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>💬</span>
            <span>No SMS alerts logged yet.<br />Trigger an emergency or schedule checkups to test alerts.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {smsLogs.map((log) => (
              <div key={log.id} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f1f5f9' }}>
                    To: {log.to_name} ({log.to_number})
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {log.message}
                </p>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Logs saved locally in localStorage</span>
        {smsLogs.length > 0 && (
          <button
            onClick={clearLogs}
            style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear Logs
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (max-width: 640px) {
          .sms-simulator-float-btn {
            top: ${yPos === null ? '90px' : `${yPos}px`} !important;
            bottom: auto !important;
            right: 16px !important;
          }
          .sms-simulator-drawer {
            width: calc(100% - 32px) !important;
            height: ${isMaximized ? 'calc(100vh - 120px)' : '460px'} !important;
            top: ${yPos === null ? '120px' : `${yPos > window.innerHeight / 2 ? yPos - 470 : yPos + 50}px`} !important;
            bottom: auto !important;
            right: 16px !important;
          }
        }
      `}</style>

      {/* Floating Toggle Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="sms-simulator-float-btn"
        style={{
          position: 'fixed',
          bottom: yPos === null ? '24px' : 'auto',
          top: yPos === null ? undefined : `${yPos}px`,
          right: '24px',
          zIndex: 99999,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          border: '1px solid rgba(251, 113, 133, 0.4)',
          borderRadius: '30px',
          padding: '12px 22px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          fontFamily: 'inherit',
          transition: isDragging.current ? 'transform 0.2s ease' : 'transform 0.2s ease, bottom 0.3s ease, top 0.3s ease, right 0.3s ease',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <span style={{ fontSize: '1.1rem' }}>✉️</span>
        <span>SMS Console</span>
        {smsLogs.length > 0 && (
          <span style={{
            background: '#e11d48',
            color: '#fff',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800
          }}>
            {smsLogs.length}
          </span>
        )}
      </button>

      {/* Simulator Drawer Panel */}
      {isOpen && (
        <div 
          className="sms-simulator-drawer"
          style={{
            position: 'fixed',
            bottom: yPos === null ? '85px' : 'auto',
            top: yPos === null ? undefined : `${yPos > window.innerHeight / 2 ? (isMaximized && isDesktop ? yPos - 600 : yPos - 520) : yPos + 50}px`,
            right: '24px',
            zIndex: 99999,
            width: isMaximized && isDesktop ? '680px' : '420px',
            height: isMaximized && isDesktop ? '560px' : '480px',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 15px 45px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transition: isDragging.current ? 'width 0.3s ease, height 0.3s ease' : 'bottom 0.3s ease, right 0.3s ease, width 0.3s ease, height 0.3s ease, top 0.3s ease',
          }}
        >

          {/* Header */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✉️ SMS Gateway Console
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Africa's Talking SMS Telephony Service</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore size" : "Maximize view"}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {isMaximized ? '🗗' : '🗖'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {renderSmsLogs()}
          </div>
        </div>
      )}
    </>
  );
};
