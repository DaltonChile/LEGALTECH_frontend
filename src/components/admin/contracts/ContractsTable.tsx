import { Eye, FileText } from 'lucide-react';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { EmptyState } from '../../shared/EmptyState';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
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
    return `$${(amount || 0).toLocaleString()}`;
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
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <Text variant="caption" color="muted">CÓDIGO</Text>
              </th>
              <th className="px-6 py-4 text-left hidden lg:table-cell">
                <Text variant="caption" color="muted">CONTRATO</Text>
              </th>
              <th className="px-6 py-4 text-left">
                <Text variant="caption" color="muted">CLIENTE</Text>
              </th>
              <th className="px-6 py-4 text-left">
                <Text variant="caption" color="muted">ESTADO</Text>
              </th>
              <th className="px-6 py-4 text-left hidden md:table-cell">
                <Text variant="caption" color="muted">MONTO</Text>
              </th>
              <th className="px-6 py-4 text-left hidden xl:table-cell">
                <Text variant="caption" color="muted">FECHA</Text>
              </th>
              <th className="px-6 py-4 text-center hidden md:table-cell">
                <Text variant="caption" color="muted">FIRMAS</Text>
              </th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contracts.map((contract) => {
              const signedCount = contract.signers?.filter(s => s.has_signed).length || 0;
              const totalSigners = contract.signers?.length || 0;

              return (
                <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {contract.tracking_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[200px]" title={contract.templateVersion?.template?.title}>
                        {contract.templateVersion?.template?.title || 'Sin template'}
                      </Text>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[180px]" title={contract.buyer_email}>
                      {contract.buyer_email}
                    </Text>
                    <Text variant="caption" color="muted">{contract.buyer_rut}</Text>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={contract.status as any} size="sm" />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <Text variant="body-sm" weight="bold" color="primary">
                      {formatCurrency(contract.total_amount)}
                    </Text>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <div className="flex flex-col">
                      <Text variant="body-sm" weight="medium" color="secondary">
                        {new Date(contract.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </Text>
                      <Text variant="caption" color="muted">
                        {new Date(contract.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
                    <Text variant="body-sm" color="secondary" weight="medium">
                      {signedCount}/{totalSigners}
                    </Text>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewDetails(contract.id)}
                      className="p-2 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
