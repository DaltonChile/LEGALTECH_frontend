import { Eye } from 'lucide-react';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { EmptyState } from '../../shared/EmptyState';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/primitives/Button';
import { StatusBadge } from '../../ui/composed/StatusBadge';
import { AlertCircle } from 'lucide-react';

interface Contract {
  id: string;
  tracking_code: string;
  status: string;
  buyer_email: string;
  buyer_rut: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  templateVersion?: {
    template?: {
      title: string;
      slug: string;
    };
  };
  signers?: Array<{
    id: string;
    full_name: string;
    role: string;
    has_signed: boolean;
  }>;
}

interface ContractsTableProps {
  contracts: Contract[];
  isLoading: boolean;
  onViewDetails: (contractId: string) => void;
}

export function ContractsTable({ contracts, isLoading, onViewDetails }: ContractsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No hay contratos"
        description="No se encontraron contratos en el sistema"
      />
    );
  }

  return (
    <Box variant="document" padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left w-[12%]">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Código</Text>
              </th>
              <th className="px-3 py-3 text-left w-[18%] hidden lg:table-cell">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Plantilla</Text>
              </th>
              <th className="px-3 py-3 text-left w-[20%]">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Cliente</Text>
              </th>
              <th className="px-3 py-3 text-left w-[14%]">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Estado</Text>
              </th>
              <th className="px-3 py-3 text-left w-[12%] hidden md:table-cell">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Monto</Text>
              </th>
              <th className="px-3 py-3 text-left w-[12%] hidden xl:table-cell">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Fecha</Text>
              </th>
              <th className="px-3 py-3 text-left w-[6%] hidden md:table-cell">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Firmas</Text>
              </th>
              <th className="px-3 py-3 text-center w-[6%]">
                <Text variant="caption" weight="semibold" className="uppercase tracking-wider">Acciones</Text>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contracts.map((contract) => {
              const signedCount = contract.signers?.filter(s => s.has_signed).length || 0;
              const totalSigners = contract.signers?.length || 0;

              return (
                <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 w-[12%]">
                    <Text variant="body-sm" weight="medium" className="font-mono truncate" title={contract.tracking_code}>
                      {contract.tracking_code.substring(0, 12)}...
                    </Text>
                  </td>
                  <td className="px-3 py-3 w-[18%] hidden lg:table-cell">
                    <Text variant="body-sm" className="truncate" title={contract.templateVersion?.template?.title}>
                      {contract.templateVersion?.template?.title || 'Sin plantilla'}
                    </Text>
                  </td>
                  <td className="px-3 py-3 w-[20%]">
                    <Text variant="body-sm" className="truncate" title={contract.buyer_email}>{contract.buyer_email}</Text>
                    <Text variant="caption" color="muted">{contract.buyer_rut}</Text>
                  </td>
                  <td className="px-3 py-3 w-[14%]">
                    <StatusBadge status={contract.status as any} size="sm" />
                  </td>
                  <td className="px-3 py-3 w-[12%] hidden md:table-cell">
                    <Text variant="body-sm" weight="medium" className="truncate">
                      {formatCurrency(contract.total_amount)}
                    </Text>
                  </td>
                  <td className="px-3 py-3 w-[12%] hidden xl:table-cell">
                    <Text variant="caption">
                      {new Date(contract.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </Text>
                  </td>
                  <td className="px-3 py-3 w-[6%] text-center hidden md:table-cell">
                    <Text variant="body-sm">
                      {signedCount}/{totalSigners}
                    </Text>
                  </td>
                  <td className="px-3 py-3 w-[6%] text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(contract.id)}
                      title="Ver detalles"
                      className="p-1.5"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Box>
  );
}
