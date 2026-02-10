// LEGALTECH_frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  FileText, Clock, CheckCircle, XCircle, AlertCircle,
  X, Eye, TrendingUp, TrendingDown, DollarSign,
  BarChart3, PieChart as PieChartIcon, Loader2, Receipt, Calculator, Calendar
} from 'lucide-react';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';
import { Button } from '../../components/ui/primitives/Button';
import { Badge } from '../../components/ui/primitives/Badge';
import { Link } from 'react-router-dom';
import {
  getDashboardStats,
  getDashboardWeeklyActivity,
  getDashboardMonthlyActivity,
  getDashboardRecentContracts,
  getDashboardPopularTemplates
} from '../../services/api';
import { useAdminDateRange, DATE_PRESETS, getPresetDates, type DatePreset } from '../../context/AdminDateContext';
import { StatusBadge } from '../../components/ui/composed/StatusBadge';
import { PaymentStatusBadge } from '../../components/ui/composed/PaymentStatusBadge';
import { DTEStatusBadge } from '../../components/ui/composed/DTEStatusBadge';
import type { PaymentInfo } from '../../types/history';
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
interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  netRevenue: number;
  totalIVA: number;
  totalSignatureCosts: number;
  totalProcessorFees: number;
  totalCosts: number;
  profit: number;
  totalContracts: number;
  completedContracts: number;
  contractsByStatus: {
    pending_payment: number;
    draft: number;
    waiting_signatures: number;
    waiting_notary: number;
    completed: number;
    failed: number;
  };
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
  payments?: PaymentInfo[];
}

// Estados reales del flujo:
// pending_payment → draft → waiting_signatures → waiting_notary → completed
const STATUS_CONFIG = {
  pending_payment: { label: 'Pend. Pago', color: 'bg-amber-50 text-amber-700', dotColor: 'bg-amber-600', chartColor: '#d97706' },
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700', dotColor: 'bg-slate-600', chartColor: '#475569' },
  waiting_signatures: { label: 'Esp. Firmas', color: 'bg-blue-50 text-blue-700', dotColor: 'bg-blue-600', chartColor: '#2563eb' },
  waiting_notary: { label: 'Esp. Notario', color: 'bg-navy-100 text-navy-700', dotColor: 'bg-navy-600', chartColor: '#486581' },
  completed: { label: 'Completado', color: 'bg-legal-emerald-50 text-legal-emerald-700', dotColor: 'bg-legal-emerald-600', chartColor: '#047857' },
  failed: { label: 'Fallido', color: 'bg-red-50 text-red-700', dotColor: 'bg-red-600', chartColor: '#dc2626' }
};

const CHART_COLORS = ['#047857', '#486581', '#2563eb', '#d97706', '#dc2626', '#475569', '#64748b'];

