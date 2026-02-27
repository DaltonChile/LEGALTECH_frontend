// LEGALTECH_frontend/src/pages/admin/TemplateEditPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { 
  getAdminTemplates, 
  publishVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion
} from '../../services/api';
import { TemplateEditor } from '../../components/admin/templates';
import type { Template } from '../../types/templates';

export const TemplateEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await getAdminTemplates();
      const foundTemplate = response.data.data.find((t: Template) => t.id === id);
      
      if (!foundTemplate) {
        alert('Template no encontrado');
        navigate('/admin/templates');
        return;
      }
      
      setTemplate(foundTemplate);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error al cargar el template');
      navigate('/admin/templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    try {
      await publishVersion(versionId);
      await loadTemplate();
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

  const handleDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`¿Estás seguro de eliminar la versión ${versionNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteTemplateVersion(versionId);
      await loadTemplate();
      alert('Versión eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting version:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar la versión';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg">Template no encontrado</p>
        <button
          onClick={() => navigate('/admin/templates')}
          className="mt-4 px-6 py-3 bg-navy-900 text-white rounded-md font-medium hover:bg-navy-800 transition-all"
        >
          Volver a Plantillas
        </button>
      </div>
    );
  }

  const publishedVersion = template.versions?.find(v => v.is_published);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/templates')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Volver a Plantillas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              publishedVersion ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{template.title}</h1>
              <p className="text-sm text-slate-500 font-mono">{template.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <TemplateEditor
        template={template}
        onPublish={handlePublishVersion}
        onDownload={handleDownloadVersion}
        onDelete={handleDeleteVersion}
        onUpdate={loadTemplate}
      />
    </div>
  );
};
