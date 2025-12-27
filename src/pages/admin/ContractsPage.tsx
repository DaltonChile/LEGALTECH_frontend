import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { 
  Search, 
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Calendar,
  Mail,
  CreditCard
} from 'lucide-react';

interface Signer {
  id: string;
  full_name: string;
  email: string;
  rut: string;
  role: string;
  has_signed: boolean;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface Contract {
  id: string;
  tracking_code: string;
  buyer_rut: string;
  buyer_email: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'waiting_notary' | 'signed' | 'failed';
  total_amount: number;
  requires_notary: boolean;
  created_at: string;
  updated_at: string;
  templateVersion?: {
    id: string;
    version_number: number;
    template?: {
      id: string;
      title: string;
      slug: string;
    };
  };
  signers?: Signer[];
  payments?: Payment[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: FileText },
  pending_payment: { label: 'Pendiente Pago', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  paid: { label: 'Pagado', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: DollarSign },
  waiting_notary: { label: 'Esperando Notario', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: AlertCircle },
  signed: { label: 'Firmado', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle },
  failed: { label: 'Fallido', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [pagination.page, filterStatus]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/admin/contracts?${params.toString()}`);
      setContracts(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadContracts();
  };

  const viewContractDetails = async (contract: Contract) => {
    try {
      const response = await api.get(`/admin/contracts/${contract.id}`);
      setSelectedContract(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading contract details:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && contracts.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando contratos...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-slate-500 mt-1">Gestión de órdenes y solicitudes</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, email o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </form>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="pending_payment">Pendiente Pago</option>
            <option value="paid">Pagado</option>
            <option value="waiting_notary">Esperando Notario</option>
            <option value="signed">Firmado</option>
            <option value="failed">Fallido</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusConfig).slice(0, 4).map(([status, config]) => {
          const count = contracts.filter(c => c.status === status).length;
          return (
            <div 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                filterStatus === status ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center mb-2`}>
                <config.icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Código</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Template</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Monto</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Fecha</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium">No hay contratos</p>
                    <p className="text-sm">Los contratos aparecerán aquí cuando los usuarios los creen</p>
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => {
                  const status = statusConfig[contract.status];
                  return (
                    <tr 
                      key={contract.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-blue-600">
                          {contract.tracking_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900">
                          {contract.templateVersion?.template?.title || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-slate-900">{contract.buyer_email}</p>
                          <p className="text-xs text-slate-500">{contract.buyer_rut}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(contract.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {formatDate(contract.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewContractDetails(contract)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-slate-700">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Contrato #{selectedContract.tracking_code}</h2>
                <p className="text-sm text-slate-500">{selectedContract.templateVersion?.template?.title}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status & Amount */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Estado</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[selectedContract.status].bgColor} ${statusConfig[selectedContract.status].color}`}>
                    {(() => {
                      const Icon = statusConfig[selectedContract.status].icon;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    {statusConfig[selectedContract.status].label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Monto Total</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedContract.total_amount)}</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900">{selectedContract.buyer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">RUT</p>
                    <p className="text-sm font-medium text-slate-900">{selectedContract.buyer_rut}</p>
                  </div>
                </div>
              </div>

              {/* Signers */}
              {selectedContract.signers && selectedContract.signers.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Firmantes ({selectedContract.signers.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedContract.signers.map((signer) => (
                      <div key={signer.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{signer.full_name}</p>
                          <p className="text-xs text-slate-500">{signer.email} • {signer.role}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          signer.has_signed 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          {signer.has_signed ? 'Firmado' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {selectedContract.payments && selectedContract.payments.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pagos ({selectedContract.payments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedContract.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-slate-500">{payment.payment_method} • {formatDate(payment.created_at)}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          payment.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : payment.status === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fechas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Creado</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedContract.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Última actualización</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedContract.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
