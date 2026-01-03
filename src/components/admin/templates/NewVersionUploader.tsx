import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadTemplateVersion, setCapsulePrices } from '../../../services/api';
import type { CapsulePending } from '../../../types/templates';

interface NewVersionUploaderProps {
  templateId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const NewVersionUploader: React.FC<NewVersionUploaderProps> = ({ templateId, onSuccess, onCancel }) => {
  const [basePrice, setBasePrice] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [capsulesPending, setCapsulesPending] = useState<CapsulePending[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo');
      return;
    }

    if (!basePrice || parseInt(basePrice) <= 0) {
      setError('Ingresa un precio válido');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadTemplateVersion(templateId, selectedFile, parseInt(basePrice));
      
      if (response.data.requires_capsule_pricing && response.data.data.capsules_pending_price) {
        setVersionId(response.data.data.version.id);
        const capsulesWithDefaultPrices = response.data.data.capsules_pending_price.map((cap: CapsulePending) => ({
          ...cap,
          price: 10000
        }));
        setCapsulesPending(capsulesWithDefaultPrices);
        setShowPricing(true);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrices = async () => {
    if (!versionId) return;

    setUploading(true);
    try {
      await setCapsulePrices(versionId, capsulesPending);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al asignar precios');
    } finally {
      setUploading(false);
    }
  };

  if (showPricing) {
    return (
      <div className="border-2 border-cyan-200 bg-cyan-50 rounded-xl p-4 space-y-4">
        <h4 className="font-medium text-slate-900">Configurar precios de cápsulas</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {capsulesPending.map((capsule) => (
            <div key={capsule.slug} className="flex items-center justify-between bg-white rounded-lg p-3">
              <span className="text-sm text-slate-700">{capsule.title}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  value={capsule.price || ''}
                  onChange={(e) => setCapsulesPending(prev => 
                    prev.map(c => c.slug === capsule.slug ? { ...c, price: parseInt(e.target.value) || 0 } : c)
                  )}
                  className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onSuccess} className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">
            Omitir
          </button>
          <button onClick={handleSetPrices} disabled={uploading} className="flex-1 px-3 py-2 bg-cyan-100 text-slate-700 border border-cyan-300 rounded-lg text-sm hover:bg-cyan-200">
            {uploading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-cyan-200 bg-cyan-50 rounded-xl p-4 space-y-4">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Precio Base</label>
          <input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="29990"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Archivo .docx</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-cyan-400 bg-white' : 'border-slate-300'
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <p className="text-sm text-slate-700 truncate">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-slate-500">Arrastra o selecciona</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">
          Cancelar
        </button>
        <button 
          onClick={handleUpload} 
          disabled={uploading || !selectedFile}
          className="flex-1 px-3 py-2 bg-cyan-100 text-slate-700 border border-cyan-300 rounded-lg text-sm disabled:opacity-50 hover:bg-cyan-200"
        >
          {uploading ? 'Subiendo...' : 'Subir versión'}
        </button>
      </div>
    </div>
  );
};

export default NewVersionUploader;
