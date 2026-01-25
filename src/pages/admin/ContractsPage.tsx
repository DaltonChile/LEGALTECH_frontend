import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminContracts } from '../../hooks/admin/useAdminContracts';
import { ContractsTable } from '../../components/admin/contracts/ContractsTable';

export function ContractsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { contracts, isLoading, error, refetch, pagination } = useAdminContracts(
    statusFilter || undefined,
    currentPage,
    limit
  );

  const handleViewDetails = (contractId: string) => {
    // TODO: Implementar vista de detalles del contrato
    console.log('Ver detalles del contrato:', contractId);
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending_payment', label: 'Pago Pendiente' },
    { value: 'paid', label: 'Pagado' },
    { value: 'waiting_signatures', label: 'Esperando Firmas' },
    { value: 'waiting_notary', label: 'Esperando Notario' },
    { value: 'completed', label: 'Completado' },
    { value: 'rejected', label: 'Rechazado' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Stats Cards */}
      

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filtros:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Contracts Table */}
      <ContractsTable
        contracts={contracts}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Mostrando {contracts.length} de {pagination.total} contratos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
