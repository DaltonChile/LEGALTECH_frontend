// LEGALTECH_frontend/src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  X, Eye, TrendingUp, TrendingDown
} from 'lucide-react';
import { 
  getDashboardStats, 
  getDashboardWeeklyActivity, 
  getDashboardRecentContracts
} from '../../services/api';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
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
  signedContracts: number;
  contractsByStatus: {
    draft: number;
    pending_payment: number;
    paid: number;
    waiting_notary: number;
    waiting_signatures: number;
    signed: number;
    failed: number;
  };
}

interface WeeklyData {
  day: string;
  date: string;
  contratos: number;
  ingresos: number;
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
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400' },
  pending_payment: { label: 'Pend. Pago', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' },
  paid: { label: 'Pagado', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  waiting_notary: { label: 'Esp. Notario', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
  waiting_signatures: { label: 'Esp. Firmas', color: 'bg-cyan-100 text-cyan-700', dotColor: 'bg-cyan-500' },
  signed: { label: 'Firmado', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' }
};

// ============================================
// Main Component
// ============================================
export function AdminDashboard() {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Simulating API calls if imports are missing, or using actual services
        // Ideally keep your original service calls here
        const [statsRes, weeklyRes, contractsRes] = await Promise.all([
          getDashboardStats(),
          getDashboardWeeklyActivity(),
          getDashboardRecentContracts(5)
        ]);

        setStats(statsRes.data.data);
        setWeeklyData(weeklyRes.data.data);
        setRecentContracts(contractsRes.data.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Porcentaje de clientes nuevos
  const newCustomersPercent = stats ? Math.round((stats.contractsByStatus.draft + stats.contractsByStatus.pending_payment) / Math.max(stats.totalContracts, 1) * 100) : 0;
  const returningPercent = 100 - newCustomersPercent;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        


        {/* ================= GRID LAYOUT ================= */}
        {/* Using a 12-column grid system for perfect alignment */}
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-12 gap-4">

          {/* --- KPI 1: Ingresos (4 Cols) --- */}
          <div className="lg:col-span-3">
            <StatCard 
              title="Ingresos" 
              value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} 
              change={stats?.revenueChange || 0}
              sparkColor="#10b981"
            />
          </div>

          {/* --- KPI 2: Contratos (4 Cols) --- */}
          <div className="lg:col-span-4">
            <StatCard 
              title="Contratos" 
              value={(stats?.totalContracts || 0).toString()} 
              change={stats?.contractsChange || 0}
              sparkColor="#3b82f6"
            />
          </div>

          {/* --- KPI 3: Firmados (4 Cols) --- */}
          <div className="lg:col-span-2 md:col-span-2 md:col-start-1 lg:col-start-auto">
            <StatCard 
              title="Firmados" 
              value={(stats?.signedContracts || 0).toString()} 
              change={30.3}
              sparkColor="#06b6d4"
            />
          </div>

          {/* --- CHART: Ventas (8 Cols) --- */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Gráfico Ventas</h3>
                <p className="text-xs text-slate-400 mt-1">Comparativa Ingresos vs Contratos</p>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setViewPeriod(period as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      viewPeriod === period 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {period === 'daily' ? 'Diario' : period === 'weekly' ? 'Semanal' : 'Mensual'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="contratos" name="Contratos" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- CHART: Clientes (4 Cols) --- */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Gráfico Clientes</h3>
              <p className="text-xs text-slate-400">Distribución Nuevos vs Recurrentes</p>
            </div>

            <div className="h-56 relative my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Actuales', value: returningPercent },
                      { name: 'Nuevos', value: newCustomersPercent }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#0e7490" /> {/* Darker Cyan */}
                    <Cell fill="#22d3ee" /> {/* Lighter Cyan */}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{newCustomersPercent}%</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Nuevos</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#0e7490]"></span>
                  <span className="text-xs text-slate-500">Recurrentes</span>
                </div>
                <span className="font-bold text-slate-700">{returningPercent}%</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#22d3ee]"></span>
                  <span className="text-xs text-slate-500">Nuevos</span>
                </div>
                <span className="font-bold text-slate-700">{newCustomersPercent}%</span>
              </div>
            </div>
          </div>

          {/* --- TABLE: Full Width (12 Cols) --- */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Tabla Contratos</h3>
                <p className="text-xs text-slate-400 mt-1">Últimos movimientos registrados</p>
              </div>
              <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                Ver todos
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
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
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
// Sub Components (Preserved & Styled)
// ============================================

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  sparkColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, sparkColor }) => {
  const isPositive = change >= 0;
  // Simple sparkline path logic
  const sparkData = [30, 45, 35, 50, 40, 60, 55];
  const maxVal = Math.max(...sparkData);
  const points = sparkData.map((val, i) => `${(i / (sparkData.length - 1)) * 100},${100 - (val / maxVal) * 100}`).join(' ');

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500 font-medium truncate pr-2">{title}</p>
        <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-full ${
          isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <div className="w-20 h-10 opacity-75">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke={sparkColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
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
  const status = STATUS_CONFIG[contract.status];

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
          <span className="text-sm font-medium text-slate-900 truncate max-w-45">
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
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {contract.buyer_email.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-600 truncate max-w-30">
            {contract.buyer_email.split('@')[0]}
          </span>
        </div>
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

// ... ContractDetailModal remains the same as your original code, 
// just ensure it is exported or included in the file.
interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ contract, onClose }) => {
  const status = STATUS_CONFIG[contract.status];
  const statusIcons = {
    draft: FileText, pending_payment: Clock, paid: CheckCircle,
    waiting_notary: AlertCircle, signed: CheckCircle, failed: XCircle
  };
  const StatusIcon = statusIcons[contract.status];

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
             <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500">Fecha Creación</span>
                <span className="text-sm font-medium text-slate-900">{new Date(contract.created_at).toLocaleDateString()}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};