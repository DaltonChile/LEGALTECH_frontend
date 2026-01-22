import React, { useEffect, useState } from 'react';
import { Download, Upload, Clock, CheckCircle, FileText, Mail, Search } from 'lucide-react';
import { notaryApi, type NotaryContract } from '../../services/api';

type ContractRequest = NotaryContract;

export const NotaryInboxPage: React.FC = () => {
  const [pendingContracts, setPendingContracts] = useState<ContractRequest[]>([]);
  const [signedContracts, setSignedContracts] = useState<ContractRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'signed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [_selectedContract, setSelectedContract] = useState<ContractRequest | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    loadContracts();
  }, [startDate, endDate]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const [pending, signed] = await Promise.all([
        notaryApi.getPendingContracts(startDate, endDate),
        notaryApi.getSignedContracts(startDate, endDate)
      ]);
      setPendingContracts(pending || []);
      setSignedContracts(signed || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async (contractId: string, trackingCode: string) => {
    try {
      const blob = await notaryApi.downloadContract(contractId);
      
      // Crear URL temporal del blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${trackingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar la URL del blob
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
      setSelectedContract(null);
    } catch (error: unknown) {
      console.error('Error uploading signed contract:', error);
      
      // Extraer mensaje específico del error de validación BR-23
      let errorMessage = 'Error al subir el documento firmado';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        const data = axiosError.response?.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          // Traducir códigos de error a mensajes amigables
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

  const notarySigner = (contract: ContractRequest) => 
    contract.signers.find(s => s.role === 'notary');

  // Combinar contratos según el filtro
  const allContracts = [...pendingContracts, ...signedContracts];
  const contractsToShow = filter === 'pending' 
    ? pendingContracts 
    : filter === 'signed' 
    ? signedContracts 
    : allContracts;

  const filteredContracts = contractsToShow.filter(contract => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      contract.templateVersion.template.title.toLowerCase().includes(searchLower) ||
      contract.tracking_code.toLowerCase().includes(searchLower) ||
      contract.buyer_email.toLowerCase().includes(searchLower) ||
      contract.buyer_rut.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const pendingCount = pendingContracts.length;
  const signedCount = signedContracts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bandeja de Entrada</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona las firmas pendientes y contratos completados</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Firmados</p>
              <p className="text-2xl font-bold text-green-600">{signedCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-900">{pendingCount + signedCount}</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, código o contrato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['pending', 'signed', 'all'] as const).map((status) => (
              <button 
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === status 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status === 'pending' && 'Pendientes'}
                {status === 'signed' && 'Firmados'}
                {status === 'all' && 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Mail className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-lg mb-1">No se encontraron contratos</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchQuery ? 'Intenta ajustar tus filtros o búsqueda' : 'No hay documentos pendientes de revisión'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">Contrato / Código</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Identificación</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitante</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((contract) => {
                  const signer = notarySigner(contract);
                  const isPending = contract.status === 'waiting_notary';
                  
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{contract.templateVersion.template.title}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{contract.tracking_code}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{contract.buyer_rut}</span>
                          <span className="text-xs text-slate-500">RUT Comprador</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pendiente
                          </span>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Firmado
                            </span>
                            {signer?.signed_at && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(signer.signed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium">{contract.buyer_email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">${contract.total_amount.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {/* Download Button */}
                           <button
                            onClick={() => handleDownloadContract(contract.id, contract.tracking_code)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Upload Signed Contract Button (Only if pending) */}
                          {isPending && (
                            <label className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Subir documento firmado">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (confirm('¿Estás seguro de subir este documento firmado?')) {
                                      handleUploadSigned(contract.id, file);
                                    }
                                  }
                                }}
                                disabled={uploading}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
