// LEGALTECH_frontend/src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  X, Eye, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, PieChart as PieChartIcon, Loader2,
  Calendar, Filter, RefreshCw
} from 'lucide-react';
import { 
  getDashboardStats, 
  getDashboardWeeklyActivity, 
  getDashboardMonthlyActivity,
  getDashboardRecentContracts,
  getDashboardPopularTemplates
} from '../../services/api';
import type { DateRangeParams } from '../../services/api';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

// ============================================
// Types
// ============================================
interface SalesByCategory {
  category: string;
  count: number;
  revenue: number;
}

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalContracts: number;
  contractsChange: number;
  activeUsers: number;
  totalUsers: number;
  completedContracts: number;
  signatureStats: {
    simple: number;
    fea: number;
    none: number;
  };
  contractsByStatus: {
    pending_payment: number;
    draft: number;
    waiting_signatures: number;
    waiting_notary: number;
    completed: number;
    failed: number;
  };
  // Nuevas métricas de ventas
  totalSales: number;
  totalSalesRevenue: number;
  salesByCategory: SalesByCategory[];
}

interface WeeklyData {
  day: string;
  date: string;
  contratos: number;
  ingresos: number;
}

interface MonthlyData {
  month: string;
  year: number;
  contratos: number;
  ingresos: number;
}

interface PopularTemplate {
  id: string;
  title: string;
  slug: string;
  usage_count: number;
  total_revenue: number;
}

interface Contract {
  id: string;
  tracking_code: string;
  buyer_rut: string;
  buyer_email: string;
  total_amount: number;
  status: 'draft' | 'pending_payment' | 'waiting_signatures' | 'waiting_notary' | 'completed' | 'failed';
  requires_notary: boolean;
  created_at: string;
  updated_at: string;
  templateVersion?: {
    version_number: number;
    template?: {
      title: string;
      slug: string;
    };
  };
}

// Estados reales del flujo:
// pending_payment → draft → waiting_signatures → waiting_notary → completed
const STATUS_CONFIG = {
  pending_payment: { label: 'Pend. Pago', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500', chartColor: '#f59e0b' },
  draft: { label: 'Completando', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500', chartColor: '#3b82f6' },
  waiting_signatures: { label: 'Esp. Firmas', color: 'bg-cyan-100 text-cyan-700', dotColor: 'bg-cyan-500', chartColor: '#06b6d4' },
  waiting_notary: { label: 'Esp. Notario', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500', chartColor: '#8b5cf6' },
  completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500', chartColor: '#059669' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500', chartColor: '#ef4444' }
};

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#94a3b8'];

// ============================================
// Date Range Filter Types & Constants
// ============================================
type DatePreset = 'all' | 'today' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

interface DateRangeState {
  preset: DatePreset;
  startDate: string;
  endDate: string;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'Todo el período' },
  { value: 'today', label: 'Hoy' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Último mes' },
  { value: 'thisYear', label: 'Este año' },
  { value: 'custom', label: 'Personalizado' },
];

const STORAGE_KEY = 'admin_dashboard_date_range';

const getPresetDates = (preset: DatePreset): { startDate: string; endDate: string } => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  switch (preset) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) };
    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case 'thisYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
};

const loadStoredDateRange = (): DateRangeState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Si es un preset dinámico (no 'custom' ni 'all'), recalcular fechas
      if (parsed.preset && parsed.preset !== 'custom' && parsed.preset !== 'all') {
        const dates = getPresetDates(parsed.preset);
        return { preset: parsed.preset, ...dates };
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error loading date range from localStorage', e);
  }
  return { preset: 'all', startDate: '', endDate: '' };
};

const saveDateRange = (dateRange: DateRangeState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dateRange));
  } catch (e) {
    console.warn('Error saving date range to localStorage', e);
  }
};

