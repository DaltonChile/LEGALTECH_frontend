import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { ContractCatalogPage } from '../pages/public/ContractCatalogPage';
import { ContractEditorPage } from '../pages/public/ContractEditorPage';
import { TrackingPage } from '../pages/public/TrackingPage';
import { HelpPage } from '../pages/public/HelpPage';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TemplatesPage } from '../pages/admin/TemplatesPage';
import { TemplateEditPage } from '../pages/admin/TemplateEditPage';
import { UsersPage } from '../pages/admin/UsersPage';

// Notary
// import { NotaryDashboard } from '../pages/notary/NotaryDashboard';
import { NotaryInboxPage } from '../pages/notary/NotaryInboxPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/seguimiento" element={<TrackingPage />} />
      <Route path="/ayuda" element={<HelpPage />} />
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
        <Route path="/admin/templates/:id/edit" element={<TemplateEditPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/settings" element={<Outlet />} />
      </Route>

      {/* Notary routes - use same AdminLayout */}
      <Route
        element={
          <ProtectedRoute requiredRole="notario">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/notary" element={<Navigate to="/notary/inbox" replace />} />
        <Route path="/notary/inbox" element={<NotaryInboxPage />} />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}