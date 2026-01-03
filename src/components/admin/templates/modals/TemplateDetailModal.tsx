import React, { useState } from 'react';
import { Edit2, Save, Download, Trash2, Upload } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import NewVersionUploader from '../NewVersionUploader';
import api from '../../../../services/api';
import type { Template } from '../../../../types/templates';

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

export default TemplateDetailModal;
