import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DesignSystemPreview from './pages/DesignSystemPreview';

export default function App() {
  const [role, setRole] = useState('student');
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setActiveTab('dashboard');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
              <LandingPage />
            </AppLayout>
          }
        />

        {/* Authentication Sign-in Preview */}
        <Route
          path="/login"
          element={
            <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
              <LoginPage onRoleChange={handleRoleChange} />
            </AppLayout>
          }
        />

        {/* Student Portal Preview */}
        <Route
          path="/student"
          element={
            <AppLayout
              role="student"
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <StudentDashboard activeTab={activeTab} />
            </AppLayout>
          }
        />

        {/* Lecturer Portal Preview */}
        <Route
          path="/lecturer"
          element={
            <AppLayout
              role="lecturer"
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <LecturerDashboard activeTab={activeTab} />
            </AppLayout>
          }
        />

        {/* Super Admin Console Preview */}
        <Route
          path="/admin"
          element={
            <AppLayout
              role="admin"
              onRoleChange={handleRoleChange}
              showSidebar={true}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            >
              <AdminDashboard activeTab={activeTab} />
            </AppLayout>
          }
        />

        {/* Comprehensive Design System Showcase */}
        <Route
          path="/design-system"
          element={
            <AppLayout role={role} onRoleChange={handleRoleChange} showSidebar={false}>
              <DesignSystemPreview />
            </AppLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
