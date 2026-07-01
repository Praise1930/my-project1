// MamaTrack GPS — Login Portal

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/db';
import { Key, Mail, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRole = searchParams.get('role') || 'mother';
  const role = ['mother', 'admin', 'doctor', 'driver'].includes(rawRole)
    ? (rawRole as 'mother' | 'admin' | 'doctor' | 'driver')
    : 'mother';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Set default credentials based on selected role to make demo testing seamless
  const getDemoCredentials = () => {
    switch (role) {
      case 'admin':
        return { email: 'admin@mukonogeneral.go.ug', password: 'password123' };
      case 'doctor':
        return { email: 'james.ssemakula@mukonogeneral.go.ug', password: 'password123' };
      case 'driver':
        return { email: 'moses.kiggundu@mukonogeneral.go.ug', password: 'password123' };
      case 'mother':
      default:
        return { email: 'fatima.nakato@gmail.com', password: 'password123' };
    }
  };

  useEffect(() => {
    const creds = getDemoCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = AuthService.login(email, password, role);
    if (res.success) {
      navigate(`/${role}`);
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleFillCredentials = () => {
    const creds = getDemoCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const roleLabels = {
    mother: { title: 'Expectant Mother Portal', icon: '🤰', color: 'var(--rose-500)' },
    admin: { title: 'Command Control Center', icon: '📡', color: 'var(--primary-500)' },
    doctor: { title: 'Clinical Care Console', icon: '🩺', color: 'var(--success-500)' },
    driver: { title: 'Ambulance Navigation Panel', icon: '🚑', color: 'var(--warning-500)' }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="card card-glass" style={{ width: '100%', maxWidth: '540px', padding: '4rem 3.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>{roleLabels[role].icon}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1f2937' }}>{roleLabels[role].title}</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginTop: '6px' }}>MamaTrack GPS — Mukono District</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger-400)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              <Mail size={16} style={{ color: 'var(--text-muted)' }} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              style={{ padding: '14px 20px', fontSize: '1.1rem', borderRadius: '10px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. fatima@gmail.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              <Key size={16} style={{ color: 'var(--text-muted)' }} /> Account Password
            </label>
            <input
              type="password"
              className="form-input"
              style={{ padding: '14px 20px', fontSize: '1.1rem', borderRadius: '10px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-block"
            style={{
              background: roleLabels[role].color,
              color: role === 'driver' ? '#000000' : '#ffffff',
              fontWeight: 700,
              boxShadow: `0 4px 15px rgba(0,0,0,0.2)`,
              padding: '14px 24px',
              fontSize: '1.15rem',
              borderRadius: '10px'
            }}
          >
            Authenticate Portal →
          </button>
        </form>

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <button
            onClick={handleFillCredentials}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <UserCheck size={14} /> Auto-fill Demo Credentials
          </button>

          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '12px' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>← Change Role</Link>
            {role === 'mother' && (
              <>
                <span>•</span>
                <Link to="/register" style={{ color: 'var(--rose-400)', fontWeight: 700, textDecoration: 'underline' }}>Create Account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
