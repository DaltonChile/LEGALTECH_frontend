import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Public
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ContractCatalog } from './components/ContractCatalog';
import { LoginPage } from './pages/public/LoginPage';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Notary
import { NotaryDashboard } from './pages/notary/NotaryDashboard';

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ContractCatalog />
      
      <footer className="bg-slate-900 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">L</span>
              </div>
              <span className="text-white text-xl">legaltech</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 legaltech. Contratos legales al instante.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}