// ============================================
// DateRangeFilter Component
// ============================================
interface DateRangeFilterProps {
  dateRange: DateRangeState;
  onDateRangeChange: (dateRange: DateRangeState) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  dateRange, 
  onDateRangeChange, 
  onRefresh,
  isLoading 
}) => {
  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      onDateRangeChange({ preset, startDate: dateRange.startDate, endDate: dateRange.endDate });
    } else {
      const dates = getPresetDates(preset);
      onDateRangeChange({ preset, ...dates });
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onDateRangeChange({ ...dateRange, preset: 'custom', [field]: value });
  };

  const isFiltered = dateRange.preset !== 'all';
  const currentPresetLabel = DATE_PRESETS.find(p => p.value === dateRange.preset)?.label || 'Todo el período';

  // Format dates for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Filter Icon & Label */}
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isFiltered ? 'bg-cyan-100' : 'bg-slate-100'}`}>
            <Calendar className={`w-5 h-5 ${isFiltered ? 'text-cyan-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Período de datos</p>
            {isFiltered && (
              <p className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtro activo: {dateRange.preset === 'custom' 
                  ? `${formatDisplayDate(dateRange.startDate)} - ${formatDisplayDate(dateRange.endDate)}`
                  : currentPresetLabel}
              </p>
            )}
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 flex-1">
          {DATE_PRESETS.filter(p => p.value !== 'custom').map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange.preset === preset.value
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Desde"
          />
          <span className="text-slate-400">—</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Hasta"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Actualizar</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// Helper Functions
// ============================================
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// ============================================
// Main Component
// ============================================
export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Date Range Filter State
  const [dateRange, setDateRange] = useState<DateRangeState>(() => loadStoredDateRange());

  // Memoized date range params for API calls
  const dateRangeParams: DateRangeParams | undefined = useMemo(() => {
    if (dateRange.preset === 'all' || (!dateRange.startDate && !dateRange.endDate)) {
      return undefined;
    }
    return {
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined
    };
  }, [dateRange]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      const [statsRes, weeklyRes, monthlyRes, contractsRes, templatesRes] = await Promise.all([
        getDashboardStats(dateRangeParams),
        getDashboardWeeklyActivity(dateRangeParams),
        getDashboardMonthlyActivity(dateRangeParams),
        getDashboardRecentContracts(5, dateRangeParams),
        getDashboardPopularTemplates(5, dateRangeParams)
      ]);

      setStats(statsRes.data.data);
      setWeeklyData(weeklyRes.data.data);
      setMonthlyData(monthlyRes.data.data);
      setRecentContracts(contractsRes.data.data);
      setPopularTemplates(templatesRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (newDateRange: DateRangeState) => {
    setDateRange(newDateRange);
    saveDateRange(newDateRange);
  };

  useEffect(() => {
    loadDashboard();
  }, [dateRangeParams]);

  // Datos para el gráfico de estados - mostrar todos los estados
  const statusChartData = stats ? Object.entries(STATUS_CONFIG).map(([status, config]) => ({
      name: config.label,
      value: stats.contractsByStatus[status as keyof typeof stats.contractsByStatus] || 0,
      color: config.chartColor
    })) : [];

  // Formateador de fecha para el eje X del gráfico
  const formatDateLabel = (dateStr: string, showYear: boolean = false) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (showYear) {
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    }
    return `${date.getDate()} ${monthNames[date.getMonth()]}`;
  };

  // Datos para el gráfico de actividad - se adapta automáticamente al rango de fechas
  // Si el rango es menor a 45 días, muestra datos diarios; si no, muestra mensuales
  const activityData = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      // Sin filtro: mostrar últimos 6 meses
      return monthlyData.map(m => ({
        day: `${m.month} ${m.year.toString().slice(-2)}`,
        contratos: m.contratos,
        ingresos: m.ingresos
      }));
    }
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Si el rango es menor a 8 días, usar nombre de día (Lun, Mar, etc.)
    if (diffDays <= 7) {
      return weeklyData;
    }
    
    // Si el rango es menor a 45 días, usar datos diarios con fecha formateada
    if (diffDays <= 45) {
      return weeklyData.map(d => ({
        ...d,
        day: formatDateLabel(d.date)
      }));
    }
    
    // Si el rango cruza años, incluir el año
    const crossesYears = start.getFullYear() !== end.getFullYear();
    
    // Si no, usar datos mensuales
    return monthlyData.map(m => ({
      day: crossesYears ? `${m.month} ${m.year.toString().slice(-2)}` : m.month,
      contratos: m.contratos,
      ingresos: m.ingresos
    }));
  }, [weeklyData, monthlyData, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          <p className="text-slate-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Resumen de actividad y métricas</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Última actualización</p>
              <p className="text-sm font-medium text-slate-600">{new Date().toLocaleDateString('es-CL', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={loadDashboard}
            isLoading={loading}
          />

          {/* ================= KPI CARDS - VENTAS ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ventas Completadas (contratos con status completed) */}
            <StatCard 
              icon={<CheckCircle className="w-5 h-5" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              title="Ventas Completadas" 
              value={formatNumber(stats?.totalSales || 0)} 
              subtitle="contratos finalizados"
            />

            {/* Ingresos de Ventas */}
            <StatCard 
              icon={<DollarSign className="w-5 h-5" />}
              iconBg="bg-cyan-100"
              iconColor="text-cyan-600"
              title="Ingresos por Ventas" 
              value={formatCurrency(stats?.totalSalesRevenue || 0)} 
              subtitle="de contratos completados"
            />

            {/* Total Solicitudes */}
            <StatCard 
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              title="Total Solicitudes" 
              value={formatNumber(stats?.totalContracts || 0)} 
              subtitle="todos los estados"
            />

            {/* Tasa de Completación */}
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              title="Tasa de Completación" 
              value={`${stats && stats.totalContracts > 0 ? ((stats.totalSales / stats.totalContracts) * 100).toFixed(1) : 0}%`} 
              subtitle="completados / total"
            />
          </div>

          {/* ================= VENTAS POR CATEGORÍA ================= */}
          {stats?.salesByCategory && stats.salesByCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-500" />
                  Ventas por Categoría
                </h3>
                <p className="text-xs text-slate-400 mt-1">Contratos completados agrupados por categoría</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.salesByCategory.map((cat, index) => (
                  <div key={cat.category} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-slate-700 truncate">{cat.category}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{cat.count}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(cat.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= CHARTS ROW ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Chart: Actividad (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-500" />
                  Actividad
                </h3>
                <p className="text-xs text-slate-400 mt-1">Contratos e ingresos por período seleccionado</p>
              </div>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      label={{ value: 'Contratos', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      label={{ value: 'Ingresos (K)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                        padding: '12px 16px'
                      }}
                      formatter={(value, name) => [
                        name === 'ingresos' ? `$${value}K` : value,
                        name === 'ingresos' ? 'Ingresos' : 'Contratos'
                      ]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => value === 'contratos' ? 'Contratos' : 'Ingresos'}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="contratos" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorContratos)" 
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIngresos)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Estados (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-500" />
                  Estados
                </h3>
                <p className="text-xs text-slate-400 mt-1">Distribución de contratos</p>
              </div>

              {statusChartData.length > 0 ? (
                <>
                  <div className="h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' 
                          }}
                          formatter={(value) => [`${value} contratos`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-800">{stats?.totalContracts || 0}</span>
                      <span className="text-xs text-slate-500">Total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {statusChartData.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate">{item.name}</span>
                        <span className="text-slate-900 font-semibold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  Sin datos de estados
                </div>
              )}
            </div>
          </div>

          {/* ================= TABLES ROW ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Recent Contracts (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Contratos Recientes</h3>
                  <p className="text-xs text-slate-400 mt-1">Últimos movimientos registrados</p>
                </div>
                <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                  Ver todos →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contrato</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentContracts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No hay contratos recientes
                        </td>
                      </tr>
                    ) : (
                      recentContracts.map(contract => (
                        <ContractRow 
                          key={contract.id} 
                          contract={contract}
                          onView={() => setSelectedContract(contract)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Templates (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Templates Populares</h3>
                <p className="text-xs text-slate-400 mt-1">Más utilizados</p>
              </div>

              <div className="divide-y divide-slate-100">
                {popularTemplates.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
                    Sin templates disponibles
                  </div>
                ) : (
                  popularTemplates.map((template, index) => (
                    <div key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold`}
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{template.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">
                              {template.usage_count} usos
                            </span>
                            <span className="text-xs font-medium text-emerald-600">
                              {formatCurrency(template.total_revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Sub Components
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string;
  change?: number;
  subtitle: string;
  showChange?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, iconBg, iconColor, title, value, change, subtitle, showChange = false 
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {showChange && change !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-full ${
            isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
    </div>
  );
};

interface ContractRowProps {
  contract: Contract;
  onView: () => void;
}

const ContractRow: React.FC<ContractRowProps> = ({ contract, onView }) => {
  const status = STATUS_CONFIG[contract.status] || { 
    label: contract.status, 
    color: 'bg-gray-100 text-gray-600', 
    dotColor: 'bg-gray-400' 
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4">
        <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {contract.tracking_code}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
            {contract.templateVersion?.template?.title || 'Sin template'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 font-medium">
            {new Date(contract.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(contract.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-slate-900">
          ${(contract.total_amount || 0).toLocaleString()}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={onView}
          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ contract, onClose }) => {
  const status = STATUS_CONFIG[contract.status] || { 
    label: contract.status, 
    color: 'bg-gray-100 text-gray-600', 
    dotColor: 'bg-gray-400' 
  };
  const statusIcons: Record<string, typeof FileText> = {
    draft: FileText, pending_payment: Clock, completed: CheckCircle,
    waiting_notary: AlertCircle, waiting_signatures: Clock, failed: XCircle
  };
  const StatusIcon = statusIcons[contract.status] || FileText;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Detalle del Contrato</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{contract.tracking_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className={`flex items-start gap-4 p-4 rounded-xl ${status.color} bg-opacity-50`}>
            <div className={`p-2 rounded-lg ${status.dotColor.replace('bg-', 'text-')} bg-white`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{status.label}</p>
              <p className="text-xs opacity-80 mt-0.5">Estado actual del proceso</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto</p>
              <p className="text-xl font-bold text-slate-900">${(contract.total_amount || 0).toLocaleString()}</p>
            </div>
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">RUT Cliente</p>
              <p className="text-sm font-bold text-slate-900 font-mono">{contract.buyer_rut}</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Template</span>
                <span className="text-sm font-medium text-slate-900">{contract.templateVersion?.template?.title || 'N/A'}</span>
             </div>
             <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Email Cliente</span>
                <span className="text-sm font-medium text-slate-900">{contract.buyer_email}</span>
             </div>
             <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Requiere Notario</span>
                <span className="text-sm font-medium text-slate-900">{contract.requires_notary ? 'Sí' : 'No'}</span>
             </div>
             <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500">Fecha Creación</span>
                <span className="text-sm font-medium text-slate-900">
                  {new Date(contract.created_at).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
             </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cerrar
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Ver Detalles Completos
          </button>
        </div>
      </div>
    </div>
  );
};