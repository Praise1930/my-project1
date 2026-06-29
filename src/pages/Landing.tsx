// MamaTrack GPS — Role Selection Landing Page

import React from 'react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  return (
    <div className="landing-page-root" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Header */}
        <header className="site-header" style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🚑</span>
            <span className="logo-text">Mama<span style={{ color: 'var(--rose-500)' }}>Track</span> GPS</span>
          </div>
          <div className="header-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ animation: 'pulse-slow 2s infinite' }}>🛰️</span> Live System
          </div>
        </header>

        {/* Hero Area */}
        <div className="hero" style={{ marginTop: '2rem' }}>
          <div className="hero-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>📍</span> Mukono District, Uganda
          </div>
          <h1 style={{ marginTop: '1rem', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1 }}>
            Maternal Emergency<br />Response, Reimagined
          </h1>
          <p style={{ marginTop: '1.2rem', fontSize: '1.1rem', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto' }}>
            A GPS-powered dispatch platform connecting expectant mothers, ambulance drivers, clinical doctors, and emergency administrators — in real time.
          </p>
        </div>

        {/* Role Selection section */}
        <p className="roles-heading" style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Select your portal to continue
        </p>

        <div className="roles-grid">
          {/* Mother Card */}
          <Link to="/login?role=mother" className="role-card mother" id="card-mother">
            <div className="role-icon-wrap">🤰</div>
            <div className="role-title">Expectant Mother</div>
            <p className="role-subtitle">Trigger emergency alerts, view ANC timelines, and track your rescue in real time</p>
            <span className="role-btn">Enter Portal →</span>
          </Link>

          {/* Admin Card */}
          <Link to="/login?role=admin" className="role-card admin" id="card-admin">
            <div className="role-icon-wrap">📡</div>
            <div className="role-title">System Admin</div>
            <p className="role-subtitle">Manage ambulance dispatching, monitor active emergencies, and coordinate regional facilities</p>
            <span className="role-btn">Command Center →</span>
          </Link>

          {/* Doctor Card */}
          <Link to="/login?role=doctor" className="role-card doctor" id="card-doctor">
            <div className="role-icon-wrap">🩺</div>
            <div className="role-title">Clinical Doctor</div>
            <p className="role-subtitle">Receive incoming emergency patient briefs, manage bed capacity, and record triage logs</p>
            <span className="role-btn">Clinical Console →</span>
          </Link>

          {/* Driver Card */}
          <Link to="/login?role=driver" className="role-card driver" id="card-driver">
            <div className="role-icon-wrap">🚑</div>
            <div className="role-title">Ambulance Driver</div>
            <p className="role-subtitle">Receive navigation requests, update trip progress coordinates, and submit pre-duty safety checklists</p>
            <span className="role-btn">Navigation Panel →</span>
          </Link>
        </div>

        {/* Key highlights panel */}
        <div className="features-row">
          <div className="feat"><div className="feat-dot rose" /> One-tap emergency trigger</div>
          <div className="feat"><div className="feat-dot blue" /> Live GPS tracking</div>
          <div className="feat"><div className="feat-dot green" /> CEmONC hospital matching</div>
          <div className="feat"><div className="feat-dot rose" /> Works offline (PWA)</div>
          <div className="feat"><div className="feat-dot blue" /> Role-based dashboards</div>
          <div className="feat"><div className="feat-dot green" /> Instant notifications</div>
        </div>

        {/* Register Strip */}
        <div className="register-strip" style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
          <div className="register-strip-icon">🤱</div>
          <div className="register-strip-text" style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>New expectant mother?</strong>
            <span style={{ fontSize: '0.78rem' }}>Create a free account and register your pregnancy profile for emergency dispatch support</span>
          </div>
          <Link to="/register" style={{ textDecoration: 'none' }}>Register Free</Link>
        </div>

        {/* Footer */}
        <footer className="site-footer" style={{ marginTop: 'auto', padding: '1.5rem 0', width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'center' }}>
          © 2026 MamaTrack GPS &nbsp;•&nbsp; Mukono District Health Department, Uganda &nbsp;•&nbsp; Secure Encryption Active
        </footer>
      </div>
    </div>
  );
};
