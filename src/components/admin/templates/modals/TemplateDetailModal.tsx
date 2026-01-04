import React, { useState } from 'react';
import { Edit2, Download } from 'lucide-react';
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
  onUpdate,
  onDownload
}) => {
  const [showVersions, setShowVersions] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'description' | 'price' | string | null>(null);
  const [editData, setEditData] = useState({
    title: template.title,
    description: template.description || '',
  });
  const [editPrice, setEditPrice] = useState('');
  const [editCapsulePrice, setEditCapsulePrice] = useState('');
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

  const handleStartEditPrice = () => {
    const currentPrice = publishedVersion?.base_price?.toString() || '0';
    console.log('Starting edit price:', currentPrice, 'from:', publishedVersion?.base_price);
    setEditPrice(currentPrice);
    setEditingField('price');
  };

  const handleStartEditCapsule = (capsuleIndex: number, currentPrice: number) => {
    setEditCapsulePrice(currentPrice?.toString() || '');
    setEditingField(`capsule-${capsuleIndex}`);
  };

  const handleCancelEdit = () => {
    // Restaurar valores originales
    setEditData({
      title: template.title,
      description: template.description || '',
    });
    setEditPrice('');
    setEditCapsulePrice('');
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

  const handleSavePrice = async () => {
    if (saving || !publishedVersion) return;
    
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Ingresa un precio válido');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/templates/${template.id}/versions/${publishedVersion.id}/price`, {
        base_price: newPrice
      });
      setEditingField(null);
      setEditPrice('');
      onUpdate();
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error al actualizar el precio');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCapsulePrice = async (capsuleIndex: number) => {
    if (saving || !publishedVersion?.capsules?.[capsuleIndex]) return;
    
    const newPrice = parseFloat(editCapsulePrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Ingresa un precio válido');
      return;
    }

    setSaving(true);
    try {
      const capsule = publishedVersion.capsules[capsuleIndex];
      await api.put(`/admin/templates/${template.id}/versions/${publishedVersion.id}/capsule-price`, {
        capsule_slug: capsule.slug,
        price: newPrice
      });
      setEditingField(null);
      setEditCapsulePrice('');
      onUpdate();
    } catch (error) {
      console.error('Error updating capsule price:', error);
      alert('Error al actualizar el precio de la cápsula');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-6">
        {/* Vista de versiones anteriores */}
        {showVersions && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Versiones Anteriores</h2>
              <p className="text-slate-600">{template.title}</p>
            </div>

            {/* Lista de versiones */}
            {template.versions && template.versions.length > 0 ? (
              <div className="space-y-6">
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
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-900">${version.base_price?.toLocaleString()}</span>
                        <button
                          onClick={() => onDownload?.(version.id)}
                          className="p-2 flex items-center justify-center bg-white border-2 border-slate-300 rounded-lg text-slate-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                          title="Descargar versión"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
          </>
        )}

        {/* Vista de subir nueva versión */}
        {showUploader && (
          <>
            <h2 className="text-2xl font-bold text-slate-900">Nueva Versión</h2>
            <NewVersionUploader
              templateId={template.id}
              onSuccess={() => {
                setShowUploader(false);
                onUpdate();
              }}
              onCancel={() => setShowUploader(false)}
            />
          </>
        )}

        {/* Vista principal */}
        {!showVersions && !showUploader && (
          <>
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
            {editingField === 'price' ? (
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-4 py-3 border-2 border-cyan-400 rounded-xl focus:outline-none focus:border-cyan-500 text-lg font-semibold"
                placeholder="0"
                min="0"
                step="0.01"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePrice();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
            ) : (
              <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50">
                <p className="text-lg font-semibold text-slate-900">
                  ${publishedVersion?.base_price?.toLocaleString() || '0'}
                </p>
              </div>
            )}
          </div>
          {editingField === 'price' ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-3 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrice}
                disabled={saving}
                className="px-5 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 disabled:opacity-50"
              >
                {saving ? '...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditPrice}
              disabled={!publishedVersion}
              className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              editar
            </button>
          )}
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
                    {editingField === `capsule-${index}` ? (
                      <>
                        <input
                          type="number"
                          value={editCapsulePrice}
                          onChange={(e) => setEditCapsulePrice(e.target.value)}
                          className="px-4 py-3 border-2 border-cyan-400 rounded-xl focus:outline-none focus:border-cyan-500 min-w-[120px] text-center font-semibold"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCapsulePrice(index);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="px-3 py-3 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50 text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveCapsulePrice(index)}
                            disabled={saving}
                            className="px-4 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 disabled:opacity-50 text-sm"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 min-w-[120px] text-center">
                          <p className="text-slate-900 font-semibold">${capsule.price?.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleStartEditCapsule(index, capsule.price)}
                          className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                        >
                          editar
                        </button>
                      </>
                    )}
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
        </>
        )}
      </div>
    </Modal>
  );
};

export default TemplateDetailModal;
