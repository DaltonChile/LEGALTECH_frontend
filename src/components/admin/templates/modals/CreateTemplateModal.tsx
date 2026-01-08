import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { createTemplate, uploadTemplateVersion, setCapsulePrices } from '../../../../services/api';
import type { CapsulePending } from '../../../../types/templates';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSuccess: () => void;
  existingSlugs: string[];
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onSuccess, existingSlugs }) => {
  const [step, setStep] = useState<'info' | 'upload' | 'pricing'>('info');
  const [templateData, setTemplateData] = useState({
    title: '',
    slug: '',
    description: ''
  });

  const generateSlug = (title: string): string => {
    let baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    if (!baseSlug) return '';
    
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return finalSlug;
  };

  const handleTitleChange = (title: string) => {
    const newSlug = generateSlug(title);
    setTemplateData({ ...templateData, title, slug: newSlug });
  };

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState('');
  const [requiresNotary, setRequiresNotary] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleCreateTemplate = async () => {
    if (!templateData.title || !templateData.slug) {
      setError('Título y slug son requeridos');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await createTemplate(templateData);
      setTemplateId(response.data.data.id);
      setStep('upload');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el template');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedFile || !templateId) {
      setError('Selecciona un archivo .docx');
      return;
    }

    if (!basePrice || parseInt(basePrice) <= 0) {
      setError('Ingresa un precio base válido');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadTemplateVersion(templateId, selectedFile, parseInt(basePrice), requiresNotary);
      
      if (response.data.requires_capsule_pricing && response.data.data.capsules_pending_price) {
        setVersionId(response.data.data.version.id);
        const capsulesWithDefaultPrices = response.data.data.capsules_pending_price.map((cap: CapsulePending) => ({
          ...cap,
          price: 10000
        }));
        setCapsulesPending(capsulesWithDefaultPrices);
        setStep('pricing');
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

    const invalidCapsules = capsulesPending.filter(cap => !cap.price || cap.price <= 0);
    if (invalidCapsules.length > 0) {
      setError('Todas las cápsulas necesitan un precio válido');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await setCapsulePrices(versionId, capsulesPending);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al asignar precios');
    } finally {
      setUploading(false);
    }
  };

  const handlePriceChange = (slug: string, price: string) => {
    setCapsulesPending(prev => 
      prev.map(cap => 
        cap.slug === slug ? { ...cap, price: parseInt(price) || 0 } : cap
      )
    );
  };

  return (
    <Modal onClose={onClose} wide={step === 'pricing'} title={
      step === 'info' ? 'Crear Nuevo Template' :
      step === 'upload' ? 'Subir Documento' :
      'Configurar Precios de Cápsulas'
    }>
      <p className="text-slate-500 text-sm mb-6">
        {step === 'info' && 'Paso 1 de 3: Información básica del template'}
        {step === 'upload' && 'Paso 2 de 3: Sube el documento .docx con las variables'}
        {step === 'pricing' && 'Paso 3 de 3: Asigna precios a las cápsulas detectadas'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === 'info' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
            <input
              type="text"
              value={templateData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej: Contrato de Arrendamiento"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {templateData.slug && (
              <p className="text-xs text-slate-500 mt-2">
                URL: /<span className="font-mono">{templateData.slug}</span>
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              value={templateData.description}
              onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
              placeholder="Describe el template..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Creando...' : 'Siguiente paso →'}
            </button>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Base (CLP) *</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="29990"
              min="0"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Documento .docx *</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              {selectedFile ? (
                <div>
                  <p className="text-slate-900 font-medium">{selectedFile.name}</p>
                  <p className="text-slate-500 text-sm mt-1">Click para cambiar</p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600">Arrastra un archivo .docx aquí</p>
                  <p className="text-slate-400 text-sm mt-1">o haz click para seleccionar</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="requiresNotary"
              checked={requiresNotary}
              onChange={(e) => setRequiresNotary(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="requiresNotary" className="flex-1">
              <span className="font-medium text-slate-700">Requiere Notario</span>
              <p className="text-xs text-slate-500">Este contrato necesita firma ante notario</p>
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('info')}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Atrás
            </button>
            <button
              onClick={handleUploadVersion}
              disabled={uploading || !selectedFile}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Subiendo...' : 'Siguiente Paso →'}
            </button>
          </div>
        </div>
      )}

      {step === 'pricing' && (
        <div className="space-y-5">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {capsulesPending.map((capsule) => (
              <div key={capsule.slug} className="border-2 border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-900">{capsule.title}</h4>
                    <p className="text-xs text-slate-500">{capsule.variables_count} variables detectadas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">$</span>
                    <input
                      type="number"
                      value={capsule.price || ''}
                      onChange={(e) => handlePriceChange(capsule.slug, e.target.value)}
                      placeholder="10000"
                      min="0"
                      className="w-28 px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors text-right"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onSuccess}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Omitir (asignar después)
            </button>
            <button
              onClick={handleSetPrices}
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Guardando...' : 'Finalizar ✓'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateTemplateModal;
