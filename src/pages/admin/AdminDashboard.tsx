// LEGALTECH_frontend/src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Search, FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  X, Eye, TrendingUp, TrendingDown, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  status: 'draft' | 'pending_payment' | 'paid' | 'waiting_notary' | 'signed' | 'failed';
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
  signed: { label: 'Firmado', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' }
};

// ============================================
// Main Component
// ============================================
export function AdminDashboard() {
  const { user } = useAuth();
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

  // Porcentaje de clientes nuevos (basado en contratos recientes)
  const newCustomersPercent = stats ? Math.round((stats.contractsByStatus.draft + stats.contractsByStatus.pending_payment) / Math.max(stats.totalContracts, 1) * 100) : 0;
  const returningPercent = 100 - newCustomersPercent;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.full_name || 'Administrador'}</h1>
          <p className="text-slate-500 mt-1">Bienvenido al panel de LegalTech Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2.5 w-64 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row - 3 cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          title="Ingresos Totales" 
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} 
          change={stats?.revenueChange || 0}
          sparkColor="#10b981"
        />
        <StatCard 
          title="Total Contratos" 
          value={(stats?.totalContracts || 0).toString()} 
          change={stats?.contractsChange || 0}
          sparkColor="#3b82f6"
        />
        <StatCard 
          title="Contratos Firmados" 
          value={(stats?.signedContracts || 0).toString()} 
          change={30.3}
          sparkColor="#06b6d4"
        />
      </div>

      {/* Charts Row: Sales (large) + Clients (small) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sales Volume - Bar Chart (8 cols) */}
        <div className="col-span-8 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-lg">Volumen de Ventas</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
                Contratos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                Ingresos (k)
              </span>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setViewPeriod(period as any)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewPeriod === period 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {period === 'daily' ? 'Diario' : period === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="contratos" fill="#0891b2" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Volume - Donut Chart (4 cols) */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 text-lg mb-4">Clientes</h3>
          <div className="h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actuales', value: returningPercent },
                    { name: 'Nuevos', value: newCustomersPercent }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#0891b2" />
                  <Cell fill="#22d3ee" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold text-cyan-600">+{newCustomersPercent}%</span>
                <p className="text-sm text-slate-400">Nuevos</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-600"></span>
              <span className="text-sm text-slate-600">Actuales {returningPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-300"></span>
              <span className="text-sm text-slate-600">Nuevos {newCustomersPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table - Full Width */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Contratos Recientes</h3>
          <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
            <option>Esta semana</option>
            <option>Este mes</option>
            <option>Últimos 3 meses</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contrato</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
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
// Stat Card Component
// ============================================
interface StatCardProps {
  title: string;
  value: string;
  change: number;
  sparkColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, sparkColor }) => {
  const isPositive = change >= 0;
  
  // Generar mini sparkline data
  const sparkData = [30, 45, 35, 50, 40, 60, 55];
  const maxVal = Math.max(...sparkData);
  const points = sparkData.map((val, i) => `${(i / (sparkData.length - 1)) * 100},${100 - (val / maxVal) * 100}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-lg ${
          isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {/* Mini Sparkline */}
        <svg viewBox="0 0 100 50" className="w-24 h-12">
          <polyline
            fill="none"
            stroke={sparkColor}
            strokeWidth="2.5"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};

// ============================================
// Contract Row Component
// ============================================
interface ContractRowProps {
  contract: Contract;
  onView: () => void;
}

const ContractRow: React.FC<ContractRowProps> = ({ contract, onView }) => {
  const status = STATUS_CONFIG[contract.status];

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-5 py-4">
        <span className="font-mono text-sm text-slate-700">{contract.tracking_code}</span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 truncate max-w-40">
              {contract.templateVersion?.template?.title || 'Sin template'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-slate-500">
          {new Date(contract.created_at).toLocaleDateString('es-CL', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
          })}, {new Date(contract.created_at).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
          {status.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm font-semibold text-slate-900">
          ${(contract.total_amount || 0).toLocaleString()}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {contract.buyer_email.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-slate-600 truncate max-w-24">
            {contract.buyer_email.split('@')[0]}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          onClick={onView}
          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// ============================================
// Contract Detail Modal
// ============================================
interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ contract, onClose }) => {
  const status = STATUS_CONFIG[contract.status];

  const statusIcons = {
    draft: FileText,
    pending_payment: Clock,
    paid: CheckCircle,
    waiting_notary: AlertCircle,
    signed: CheckCircle,
    failed: XCircle
  };
  const StatusIcon = statusIcons[contract.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Detalle del Contrato</h2>
            <p className="text-sm text-slate-500 font-mono">{contract.tracking_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${status.color}`}>
            <StatusIcon className="w-5 h-5" />
            <div>
              <p className="font-semibold">{status.label}</p>
              <p className="text-xs opacity-75">Estado actual</p>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Template</p>
              <p className="text-sm font-medium text-slate-900">{contract.templateVersion?.template?.title || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Monto</p>
              <p className="text-sm font-medium text-cyan-600">${(contract.total_amount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-900 truncate">{contract.buyer_email}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">RUT</p>
              <p className="text-sm font-medium text-slate-900 font-mono">{contract.buyer_rut}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="text-xs text-slate-500 flex justify-between pt-3 border-t border-slate-100">
            <span>Creado: {new Date(contract.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

