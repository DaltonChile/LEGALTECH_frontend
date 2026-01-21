import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public pages - lazy loaded
const HomePage = lazy(() => import('../pages/public/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('../pages/public/LoginPage').then(m => ({ default: m.LoginPage })));
const ContractCatalogPage = lazy(() => import('../pages/public/ContractCatalogPage').then(m => ({ default: m.ContractCatalogPage })));
const ContractEditorPage = lazy(() => import('../pages/public/ContractEditorPage').then(m => ({ default: m.ContractEditorPage })));
const TrackingPage = lazy(() => import('../pages/public/TrackingPage').then(m => ({ default: m.TrackingPage })));
const HelpPage = lazy(() => import('../pages/public/HelpPage').then(m => ({ default: m.HelpPage })));
const ResumeContractPage = lazy(() => import('../pages/public/ResumeContractPage').then(m => ({ default: m.ResumeContractPage })));
const ContractSuccessPage = lazy(() => import('../pages/public/ContractSuccessPage').then(m => ({ default: m.ContractSuccessPage })));

// Payment pages - lazy loaded
const PaymentPage = lazy(() => import('../pages/public/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('../pages/public/PaymentSuccessPage'));
const PaymentFailurePage = lazy(() => import('../pages/public/PaymentFailurePage'));
const PaymentPendingPage = lazy(() => import('../pages/public/PaymentPendingPage'));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const TemplatesPage = lazy(() => import('../pages/admin/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const TemplateEditPage = lazy(() => import('../pages/admin/TemplateEditPage').then(m => ({ default: m.TemplateEditPage })));
const UsersPage = lazy(() => import('../pages/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Notary pages - lazy loaded
const NotaryInboxPage = lazy(() => import('../pages/notary/NotaryInboxPage').then(m => ({ default: m.NotaryInboxPage })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-lg">Cargando...</div>
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/seguimiento" element={<TrackingPage />} />
        <Route path="/ayuda" element={<HelpPage />} />
        <Route path="/resume" element={<ResumeContractPage />} />
        <Route path="/retomar" element={<ResumeContractPage />} />
        <Route path="/contracts/resume" element={<ResumeContractPage />} />
        <Route path="/contracts/success" element={<ContractSuccessPage />} />
        <Route path="/catalogo" element={<ContractCatalogPage />} />
        
        {/* Payment routes */}
        <Route path="/payment/:contractId" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/payment/pending" element={<PaymentPendingPage />} />
        
        <Route path="/:slug" element={<ContractEditorPage />} />

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
        <Route path="/admin/settings" element={<SettingsPage />} />
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
    </Suspense>
  );
}