// MamaTrack GPS — Supabase Connection & Data Migration UI Modal
import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, testSupabaseConnection, SupabaseConnectionResult } from '../services/supabase';
import { DataMigrationService, FullMigrationResult, SUPABASE_SQL_SCHEMA } from '../services/dataMigrationService';
import { Database, CheckCircle, AlertTriangle, RefreshCw, Copy, Check, Server, ArrowRight, ShieldCheck, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseMigrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<FullMigrationResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result);
    } catch (err: any) {
      setConnectionStatus({
        success: false,
        message: `Connection test error: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const res = await DataMigrationService.runMigration();
      setMigrationResult(res);
    } catch (err: any) {
      setMigrationResult({
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        connectionStatus: 'Failed',
        summaries: [],
        totalRecordsTransferred: 0,
        verificationMessage: `Migration error: ${err.message}`
      });
    } finally {
      setMigrating(false);
    }
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '16px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155',
        padding: '28px'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-[#334155]', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: '#3b82f620', borderRadius: '12px', color: '#60a5fa' }}>
              <Database size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Supabase Connection & Data Migration</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Test Supabase database connection & upload local data</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}
          >✕</button>
        </div>

        {/* 1. Connection Status Card */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#38bdf8" /> Supabase Connection Status
            </h3>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              style={{
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={testing ? 'spin' : ''} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {connectionStatus && (
            <div style={{
              backgroundColor: connectionStatus.success ? '#065f4620' : '#991b1b20',
              border: `1px solid ${connectionStatus.success ? '#10b98150' : '#ef444450'}`,
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {connectionStatus.success ? <CheckCircle size={20} color="#34d399" /> : <AlertTriangle size={20} color="#f87171" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: connectionStatus.success ? '#34d399' : '#f87171', fontSize: '14px' }}>
                  {connectionStatus.success ? 'Supabase Ready / Connected' : 'Connection Pending / Required'}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                  {connectionStatus.message}
                </div>
                {connectionStatus.url && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontFamily: 'monospace' }}>
                    Target URL: {connectionStatus.url}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. SQL DDL Schema Tool */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="#a78bfa" /> Supabase Database DDL Schema
            </h3>
            <button
              onClick={copySchemaToClipboard}
              style={{
                backgroundColor: copiedSchema ? '#10b981' : '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedSchema ? <Check size={14} /> : <Copy size={14} />}
              {copiedSchema ? 'Copied SQL!' : 'Copy SQL Schema'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
            Paste this SQL script into your Supabase SQL Editor to automatically create required tables (`users`, `hospitals`, `vehicles`, `mothers`, `vitals`, `vht_visits`, `emergencies`).
          </p>
          <pre style={{
            backgroundColor: '#020617',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#38bdf8',
            maxHeight: '130px',
            overflowY: 'auto',
            border: '1px solid #1e293b',
            fontFamily: 'Consolas, Monaco, monospace'
          }}>
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>

        {/* 3. Data Transfer Action & Verification */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRight size={18} color="#f43f5e" /> Local to Supabase Data Transfer
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Upsert all local collections into Supabase tables with data loss checks.
              </p>
            </div>
            <button
              onClick={handleRunMigration}
              disabled={migrating || !isSupabaseConfigured}
              style={{
                backgroundColor: isSupabaseConfigured ? '#10b981' : '#334155',
                color: isSupabaseConfigured ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSupabaseConfigured ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ShieldCheck size={16} />
              {migrating ? 'Transferring Data...' : 'Start Data Transfer'}
            </button>
          </div>

          {migrationResult && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                backgroundColor: migrationResult.overallSuccess ? '#065f4620' : '#991b1b20',
                border: `1px solid ${migrationResult.overallSuccess ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '14px',
                fontSize: '13px',
                fontWeight: 600,
                color: migrationResult.overallSuccess ? '#34d399' : '#f87171'
              }}>
                {migrationResult.verificationMessage}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {migrationResult.summaries.map(item => (
                  <div key={item.collectionName} style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid #334155'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.collectionName}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: item.status === 'SUCCESS' ? '#34d399' : '#f87171' }}>
                      {item.transferredCount} / {item.sourceCount} Transferred
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
