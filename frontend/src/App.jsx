import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DataUploadPage from './pages/DataUploadPage';
import PreprocessingPage from './pages/PreprocessingPage';
import ModelTrainingPage from './pages/ModelTrainingPage';
import PredictionPage from './pages/PredictionPage';
import LoadBalancingPage from './pages/LoadBalancingPage';
import EnergyInsightsPage from './pages/EnergyInsightsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { smartGridApi } from './services/api';

// Layout wrapper for app pages with responsive Sidebar
function AppLayout({ backendOnline, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        backendOnline={backendOnline}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="flex-1 md:ml-64 min-w-0 transition-all duration-300">
        {React.cloneElement(children, {
          onOpenMobileMenu: () => setMobileOpen(true)
        })}
      </main>
    </div>
  );
}

export default function App() {
  const [backendOnline, setBackendOnline] = useState(true);

  // Poll backend health periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await smartGridApi.checkHealth();
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page (Full Width) */}
        <Route path="/" element={<LandingPage />} />

        {/* Core App Modules wrapped in AppLayout */}
        <Route
          path="/dashboard"
          element={
            <AppLayout backendOnline={backendOnline}>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <AppLayout backendOnline={backendOnline}>
              <DataUploadPage />
            </AppLayout>
          }
        />
        <Route
          path="/preprocessing"
          element={
            <AppLayout backendOnline={backendOnline}>
              <PreprocessingPage />
            </AppLayout>
          }
        />
        <Route
          path="/training"
          element={
            <AppLayout backendOnline={backendOnline}>
              <ModelTrainingPage />
            </AppLayout>
          }
        />
        <Route
          path="/predict"
          element={
            <AppLayout backendOnline={backendOnline}>
              <PredictionPage />
            </AppLayout>
          }
        />
        <Route
          path="/load-balancing"
          element={
            <AppLayout backendOnline={backendOnline}>
              <LoadBalancingPage />
            </AppLayout>
          }
        />
        <Route
          path="/insights"
          element={
            <AppLayout backendOnline={backendOnline}>
              <EnergyInsightsPage />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AppLayout backendOnline={backendOnline}>
              <HistoryPage />
            </AppLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AppLayout backendOnline={backendOnline}>
              <SettingsPage />
            </AppLayout>
          }
        />

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
