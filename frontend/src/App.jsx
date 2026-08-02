import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SidebarLayout } from './components/SidebarLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Appointments } from './pages/Appointments';
import { AIChat } from './pages/AIChat';
import { HealthBridgeServices } from './pages/HealthBridgeServices';
import { ForeignRights } from './pages/ForeignRights';
import { HealthBridgeFullPortal } from './pages/HealthBridgeFullPortal';
import { HealthDirectory } from './pages/HealthDirectory';
import { HealthContacts } from './pages/HealthContacts';
import { MentalHealth } from './pages/MentalHealth';
import { PregnancyPediatrics } from './pages/PregnancyPediatrics';
import { UserProfile } from './pages/UserProfile';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading HealthBridge...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <SidebarLayout>{children}</SidebarLayout>;
};

const PublicWithSidebar = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <SidebarLayout>{children}</SidebarLayout>;
  }
  return children;
};

const DefaultRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
  return <Navigate to="/patient-dashboard" replace />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/foreign-rights"
              element={
                <PublicWithSidebar>
                  <ForeignRights />
                </PublicWithSidebar>
              }
            />

            <Route
              path="/health-directory"
              element={
                <PublicWithSidebar>
                  <HealthDirectory />
                </PublicWithSidebar>
              }
            />

            <Route
              path="/health-contacts"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <HealthContacts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mental-health"
              element={
                <PublicWithSidebar>
                  <MentalHealth />
                </PublicWithSidebar>
              }
            />

            <Route
              path="/pregnancy-pediatrics"
              element={
                <PublicWithSidebar>
                  <PregnancyPediatrics />
                </PublicWithSidebar>
              }
            />

            <Route
              path="/healthbridge-services"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <HealthBridgeServices />
                </ProtectedRoute>
              }
            />
            <Route path="/HealthBridge-services" element={<Navigate to="/healthbridge-services" replace />} />
            <Route path="/helsenorge-services" element={<Navigate to="/healthbridge-services" replace />} />
            <Route path="/helsenorge-full-portal" element={<Navigate to="/full-portal" replace />} />

            <Route
              path="/full-portal"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <HealthBridgeFullPortal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient', 'admin']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <AIChat />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
