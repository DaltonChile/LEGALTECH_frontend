import { useAuth } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ClipboardCheck,
  Scale,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Contrato Seguro</span>
        </div>
        {/* Close button only visible on mobile context (handled by parent logic typically, but added here for safety) */}
        <button onClick={onClose} className="md:hidden p-1 hover:bg-slate-100 rounded-md">
           <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
         <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
         <RouteSelect onClose={onClose} />
      </div>

      <AccountToggle />
      <Plan />
    </div>
  );
};

const AccountToggle = () => {
  const { user } = useAuth();
  
  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer group">
        <div className="w-9 h-9 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-700">
          {user?.full_name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1 min-w-0">
           <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || 'Admin User'}</p>
           <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'Administrador'}</p>
        </div>
      </div>
    </div>
  );
};

const RouteSelect = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminRoutes = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Plantillas', path: '/admin/templates' },
    { icon: Users, label: 'Usuarios', path: '/admin/users' },
    { icon: Settings, label: 'Configuración', path: '/admin/settings' },
  ];

  const notaryRoutes = [
    { icon: ClipboardCheck, label: 'Bandeja de Entrada', path: '/notary/inbox' },
  ];

  const routes = user?.role === 'notario' ? notaryRoutes : adminRoutes;

  return (
    <>
      {routes.map((route) => {
        const isActive = location.pathname === route.path;
        return (
          <button
            key={route.path}
            onClick={() => {
              navigate(route.path);
              onClose?.();
            }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <route.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            {route.label}
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
          </button>
        );
      })}
    </>
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
    <div className="p-4 border-t border-slate-100">
      <button 
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
};