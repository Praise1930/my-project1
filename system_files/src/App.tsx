// MamaTrack GPS — Main Application Entry and Router

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ToastContainer } from './components/Toast';
import './index.css';

// Helper component to scroll window to top on client-side route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Public routes — eagerly loaded (small, always needed)
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { SyncService } from './services/syncService';
import { HeartbeatLoader } from './components/LoadingStates';

// Dashboard portals — lazily loaded (heavy, role-specific)
const MotherDashboard = lazy(() => import('./pages/MotherDashboard').then(m => ({ default: m.MotherDashboard })));
const MotherConsole   = lazy(() => import('./pages/MotherConsole').then(m => ({ default: m.MotherConsole })));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const VhtDashboard    = lazy(() => import('./pages/VhtDashboard').then(m => ({ default: m.VhtDashboard })));

// Lightweight loading spinner shown while a lazy chunk loads
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0f172a',
  }}>
    <HeartbeatLoader message="Loading MamaTrack System..." subtitle="Connecting Mukono District emergency health network" />
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    SyncService.init();
  }, []);

  return (
    <ThemeProvider>
      <PWAInstallBanner />
      <ToastContainer />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Private Dashboard Portals (lazy-loaded) */}
            <Route path="/mother" element={<MotherDashboard />} />
            <Route path="/mother-console" element={<MotherConsole />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/vht" element={<VhtDashboard />} />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};


export default App;