// ============================================
// DateRangeFilter Component (Dashboard Version)
// ============================================
function DateRangeFilter() {
  const { dateRange, setDateRange, isFiltered } = useAdminDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDateRange({ preset, startDate: dateRange.startDate, endDate: dateRange.endDate });
    } else {
      const dates = getPresetDates(preset);
      setDateRange({ preset, ...dates });
    }
    if (preset !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange({ ...dateRange, preset: 'custom', [field]: value });
  };

  const currentPresetLabel = DATE_PRESETS.find(p => p.value === dateRange.preset)?.label || 'Todo el período';

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  const getDisplayLabel = () => {
    if (dateRange.preset === 'custom' && dateRange.startDate && dateRange.endDate) {
      return `${formatDisplayDate(dateRange.startDate)} — ${formatDisplayDate(dateRange.endDate)}`;
    }
    return currentPresetLabel;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium font-sans ${isFiltered
          ? 'bg-legal-emerald-50 border-legal-emerald-200 text-legal-emerald-700 hover:bg-legal-emerald-100'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
      >
        <Calendar className="w-4 h-4" />
        <span>{getDisplayLabel()}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Período de datos</span>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DATE_PRESETS.filter(p => p.value !== 'custom').map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`px-3 py-2 text-xs font-medium font-sans rounded-lg transition-all ${dateRange.preset === preset.value
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 block mb-2">Rango personalizado</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs font-sans border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-slate-50"
              />
              <span className="text-slate-300">—</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs font-sans border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-slate-50"
              />
            </div>
          </div>

          {/* Clear Filter */}
          {isFiltered && (
            <button
              onClick={() => handlePresetChange('all')}
              className="mt-3 w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpiar filtro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================
const formatCurrency = (value: number): string => {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
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

  // Get date range from shared context (filter is in dashboard)
  const { dateRange, dateRangeParams } = useAdminDateRange();

  // Reload dashboard when date range changes
  useEffect(() => {
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

    loadDashboard();
  }, [JSON.stringify(dateRangeParams)]);

  // IVA and cost data from backend
  const financialData = useMemo(() => ({
    grossRevenue: stats?.totalRevenue || 0,
    netRevenue: stats?.netRevenue || 0,
    ivaAmount: stats?.totalIVA || 0,
    totalCosts: stats?.totalCosts || 0,
    profit: stats?.profit || 0,
    signatureCosts: stats?.totalSignatureCosts || 0,
    processorFees: stats?.totalProcessorFees || 0
  }), [stats]);

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
          <Loader2 className="w-10 h-10 text-navy-900 animate-spin" />
          <Text variant="body-sm" color="muted">Cargando dashboard...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <Text variant="h2">Dashboard Administrativo</Text>
              <Text variant="body-sm" color="muted" className="mt-1">Resumen de actividad y métricas</Text>
            </div>
            <div className="flex items-center gap-4">
              <DateRangeFilter />
              <div className="text-right hidden sm:block">
                <Text variant="caption" color="muted" className="block">Última actualización</Text>
                <Text variant="body-sm" weight="medium" color="secondary" className="mt-0.5">
                  {new Date().toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </div>
            </div>
          </div>

          {/* ================= FINANCIAL OVERVIEW ================= */}
          {/* Row 1: Revenue, IVA, Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ingresos Brutos */}
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-700"
              title="Ingresos Brutos"
              value={formatCurrency(financialData.grossRevenue)}
              subtitle="Total con IVA"
              change={stats?.revenueChange}
            />

            {/* Ingresos Netos */}
            <StatCard
              icon={<Receipt className="w-5 h-5" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
              title="Ingresos Netos"
              value={formatCurrency(financialData.netRevenue)}
              subtitle="Sin IVA"
            />

            {/* IVA Recaudado */}
            <StatCard
              icon={<Calculator className="w-5 h-5" />}
              iconBg="bg-amber-100"
              iconColor="text-amber-700"
              title="IVA Recaudado"
              value={formatCurrency(financialData.ivaAmount)}
              subtitle="19% del neto"
            />

            {/* Total Solicitudes */}
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-slate-100"
              iconColor="text-slate-700"
              title="Total Solicitudes"
              value={formatNumber(stats?.totalContracts || 0)}
              subtitle={`${stats?.completedContracts || 0} completados`}
            />
          </div>

          {/* Row 2: Costs and Profit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Costos Totales */}
            <StatCard
              icon={<TrendingDown className="w-5 h-5" />}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              title="Costos Totales"
              value={formatCurrency(financialData.totalCosts)}
              subtitle={`Firmas: ${formatCurrency(financialData.signatureCosts)} | Comisiones: ${formatCurrency(financialData.processorFees)}`}
            />

            {/* Utilidad Neta */}
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg={financialData.profit >= 0 ? "bg-legal-emerald-100" : "bg-red-100"}
              iconColor={financialData.profit >= 0 ? "text-legal-emerald-700" : "text-red-600"}
              title="Utilidad Neta"
              value={formatCurrency(financialData.profit)}
              subtitle="Neto - Costos"
            />

            {/* Margen de Utilidad */}
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-700"
              title="Margen de Utilidad"
              value={financialData.netRevenue > 0
                ? `${((financialData.profit / financialData.netRevenue) * 100).toFixed(1)}%`
                : '0%'}
              subtitle="Utilidad / Ingresos Netos"
            />
          </div>

          {/* ================= CHARTS ROW ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Chart: Actividad (8 cols) */}
            <Box variant="document" padding="md" className="lg:col-span-8">
              <div className="mb-6">
                <Text variant="h4" className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-navy-700" />
                  Actividad
                </Text>
                <Text variant="caption" color="muted" className="mt-1">Contratos e ingresos por período seleccionado</Text>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#486581" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#486581" stopOpacity={0} />
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
                      stroke="#047857"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorContratos)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#486581"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIngresos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Box>

            {/* Chart: Estados (4 cols) */}
            <Box variant="document" padding="md" className="lg:col-span-4">
              <div className="mb-4">
                <Text variant="h4" className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-navy-700" />
                  Estados
                </Text>
                <Text variant="caption" color="muted" className="mt-1">Distribución de contratos</Text>
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
                          innerRadius={0}
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
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {statusChartData.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <Text variant="caption" color="secondary" className="truncate flex-1">{item.name}</Text>
                        <Text variant="body-sm" weight="semibold" color="primary">{item.value}</Text>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <Text variant="body-sm" color="muted">Sin datos de estados</Text>
                </div>
              )}
            </Box>
          </div>

          {/* ================= TABLES ROW ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Recent Contracts (8 cols) */}
            <Box variant="document" padding="none" className="lg:col-span-8 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                <div>
                  <Text variant="h4">Historial Reciente</Text>
                  <Text variant="caption" color="muted" className="mt-1">Últimos movimientos registrados</Text>
                </div>
                <Link to="/admin/history">
                  <Button variant="ghost" size="sm" rightIcon={<span>→</span>}>
                    Ver todos
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">CÓDIGO</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">CONTRATO</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">CLIENTE</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">ESTADO</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">MONTO</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">PAGO</Text>
                      </th>
                      <th className="text-left px-6 py-4">
                        <Text variant="caption" color="muted">DOC</Text>
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentContracts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Text variant="body-sm" color="muted">No hay contratos recientes</Text>
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
            </Box>

            {/* Popular Templates (4 cols) */}
            <Box variant="document" padding="none" className="lg:col-span-4 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200">
                <Text variant="h4">Templates Populares</Text>
                <Text variant="caption" color="muted" className="mt-1">Más utilizados</Text>
              </div>

              <div className="divide-y divide-slate-200">
                {popularTemplates.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Text variant="body-sm" color="muted">Sin templates disponibles</Text>
                  </div>
                ) : (
                  popularTemplates.map((template, index) => (
                    <div key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-sans text-sm font-bold`}
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text variant="body-sm" weight="medium" color="primary" className="truncate block">{template.title}</Text>
                          <div className="flex items-center gap-3 mt-1">
                            <Text variant="caption" color="muted">
                              {template.usage_count} usos
                            </Text>
                            <Text variant="caption" weight="medium" className="text-legal-emerald-700">
                              {formatCurrency(template.total_revenue)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Box>
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
    <Box variant="document" padding="md" className="hover:shadow-document-hover transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {showChange && change !== undefined && (
          <Badge
            variant={isPositive ? 'success' : 'error'}
            size="sm"
            dot={false}
            className="gap-1"
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </Badge>
        )}
      </div>
      <Text variant="caption" color="muted" className="block mb-1">{title}</Text>
      <Text variant="h3" className="text-3xl font-sans tracking-tight">{value}</Text>
      <Text variant="body-sm" color="muted" className="mt-2">{subtitle}</Text>
    </Box>
  );
};

