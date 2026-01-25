import { useState } from 'react';
import { Eye, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { EmptyState } from '../../shared/EmptyState';

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
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
      draft: {
        label: 'Borrador',
        icon: Clock,
        className: 'bg-gray-100 text-gray-700 border-gray-300'
      },
      pending_payment: {
        label: 'Pago Pendiente',
        icon: AlertCircle,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300'
      },
      paid: {
        label: 'Pagado',
        icon: CheckCircle,
        className: 'bg-blue-100 text-blue-700 border-blue-300'
      },
      waiting_signatures: {
        label: 'Esperando Firmas',
        icon: Clock,
        className: 'bg-orange-100 text-orange-700 border-orange-300'
      },
      waiting_notary: {
        label: 'Esperando Notario',
        icon: Clock,
        className: 'bg-purple-100 text-purple-700 border-purple-300'
      },
      completed: {
        label: 'Completado',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-300'
      },
      rejected: {
        label: 'Rechazado',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-300'
      }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                Código
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[18%] hidden lg:table-cell">
                Plantilla
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[20%]">
                Cliente
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[14%]">
                Estado
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%] hidden md:table-cell">
                Monto
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%] hidden xl:table-cell">
                Fecha
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[6%] hidden md:table-cell">
                Firmas
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[6%]">
                Acciones
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
                    <div className="text-xs font-mono font-medium text-slate-900 truncate" title={contract.tracking_code}>
                      {contract.tracking_code.substring(0, 12)}...
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[18%] hidden lg:table-cell">
                    <div className="text-sm text-slate-900 truncate" title={contract.templateVersion?.template?.title}>
                      {contract.templateVersion?.template?.title || 'Sin plantilla'}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[20%]">
                    <div className="text-sm text-slate-900 truncate" title={contract.buyer_email}>{contract.buyer_email}</div>
                    <div className="text-xs text-slate-500">{contract.buyer_rut}</div>
                  </td>
                  <td className="px-3 py-3 w-[14%]">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-3 py-3 w-[12%] hidden md:table-cell">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {formatCurrency(contract.total_amount)}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[12%] hidden xl:table-cell">
                    <div className="text-xs text-slate-900">
                      {new Date(contract.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[6%] text-center hidden md:table-cell">
                    <div className="text-sm text-slate-900">
                      {signedCount}/{totalSigners}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[6%] text-center">
                    <button
                      onClick={() => onViewDetails(contract.id)}
                      className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
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
    </div>
  );
}
