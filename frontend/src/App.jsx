import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DesignSystemPreview from './pages/DesignSystemPreview';

/**
 * Root entry point handler:
 * If user is not authenticated -> redirects immediately to /login.
 * If user is already authenticated -> redirects to their verified role portal.
 */
function RootEntry() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-page" style={{ minHeight: '80vh' }}>
        <div className="spinner" aria-label="Verifying credentials..." />
      </div>
    );
  }

  if (isAuthenticated) {
    if (role === 'super_admin' || role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (role === 'lecturer') {
      return <Navigate to="/lecturer" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { role, setPreviewRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleRoleChange = (newRole) => {
    setPreviewRole(newRole);
    setActiveTab('dashboard');
  };

  return (
    <Routes>
      {/* Root Entry: Immediately redirects to login or user's verified role portal */}
      <Route path="/" element={<RootEntry />} />

      {/* Login & Registration: The first screen the user interacts with */}
      <Route
        path="/login"
        element={
          <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
            <LoginPage />
          </AppLayout>
        }
      />

      {/* Optional Platform Overview / Landing page */}
      <Route
        path="/overview"
        element={
          <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
            <LandingPage />
          </AppLayout>
        }
      />

      {/* Student Portal (Accessible by Students and Staff) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'lecturer', 'admin', 'super_admin']}>
            <AppLayout
              role={role}
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <StudentDashboard activeTab={activeTab} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Lecturer Portal (Accessible by Lecturers and Admins) */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={['lecturer', 'admin', 'super_admin']}>
            <AppLayout
              role={role}
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <LecturerDashboard activeTab={activeTab} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin & Super Admin Console */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AppLayout
              role={role}
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <AdminDashboard activeTab={activeTab} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Design System Preview */}
      <Route
        path="/design-system"
        element={
          <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
            <DesignSystemPreview />
          </AppLayout>
        }
      />

      {/* Fallback to root entry */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
