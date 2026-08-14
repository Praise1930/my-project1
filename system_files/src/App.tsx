// MamaTrack GPS — Main Application Entry and Router

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
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

// Reference page for the loading and skeleton states, so the set can be
// reviewed side by side rather than by navigating to each screen that uses one.
const LoadingShowcase = lazy(() => import('./pages/LoadingShowcase').then(m => ({ default: m.LoadingShowcase })));

// Lightweight loading spinner shown while a lazy chunk loads
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
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
      <ConfirmDialog />
      {/* Opt in to the v7 behaviours now: state updates are wrapped in
          startTransition, and relative paths inside splat routes resolve the
          way v7 will. The only splat route here is the catch-all redirect, so
          neither changes how this app routes — it just settles the behaviour
          before the upgrade rather than during it. */}
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        {/* Inside the router so a failed screen can still be navigated away
            from, and so the boundary resets when the route changes. */}
        <ErrorBoundary>
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

            {/* Internal reference page */}
            <Route path="/loading-states" element={<LoadingShowcase />} />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
};


export default App;

