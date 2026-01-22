// LEGALTECH_frontend/src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  X, Eye, TrendingUp, TrendingDown, DollarSign, 
  FileSignature, BarChart3, PieChart as PieChartIcon, Loader2
} from 'lucide-react';
import { 
  getDashboardStats, 
  getDashboardWeeklyActivity, 
  getDashboardMonthlyActivity,
  getDashboardRecentContracts,
  getDashboardPopularTemplates
} from '../../services/api';
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
    draft: number;
    pending_payment: number;
    paid: number;
    waiting_notary: number;
    waiting_signatures: number;
    signed: number;
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
  status: 'draft' | 'pending_payment' | 'paid' | 'waiting_notary' | 'waiting_signatures' | 'signed' | 'failed';
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

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400', chartColor: '#94a3b8' },
  pending_payment: { label: 'Pend. Pago', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500', chartColor: '#f59e0b' },
  paid: { label: 'Pagado', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500', chartColor: '#3b82f6' },
  waiting_notary: { label: 'Esp. Notario', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500', chartColor: '#8b5cf6' },
  waiting_signatures: { label: 'Esp. Firmas', color: 'bg-cyan-100 text-cyan-700', dotColor: 'bg-cyan-500', chartColor: '#06b6d4' },
  signed: { label: 'Firmado', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500', chartColor: '#10b981' },
  completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500', chartColor: '#059669' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500', chartColor: '#ef4444' }
};

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#94a3b8'];

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
  const [viewPeriod, setViewPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        const [statsRes, weeklyRes, monthlyRes, contractsRes, templatesRes] = await Promise.all([
          getDashboardStats(),
          getDashboardWeeklyActivity(),
          getDashboardMonthlyActivity(),
          getDashboardRecentContracts(5),
          getDashboardPopularTemplates(5)
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
  }, []);

  // Datos para el gráfico de estados
  const statusChartData = stats ? Object.entries(stats.contractsByStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
      value: count,
      color: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.chartColor || '#94a3b8'
    })) : [];

  // Datos para el gráfico de actividad
  const activityData = viewPeriod === 'weekly' ? weeklyData : monthlyData.map(m => ({
    day: m.month,
    contratos: m.contratos,
    ingresos: m.ingresos
  }));

  // Calcular tasa de conversión (pagados + firmados / total)
  const conversionRate = stats && stats.totalContracts > 0
    ? ((stats.contractsByStatus.paid + stats.contractsByStatus.signed + (stats.contractsByStatus.completed || 0) + stats.contractsByStatus.waiting_notary + (stats.contractsByStatus.waiting_signatures || 0)) / stats.totalContracts * 100).toFixed(1)
    : '0';

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

          {/* ================= KPI CARDS ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ingresos */}
            <StatCard 
              icon={<DollarSign className="w-5 h-5" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              title="Ingresos Totales" 
              value={formatCurrency(stats?.totalRevenue || 0)} 
              change={stats?.revenueChange || 0}
              subtitle="vs mes anterior"
            />

            {/* Contratos */}
            <StatCard 
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              title="Total Contratos" 
              value={formatNumber(stats?.totalContracts || 0)} 
              change={stats?.contractsChange || 0}
              subtitle="vs mes anterior"
            />

            {/* Firma Simple vs FEA */}
            <SignatureComparisonCard 
              simple={stats?.signatureStats?.simple || 0}
              fea={stats?.signatureStats?.fea || 0}
            />

            {/* Conversión */}
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              title="Tasa de Conversión" 
              value={`${conversionRate}%`} 
              change={parseFloat(conversionRate) > 50 ? 10 : -5}
              subtitle="pagados / total"
            />
          </div>

          {/* ================= CHARTS ROW ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Chart: Actividad (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-500" />
                    Actividad
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Contratos e ingresos por período</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['weekly', 'monthly'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                        viewPeriod === period 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {period === 'weekly' ? 'Semanal' : 'Mensual'}
                    </button>
                  ))}
                </div>
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
                      formatter={(value: number, name: string) => [
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
                          formatter={(value: number) => [`${value} contratos`, '']}
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

          {/* ================= STATS BY STATUS CARDS ================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = stats?.contractsByStatus[status as keyof typeof stats.contractsByStatus] || 0;
              return (
                <div 
                  key={status}
                  className={`${config.color} rounded-xl p-4 text-center transition-transform hover:scale-105`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-1">{config.label}</p>
                </div>
              );
            })}
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
  change: number;
  subtitle: string;
  showChangeAsPercent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, iconBg, iconColor, title, value, change, subtitle, showChangeAsPercent = true 
}) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {showChangeAsPercent && (
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

// Signature Comparison Card Component
interface SignatureComparisonCardProps {
  simple: number;
  fea: number;
}

const SignatureComparisonCard: React.FC<SignatureComparisonCardProps> = ({ simple, fea }) => {
  const total = simple + fea;
  const simplePercent = total > 0 ? Math.round((simple / total) * 100) : 0;
  const feaPercent = total > 0 ? Math.round((fea / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-100 to-purple-100">
          <FileSignature className="w-5 h-5 text-cyan-600" />
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {total} completados
        </span>
      </div>
      <p className="text-xs text-slate-500 font-medium mb-3">Tipo de Firma</p>
      
      {/* Progress Bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex mb-3">
        {simplePercent > 0 && (
          <div 
            className="bg-cyan-500 h-full transition-all duration-500"
            style={{ width: `${simplePercent}%` }}
          />
        )}
        {feaPercent > 0 && (
          <div 
            className="bg-purple-500 h-full transition-all duration-500"
            style={{ width: `${feaPercent}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          <span className="text-slate-600">Simple</span>
          <span className="font-bold text-slate-900">{simple}</span>
          <span className="text-slate-400">({simplePercent}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span className="text-slate-600">FEA</span>
          <span className="font-bold text-slate-900">{fea}</span>
          <span className="text-slate-400">({feaPercent}%)</span>
        </div>
      </div>
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
  const statusIcons = {
    draft: FileText, pending_payment: Clock, paid: CheckCircle,
    waiting_notary: AlertCircle, waiting_signatures: Clock, signed: CheckCircle, failed: XCircle
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