import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { ContractCatalogPage } from '../pages/public/ContractCatalogPage';
import { ContractEditorPage } from '../pages/public/ContractEditorPage';

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
      <Route path="/:slug" element={<ContractEditorPage />} />
      <Route path="/catalogo" element={<ContractCatalogPage />} />

      {/* Admin Routes with Layout */}
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/templates" element={<TemplatesPage />} />
        <Route path="/admin/users" element={<Outlet />} />
        <Route path="/admin/contracts" element={<Outlet />} />
        <Route path="/admin/settings" element={<Outlet />} />
      </Route>

      {/* Notary routes */}
      <Route
        path="/notary"
        element={
          <ProtectedRoute requiredRole="notario">
            <NotaryDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}