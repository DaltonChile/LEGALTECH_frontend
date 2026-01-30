import { useState } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminContracts } from '../../hooks/admin/useAdminContracts';
import { ContractsTable } from '../../components/admin/contracts/ContractsTable';
import { Box } from '../../components/ui/primitives/Box';
import { Text } from '../../components/ui/primitives/Text';
import { Button } from '../../components/ui/primitives/Button';

export function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { contracts, isLoading, error, pagination } = useAdminContracts(
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
      {/* Page Header */}


      {/* Filters */}
      <Box variant="document" padding="md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Text variant="body-sm" weight="medium">Filtros:</Text>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Box>

      {/* Error Message */}
      {error && (
        <Box className="bg-red-50 border-red-200">
          <Text variant="body-sm" className="text-red-800">{error}</Text>
        </Box>
      )}

      {/* Contracts Table */}
      <ContractsTable
        contracts={contracts}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Box variant="document" padding="md">
          <div className="flex items-center justify-between">
            <Text variant="body-sm" color="muted">
              Mostrando {contracts.length} de {pagination.total} contratos
            </Text>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

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
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Box>
      )}
    </div>
  );
}
