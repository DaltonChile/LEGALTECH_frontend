
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ClipboardCheck,
} from 'lucide-react';

export const Sidebar = () => {
  return (
    <div className="w-60 border-r border-slate-200 bg-white/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col hidden md:flex">
      <AccountToggle />
      <div className="flex-1 pr-4 overflow-y-auto py-4 space-y-4">
        <RouteSelect />
      </div>
      <Plan />
    </div>
  );
};

const AccountToggle = () => {
  const { user } = useAuth();
  
  return (
    <div className="border-b border-slate-200 pb-4 p-6 ">
      <button className="flex items-center gap-3 w-full p-2 hover:bg-slate-100 rounded-lg transition-colors text-left group">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
          {user?.full_name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold block truncate text-slate-900">
            {user?.full_name || 'Admin User'}
          </span>
        </div>

      </button>
    </div>
  );
};



const RouteSelect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Different routes based on role
  const adminRoutes = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Templates', path: '/admin/templates' },
    { icon: Users, label: 'Usuarios', path: '/admin/users' },

    { icon: Settings, label: 'Configuración', path: '/admin/settings' },
  ];

  const notaryRoutes = [
    { icon: ClipboardCheck, label: 'Bandeja de Entrada', path: '/notary/inbox' },
  ];

  const routes = user?.role === 'notario' ? notaryRoutes : adminRoutes;

  return (
    <div className="space-y-1">
      {routes.map((route) => {
        const isActive = location.pathname === route.path;
        return (
          <button
            key={route.path}
            onClick={() => navigate(route.path)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-cyan-50 text-cyan-700 shadow-sm border border-cyan-100' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <route.icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
            {route.label}
          </button>
        );
      })}
    </div>
  );
};

const Plan = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="border-t border-slate-200 pt-4">
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </div>
  );
};