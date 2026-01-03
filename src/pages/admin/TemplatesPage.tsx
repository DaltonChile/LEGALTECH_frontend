// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  getAdminTemplates, 
  publishVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion,
  deleteTemplate
} from '../../services/api';
import { Search, Plus, FileText } from 'lucide-react';
import { 
  TemplateCard, 
  CreateTemplateModal, 
  TemplateDetailModal 
} from '../../components/admin/templates';
import type { Template, FilterType } from '../../types/templates';

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

  const handleToggleActive = async (templateId: number, currentStatus: boolean) => {
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
      const response = await fetch(`/api/v1/admin/templates/${templateId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Error updating template');

      loadTemplates();
      const action = currentStatus ? 'escondido' : 'publicado';
      alert(`Template ${action} exitosamente`);
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar el template');
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
              onDownload={handleDownloadVersion}
              onToggleActive={handleToggleActive}
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
