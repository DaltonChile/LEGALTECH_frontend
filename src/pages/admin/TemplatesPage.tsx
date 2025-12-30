// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  getAdminTemplates, 
  createTemplate, 
  publishVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion,
  deleteTemplate,
  uploadTemplateVersion,
  setCapsulePrices
} from '../../services/api';
import api from '../../services/api';
import { Search, Plus, FileText, Download, Trash2, X, ChevronRight, Upload, Edit2, Save } from 'lucide-react';

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  versions: Version[];
}

interface Capsule {
  id: number;
  slug: string;
  title: string;
  price: number;
  display_order: number;
  form_schema: any[];
}

interface Version {
  id: number;
  version_number: number;
  base_price: number;
  is_published: boolean;
  requires_notary: boolean;
  created_at: string;
  base_form_schema: any[];
  capsules?: Capsule[];
}

interface CapsulePending {
  slug: string;
  title: string;
  legal_text: string;
  form_schema: any[];
  display_order: number;
  variables_count: number;
  price?: number;
}

type FilterType = 'all' | 'published' | 'draft';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await getAdminTemplates();
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVersion = async (versionId: number) => {
    try {
      await publishVersion(versionId);
      loadTemplates();
      // Refresh selected template
      if (selectedTemplate) {
        const updated = templates.find(t => t.id === selectedTemplate.id);
        if (updated) setSelectedTemplate(updated);
      }
      alert('Versión publicada exitosamente');
    } catch (error) {
      console.error('Error publishing version:', error);
    }
  };

  const handleDownloadVersion = async (versionId: number) => {
    try {
      const result = await getTemplateVersionDownloadUrl(versionId);
      
      if (result.success) {
        const downloadUrl = result.download_url.startsWith('http') 
          ? result.download_url 
          : `${window.location.origin}${result.download_url}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename || 'template.docx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading version:', error);
      alert('Error al descargar el template');
    }
  };

  const handleDeleteVersion = async (versionId: number, versionNumber: number) => {
    if (!confirm(`¿Estás seguro de eliminar la versión ${versionNumber}?`)) {
      return;
    }

    try {
      await deleteTemplateVersion(versionId);
      loadTemplates();
      alert('Versión eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting version:', error);
      alert('Error al eliminar la versión');
    }
  };

  const handleDeleteTemplate = async (templateId: number, templateTitle: string) => {
    if (!confirm(`¿Estás seguro de desactivar el template "${templateTitle}"? El template dejará de estar visible en el catálogo.`)) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      loadTemplates();
      setSelectedTemplate(null);
      alert('Template desactivado exitosamente');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al desactivar el template');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if template has a published version
    const hasPublishedVersion = template.versions?.some(v => v.is_published);
    
    let matchesFilter = true;
    if (filterStatus === 'published') {
      matchesFilter = hasPublishedVersion;
    } else if (filterStatus === 'draft') {
      matchesFilter = !hasPublishedVersion;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Search and Actions Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Status Filter Button */}
        <button 
          onClick={() => {
            const filters: FilterType[] = ['all', 'published', 'draft'];
            const currentIndex = filters.indexOf(filterStatus);
            const nextIndex = (currentIndex + 1) % filters.length;
            setFilterStatus(filters[nextIndex]);
          }}
          className={`px-6 py-3 border-2 rounded-2xl font-medium transition-all ${
            filterStatus === 'published' ? 'bg-green-50 border-green-400 text-green-700'
              : filterStatus === 'draft' ? 'bg-amber-50 border-amber-400 text-amber-700'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          {filterStatus === 'all' && 'Todos'}
          {filterStatus === 'published' && '✓ Publicados'}
          {filterStatus === 'draft' && '◐ Borrador'}
        </button>

        {/* New Template Button */}
        <button 
          onClick={() => setShowNewTemplateForm(true)}
          className="px-6 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-2xl font-semibold hover:bg-cyan-200 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Template
        </button>

      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg mb-4">
            {searchQuery ? 'No se encontraron templates' : 'No hay templates creados'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowNewTemplateForm(true)}
              className="px-6 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-2xl font-semibold hover:bg-cyan-200 transition-all shadow-md"
            >
              Crear tu primer template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template} 
              onClick={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* New Template Modal - Now with file upload */}
      {showNewTemplateForm && (
        <CreateTemplateModal
          onClose={() => setShowNewTemplateForm(false)}
          onSuccess={() => {
            setShowNewTemplateForm(false);
            loadTemplates();
          }}
          existingSlugs={templates.map(t => t.slug)}
        />
      )}

      {/* Template Detail/Edit Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => {
            setSelectedTemplate(null);
          }}
          onPublish={handlePublishVersion}
          onDownload={handleDownloadVersion}
          onDelete={handleDeleteVersion}
          onDeleteTemplate={handleDeleteTemplate}
          onUpdate={() => {
            loadTemplates();
            // Refresh the selected template data
            setTimeout(async () => {
              const response = await getAdminTemplates();
              const updated = response.data.data.find((t: Template) => t.id === selectedTemplate.id);
              if (updated) setSelectedTemplate(updated);
            }, 500);
          }}
        />
      )}
    </div>
  );
};

// ============================================
// Create Template Modal Component
// ============================================
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

  // Generate unique slug from title
  const generateSlug = (title: string): string => {
    let baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .trim();
    
    if (!baseSlug) return '';
    
    // Check if slug exists and add number if needed
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return finalSlug;
  };

  // Auto-generate slug when title changes
  const handleTitleChange = (title: string) => {
    const newSlug = generateSlug(title);
    setTemplateData({ ...templateData, title, slug: newSlug });
  };
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [basePrice, setBasePrice] = useState('');
  const [requiresNotary, setRequiresNotary] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Capsule pricing state
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
    <Modal onClose={onClose} wide={step === 'pricing'}>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {step === 'info' && 'Crear Nuevo Template'}
        {step === 'upload' && 'Subir Documento'}
        {step === 'pricing' && 'Configurar Precios de Cápsulas'}
      </h2>
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

      {/* Step 1: Template Info */}
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
              className="flex-1 px-4 py-3 bg-cyan-600 text-slate-600 rounded-xl font-semibold hover:bg-cyan-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Creando...' : 'Siguiente paso →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: File Upload */}
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
            <p className="text-xs text-slate-500 mt-2">
              Usa {"{{variable}}"} para campos base y {"[CAPSULE:nombre]contenido[/CAPSULE:nombre]"} para cápsulas opcionales
            </p>
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
              className="flex-1 px-4 py-3 bg-green-600 text-slate-600 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Subiendo...' : 'Siguiente Paso →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Capsule Pricing */}
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
              className="flex-1 px-4 py-3 bg-green-600 text-slate-600 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
            >
              {uploading ? 'Guardando...' : 'Finalizar ✓'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ============================================
// Template Detail Modal Component
// ============================================
interface TemplateDetailModalProps {
  template: Template;
  onClose: () => void;
  onPublish: (versionId: number) => void;
  onDownload: (versionId: number) => void;
  onDelete: (versionId: number, versionNumber: number) => void;
  onDeleteTemplate: (templateId: number, templateTitle: string) => void;
  onUpdate: () => void;
}

const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  onClose,
  onPublish,
  onDownload,
  onDelete,
  onDeleteTemplate,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: template.title,
    description: template.description || '',
    is_active: template.is_active
  });
  const [saving, setSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Calcular estado del template
  const hasPublishedVersion = template.versions?.some(v => v.is_published);
  const publishedVersion = template.versions?.find(v => v.is_published);
  
  const getTemplateStatus = () => {
    if (!template.is_active) return { label: 'Inactivo', desc: 'No visible en el catálogo', color: 'bg-slate-100 text-slate-600 border-slate-300' };
    if (hasPublishedVersion) return { label: 'Publicado', desc: 'Visible en el catálogo público', color: 'bg-green-50 text-green-700 border-green-300' };
    return { label: 'Borrador', desc: 'Necesita publicar una versión', color: 'bg-amber-50 text-amber-700 border-amber-300' };
  };
  
  const status = getTemplateStatus();

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/templates/${template.id}`, editData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar el template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      {/* Status Banner */}
      <div className={`-mx-6 -mt-6 px-6 py-3 mb-6 border-b ${status.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">{status.label}</span>
            <span className="text-sm ml-2 opacity-75">— {status.desc}</span>
          </div>
          {!template.is_active && (
            <button
              onClick={() => {
                setEditData({ ...editData, is_active: true });
                // Auto-save activation
                api.put(`/admin/templates/${template.id}`, { ...editData, is_active: true }).then(onUpdate);
              }}
              className="px-3 py-1 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 border"
            >
              Activar template
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-xl font-bold text-slate-900 w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Descripción..."
                rows={2}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 resize-none text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editData.is_active}
                  onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">Template activo (visible en catálogo si tiene versión publicada)</span>
              </label>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-900">{template.title}</h2>
              <p className="text-slate-500 mt-1">{template.description || 'Sin descripción'}</p>
              <span className="text-xs text-slate-400 font-mono">/{template.slug}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="px-3 py-1.5 bg-cyan-100 text-slate-700 border border-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-200 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              {template.is_active && (
                <button
                  onClick={() => onDeleteTemplate(template.id, template.title)}
                  className="px-3 py-1.5 border-2 border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Desactivar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Published Version Info */}
      {publishedVersion && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">Versión publicada: v{publishedVersion.version_number}</p>
              <p className="text-green-600 text-sm">Precio: ${publishedVersion.base_price?.toLocaleString()} • {publishedVersion.base_form_schema?.length || 0} campos</p>
            </div>
            <button
              onClick={() => onDownload(publishedVersion.id)}
              className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          </div>
        </div>
      )}

      {/* Versions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Todas las versiones ({template.versions?.length || 0})
          </h3>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-3 py-1.5 bg-cyan-100 text-slate-700 border border-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-200 flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Subir nueva versión
          </button>
        </div>

        {showUploader && (
          <NewVersionUploader
            templateId={template.id}
            onSuccess={() => {
              setShowUploader(false);
              onUpdate();
            }}
            onCancel={() => setShowUploader(false)}
          />
        )}

        {template.versions && template.versions.length > 0 ? (
          <div className="space-y-2">
            {template.versions.map((version) => (
              <div 
                key={version.id} 
                className={`border-2 rounded-xl p-4 transition-colors ${
                  version.is_published 
                    ? 'border-green-300 bg-green-50/50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-900">v{version.version_number}</span>
                    {version.is_published ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✓ Publicada
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Borrador
                      </span>
                    )}
                    <span className="text-sm text-slate-500">${version.base_price?.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                    {version.requires_notary && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        🏛 Notario
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDownload(version.id)}
                      className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Descargar .docx"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!version.is_published && (
                      <>
                        <button
                          onClick={() => onPublish(version.id)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Publicar
                        </button>
                        <button
                          onClick={() => onDelete(version.id, version.version_number)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Version details */}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span>{version.base_form_schema?.length || 0} campos</span>
                  {version.capsules && version.capsules.length > 0 && (
                    <span className="text-amber-600">{version.capsules.length} cápsulas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No hay versiones</p>
            <p className="text-slate-400 text-sm">Sube un archivo .docx para crear la primera versión</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ============================================
// New Version Uploader Component
// ============================================
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

// ============================================
// Template Card Component
// ============================================
const TemplateCard: React.FC<{ template: Template; onClick: () => void }> = ({ template, onClick }) => {
  const latestVersion = template.versions?.[0];
  const hasPublishedVersion = template.versions?.some(v => v.is_published);
  
  // Determinar el estado del template de forma simple
  const getStatus = () => {
    if (!template.is_active) return { label: 'Inactivo', color: 'bg-slate-100 text-slate-500' };
    if (hasPublishedVersion) return { label: 'Publicado', color: 'bg-green-100 text-green-700' };
    return { label: 'Borrador', color: 'bg-amber-100 text-amber-700' };
  };
  
  const status = getStatus();
  
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300 cursor-pointer"
    >
      {/* Icon */}
      <div className="w-14 h-14 bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-600 rounded-xl flex items-center justify-center mb-5 transition-all duration-300">
        <FileText className="w-7 h-7 text-slate-600 group-hover:text-white transition-colors duration-300" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
        {template.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
        {template.description || 'Sin descripción'}
      </p>

      {/* Price */}
      {latestVersion && (
        <p className="text-lg font-bold text-slate-900 mb-4">
          ${latestVersion.base_price?.toLocaleString() || 0}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {template.versions?.length || 0} versión{template.versions?.length !== 1 ? 'es' : ''}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
      </div>
    </div>
  );
};

// ============================================
// Modal Component
// ============================================
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; wide?: boolean }> = ({ 
  children, 
  onClose,
  wide = false 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto relative`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
