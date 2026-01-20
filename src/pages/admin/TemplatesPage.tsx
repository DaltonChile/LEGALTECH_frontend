// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminTemplates, 
  publishVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion,
  deleteTemplate,
  updateTemplateStatus
} from '../../services/api';
import { Search, Plus, FileText, Edit, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import { 
  CreateTemplateModal, 
  TemplateDetailModal 
} from '../../components/admin/templates';
import type { Template, FilterType } from '../../types/templates';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handlePublishVersion = async (versionId: string) => {
    try {
      await publishVersion(versionId);
      
      // Recargar templates inmediatamente
      await loadTemplates();
      
      // Actualizar template seleccionado si está abierto
      if (selectedTemplate) {
        // Esperar un momento para que la base de datos se actualice
        setTimeout(async () => {
          const response = await getAdminTemplates();
          const updated = response.data.data.find((t: Template) => t.id === selectedTemplate.id);
          if (updated) {
            setSelectedTemplate(updated);
          }
        }, 500);
      }
      
      alert('Versión publicada exitosamente');
    } catch (error: any) {
      console.error('Error publishing version:', error);
      const errorMessage = error.response?.data?.error || 'Error al publicar la versión';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDownloadVersion = async (versionId: string) => {
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

  const handleDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`¿Estás seguro de eliminar la versión ${versionNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      console.log('Deleting version with ID:', versionId, 'type:', typeof versionId);
      await deleteTemplateVersion(versionId);
      
      // Recargar templates inmediatamente
      await loadTemplates();
      
      // Actualizar template seleccionado si está abierto
      if (selectedTemplate) {
        setTimeout(async () => {
          const response = await getAdminTemplates();
          const updated = response.data.data.find((t: Template) => t.id === selectedTemplate.id);
          if (updated) {
            setSelectedTemplate(updated);
          }
        }, 500);
      }
      
      alert('Versión eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting version:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar la versión';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    // Mostrar opciones de eliminación
    const action = prompt(
      `¿Qué acción deseas realizar con "${templateTitle}"?\n\n` +
      '1. Desactivar (soft delete - se puede reactivar)\n' +
      '2. Eliminar permanentemente (hard delete - NO se puede recuperar)\n\n' +
      'Escribe "1" para desactivar o "2" para eliminar permanentemente:'
    );

    if (!action || !['1', '2'].includes(action)) {
      return; // Usuario canceló o ingresó opción inválida
    }

    const isHardDelete = action === '2';
    const confirmMessage = isHardDelete 
      ? `⚠️ PELIGRO: ¿Estás ABSOLUTAMENTE SEGURO de eliminar permanentemente "${templateTitle}"?\n\nEsta acción:\n- Eliminará el template PARA SIEMPRE\n- Eliminará TODAS sus versiones\n- Eliminará TODAS las cápsulas asociadas\n- NO SE PUEDE DESHACER\n\n¡Escribe "ELIMINAR" para confirmar!`
      : `¿Estás seguro de desactivar el template "${templateTitle}"?\n\nEl template dejará de estar visible en el catálogo pero se podrá reactivar después.`;
    
    if (isHardDelete) {
      const confirmation = prompt(confirmMessage);
      if (confirmation !== 'ELIMINAR') {
        return;
      }
    } else {
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await deleteTemplate(templateId, isHardDelete);
      loadTemplates();
      setSelectedTemplate(null);
      const successMessage = isHardDelete ? 'Template eliminado permanentemente' : 'Template desactivado exitosamente';
      alert(successMessage);
    } catch (error: any) {
      console.error('Error deleting template:', error);
      const errorMessage = error.response?.data?.error || 'Error al procesar la eliminación';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    const template = templates.find(t => t.id === templateId);
    
    if (!currentStatus) {
      // Intentando publicar
      const hasPublishedVersion = template?.versions?.some(v => v.is_published);
      const latestVersion = template?.versions?.[0];
      
      if (!latestVersion) {
        alert('No se puede publicar un template sin versiones. Sube una versión primero.');
        return;
      }

      let message = '¿Estás seguro de publicar este template?';
      if (!hasPublishedVersion) {
        message = `¿Estás seguro de publicar este template?\n\nSe publicará automáticamente la versión ${latestVersion.version_number} (la más reciente).`;
      }
      
      if (!confirm(message)) return;
    } else {
      // Intentando esconder
      if (!confirm('¿Estás seguro de esconder este template del catálogo público?')) {
        return;
      }
    }

    try {
      console.log('🔄 Updating template:', templateId, 'type:', typeof templateId, 'to:', !currentStatus);
      await updateTemplateStatus(String(templateId), !currentStatus);
      console.log('✅ Template updated successfully');
      loadTemplates();
      const action = currentStatus ? 'escondido' : 'publicado';
      alert(`Template ${action} exitosamente`);
    } catch (error: any) {
      console.error('❌ Error updating template:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al actualizar el template: ${errorMessage}`);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="p-0"> {/* Removed padding to fit dashboard style better */}
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plantillas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los modelos de contratos disponibles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewTemplateForm(true)}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Filters & Search - Styled like a toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filterStatus === status 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'all' && 'Todos'}
              {status === 'published' && 'Publicados'}
              {status === 'draft' && 'Borradores'}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-lg mb-1">No se encontraron plantillas</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              {searchQuery ? 'Intenta ajustar tus filtros o búsqueda' : 'Comienza creando tu primera plantilla de contrato'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewTemplateForm(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Crear Plantilla
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[40%]">Nombre / Slug</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio Base</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((template) => {
                  const hasPublishedVersion = template.versions?.some(v => v.is_published);
                  const publishedVersion = template.versions?.find(v => v.is_published);
                  const latestVersion = template.versions?.[0];
                  
                  return (
                    <tr key={template.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${hasPublishedVersion ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{template.title}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{template.slug}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {template.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactivo
                          </span>
                        )}
                        <div className="mt-1 text-[10px] text-slate-400">
                          {hasPublishedVersion ? 'Versión publicada disponible' : 'Sin versión publicada'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 text-sm">
                          ${(publishedVersion?.base_price || latestVersion?.base_price || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                         {latestVersion ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700">v{latestVersion.version_number}</span>
                              <span className="text-xs text-slate-400 text-[10px]">
                                {new Date(latestVersion.created_at).toLocaleDateString()}
                              </span>
                            </div>
                         ) : (
                           <span className="text-xs text-slate-400 italic">--</span>
                         )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Download Button - only if published version exists */}
                          {publishedVersion && (
                            <button 
                              onClick={() => handleDownloadVersion(publishedVersion.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Descargar versión publicada"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Active Button */}
                          <button 
                            onClick={() => handleToggleActive(template.id, template.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              template.is_active 
                                ? 'text-green-600 hover:bg-green-50 hover:text-green-700' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={template.is_active ? "Desactivar plantilla" : "Activar plantilla"}
                          >
                            {template.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit Button */}
                          <button 
                            onClick={() => navigate(`/admin/templates/${template.id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar plantilla"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDeleteTemplate(template.id, template.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
