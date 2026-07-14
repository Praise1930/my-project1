// MamaTrack GPS — SMS & USSD Gateway Simulator Console
import React, { useState, useEffect, useRef } from 'react';
import { db, SmsService, EmergencyService } from '../services/db';

export const SMSSimulator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'ussd'>('sms');
  const [smsLogs, setSmsLogs] = useState(db.smsLogs);
  
  // USSD State
  const [ussdInput, setUssdInput] = useState('');
  const [dialString, setDialString] = useState('*270#');
  const [ussdScreen, setUssdScreen] = useState('dialer'); // 'dialer', 'menu', 'edd_input', 'edd_result', 'sos_result', 'vht_result'
  const [ussdMessage, setUssdMessage] = useState('');
  const [sessionMother, setSessionMother] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

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

  // Load session mother if any
  useEffect(() => {
    const session = db.getCurrentSessionUser();
    if (session && session.role === 'mother') {
      const motherData = db.mothers.find(m => m.user_id === session.id);
      if (motherData) {
        setSessionMother({ ...session, ...motherData });
      }
    }
  }, [isOpen]);

  // Auto-scroll SMS logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [smsLogs, isOpen]);

  const handleDial = () => {
    if (dialString === '*270#') {
      setUssdScreen('menu');
    } else {
      alert('Invalid MMI code. Use *270# for MamaTrack services.');
    }
  };

  const handleUssdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = ussdInput.trim();
    setUssdInput('');

    if (ussdScreen === 'menu') {
      if (val === '1') {
        // Trigger SOS
        const mId = sessionMother ? sessionMother.user_id : 8; // fallback to seed mother
        const motherProfile = db.mothers.find(m => m.user_id === mId);
        const motherUser = db.users.find(u => u.id === mId);
        if (motherProfile && motherUser) {
          EmergencyService.triggerEmergency(
            mId,
            motherProfile.home_latitude,
            motherProfile.home_longitude,
            'USSD: SOS rescue requested via dialer menu.',
            false
          );
          setUssdMessage(`SOS beacon active! Ambulance dispatch is being processed for ${motherUser.full_name}.`);
          setUssdScreen('sos_result');
        } else {
          setUssdMessage('Failed to identify patient account.');
          setUssdScreen('sos_result');
        }
      } else if (val === '2') {
        setUssdScreen('edd_input');
      } else if (val === '3') {
        setUssdMessage('Registration: Dial *270*1# or use the registration form to create a VHT portal account.');
        setUssdScreen('vht_result');
      } else {
        alert('Invalid menu choice. Select 1, 2, or 3.');
      }
    } else if (ussdScreen === 'edd_input') {
      const mother = db.mothers.find(m => {
        const u = db.users.find(usr => usr.id === m.user_id);
        return u?.email.toLowerCase() === val.toLowerCase();
      });
      if (mother) {
        setUssdMessage(`Expected Due Date (EDD) for mother is: ${mother.expected_due_date}`);
      } else {
        setUssdMessage('No mother found with this email.');
      }
      setUssdScreen('edd_result');
    }
  };

  const handleUssdCancel = () => {
    setUssdScreen('dialer');
    setDialString('*270#');
  };

  const clearLogs = () => {
    SmsService.clearLogs();
    setSmsLogs([]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sms-simulator-float-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          border: '1px solid rgba(251, 113, 133, 0.3)',
          borderRadius: '30px',
          padding: '12px 24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'transform 0.2s ease, bottom 0.3s ease, right 0.3s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <span style={{ fontSize: '1.1rem' }}>📱</span>
        <span>SMS & USSD Console</span>
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
            bottom: '85px',
            right: '24px',
            zIndex: 99999,
            width: '420px',
            height: '560px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 15px 45px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transition: 'bottom 0.3s ease, right 0.3s ease, width 0.3s ease, height 0.3s ease',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            @media (max-width: 640px) {
              .sms-simulator-float-btn {
                bottom: 110px !important;
                right: 16px !important;
              }
              .sms-simulator-drawer {
                width: calc(100% - 32px) !important;
                height: 480px !important;
                bottom: 165px !important;
                right: 16px !important;
              }
            }
          `}</style>

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
                📡 Telephony Simulator
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Africa's Talking SMS & USSD Service</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(15,23,42,0.4)'
          }}>
            <button
              onClick={() => setActiveTab('sms')}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === 'sms' ? 'rgba(251,113,133,0.08)' : 'none',
                color: activeTab === 'sms' ? '#fb7185' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === 'sms' ? '2px solid #fb7185' : 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✉️ SMS logs ({smsLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('ussd')}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === 'ussd' ? 'rgba(251,113,133,0.08)' : 'none',
                color: activeTab === 'ussd' ? '#fb7185' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === 'ussd' ? '2px solid #fb7185' : 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📳 Dial USSD (*270#)
            </button>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {activeTab === 'sms' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* SMS Logs List */}
                <div style={{ flex: 1, minHeight: '230px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', marginBottom: '12px' }}>
                  {smsLogs.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.78rem', textAlign: 'center' }}>
                      No SMS alerts logged yet.<br />Trigger an emergency or schedule checkups to test alerts.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {smsLogs.map((log) => (
                        <div key={log.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f1f5f9' }}>
                              To: {log.to_name} ({log.to_number})
                            </span>
                            <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                            {log.message}
                          </p>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Logs are saved locally in localStorage</span>
                  {smsLogs.length > 0 && (
                    <button
                      onClick={clearLogs}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear Logs
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ussd' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {/* Simulated Nokia-style Screen */}
                <div style={{
                  width: '320px',
                  height: '240px',
                  background: '#c5e1a5',
                  color: '#1b5e20',
                  borderRadius: '10px',
                  border: '10px solid #2e7d32',
                  boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.2)',
                  fontFamily: '"Courier New", Courier, monospace',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}>
                  {ussdScreen === 'dialer' && (
                    <div style={{ textAlign: 'center', margin: 'auto' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 'bold' }}>Dial Code</p>
                      <input
                        type="text"
                        value={dialString}
                        onChange={(e) => setDialString(e.target.value)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          fontSize: '1.2rem',
                          background: 'rgba(0,0,0,0.05)',
                          border: 'none',
                          borderBottom: '2px solid #2e7d32',
                          color: '#1b5e20',
                          fontWeight: 'bold',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleDial}
                        style={{
                          marginTop: '15px',
                          background: '#2e7d32',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Dial
                      </button>
                    </div>
                  )}

                  {ussdScreen !== 'dialer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, fontSize: '0.82rem', overflowY: 'auto' }}>
                        {ussdScreen === 'menu' && (
                          <>
                            <p style={{ margin: '0 0 6px', fontWeight: 'bold', fontSize: '0.88rem' }}>MAMATRACK USSD</p>
                            <p style={{ margin: 0 }}>1. Trigger SOS Rescue</p>
                            <p style={{ margin: 0 }}>2. Check expected Due Date</p>
                            <p style={{ margin: 0 }}>3. VHT Portal Info</p>
                          </>
                        )}
                        {ussdScreen === 'edd_input' && (
                          <>
                            <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>CHECK EDD</p>
                            <p style={{ margin: 0 }}>Enter your Email:</p>
                          </>
                        )}
                        {['sos_result', 'edd_result', 'vht_result'].includes(ussdScreen) && (
                          <p style={{ margin: 0, lineHeight: 1.4 }}>{ussdMessage}</p>
                        )}
                      </div>

                      {/* Input for USSD options */}
                      {['menu', 'edd_input'].includes(ussdScreen) && (
                        <form onSubmit={handleUssdSubmit} style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(0,0,0,0.15)', paddingTop: '6px' }}>
                          <input
                            type="text"
                            value={ussdInput}
                            onChange={(e) => setUssdInput(e.target.value)}
                            placeholder="Enter response..."
                            required
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.05)',
                              border: 'none',
                              borderBottom: '1px solid #1b5e20',
                              color: '#1b5e20',
                              outline: 'none',
                              fontSize: '0.78rem',
                              fontFamily: 'inherit'
                            }}
                          />
                          <button type="submit" style={{ background: '#2e7d32', color: '#fff', border: 'none', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer' }}>
                            Send
                          </button>
                        </form>
                      )}

                      {/* Back button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          onClick={handleUssdCancel}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e53935',
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {['sos_result', 'edd_result', 'vht_result'].includes(ussdScreen) ? 'Dismiss' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
                  MMI Dialer simulating USSD protocols for basic feature availability on low-connectivity devices.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
