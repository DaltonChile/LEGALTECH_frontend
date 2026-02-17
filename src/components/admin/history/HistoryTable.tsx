import { Eye, FileText, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { EmptyState } from '../../shared/EmptyState';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
import { StatusBadge } from '../../ui/composed/StatusBadge';
import { PaymentStatusBadge } from '../../ui/composed/PaymentStatusBadge';
import { DTEStatusBadge } from '../../ui/composed/DTEStatusBadge';
import type { HistoryRecord } from '../../../types/history';

interface HistoryTableProps {
  records: HistoryRecord[];
  isLoading: boolean;
  onViewDetails: (record: HistoryRecord) => void;
}

const formatCurrency = (amount: number) => `$${(amount || 0).toLocaleString()}`;

export function HistoryTable({ records, isLoading, onViewDetails }: HistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No hay registros"
        description="No se encontraron registros en el historial"
      />
    );
  }

  return (
    <Box variant="document" padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-left">
                <Text variant="caption" color="muted">CÓDIGO</Text>
              </th>
              <th className="px-4 py-4 text-left hidden lg:table-cell">
                <Text variant="caption" color="muted">CONTRATO</Text>
              </th>
              <th className="px-4 py-4 text-left">
                <Text variant="caption" color="muted">CLIENTE</Text>
              </th>
              <th className="px-4 py-4 text-left">
                <Text variant="caption" color="muted">ESTADO</Text>
              </th>
              <th className="px-4 py-4 text-left hidden md:table-cell">
                <Text variant="caption" color="muted">MONTO</Text>
              </th>
              <th className="px-4 py-4 text-left hidden md:table-cell">
                <Text variant="caption" color="muted">PAGO</Text>
              </th>
              <th className="px-4 py-4 text-left hidden lg:table-cell">
                <Text variant="caption" color="muted">DOC</Text>
              </th>
              <th className="px-4 py-4 text-left hidden xl:table-cell">
                <Text variant="caption" color="muted">DTE</Text>
              </th>
              <th className="px-4 py-4 text-left hidden xl:table-cell">
                <Text variant="caption" color="muted">NETO / IVA</Text>
              </th>
              <th className="px-4 py-4 text-center hidden md:table-cell">
                <Text variant="caption" color="muted">FIRMAS</Text>
              </th>
              <th className="px-4 py-4 text-left hidden xl:table-cell">
                <Text variant="caption" color="muted">FECHA</Text>
              </th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((record) => {
              const payment = record.payments?.[0];
              const signedCount = record.signers?.filter(s => s.has_signed).length || 0;
              const totalSigners = record.signers?.length || 0;

              return (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Tracking Code */}
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {record.tracking_code}
                    </span>
                  </td>

                  {/* Template */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[160px]" title={record.templateVersion?.template?.title}>
                        {record.templateVersion?.template?.title || 'Sin template'}
                      </Text>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-4">
                    <Text variant="body-sm" weight="medium" color="primary" className="truncate max-w-[160px]" title={record.buyer_email}>
                      {record.buyer_email}
                    </Text>
                    <Text variant="caption" color="muted">{record.buyer_rut}</Text>
                  </td>

                  {/* Request Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={record.status as any} size="sm" />
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 hidden md:table-cell">
                    <Text variant="body-sm" weight="bold" color="primary">
                      {formatCurrency(record.total_amount)}
                    </Text>
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-4 hidden md:table-cell">
                    <PaymentStatusBadge status={payment?.status} />
                  </td>

                  {/* Billing Type */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {payment?.billing_type ? (
                      <Text variant="caption" weight="medium" color="secondary" className="capitalize">
                        {payment.billing_type}
                      </Text>
                    ) : (
                      <Text variant="caption" color="muted">—</Text>
                    )}
                  </td>

                  {/* DTE */}
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <div className="flex items-center gap-1.5">
                      <DTEStatusBadge status={payment?.dte_status} folio={payment?.dte_folio} />
                      {payment?.dte_pdf_url && (
                        <a
                          href={payment.dte_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded transition-colors"
                          title="Descargar PDF"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Net / IVA */}
                  <td className="px-4 py-4 hidden xl:table-cell">
                    {payment?.net_amount != null ? (
                      <div>
                        <Text variant="body-sm" weight="medium" color="primary">
                          {formatCurrency(payment.net_amount)}
                        </Text>
                        <Text variant="caption" color="muted">
                          IVA: {formatCurrency(payment.iva_amount || 0)}
                        </Text>
                      </div>
                    ) : (
                      <Text variant="caption" color="muted">—</Text>
                    )}
                  </td>

                  {/* Signatures */}
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <Text variant="body-sm" color="secondary" weight="medium">
                      {signedCount}/{totalSigners}
                    </Text>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <div className="flex flex-col">
                      <Text variant="body-sm" weight="medium" color="secondary">
                        {new Date(record.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </Text>
                      <Text variant="caption" color="muted">
                        {new Date(record.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onViewDetails(record)}
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
