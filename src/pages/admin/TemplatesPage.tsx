// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminTemplates, 
  getTemplateVersionDownloadUrl,
  deleteTemplate,
  updateTemplateStatus,
  getTemplateCategories
} from '../../services/api';
import { Search, Plus, FileText, Edit, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import type { Template, FilterType } from '../../types/templates';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';
import { Button } from '../../components/ui/primitives/Button';
import { Badge } from '../../components/ui/primitives/Badge';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);


  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getTemplateCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(['laboral', 'arrendamiento', 'compraventa', 'servicios', 'otros']);
    }
  };

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

  const handleDownloadVersion = async (versionId: string) => {
    try {
      const result = await getTemplateVersionDownloadUrl(versionId);
      
      if (result.success) {
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = result.filename || 'template.docx';
        
        // No abrir en nueva pestaña para blobs
        if (!result.isBlob) {
          link.target = '_blank';
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar memoria del blob URL
        if (result.isBlob) {
          setTimeout(() => window.URL.revokeObjectURL(result.download_url), 100);
        }
      }
    } catch (error) {
      console.error('Error downloading version:', error);
      alert('Error al descargar el template');
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

    // Category filter
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesFilter && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="p-0"> {/* Removed padding to fit dashboard style better */}
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Text variant="h2">Plantillas</Text>
          <Text variant="body-sm" color="muted" className="mt-1">Gestiona los modelos de contratos disponibles</Text>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/templates/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Filters & Search - Styled like a toolbar */}
      <Box variant="document" padding="md" className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900 transition-all"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900 transition-all"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium font-sans rounded-md transition-all ${
                filterStatus === status 
                  ? 'bg-white text-navy-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'all' && 'Todos'}
              {status === 'published' && 'Publicados'}
              {status === 'draft' && 'Borradores'}
            </button>
          ))}
        </div>
      </Box>

      {/* Templates Table Container */}
      <Box variant="document" padding="none" className="overflow-hidden">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <Text variant="h4" className="mb-1">No se encontraron plantillas</Text>
            <Text variant="body-sm" color="muted" className="max-w-sm mx-auto mb-6">
              {searchQuery ? 'Intenta ajustar tus filtros o búsqueda' : 'Comienza creando tu primera plantilla de contrato'}
            </Text>
            {!searchQuery && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/admin/templates/new')}
              >
                Crear Plantilla
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 w-[35%]">
                    <Text variant="caption" color="muted">NOMBRE / SLUG</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">CATEGORÍA</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">ESTADO</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">PRECIO BASE</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">VERSIÓN</Text>
                  </th>
                  <th className="text-right px-6 py-4">
                    <Text variant="caption" color="muted">ACCIONES</Text>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTemplates.map((template) => {
                  const hasPublishedVersion = template.versions?.some(v => v.is_published);
                  const publishedVersion = template.versions?.find(v => v.is_published);
                  const latestVersion = template.versions?.[0];
                  
                  return (
                    <tr key={template.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${hasPublishedVersion ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <Text variant="body-sm" weight="bold" color="primary">{template.title}</Text>
                            <Text variant="caption" color="muted" className="font-mono mt-0.5">{template.slug}</Text>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {template.category ? (
                          <Badge variant="info" size="sm">
                            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                          </Badge>
                        ) : (
                          <Text variant="caption" color="muted" className="italic">Sin categoría</Text>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <Badge variant={template.is_active ? 'success' : 'draft'} size="sm">
                          {template.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <div className="mt-1">
                          <Text variant="caption" color="muted" className="text-[10px]">
                            {hasPublishedVersion ? 'Versión publicada disponible' : 'Sin versión publicada'}
                          </Text>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Text variant="body-sm" weight="medium" color="primary">
                          ${(publishedVersion?.base_price || latestVersion?.base_price || 0).toLocaleString()}
                        </Text>
                      </td>

                      <td className="px-6 py-4">
                         {latestVersion ? (
                            <div className="flex flex-col">
                              <Text variant="body-sm" color="secondary">v{latestVersion.version_number}</Text>
                              <Text variant="caption" color="muted" className="text-[10px]">
                                {new Date(latestVersion.created_at).toLocaleDateString()}
                              </Text>
                            </div>
                         ) : (
                           <Text variant="caption" color="muted" className="italic">--</Text>
                         )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Download Button - only if published version exists */}
                          {publishedVersion && (
                            <button 
                              onClick={() => handleDownloadVersion(publishedVersion.id)}
                              className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
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
                                ? 'text-legal-emerald-700 hover:bg-legal-emerald-50 hover:text-legal-emerald-800' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={template.is_active ? "Desactivar plantilla" : "Activar plantilla"}
                          >
                            {template.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit Button */}
                          <button 
                            onClick={() => navigate(`/admin/templates/${template.id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
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
      </Box>


    </div>
  );
};
