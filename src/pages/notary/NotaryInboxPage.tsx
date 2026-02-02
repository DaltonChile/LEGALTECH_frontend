import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { notaryApi, type NotaryContract } from '../../services/api';
import { NotaryStatsCards, NotaryFilters, NotaryContractRow } from '../../components/notary';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';

type FilterType = 'pending' | 'completed' | 'all';

export const NotaryInboxPage: React.FC = () => {
  const [pendingContracts, setPendingContracts] = useState<NotaryContract[]>([]);
  const [completedContracts, setCompletedContracts] = useState<NotaryContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [startDate, endDate]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const [pending, completed] = await Promise.all([
        notaryApi.getPendingContracts(startDate, endDate),
        notaryApi.getSignedContracts(startDate, endDate)
      ]);
      setPendingContracts(pending || []);
      setCompletedContracts(completed || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async (contractId: string, trackingCode: string) => {
    try {
      const blob = await notaryApi.downloadContract(contractId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${trackingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('Error al descargar el contrato');
    }
  };

  const handleUploadSigned = async (contractId: string, file: File) => {
    try {
      setUploading(true);
      await notaryApi.uploadSignedContract(contractId, file);
      alert('Documento firmado subido exitosamente');
      loadContracts();
    } catch (error: unknown) {
      console.error('Error uploading signed contract:', error);
      
      let errorMessage = 'Error al subir el documento firmado';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        const data = axiosError.response?.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          const errorMessages: Record<string, string> = {
            'MISSING_METADATA': 'Este documento no fue descargado desde el sistema. Por favor, descargue nuevamente el contrato y fírmelo sin usar "Imprimir como PDF".',
            'CONTRACT_MISMATCH': 'Este documento pertenece a otro contrato. Por favor, verifique que está subiendo el documento correcto.'
          };
          errorMessage = errorMessages[data.error] || data.error;
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Combine and filter contracts
  const allContracts = [...pendingContracts, ...completedContracts];
  const contractsToShow = filter === 'pending' 
    ? pendingContracts 
    : filter === 'completed' 
    ? completedContracts 
    : allContracts;

  const filteredContracts = contractsToShow.filter(contract => {
    const searchLower = searchQuery.toLowerCase();
    const title = contract.templateVersion?.template?.title || 'Documento personalizado';
    return (
      title.toLowerCase().includes(searchLower) ||
      contract.tracking_code.toLowerCase().includes(searchLower) ||
      contract.buyer_email.toLowerCase().includes(searchLower) ||
      contract.buyer_rut.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Text variant="h2">Bandeja de Entrada</Text>
          <Text variant="body-sm" color="muted" className="mt-1">Gestiona las firmas pendientes y contratos completados</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <NotaryStatsCards 
        pending={pendingContracts.length}
        completed={completedContracts.length}
        total={pendingContracts.length + completedContracts.length}
      />

      {/* Filters */}
      <NotaryFilters
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearDates={() => { setStartDate(''); setEndDate(''); }}
      />

      {/* Table Container */}
      <Box variant="document" padding="none" className="overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Mail className="w-8 h-8 text-slate-300" />
            </div>
            <Text variant="h4" className="mb-1">No se encontraron contratos</Text>
            <Text variant="body-sm" color="muted" className="max-w-sm mx-auto">
              {searchQuery ? 'Intenta ajustar tus filtros o búsqueda' : 'No hay documentos pendientes de revisión'}
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 w-[30%]">
                    <Text variant="caption" color="muted">CONTRATO / CÓDIGO</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">IDENTIFICACIÓN</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">ESTADO</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">SOLICITANTE</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">DETALLES</Text>
                  </th>
                  <th className="text-right px-6 py-4">
                    <Text variant="caption" color="muted">ACCIONES</Text>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredContracts.map((contract) => (
                  <NotaryContractRow
                    key={contract.id}
                    contract={contract}
                    onDownload={handleDownloadContract}
                    onUpload={handleUploadSigned}
                    uploading={uploading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Box>
    </div>
  );
};
