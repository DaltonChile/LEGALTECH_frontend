import React, { useEffect, useState } from 'react';
import { Download, Upload, Clock, CheckCircle, FileText, Mail, Search } from 'lucide-react';
import { notaryApi, type NotaryContract } from '../../services/api';

type ContractRequest = NotaryContract;

export const NotaryInboxPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'signed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [_selectedContract, setSelectedContract] = useState<ContractRequest | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await notaryApi.getContracts();
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async (contractId: string) => {
    try {
      const data = await notaryApi.downloadContract(contractId);
      
      if (data.success) {
        const downloadUrl = data.download_url.startsWith('http') 
          ? data.download_url 
          : `${window.location.origin}${data.download_url}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.filename || 'contrato.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
    } catch (error) {
      console.error('Error uploading signed contract:', error);
      alert('Error al subir el documento firmado');
    } finally {
      setUploading(false);
    }
  };

  const notarySigner = (contract: ContractRequest) => 
    contract.signers.find(s => s.role === 'notary');

  const filteredContracts = contracts.filter(contract => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      contract.templateVersion.template.title.toLowerCase().includes(searchLower) ||
      contract.tracking_code.toLowerCase().includes(searchLower) ||
      contract.buyer_email.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Status filter
    const notary = notarySigner(contract);
    if (filter === 'pending') return notary && !notary.has_signed;
    if (filter === 'signed') return notary && notary.has_signed;
    return true;
  });

  const pendingCount = contracts.filter(c => {
    const notary = notarySigner(c);
    return notary && !notary.has_signed;
  }).length;
  
  const signedCount = contracts.filter(c => {
    const notary = notarySigner(c);
    return notary && notary.has_signed;
  }).length;

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
              <p className="text-2xl font-bold text-slate-900">{contracts.length}</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[35%]">Contrato / Código</th>
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
                            onClick={() => handleDownloadContract(contract.id)}
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
