// MamaTrack GPS — Supabase Data Migration Modal
//
// Shown from AdminDashboard to allow the admin to trigger a migration
// of the in-memory local database to the connected Supabase instance.

import React, { useState } from 'react';
import { showToast } from './toastBus';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { db } from '../services/db';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MigrationStep = 'idle' | 'testing' | 'migrating' | 'done' | 'error';

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<MigrationStep>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const appendLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleTestConnection = async () => {
    setStep('testing');
    appendLog('Testing Supabase connection…');
    const result = await testSupabaseConnection();
    appendLog(result.message);
    if (result.success) {
      appendLog('✅ Connection OK. Ready to migrate.');
      setStep('idle');
    } else {
      appendLog('❌ Connection failed. Check your .env configuration.');
      setStep('error');
    }
  };

  const handleMigrate = async () => {
    if (!isSupabaseConfigured || !supabase) {
      appendLog('❌ Supabase is not configured.');
      setStep('error');
      return;
    }

    setStep('migrating');
    setProgress(0);

    try {
      const tables = [
        { name: 'users', data: db.users },
        { name: 'mothers', data: db.mothers },
        { name: 'hospitals', data: db.hospitals },
        { name: 'doctors', data: db.doctors },
        { name: 'drivers', data: db.drivers },
      ];

      for (let i = 0; i < tables.length; i++) {
        const t = tables[i];
        appendLog(`Uploading ${t.data.length} rows to "${t.name}"…`);
        if (t.data.length > 0) {
          const { error } = await supabase.from(t.name).upsert(t.data as any, { onConflict: 'id' });
          if (error) {
            appendLog(`⚠ ${t.name}: ${error.message}`);
          } else {
            appendLog(`✅ ${t.name}: ${t.data.length} rows synced.`);
          }
        } else {
          appendLog(`⏭ ${t.name}: No data to upload.`);
        }
        setProgress(Math.round(((i + 1) / tables.length) * 100));
      }

      appendLog('🎉 Migration complete.');
      setStep('done');
      showToast('Supabase migration completed successfully.', 'success');
    } catch (err) {
      appendLog(`❌ Migration error: ${err instanceof Error ? err.message : String(err)}`);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('idle');
    setLog([]);
    setProgress(0);
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '560px',
          maxHeight: '80vh',
          background: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(148,163,184,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700 }}>
            Supabase Data Migration
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {!isSupabaseConfigured && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
            </div>
          )}

          {/* Progress bar */}
          {step === 'migrating' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(148,163,184,0.15)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>{progress}% complete</p>
            </div>
          )}

          {/* Log area */}
          {log.length > 0 && (
            <pre style={{
              background: '#0f172a',
              padding: '12px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '200px',
              overflowY: 'auto',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {log.join('\n')}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleTestConnection}
            disabled={step === 'testing' || step === 'migrating' || !isSupabaseConfigured}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(148,163,184,0.08)',
              color: '#f1f5f9',
              fontSize: '13px',
              fontWeight: 500,
              cursor: step === 'testing' || step === 'migrating' || !isSupabaseConfigured ? 'not-allowed' : 'pointer',
              opacity: step === 'testing' || step === 'migrating' || !isSupabaseConfigured ? 0.5 : 1,
            }}
          >
            Test Connection
          </button>
          <button
            onClick={handleMigrate}
            disabled={step === 'testing' || step === 'migrating' || step === 'done' || !isSupabaseConfigured}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: step === 'done' ? '#10b981' : '#6366f1',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: step === 'testing' || step === 'migrating' || step === 'done' || !isSupabaseConfigured ? 'not-allowed' : 'pointer',
              opacity: step === 'testing' || step === 'migrating' || step === 'done' || !isSupabaseConfigured ? 0.5 : 1,
            }}
          >
            {step === 'done' ? '✓ Done' : step === 'migrating' ? 'Migrating…' : 'Start Migration'}
          </button>
        </div>
      </div>
    </div>
  );
};
