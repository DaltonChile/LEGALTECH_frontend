import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';

// Public
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { ContractCatalogPage } from '../pages/public/ContractCatalogPage';
import { ContractEditorPage } from '../pages/public/ContractEditorPage';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TemplatesPage } from '../pages/admin/TemplatesPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { ConfigurationPage } from '../pages/admin/ConfigurationPage';
import { ContractsPage } from '../pages/admin/ContractsPage';

// Notary
import { NotaryDashboard } from '../pages/notary/NotaryDashboard';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/:slug" element={<ContractEditorPage />} />

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
        path="/admin/contratos"
        element={
          <ProtectedRoute requiredRole="admin">
            <ContractsPage />
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
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/configuracion"
        element={
          <ProtectedRoute requiredRole="admin">
            <ConfigurationPage />
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