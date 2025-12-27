// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ContractUploader } from '../../components/admin/ContractUpload';
import { 
  getAdminTemplates, 
  createTemplate, 
  publishVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion
} from '../../services/api';
import { 
  Search, 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Upload,
  X
} from 'lucide-react';

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
  created_at: string;
  base_form_schema: any[];
  capsules?: Capsule[];
}

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    slug: '',
    description: ''
  });

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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate(newTemplate);
      setShowNewTemplateModal(false);
      setNewTemplate({ title: '', slug: '', description: '' });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handlePublishVersion = async (versionId: number) => {
    try {
      await publishVersion(versionId);
      loadTemplates();
      alert('Versión publicada exitosamente');
    } catch (error) {
      console.error('Error publishing version:', error);
    }
  };

  const handleDownloadVersion = async (versionId: number) => {
    try {
      const result = await getTemplateVersionDownloadUrl(versionId);
      
      if (result.success) {
        // Abrir el archivo en una nueva ventana
        const downloadUrl = result.download_url.startsWith('http') 
          ? result.download_url 
          : `${window.location.origin}${result.download_url}`;
        
        // Crear un elemento temporal para descargar
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
    if (!confirm(`¿Estás seguro de eliminar la versión ${versionNumber}? Esto también eliminará todas sus cápsulas asociadas.`)) {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando templates...</div>
        </div>
      </AdminLayout>
    );
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                          (filterActive === 'active' && template.is_active) ||
                          (filterActive === 'inactive' && !template.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Active filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        {/* New template button */}
        <button
          onClick={() => setShowNewTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Template
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay templates {searchQuery ? 'que coincidan con la búsqueda' : 'creados aún'}</p>
          {!searchQuery && (
            <button
              onClick={() => setShowNewTemplateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Crear primer template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{template.title}</h3>
                      <p className="text-xs text-slate-500">{template.slug}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    template.is_active 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {template.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inactivo
                      </>
                    )}
                  </span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {template.description || 'Sin descripción'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{template.versions?.length || 0} versiones</span>
                  {template.versions?.some(v => v.is_published) && (
                    <span className="text-emerald-600 font-medium">● Publicado</span>
                  )}
                </div>
              </div>

              {/* Expand/collapse versions */}
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                className="w-full px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span>Ver detalles</span>
                {expandedTemplate === template.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Expanded content */}
              {expandedTemplate === template.id && (
                <div className="border-t border-slate-200 p-5 bg-slate-50/50">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Versiones</h4>
                  
                  {template.versions && template.versions.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {template.versions.map((version) => (
                        <div
                          key={version.id}
                          className="bg-white rounded-lg border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-slate-900">v{version.version_number}</span>
                              <span className="mx-2 text-slate-300">•</span>
                              <span className="text-sm text-slate-500">${version.base_price}</span>
                              <span className="mx-2 text-slate-300">•</span>
                              <span className={`text-xs font-medium ${
                                version.is_published ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                {version.is_published ? 'Publicada' : 'Borrador'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadVersion(version.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Descargar"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {!version.is_published && (
                                <>
                                  <button
                                    onClick={() => handlePublishVersion(version.id)}
                                    className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                                  >
                                    Publicar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVersion(version.id, version.version_number)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Capsules count */}
                          {version.capsules && version.capsules.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <span className="text-xs text-slate-500">
                                {version.capsules.length} cápsulas opcionales
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mb-4">Sin versiones</p>
                  )}

                  {/* Upload new version */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Upload className="w-4 h-4" />
                      <span>Subir nueva versión</span>
                    </div>
                    <ContractUploader 
                      templateId={template.id} 
                      onUploadSuccess={() => loadTemplates()}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Template Modal */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewTemplateModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Crear Nuevo Template</h2>
              <button
                onClick={() => setShowNewTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  required
                  placeholder="Ej: Contrato de Arrendamiento"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={newTemplate.slug}
                  onChange={(e) => setNewTemplate({ 
                    ...newTemplate, 
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                  })}
                  required
                  placeholder="ej: contrato-arrendamiento"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-slate-500 mt-1">Identificador único (solo letras, números y guiones)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe brevemente este template..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Crear Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};