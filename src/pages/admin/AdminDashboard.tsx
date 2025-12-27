import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  DollarSign,
  Activity,
  Loader2
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import api from '../../services/api';

interface Metrics {
  contracts: {
    total: number;
    by_status: Record<string, number>;
  };
  payments: {
    total_successful: number;
    total_revenue: number;
  };
  users: {
    active: number;
  };
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/metrics');
      setMetrics(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const stats = [
    { 
      label: 'Total Contratos', 
      value: metrics ? formatNumber(metrics.contracts.total) : '0', 
      icon: FileText,
    },
    { 
      label: 'Usuarios Activos', 
      value: metrics ? formatNumber(metrics.users.active) : '0', 
      icon: Users,
    },
    { 
      label: 'Ingresos Totales', 
      value: metrics ? formatCurrency(metrics.payments.total_revenue) : '$0', 
      icon: DollarSign,
    },
  ];

  // Calculate completion percentage based on successful payments vs total contracts
  const completionRate = metrics && metrics.contracts.total > 0
    ? Math.round((metrics.payments.total_successful / metrics.contracts.total) * 100)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                index === 0 ? 'bg-blue-100' :
                index === 1 ? 'bg-cyan-100' :
                'bg-lime-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  index === 0 ? 'text-blue-600' :
                  index === 1 ? 'text-cyan-600' :
                  'text-lime-600'
                }`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Tasa de Conversión</h2>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-500">Pagos / Contratos</span>
          </div>
        </div>
        
        {/* Gauge Chart */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-64 h-32">
            {/* Background arc */}
            <svg className="w-full h-full" viewBox="0 0 200 100">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Value arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(completionRate / 100) * 251.2} 251.2`}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#84cc16" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center value */}
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <div className="text-center">
                <span className="text-4xl font-bold text-slate-900">{completionRate}%</span>
                <p className="text-sm text-slate-500 mt-1">Contratos pagados</p>
              </div>
            </div>
          </div>
          
          {/* Stats summary */}
          <div className="flex items-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{metrics?.contracts.total || 0}</p>
              <p className="text-sm text-slate-500">Total contratos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{metrics?.payments.total_successful || 0}</p>
              <p className="text-sm text-slate-500">Pagos exitosos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{metrics?.users.active || 0}</p>
              <p className="text-sm text-slate-500">Usuarios activos</p>
            </div>
          </div>

          {/* Contract status breakdown */}
          {metrics && Object.keys(metrics.contracts.by_status).length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 w-full max-w-md">
              <h3 className="text-sm font-medium text-slate-700 mb-3 text-center">Contratos por Estado</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {Object.entries(metrics.contracts.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'draft' ? 'bg-slate-400' :
                      status === 'pending_payment' ? 'bg-amber-400' :
                      status === 'paid' ? 'bg-blue-400' :
                      status === 'signed' ? 'bg-emerald-400' :
                      'bg-slate-300'
                    }`} />
                    <span className="text-sm text-slate-600 capitalize">
                      {status.replace(/_/g, ' ')}: <strong>{count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}