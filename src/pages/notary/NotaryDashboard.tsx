import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Inbox, History, FileSearch, LogOut } from 'lucide-react';

export function NotaryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Notario</h1>
                <p className="text-sm text-gray-500">Bienvenido, {user?.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Inbox className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Firmados Hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSearch className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Firmados</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">156</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/notary/inbox')}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Inbox className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bandeja de Entrada</h3>
              <p className="text-sm text-gray-500">Contratos pendientes de firma</p>
            </button>

            <button
              onClick={() => navigate('/notary/history')}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Historial</h3>
              <p className="text-sm text-gray-500">Contratos firmados</p>
            </button>

            <button
              onClick={() => navigate('/notary/search')}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSearch className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Buscar</h3>
              <p className="text-sm text-gray-500">Buscar contratos</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}