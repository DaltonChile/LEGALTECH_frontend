import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Settings, 
  BarChart3,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', active: true },
    { icon: Users, label: 'Usuarios', path: '/admin/users' },
    { icon: FileText, label: 'Templates', path: '/admin/templates' },
    { icon: Package, label: 'Cápsulas', path: '/admin/capsules' },
    { icon: BarChart3, label: 'Reportes', path: '/admin/reports' },
    { icon: Settings, label: 'Configuración', path: '/admin/settings' },
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
      icon: Package,
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
    <div className="min-h-screen h-full bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'}  bg-slate-900 text-white flex flex-col transition-all duration-300 fixed h-max z-20`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-lg flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight">legaltech</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                item.active 
                  ? 'bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-lime-500/20 text-white border border-cyan-500/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${item.active ? 'text-cyan-400' : ''}`} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-4 border-t border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center gap-4">
            {/* Search */}
            <div className="relative w-max md:w-1/3 lg:w-1/4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
        <main className="p-6">
          {/* Page Header */}


          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'cyan' ? 'bg-cyan-100' :
                    stat.color === 'lime' ? 'bg-lime-100' :
                    'bg-slate-100'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'cyan' ? 'text-cyan-600' :
                      stat.color === 'lime' ? 'text-lime-600' :
                      'text-slate-600'
                    }`} />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === 'up' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
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

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Acciones Rápidas</h2>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={() => navigate('/admin/templates')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">Nuevo Template</p>
                    <p className="text-xs text-slate-500">Crear plantilla de contrato</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/admin/users')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">Gestionar Usuarios</p>
                    <p className="text-xs text-slate-500">Administrar cuentas</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/admin/capsules')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5 text-lime-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">Cápsulas</p>
                    <p className="text-xs text-slate-500">Configurar variables</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">Ver Reportes</p>
                    <p className="text-xs text-slate-500">Analíticas y métricas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}