import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      icon: FileText, 
      label: 'Templates', 
      description: 'Gestionar plantillas de contratos y sus cápsulas',
      path: '/admin/templates',
      color: 'blue'
    },
    { 
      icon: Users, 
      label: 'Usuarios', 
      description: 'Administrar usuarios y permisos del sistema',
      path: '/admin/users',
      color: 'cyan'
    },
    { 
      icon: BarChart3, 
      label: 'Reportes', 
      description: 'Ver analíticas, métricas y estadísticas',
      path: '/admin/reports',
      color: 'lime'
    },
    { 
      icon: Settings, 
      label: 'Configuración', 
      description: 'Ajustes del sistema y preferencias',
      path: '/admin/settings',
      color: 'slate'
    },
  ];

  const stats = [
    { 
      label: 'Total Contratos', 
      value: '1,234', 
      change: '+12.5%', 
      trend: 'up',
      icon: FileText,
      color: 'blue'
    },
    { 
      label: 'Usuarios Activos', 
      value: '89', 
      change: '+4.3%', 
      trend: 'up',
      icon: Users,
      color: 'cyan'
    },
    { 
      label: 'Ingresos del Mes', 
      value: '$2.5M', 
      change: '-2.1%', 
      trend: 'down',
      icon: TrendingUp,
      color: 'lime'
    },
    { 
      label: 'Templates Activos', 
      value: '24', 
      change: '+8.0%', 
      trend: 'up',
      icon: FileText,
      color: 'slate'
    },
  ];

  const recentActivity = [
    { type: 'success', message: 'Contrato de arriendo firmado', time: 'Hace 5 min', user: 'María González' },
    { type: 'pending', message: 'Nuevo usuario registrado', time: 'Hace 12 min', user: 'Carlos Pérez' },
    { type: 'success', message: 'Pago procesado correctamente', time: 'Hace 25 min', user: 'Ana Silva' },
    { type: 'warning', message: 'Template pendiente de revisión', time: 'Hace 1 hora', user: 'Admin' },
    { type: 'success', message: 'Contrato de trabajo generado', time: 'Hace 2 horas', user: 'Pedro Muñoz' },
  ];

  return (
    <div className="min-h-screen h-full bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">legaltech</span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xl mx-8">
          
            <input
              type="text"
              placeholder="Buscar contratos, usuarios, templates..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-slate-500">Administrador</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    Mi Perfil
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    Configuración
                  </button>
                  <hr className="my-1 border-slate-200" />
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* KPIs Row - 4 columns */}
        <div className="flex flex-wrap gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex-1 min-w-[140px] max-w-[200px] bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'text-emerald-600' 
                    : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout: Menu + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Menu Items */}
          <div className="lg:col-span-1 space-y-4 p-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="w-full bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all text-left group"
              >
                <div className="flex p-6 items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    item.color === 'blue' ? 'bg-blue-100' :
                    item.color === 'cyan' ? 'bg-cyan-100' :
                    item.color === 'lime' ? 'bg-lime-100' :
                    'bg-slate-100'
                  }`}>
                    <item.icon className={`w-6 h-6 ${
                      item.color === 'blue' ? 'text-blue-600' :
                      item.color === 'cyan' ? 'text-cyan-600' :
                      item.color === 'lime' ? 'text-lime-600' :
                      'text-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      {item.label}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-cyan-500" />
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{item.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Actividad Reciente</h2>
              <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">Ver todo</button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity, index) => (
                <div key={index} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'success' ? 'bg-emerald-100' :
                    activity.type === 'warning' ? 'bg-amber-100' :
                    'bg-slate-100'
                  }`}>
                    {activity.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {activity.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                    {activity.type === 'pending' && <Clock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.user}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}