import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';

// Public
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TemplatesPage } from '../pages/admin/TemplatesPage';

// Notary
import { NotaryDashboard } from '../pages/notary/NotaryDashboard';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/templates"
        element={
          <ProtectedRoute requiredRole="admin">
            <TemplatesPage />
          </ProtectedRoute>
        }
      />

      {/* Notary routes */}
      <Route
        path="/notary"
        element={
          <ProtectedRoute requiredRole="notario">
            <NotaryDashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirect por defecto */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}