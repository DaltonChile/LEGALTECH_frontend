import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { createTemplate, uploadTemplateVersion, setCapsulePrices, getTemplateCategories } from '../../../../services/api';
import type { CapsulePending } from '../../../../types/templates';
import { DescriptionEditor } from '../DescriptionEditor';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSuccess: () => void;
  existingSlugs: string[];
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onSuccess, existingSlugs }) => {
  const [showPricing, setShowPricing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [templateData, setTemplateData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    requires_notary: false,
    category: ''
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getTemplateCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback categories
        setCategories(['laboral', 'arrendamiento', 'compraventa', 'servicios', 'otros']);
      }
    };
    loadCategories();
  }, []);

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

  const [basePrice, setBasePrice] = useState('29990');
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
    // Validaciones
    if (!templateData.title || !templateData.slug) {
      setError('Título es requerido');
      return;
    }

    if (!selectedFile) {
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
      // Paso 1: Crear el template
      const templateResponse = await createTemplate(templateData);
      const templateId = templateResponse.data.data.id;

      // Paso 2: Subir el documento
      const versionResponse = await uploadTemplateVersion(templateId, selectedFile, parseInt(basePrice));
      
      console.log('Version Response:', versionResponse.data);
      
      // Si hay cápsulas que necesitan precio, mostrar modal de pricing
      if (versionResponse.data.requires_capsule_pricing && versionResponse.data.data.capsules_pending_price) {
        setVersionId(versionResponse.data.data.version.id);
        const capsulesWithDefaultPrices = versionResponse.data.data.capsules_pending_price.map((cap: CapsulePending) => ({
          ...cap,
          price: 10000
        }));
        setCapsulesPending(capsulesWithDefaultPrices);
        setShowPricing(true);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      if (typeof errorData === 'object' && errorData !== null) {
        setError(errorData.message || 'Error al crear el template');
      } else {
        setError(errorData || 'Error al crear el template');
      }
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
      const errorData2 = err.response?.data?.error;
      if (typeof errorData2 === 'object' && errorData2 !== null) {
        setError(errorData2.message || 'Error al asignar precios');
      } else {
        setError(errorData2 || 'Error al asignar precios');
      }
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

  // Modal de pricing de cápsulas (solo se muestra después de crear el template)
  if (showPricing) {
    return (
      <Modal onClose={onClose} wide title="Configurar Precios de Cápsulas">
        <p className="text-slate-500 text-sm mb-6">
          Se detectaron cápsulas en el documento. Asigna precios a cada una.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

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
              onClick={handleSetPrices}
              disabled={uploading}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Guardando...' : 'Finalizar ✓'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Crear Nuevo Template" extraWide>
      <p className="text-slate-500 text-sm mb-6">
        Completa la información del template y sube el documento .docx
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Título */}
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
        
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción Principal
            <span className="text-xs font-normal text-slate-400 ml-2">(soporta Markdown con vista previa)</span>
          </label>
          <DescriptionEditor
            value={templateData.description}
            onChange={(value) => setTemplateData({ ...templateData, description: value })}
          />
        </div>

        {/* Descripción Corta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción Corta
            <span className="text-xs font-normal text-slate-400 ml-2">(para catálogo, máx 255)</span>
          </label>
          <input
            type="text"
            value={templateData.short_description}
            onChange={(e) => setTemplateData({ ...templateData, short_description: e.target.value.slice(0, 255) })}
            placeholder="Ej: Contrato para formalizar la relación entre arrendador e inquilino"
            maxLength={255}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{templateData.short_description.length}/255</p>
        </div>

        {/* Precio Base */}
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

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
          <select
            value={templateData.category}
            onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors bg-white"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Documento */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Documento .docx *</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
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

        {/* Requiere Notario */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <input
            type="checkbox"
            id="templateRequiresNotary"
            checked={templateData.requires_notary}
            onChange={(e) => setTemplateData({ ...templateData, requires_notary: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <label htmlFor="templateRequiresNotary" className="flex-1">
            <span className="font-medium text-slate-700">Requiere Notario</span>
            <p className="text-xs text-slate-500">Este template requiere firma ante notario</p>
          </label>
        </div>
        
        {/* Botones */}
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
            disabled={uploading || !templateData.title || !selectedFile}
            className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-all disabled:opacity-50 shadow-md"
          >
            {uploading ? 'Creando...' : 'Crear Template'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTemplateModal;
