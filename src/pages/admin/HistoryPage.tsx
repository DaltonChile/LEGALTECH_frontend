import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronLeft, ChevronRight, Search, X, FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, DollarSign, Download, Calendar } from 'lucide-react';
import { useAdminHistory } from '../../hooks/admin/useAdminHistory';
import { HistoryTable } from '../../components/admin/history/HistoryTable';
import { Box } from '../../components/ui/primitives/Box';
import { Text } from '../../components/ui/primitives/Text';
import { Button } from '../../components/ui/primitives/Button';
import { StatusBadge } from '../../components/ui/composed/StatusBadge';
import { PaymentStatusBadge } from '../../components/ui/composed/PaymentStatusBadge';
import { DTEStatusBadge } from '../../components/ui/composed/DTEStatusBadge';
import type { HistoryRecord } from '../../types/history';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pend. Pago', icon: Clock },
  draft: { label: 'Borrador', icon: FileText },
  waiting_signatures: { label: 'Esp. Firmas', icon: Clock },
  waiting_notary: { label: 'Esp. Notario', icon: AlertCircle },
  completed: { label: 'Completado', icon: CheckCircle },
  failed: { label: 'Fallido', icon: XCircle },
};

export function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [billingTypeFilter, setBillingTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const limit = 20;

  // Export state
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('payment_status', paymentStatusFilter);
      if (billingTypeFilter) params.set('billing_type', billingTypeFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (exportStartDate) params.set('startDate', exportStartDate);
      if (exportEndDate) params.set('endDate', exportEndDate);

      const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const url = `${baseUrl}/admin/contracts/history/export?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `historial_${exportStartDate || 'all'}_${exportEndDate || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setShowExportPanel(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const { records, isLoading, error, pagination } = useAdminHistory({
    status: statusFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    billingType: billingTypeFilter || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    limit,
  });

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending_payment', label: 'Pend. Pago' },
    { value: 'waiting_signatures', label: 'Esp. Firmas' },
    { value: 'waiting_notary', label: 'Esp. Notario' },
    { value: 'completed', label: 'Completado' },
    { value: 'failed', label: 'Fallido' },
  ];

  const paymentOptions = [
    { value: '', label: 'Todos los pagos' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'rejected', label: 'Rechazado' },
  ];

  const billingOptions = [
    { value: '', label: 'Todos los docs' },
    { value: 'boleta', label: 'Boleta' },
    { value: 'factura', label: 'Factura' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h2" className="text-navy-900">Historial</Text>
          <Text variant="body-sm" color="muted">Solicitudes y pagos del sistema</Text>
        </div>

        {/* Export Button */}
        <div className="relative" ref={exportRef}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowExportPanel(!showExportPanel)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>

          {showExportPanel && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-slate-500" />
                <Text variant="body-sm" weight="semibold">Rango de fechas</Text>
              </div>

              <div className="space-y-3">
                <div>
                  <Text variant="caption" color="muted" className="block mb-1">Desde</Text>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-slate-50"
                  />
                </div>
                <div>
                  <Text variant="caption" color="muted" className="block mb-1">Hasta</Text>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-slate-50"
                  />
                </div>

                <Text variant="caption" color="muted" className="block">
                  {!exportStartDate && !exportEndDate
                    ? 'Sin rango = exportar todo'
                    : 'Se aplicarán también los filtros activos'}
                </Text>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="flex-1"
                  >
                    {isExporting ? 'Exportando...' : 'Descargar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Box variant="document" padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Text variant="body-sm" weight="medium">Filtros:</Text>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            {paymentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={billingTypeFilter}
            onChange={(e) => { setBillingTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            {billingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex items-center gap-1 ml-auto">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Código, email o RUT..."
                className="pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white w-56"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button onClick={handleClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </div>
      </Box>

      {/* Error */}
      {error && (
        <Box className="bg-red-50 border-red-200">
          <Text variant="body-sm" className="text-red-800">{error}</Text>
        </Box>
      )}

      {/* Table */}
      <HistoryTable
        records={records}
        isLoading={isLoading}
        onViewDetails={(record) => setSelectedRecord(record)}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Box variant="document" padding="md">
          <div className="flex items-center justify-between">
            <Text variant="body-sm" color="muted">
              Mostrando {records.length} de {pagination.total} registros
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

      {/* Detail Modal */}
      {selectedRecord && (
        <HistoryDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Detail Modal
// ============================================

interface HistoryDetailModalProps {
  record: HistoryRecord;
  onClose: () => void;
}

function HistoryDetailModal({ record, onClose }: HistoryDetailModalProps) {
  const payment = record.payments?.[0];
  const statusIcons: Record<string, typeof FileText> = {
    draft: FileText, pending_payment: Clock, completed: CheckCircle,
    waiting_notary: AlertCircle, waiting_signatures: Clock, failed: XCircle,
  };
  const StatusIcon = statusIcons[record.status] || FileText;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Box variant="elevated" padding="none" className="max-w-2xl w-full overflow-hidden shadow-document-hover max-h-[90vh] overflow-y-auto">
        <div className="border-t-4 border-navy-900" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <Text variant="h4">Detalle del Registro</Text>
            <Text variant="caption" color="muted" className="font-mono mt-0.5">{record.tracking_code}</Text>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
              <StatusIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <Text variant="body-sm" weight="bold">Estado Solicitud</Text>
              <StatusBadge status={record.status as any} size="sm" />
            </div>
            {payment && (
              <div>
                <Text variant="body-sm" weight="bold">Estado Pago</Text>
                <PaymentStatusBadge status={payment.status} />
              </div>
            )}
          </div>

          {/* Financial info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <Text variant="caption" color="muted" className="block mb-1">MONTO TOTAL</Text>
              <Text variant="h4" className="text-xl font-sans">${(record.total_amount || 0).toLocaleString()}</Text>
            </div>
            {payment?.net_amount != null && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Text variant="caption" color="muted" className="block mb-1">NETO</Text>
                <Text variant="h4" className="text-xl font-sans">${payment.net_amount.toLocaleString()}</Text>
              </div>
            )}
            {payment?.iva_amount != null && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <Text variant="caption" color="muted" className="block mb-1">IVA</Text>
                <Text variant="h4" className="text-xl font-sans">${payment.iva_amount.toLocaleString()}</Text>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Template</Text>
              <Text variant="body-sm" weight="medium" color="primary">{record.templateVersion?.template?.title || 'N/A'}</Text>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Email Cliente</Text>
              <Text variant="body-sm" weight="medium" color="primary">{record.buyer_email}</Text>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">RUT Cliente</Text>
              <Text variant="body-sm" weight="medium" color="primary" className="font-mono">{record.buyer_rut}</Text>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <Text variant="body-sm" color="muted">Tipo Firma</Text>
              <Text variant="body-sm" weight="medium" color="primary" className="capitalize">{record.signature_type}</Text>
            </div>

            {/* Payment details */}
            {payment && (
              <>
                <div className="pt-2">
                  <Text variant="body-sm" weight="bold" color="primary" className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4" />
                    Información de Pago
                  </Text>
                </div>
                {payment.provider && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">Proveedor</Text>
                    <Text variant="body-sm" weight="medium" color="primary" className="capitalize">{payment.provider}</Text>
                  </div>
                )}
                {payment.external_transaction_id && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">ID Transacción</Text>
                    <Text variant="body-sm" weight="medium" color="primary" className="font-mono text-xs">{payment.external_transaction_id}</Text>
                  </div>
                )}
                {payment.processor_fee != null && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">Fee Procesador</Text>
                    <Text variant="body-sm" weight="medium" color="primary">${payment.processor_fee.toLocaleString()}</Text>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <Text variant="body-sm" color="muted">Tipo Documento</Text>
                  <Text variant="body-sm" weight="medium" color="primary" className="capitalize">{payment.billing_type || 'N/A'}</Text>
                </div>
                {payment.billing_razon_social && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <Text variant="body-sm" color="muted">Razón Social</Text>
                    <Text variant="body-sm" weight="medium" color="primary">{payment.billing_razon_social}</Text>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <Text variant="body-sm" color="muted">DTE</Text>
                  <div className="flex items-center gap-2">
                    <DTEStatusBadge status={payment.dte_status} folio={payment.dte_folio} />
                    {payment.dte_pdf_url && (
                      <a
                        href={payment.dte_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver PDF
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Signers */}
            {record.signers && record.signers.length > 0 && (
              <>
                <div className="pt-2">
                  <Text variant="body-sm" weight="bold" color="primary" className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" />
                    Firmantes ({record.signers.filter(s => s.has_signed).length}/{record.signers.length})
                  </Text>
                </div>
                {record.signers.map((signer) => (
                  <div key={signer.id} className="flex items-center justify-between py-2 border-b border-slate-200">
                    <div>
                      <Text variant="body-sm" weight="medium" color="primary">{signer.full_name}</Text>
                      <Text variant="caption" color="muted" className="capitalize">{signer.role}</Text>
                    </div>
                    <Text variant="caption" weight="medium" className={signer.has_signed ? 'text-legal-emerald-700' : 'text-slate-400'}>
                      {signer.has_signed ? '✓ Firmado' : 'Pendiente'}
                    </Text>
                  </div>
                ))}
              </>
            )}

            <div className="flex items-center justify-between py-2">
              <Text variant="body-sm" color="muted">Fecha Creación</Text>
              <Text variant="body-sm" weight="medium" color="primary">
                {new Date(record.created_at).toLocaleDateString('es-CL', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Box>
    </div>
  );
}