interface ContractRowProps {
  contract: Contract;
  onView: () => void;
}

const ContractRow: React.FC<ContractRowProps> = ({ contract, onView }) => {
  const payment = contract.payments?.[0];
  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4">
        <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {contract.tracking_code}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700">
            <FileText className="w-4 h-4" />
          </div>
          <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[180px]">
            {contract.templateVersion?.template?.title || 'Sin template'}
          </Text>
        </div>
      </td>
      <td className="px-6 py-4">
        <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[140px]" title={contract.buyer_email}>
          {contract.buyer_email}
        </Text>
        <Text variant="caption" color="muted">{contract.buyer_rut}</Text>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={contract.status as any} size="sm" />
      </td>
      <td className="px-6 py-4">
        <Text variant="body-sm" weight="bold" color="primary">
          ${(contract.total_amount || 0).toLocaleString()}
        </Text>
      </td>
      <td className="px-6 py-4">
        <PaymentStatusBadge status={payment?.status} />
      </td>
      <td className="px-6 py-4">
        {payment?.billing_type ? (
          <Text variant="caption" weight="medium" color="secondary" className="capitalize">
            {payment.billing_type}
          </Text>
        ) : (
          <Text variant="caption" color="muted">—</Text>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={onView}
          className="p-2 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
  const payment = contract.payments?.[0];
  const status = STATUS_CONFIG[contract.status] || {
    label: contract.status,
    color: 'bg-slate-100 text-slate-700',
    dotColor: 'bg-slate-400'
  };
  const statusIcons: Record<string, typeof FileText> = {
    draft: FileText, pending_payment: Clock, completed: CheckCircle,
    waiting_notary: AlertCircle, waiting_signatures: Clock, failed: XCircle
  };
  const StatusIcon = statusIcons[contract.status] || FileText;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Box variant="elevated" padding="none" className="max-w-lg w-full overflow-hidden shadow-document-hover max-h-[90vh] overflow-y-auto">
        {/* Navy top accent stripe */}
        <div className="border-t-4 border-navy-900"></div>

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <Text variant="h4">Detalle del Registro</Text>
            <Text variant="caption" color="muted" className="font-mono mt-0.5">{contract.tracking_code}</Text>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status row */}
          <div className="flex items-center gap-4">
            <div className={`flex items-start gap-4 p-4 rounded-lg border flex-1 ${status.color} border-current border-opacity-20`}>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <StatusIcon className="w-5 h-5" />
              </div>
              <div>
                <Text variant="body-sm" weight="bold">{status.label}</Text>
                <Text variant="caption" color="muted" className="mt-0.5">Estado solicitud</Text>
              </div>
            </div>
            {payment && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Text variant="caption" color="muted" className="block mb-1">PAGO</Text>
                <PaymentStatusBadge status={payment.status} />
              </div>
            )}
          </div>

          {/* Financial cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <Text variant="caption" color="muted" className="block mb-1">MONTO</Text>
              <Text variant="h4" className="text-xl font-sans">${(contract.total_amount || 0).toLocaleString()}</Text>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <Text variant="caption" color="muted" className="block mb-1">RUT CLIENTE</Text>
              <Text variant="body-sm" weight="bold" className="font-mono">{contract.buyer_rut}</Text>
            </div>
            {payment?.net_amount != null && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Text variant="caption" color="muted" className="block mb-1">NETO</Text>
                <Text variant="h4" className="text-xl font-sans">${payment.net_amount.toLocaleString()}</Text>
              </div>
            )}
            {payment?.iva_amount != null && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Text variant="caption" color="muted" className="block mb-1">IVA</Text>
                <Text variant="h4" className="text-xl font-sans">${payment.iva_amount.toLocaleString()}</Text>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Template</Text>
              <Text variant="body-sm" weight="medium" color="primary">{contract.templateVersion?.template?.title || 'N/A'}</Text>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Email Cliente</Text>
              <Text variant="body-sm" weight="medium" color="primary">{contract.buyer_email}</Text>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Requiere Notario</Text>
              <Text variant="body-sm" weight="medium" color="primary">{contract.requires_notary ? 'Sí' : 'No'}</Text>
            </div>

            {/* Payment details */}
            {payment && (
              <>
                <div className="pt-2">
                  <Text variant="body-sm" weight="bold" color="primary" className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Información de Pago
                  </Text>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <Text variant="body-sm" color="muted">Tipo Documento</Text>
                  <Text variant="body-sm" weight="medium" color="primary" className="capitalize">{payment.billing_type || 'N/A'}</Text>
                </div>
                {payment.processor_fee != null && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">Fee Procesador</Text>
                    <Text variant="body-sm" weight="medium" color="primary">${payment.processor_fee.toLocaleString()}</Text>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <Text variant="body-sm" color="muted">DTE</Text>
                  <div className="flex items-center gap-2">
                    <DTEStatusBadge status={payment.dte_status} folio={payment.dte_folio} />
                    {payment.dte_pdf_url && (
                      <a
                        href={payment.dte_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver PDF
                      </a>
                    )}
                  </div>
                </div>
                {payment.external_transaction_id && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">ID Transacción</Text>
                    <Text variant="body-sm" weight="medium" color="primary" className="font-mono text-xs">{payment.external_transaction_id}</Text>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between py-2">
              <Text variant="body-sm" color="muted">Fecha Creación</Text>
              <Text variant="body-sm" weight="medium" color="primary">
                {new Date(contract.created_at).toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Box>
    </div>
  );
};