// MamaTrack GPS — Main Application Entry and Router

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Public routes — eagerly loaded (small, always needed)
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Dashboard portals — lazily loaded (heavy, role-specific)
const MotherDashboard = lazy(() => import('./pages/MotherDashboard').then(m => ({ default: m.MotherDashboard })));
const MotherConsole   = lazy(() => import('./pages/MotherConsole').then(m => ({ default: m.MotherConsole })));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard').then(m => ({ default: m.DriverDashboard })));

// Lightweight loading spinner shown while a lazy chunk loads
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f9fafb',
    gap: '16px',
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #f43f5e',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Loading portal…</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private Dashboard Portals (lazy-loaded) */}
            <Route path="/mother" element={<MotherDashboard />} />
            <Route path="/mother-console" element={<MotherConsole />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/driver" element={<DriverDashboard />} />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};


export default App;

