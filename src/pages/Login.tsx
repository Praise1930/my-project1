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

      <div className="card card-glass" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{roleLabels[role].icon}</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{roleLabels[role].title}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>MamaTrack GPS — Mukono District</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger-400)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. fatima@gmail.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} style={{ color: 'var(--text-muted)' }} /> Account Password
            </label>
            <input
              type="password"
              className="form-input"
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
              boxShadow: `0 4px 15px rgba(0,0,0,0.2)`
            }}
          >
            Authenticate Portal →
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleFillCredentials}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <UserCheck size={12} /> Auto-fill Demo Credentials
          </button>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '12px' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>← Change Role</Link>
            {role === 'mother' && (
              <>
                <span>•</span>
                <Link to="/register" style={{ color: 'var(--rose-400)', fontWeight: 600 }}>Create Account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
