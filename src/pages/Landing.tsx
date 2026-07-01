// MamaTrack GPS — Role Selection Landing Page (Option A: Premium Editorial Split)

import React from 'react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  return (
    <div className="landing-theme" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Background drifting orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1rem 1.5rem var(--space-xl)' }}>
        
        {/* Header */}
        <header className="site-header" style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.35rem', fontWeight: 800 }}>
            <span style={{ fontSize: '1.8rem', background: 'rgba(244,63,94,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤱</span>
            <span className="logo-text" style={{ color: '#1f2937' }}>Mama<span style={{ color: '#f43f5e' }}>Track</span></span>
          </div>
          <div className="header-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px' }}>
            <span style={{ animation: 'active-emergency-pulse 1.2s infinite alternate', display: 'inline-block', width: '6px', height: '6px', background: '#f43f5e', borderRadius: '50%' }} /> Live System Tracker
          </div>
        </header>

        {/* Editorial Split Hero Grid */}
        <div className="landing-split-grid">
          
          {/* Left Column - Content & Role Selectors */}
          <div>
            {/* Slogan - large, dark charcoal, no quotes, no symbols, clean style */}
            <div className="landing-slogan">
              Bringing a life should not end another
            </div>

            <h1 className="landing-title">
              Maternal Emergency<br />
              Response, Reimagined
            </h1>
            <p className="landing-subtitle">
              A GPS-powered dispatch network connecting expectant mothers, VHT coordinators, ambulance drivers, and clinical doctors in real time.
            </p>

            {/* Statistics row */}
            <div className="milestones-row">
              <div className="milestone-stat">
                <span className="stat-number">50k+</span>
                <span className="stat-label">Mothers Registered</span>
              </div>
              <div className="milestone-stat">
                <span className="stat-number">12s</span>
                <span className="stat-label">Avg Dispatch Speed</span>
              </div>
              <div className="milestone-stat">
                <span className="stat-number">99.4%</span>
                <span className="stat-label">Successful Rescues</span>
              </div>
            </div>

            {/* Portal selections */}
            <div className="landing-roles-title">Select your portal to continue</div>
            <div className="landing-roles-grid">
              
              {/* Expectant Mother */}
              <Link to="/login?role=mother" className="landing-role-card mother">
                <div className="role-icon-wrap-mini">🤰</div>
                <div className="role-text-mini">
                  <span className="role-title-mini" style={{ color: '#fb7185' }}>Expectant Mother</span>
                  <span className="role-desc-mini">Trigger SOS & track dispatch</span>
                </div>
              </Link>

              {/* System Admin */}
              <Link to="/login?role=admin" className="landing-role-card admin">
                <div className="role-icon-wrap-mini">📡</div>
                <div className="role-text-mini">
                  <span className="role-title-mini" style={{ color: '#3b82f6' }}>System Admin</span>
                  <span className="role-desc-mini">Command Center Dispatching</span>
                </div>
              </Link>

              {/* Clinical Doctor */}
              <Link to="/login?role=doctor" className="landing-role-card doctor">
                <div className="role-icon-wrap-mini">🩺</div>
                <div className="role-text-mini">
                  <span className="role-title-mini" style={{ color: '#10b981' }}>Clinical Doctor</span>
                  <span className="role-desc-mini">Triage dashboard logs</span>
                </div>
              </Link>

              {/* Ambulance Driver */}
              <Link to="/login?role=driver" className="landing-role-card driver">
                <div className="role-icon-wrap-mini">🚑</div>
                <div className="role-text-mini">
                  <span className="role-title-mini" style={{ color: '#f59e0b' }}>Ambulance Driver</span>
                  <span className="role-desc-mini">Navigation coordinates</span>
                </div>
              </Link>

            </div>

            {/* Register helper Strip */}
            <div className="register-strip" style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.12)', borderRadius: '16px', padding: '10px 16px', gap: '12px' }}>
              <div style={{ fontSize: '1.5rem' }}>🤱</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1f2937' }}>New expectant mother?</div>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.3 }}>Register your pregnancy profile for emergency dispatch support.</p>
              </div>
              <Link to="/register" className="btn-momentra-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.75rem', textDecoration: 'none', borderRadius: '12px', textAlign: 'center' }}>Register Free</Link>
            </div>

          </div>

          {/* Right Column - Premium layered graphics */}
          <div className="landing-frame-collage">
            <img className="landing-mother-img" src="/mother.jpeg" alt="Expectant Mother Support" />

            {/* Layered dispatcher widget */}
            <div className="landing-widget widget-dispatcher">
              <span style={{ fontSize: '1.4rem' }}>🚑</span>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b' }}>Ambulance Dispatched</div>
                <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>James: En Route Goma Clinic</div>
              </div>
            </div>

            {/* Layered hospital availability widget */}
            <div className="landing-widget widget-hospital">
              <span style={{ fontSize: '1.4rem' }}>🏥</span>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}>Mukono General Hospital</div>
                <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>CEmONC active • 3 beds available</div>
              </div>
            </div>

            {/* Layered live emergency alarm flasher */}
            <div className="landing-widget widget-alert">
              <span style={{ fontSize: '1.4rem', animation: 'active-emergency-pulse 1s infinite alternate' }}>🚨</span>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f43f5e' }}>SOS Dispatch Active</div>
                <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>GPS Coordinates Verified</div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="site-footer" style={{ marginTop: 'auto', padding: '1.5rem 0', width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'center', fontSize: '0.75rem', color: '#8b96a5', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          © 2026 MamaTrack GPS • Mukono District Health Department, Uganda • Secure System Active
        </footer>

      </div>
    </div>
  );
};
