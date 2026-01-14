import React, { useEffect, useState } from 'react';
import { Download, Upload, Clock, CheckCircle, FileText, Mail } from 'lucide-react';
import { notaryApi, NotaryContract } from '../../services/api';

type ContractRequest = NotaryContract;

export const NotaryInboxPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'signed' | 'all'>('pending');
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

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'pending') return contract.status === 'waiting_notary';
    if (filter === 'signed') return contract.status === 'signed';
    return true;
  });

  const notarySigner = (contract: ContractRequest) => 
    contract.signers.find(s => s.role === 'notary');

  const pendingCount = contracts.filter(c => c.status === 'waiting_notary').length;
  const signedCount = contracts.filter(c => c.status === 'signed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Firmados</p>
              <p className="text-3xl font-bold text-green-600">{signedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total</p>
              <p className="text-3xl font-bold text-slate-900">{contracts.length}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
          }`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('signed')}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
            filter === 'signed'
              ? 'bg-green-100 text-green-700 border-2 border-green-400'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
          }`}
        >
          Firmados ({signedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
            filter === 'all'
              ? 'bg-slate-100 text-slate-700 border-2 border-slate-300'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
          }`}
        >
          Todos ({contracts.length})
        </button>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No hay contratos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const signer = notarySigner(contract);
            const isPending = contract.status === 'waiting_notary';
            
            return (
              <div
                key={contract.id}
                className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                  isPending 
                    ? 'border-amber-200 hover:border-amber-400' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {contract.templateVersion.template.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                        isPending
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-green-50 text-green-700 border-green-300'
                      }`}>
                        {isPending ? '⏱ Pendiente' : '✓ Firmado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-500">Código</p>
                        <p className="font-mono text-sm font-semibold text-slate-900">{contract.tracking_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Solicitante</p>
                        <p className="text-sm font-semibold text-slate-900">{contract.buyer_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Monto</p>
                        <p className="text-sm font-semibold text-slate-900">${contract.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Fecha</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {signer && signer.has_signed && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-green-700">
                          ✓ Firmado el {new Date(signer.signed_at!).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownloadContract(contract.id)}
                      className="px-5 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Descargar
                    </button>

                    {isPending && (
                      <label className="px-5 py-3 bg-gradient-to-r from-lime-100 to-cyan-100 text-slate-700 border-2 border-lime-400 rounded-xl font-semibold hover:from-lime-200 hover:to-cyan-200 transition-all flex items-center gap-2 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Subir Firmado
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
