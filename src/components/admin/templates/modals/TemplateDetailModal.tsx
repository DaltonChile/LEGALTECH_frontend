import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
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
  onUpdate
}) => {
  const [showVersions, setShowVersions] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'description' | 'price' | null>(null);
  const [editData, setEditData] = useState({
    title: template.title,
    description: template.description || '',
  });
  const [saving, setSaving] = useState(false);

  const publishedVersion = template.versions?.find(v => v.is_published);

  const handleStartEdit = (field: 'title' | 'description') => {
    // Restaurar valores actuales del template al empezar a editar
    setEditData({
      title: template.title,
      description: template.description || '',
    });
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    // Restaurar valores originales
    setEditData({
      title: template.title,
      description: template.description || '',
    });
    setEditingField(null);
  };

  const handleSaveField = async (field: 'title' | 'description' | 'price') => {
    if (saving) return;
    
    setSaving(true);
    try {
      await api.put(`/admin/templates/${template.id}`, {
        [field]: editData[field as keyof typeof editData]
      });
      setEditingField(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar el template');
    } finally {
      setSaving(false);
    }
  };

  if (showVersions) {
    return (
      <Modal onClose={onClose} wide>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Versiones Anteriores</h2>
            <p className="text-slate-600">{template.title}</p>
          </div>

          {/* Lista de versiones */}
          {template.versions && template.versions.length > 0 ? (
            <div className="space-y-3">
              {template.versions.map((version) => (
                <div
                  key={version.id}
                  className={`border-2 rounded-2xl p-5 ${
                    version.is_published
                      ? 'bg-gradient-to-r from-lime-50/50 to-cyan-50/50 border-lime-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-slate-900">v{version.version_number}</span>
                      {version.is_published ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-lime-100 to-cyan-100 border-2 border-lime-400">
                          ✓ Publicada
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border-2 border-slate-300">
                          Borrador
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-slate-900">${version.base_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                    <span>{version.base_form_schema?.length || 0} campos</span>
                    {version.capsules && version.capsules.length > 0 && (
                      <span className="text-amber-600 font-medium">{version.capsules.length} cápsulas</span>
                    )}
                    <span className="text-slate-400">{new Date(version.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-slate-600">No hay versiones</p>
            </div>
          )}

          <button
            onClick={() => setShowVersions(false)}
            className="w-full px-6 py-3 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-200"
          >
            Volver
          </button>
        </div>
      </Modal>
    );
  }

  if (showUploader) {
    return (
      <Modal onClose={onClose} wide>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Nueva Versión</h2>
          <NewVersionUploader
            templateId={template.id}
            onSuccess={() => {
              setShowUploader(false);
              onUpdate();
            }}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-6">
        {/* Titulo */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {editingField === 'title' ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-400 rounded-xl focus:outline-none focus:border-cyan-500 text-lg font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveField('title');
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
            ) : (
              <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50">
                <p className="text-lg font-semibold text-slate-900">{template.title}</p>
              </div>
            )}
          </div>
          {editingField === 'title' ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-3 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveField('title')}
                disabled={saving}
                className="px-5 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 disabled:opacity-50"
              >
                {saving ? '...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleStartEdit('title')}
              className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
            >
              editar
            </button>
          )}
        </div>

        {/* Descripcion */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {editingField === 'description' ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-400 rounded-xl focus:outline-none focus:border-cyan-500 resize-none"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
            ) : (
              <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 min-h-[56px] flex items-center">
                <p className="text-slate-700">{template.description || 'Sin descripción'}</p>
              </div>
            )}
          </div>
          {editingField === 'description' ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-3 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveField('description')}
                disabled={saving}
                className="px-5 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 disabled:opacity-50"
              >
                {saving ? '...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleStartEdit('description')}
              className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
            >
              editar
            </button>
          )}
        </div>

        {/* Precio */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50">
              <p className="text-lg font-semibold text-slate-900">
                ${publishedVersion?.base_price?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
          <button
            className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-400 rounded-xl font-semibold cursor-not-allowed"
            disabled
          >
            editar
          </button>
        </div>

        {/* Version Publicada */}
        {publishedVersion && (
          <div className="space-y-3">
            <p className="text-slate-900 font-semibold">
              Version Publicada: <span className="text-cyan-600">version {publishedVersion.version_number}</span>
            </p>

            {/* Capsulas */}
            {publishedVersion.capsules && publishedVersion.capsules.length > 0 && (
              <div className="space-y-2">
                {publishedVersion.capsules.map((capsule: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl bg-white">
                      <p className="text-slate-900 font-medium">Capsula {index + 1}: {capsule.title}</p>
                    </div>
                    <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 min-w-[120px] text-center">
                      <p className="text-slate-900 font-semibold">${capsule.price?.toLocaleString()}</p>
                    </div>
                    <button
                      className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50"
                    >
                      editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones inferiores */}
        <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
          <button
            onClick={() => setShowUploader(true)}
            className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50"
          >
            nueva version
          </button>
          <button
            onClick={() => setShowVersions(true)}
            className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50"
          >
            Ver versiones anteriores
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-100 to-cyan-100 text-slate-700 border-2 border-lime-400 rounded-xl font-semibold hover:from-lime-200 hover:to-cyan-200"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateDetailModal;
