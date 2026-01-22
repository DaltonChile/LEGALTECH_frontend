import React, { useState } from 'react';
import { Download, Play, CheckCircle, Plus, History, Save, Trash2 } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import NewVersionUploader from '../NewVersionUploader';
import api from '../../../../services/api';
import type { Template } from '../../../../types/templates';

interface TemplateDetailModalProps {
  template: Template;
  onClose: () => void;
  onPublish: (versionId: string) => void;
  onDownload: (versionId: string) => void;
  onDelete?: (versionId: string, versionNumber: number) => void;
  onUpdate: () => void;
}

const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  onClose,
  onPublish,
  onUpdate,
  onDownload,
  onDelete
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
  // Usar la versión publicada, o si no hay, la última versión (para editar cápsulas)
  const latestVersion = template.versions?.[0];
  const activeVersion = publishedVersion || latestVersion;

  const handleDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (onDelete) {
      onDelete(versionId, versionNumber);
    }
  };

  const handleStartEdit = (field: 'title' | 'description') => {
    // Restaurar valores actuales del template al empezar a editar
    setEditData({
      title: template.title,
      description: template.description || '',
    });
    setEditingField(field);
  };

  const handleStartEditPrice = () => {
    const currentPrice = activeVersion?.base_price?.toString() || '0';
    console.log('Starting edit price:', currentPrice, 'from:', activeVersion?.base_price);
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
    if (saving || !activeVersion) return;
    
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Ingresa un precio válido');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/templates/${template.id}/versions/${activeVersion.id}/price`, {
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
    if (saving || !activeVersion?.capsules?.[capsuleIndex]) return;
    
    const newPrice = parseFloat(editCapsulePrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Ingresa un precio válido');
      return;
    }

    setSaving(true);
    try {
      const capsule = activeVersion.capsules[capsuleIndex];
      await api.put(`/admin/templates/${template.id}/versions/${activeVersion.id}/capsule-price`, {
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Versiones</h2>
                <p className="text-slate-600">{template.title}</p>
              </div>
            </div>

            {/* Lista de versiones */}
            {template.versions && template.versions.length > 0 ? (
              <div className="space-y-4">
                {template.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border-2 rounded-2xl overflow-hidden transition-all ${
                      version.is_published
                        ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-300 shadow-lg ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header con gradiente para versión publicada */}
                    {version.is_published && (
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Versión Activa en el Catálogo</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      {/* Header con versión y estado */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-slate-900">v{version.version_number}</span>
                            {!version.is_published && (
                              <span className="px-3 py-1 rounded-full text-sm font-bold bg-slate-100 border-2 border-slate-300 text-slate-600">
                                Borrador
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-slate-900 mb-1">${version.base_price?.toLocaleString()}</div>
                          <div className="text-sm text-slate-500">{new Date(version.created_at).toLocaleDateString('es-ES')}</div>
                        </div>
                      </div>

                      {/* Metadata con iconos */}
                      <div className="flex items-center gap-6 text-sm mb-6">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border">
                          <span className="text-slate-500">📝</span>
                          <span className="font-medium text-slate-700">{version.base_form_schema?.length || 0} campos</span>
                        </div>
                        {version.capsules && version.capsules.length > 0 && (
                          <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                            <span className="text-amber-600">📦</span>
                            <span className="font-medium text-amber-700">{version.capsules.length} cápsulas</span>
                          </div>
                        )}
                        {template.requires_notary && (
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            <span className="text-blue-600">⚖️</span>
                            <span className="font-medium text-blue-700">Requiere notario</span>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-3">
                        {!version.is_published ? (
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de publicar la versión ${version.version_number}?\n\nEsto hará que esta versión sea la que ven los usuarios en el catálogo.`)) {
                                onPublish?.(version.id);
                                setShowVersions(false);
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-300 rounded-xl text-emerald-700 font-semibold hover:from-emerald-200 hover:to-green-200 transition-all shadow-sm"
                            title="Publicar esta versión en el catálogo"
                          >
                            <Play className="w-5 h-5" />
                            Publicar Versión
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-5 py-3 bg-emerald-100 border-2 border-emerald-300 rounded-xl text-emerald-700 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            Versión Publicada
                          </div>
                        )}
                        
                        <button
                          onClick={() => onDownload?.(version.id)}
                          className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-600 font-semibold hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                          title="Descargar archivo .docx"
                        >
                          <Download className="w-5 h-5" />
                          Descargar
                        </button>
                        
                        {/* Botón eliminar - solo para versiones no publicadas y sin contratos */}
                        {!version.is_published && !version.has_contracts && onDelete && (
                          <button
                            onClick={() => handleDeleteVersion(version.id, version.version_number)}
                            className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-red-600 font-semibold hover:border-red-400 hover:bg-red-50 transition-all group"
                            title="Eliminar esta versión permanentemente"
                          >
                            <Trash2 className="w-4 h-4 group-hover:animate-pulse" />
                          </button>
                        )}
                        
                        {/* Indicador de contratos asociados - para versiones no publicadas con contratos */}
                        {!version.is_published && version.has_contracts && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 font-medium">
                            <span className="text-amber-600">🔒</span>
                            <span className="text-sm">
                              {version.contract_count} contrato{version.contract_count !== 1 ? 's' : ''} en uso
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1"></div>
                        
                        {version.is_published && (
                          <div className="text-sm font-medium text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            En uso por usuarios
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay versiones</h3>
                <p className="text-slate-500 mb-4">Este template necesita al menos una versión para funcionar.</p>
                <button
                  onClick={() => {
                    setShowVersions(false);
                    setShowUploader(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 text-blue-700 rounded-xl font-semibold hover:from-blue-200 hover:to-indigo-200 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Crear primera versión
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={() => setShowVersions(false)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold hover:from-slate-200 hover:to-slate-300 hover:border-slate-400 transition-all"
              >
                <span>←</span>
                Volver al Template
              </button>
            </div>
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
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Título</label>
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
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Descripción</label>
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
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Precio Base (CLP)</label>
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
                  ${activeVersion?.base_price?.toLocaleString() || '0'}
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
              disabled={!activeVersion}
              className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-cyan-400 hover:bg-cyan-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              editar
            </button>
          )}
          </div>
        </div>

        {/* Version Activa */}
        {activeVersion && (
          <div className="space-y-3">
            <p className="text-slate-900 font-semibold">
              {publishedVersion ? 'Versión Publicada' : 'Última Versión (Borrador)'}: <span className="text-cyan-600">v{activeVersion.version_number}</span>
            </p>

            {/* Capsulas */}
            {activeVersion.capsules && activeVersion.capsules.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">Cápsulas Opcionales</label>
                {activeVersion.capsules.map((capsule: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl bg-white">
                      <p className="text-slate-900 font-medium">{capsule.title}</p>
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
        <div className="flex gap-3 pt-6 border-t-2 border-slate-200">
          <button
            onClick={() => setShowUploader(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 text-blue-700 rounded-xl font-semibold hover:from-blue-200 hover:to-indigo-200 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nueva Versión
          </button>
          <button
            onClick={() => setShowVersions(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all"
            disabled={!template.versions || template.versions.length === 0}
          >
            <History className="w-5 h-5" />
            Ver Versiones ({template.versions?.length || 0})
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-100 to-cyan-100 text-slate-700 border-2 border-lime-400 rounded-xl font-semibold hover:from-lime-200 hover:to-cyan-200 transition-all shadow-sm"
          >
            <Save className="w-5 h-5" />
            Cerrar
          </button>
        </div>
        </>
        )}
      </div>
    </Modal>
  );
};

export default TemplateDetailModal;
