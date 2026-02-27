import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, Play, CheckCircle, Plus, History, Save, Trash2, FileText, DollarSign, Layers, Package, ChevronDown } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import NewVersionUploader from '../NewVersionUploader';
import DescriptionEditor from '../DescriptionEditor';
import api, { getTemplateCategories } from '../../../../services/api';
import type { Template } from '../../../../types/templates';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'general' | 'pricing' | 'versions';

interface TemplateDetailModalProps {
  template: Template;
  onClose: () => void;
  onPublish: (versionId: string) => void;
  onDownload: (versionId: string) => void;
  onDelete?: (versionId: string, versionNumber: number) => void;
  onUpdate: () => void;
}

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <FileText className="w-4 h-4" /> },
  { id: 'pricing', label: 'Precios', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'versions', label: 'Versiones', icon: <Layers className="w-4 h-4" /> },
];

// ─── Component ───────────────────────────────────────────────────────────────
const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  onClose,
  onPublish,
  onUpdate,
  onDownload,
  onDelete
}) => {
  // Tab & sub-views
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showUploader, setShowUploader] = useState(false);

  // Form state — always editable, no per-field "edit" mode
  const [formData, setFormData] = useState({
    title: template.title,
    description: template.description || '',
    short_description: template.short_description || '',
    category: template.category || '',
  });
  const [basePrice, setBasePrice] = useState('');
  const [capsulePrices, setCapsulePrices] = useState<Record<number, string>>({});
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derived
  const publishedVersion = template.versions?.find(v => v.is_published);
  const latestVersion = template.versions?.[0];
  const activeVersion = publishedVersion || latestVersion;

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getTemplateCategories();
        setCategories(cats);
      } catch {
        setCategories(['laboral', 'arrendamiento', 'compraventa', 'servicios', 'otros']);
      }
    };
    loadCategories();
  }, []);

  // Sync form when template prop changes (after save)
  useEffect(() => {
    setFormData({
      title: template.title,
      description: template.description || '',
      short_description: template.short_description || '',
      category: template.category || '',
    });
    setBasePrice(activeVersion?.base_price?.toString() || '0');
    // Reset capsule prices
    const cp: Record<number, string> = {};
    activeVersion?.capsules?.forEach((c, i) => {
      cp[i] = c.price?.toString() || '0';
    });
    setCapsulePrices(cp);
  }, [template, activeVersion]);

  // ─── Dirty detection ────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    const generalDirty =
      formData.title !== template.title ||
      formData.description !== (template.description || '') ||
      formData.short_description !== (template.short_description || '') ||
      formData.category !== (template.category || '');

    const priceDirty = activeVersion
      ? parseFloat(basePrice) !== activeVersion.base_price
      : false;

    const capsuleDirty = activeVersion?.capsules?.some((c, i) => {
      return parseFloat(capsulePrices[i] || '0') !== c.price;
    }) || false;

    return generalDirty || priceDirty || capsuleDirty;
  }, [formData, template, basePrice, capsulePrices, activeVersion]);

  // ─── Completeness score ─────────────────────────────────────────────────────
  const completeness = useMemo(() => {
    const checks = [
      { label: 'Título', done: !!formData.title.trim() },
      { label: 'Descripción', done: !!formData.description.trim() },
      { label: 'Descripción corta', done: !!formData.short_description.trim() },
      { label: 'Categoría', done: !!formData.category },
      { label: 'Precio base', done: parseFloat(basePrice) > 0 },
      { label: 'Versión publicada', done: !!publishedVersion },
    ];
    const done = checks.filter(c => c.done).length;
    return { checks, done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [formData, basePrice, publishedVersion]);

  // ─── Save all changes ───────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (saving || !isDirty) return;
    setSaving(true);
    try {
      // Save template fields (title, description, short_description, category)
      const templateUpdates: Record<string, any> = {};
      if (formData.title !== template.title) templateUpdates.title = formData.title;
      if (formData.description !== (template.description || '')) templateUpdates.description = formData.description;
      if (formData.short_description !== (template.short_description || '')) templateUpdates.short_description = formData.short_description;
      if (formData.category !== (template.category || '')) templateUpdates.category = formData.category || null;

      if (Object.keys(templateUpdates).length > 0) {
        await api.put(`/admin/templates/${template.id}`, templateUpdates);
      }

      // Save base price
      if (activeVersion && parseFloat(basePrice) !== activeVersion.base_price) {
        const newPrice = parseFloat(basePrice);
        if (!isNaN(newPrice) && newPrice >= 0) {
          await api.put(`/admin/templates/${template.id}/versions/${activeVersion.id}/price`, {
            base_price: newPrice
          });
        }
      }

      // Save capsule prices
      if (activeVersion?.capsules) {
        for (let i = 0; i < activeVersion.capsules.length; i++) {
          const capsule = activeVersion.capsules[i];
          const newPrice = parseFloat(capsulePrices[i] || '0');
          if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== capsule.price) {
            await api.put(`/admin/templates/${template.id}/versions/${activeVersion.id}/capsule-price`, {
              capsule_slug: capsule.slug,
              price: newPrice
            });
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }, [saving, isDirty, formData, template, basePrice, capsulePrices, activeVersion, onUpdate]);

  const handleDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (onDelete) {
      onDelete(versionId, versionNumber);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal onClose={onClose} extraWide>
      <div className="flex flex-col" style={{ minHeight: '60vh' }}>
        {/* ─── Tab Navigation ─────────────────────────────────────────── */}
        {!showUploader && (
          <div className="border-b border-slate-200 -mx-6 -mt-6 px-6">
            <nav className="flex gap-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'text-navy-900'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'versions' && template.versions?.length ? (
                    <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {template.versions.length}
                    </span>
                  ) : null}
                  {/* Active indicator line */}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-900 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* ─── Completeness Bar ───────────────────────────────────────── */}
        {!showUploader && (
          <div className="pt-5 pb-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                {completeness.done} /{completeness.total} campos completos
              </p>
              <span className="text-sm text-slate-500">{completeness.pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completeness.pct === 100
                    ? 'bg-emerald-500'
                    : completeness.pct >= 60
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completeness.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Tab Content ────────────────────────────────────────────── */}
        <div className="flex-1 py-5 space-y-6">
          {/* Upload overlay */}
          {showUploader && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Subir Nueva Versión</h2>
              <NewVersionUploader
                templateId={template.id}
                onSuccess={() => {
                  setShowUploader(false);
                  onUpdate();
                }}
                onCancel={() => setShowUploader(false)}
              />
            </div>
          )}

          {/* ═══ GENERAL TAB ═══ */}
          {!showUploader && activeTab === 'general' && (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                  placeholder="Nombre de la plantilla"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Categoría</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Descripción Corta
                  <span className="text-xs font-normal text-slate-400 ml-2">Preview en catálogo, máx 255 chars</span>
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value.slice(0, 255) })}
                  maxLength={255}
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                  placeholder="Breve resumen para mostrar en el catálogo"
                />
                <p className="text-xs text-slate-400 text-right">{formData.short_description.length}/255</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Descripción
                    <span className="text-xs font-normal text-slate-400 ml-2">Markdown</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDescriptionEditor(!showDescriptionEditor)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showDescriptionEditor ? 'Editor simple' : 'Editor avanzado'}
                  </button>
                </div>
                {showDescriptionEditor ? (
                  <DescriptionEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                  />
                ) : (
                  <div className="space-y-1">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow resize-y placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                      placeholder="Descripción detallada de la plantilla..."
                    />
                    <p className="text-xs text-slate-400 text-right">{formData.description.length} caracteres</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ PRICING TAB ═══ */}
          {!showUploader && activeTab === 'pricing' && (
            <>
              {/* Active version line */}
              {activeVersion && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5">
                  <Layers className="w-4 h-4" />
                  <span>
                    Editando precios de la{' '}
                    <span className="font-semibold text-slate-900">
                      {publishedVersion ? 'versión publicada' : 'última versión'}
                    </span>
                    {' '}
                    <span className="text-blue-600 font-semibold">v{activeVersion.version_number}</span>
                  </span>
                </div>
              )}

              {!activeVersion && (
                <div className="text-center py-12 text-slate-400">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Sin versiones para editar precios</p>
                  <p className="text-sm mt-1">Sube una versión primero</p>
                </div>
              )}

              {/* Base Price */}
              {activeVersion && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Precio Base (CLP) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              )}

              {/* Capsule Prices */}
              {activeVersion?.capsules && activeVersion.capsules.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-medium text-slate-700">Cápsulas Opcionales</h3>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      {activeVersion.capsules.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeVersion.capsules.map((capsule: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{capsule.title}</p>
                          <p className="text-xs text-slate-500">{capsule.slug}</p>
                        </div>
                        <div className="relative shrink-0" style={{ width: '140px' }}>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                          <input
                            type="number"
                            value={capsulePrices[index] || '0'}
                            onChange={(e) => setCapsulePrices({ ...capsulePrices, [index]: e.target.value })}
                            className="w-full pl-7 pr-3 py-2 text-sm text-right text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ VERSIONS TAB ═══ */}
          {!showUploader && activeTab === 'versions' && (
            <>
              {/* Upload button */}
              <button
                onClick={() => setShowUploader(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Subir nueva versión
              </button>

              {/* Version table */}
              {template.versions && template.versions.length > 0 ? (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Versión</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Estado</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Detalles</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Precio</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Fecha</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {template.versions.map((version) => (
                        <tr key={version.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Version number */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">v{version.version_number}</span>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            {version.is_published ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Publicada
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Borrador
                              </span>
                            )}
                          </td>
                          {/* Details chips */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                {version.base_form_schema?.length || 0} campos
                              </span>
                              {version.capsules && version.capsules.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-xs text-amber-700">
                                  {version.capsules.length} cáps.
                                </span>
                              )}
                              {!version.is_published && version.has_contracts && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-xs text-amber-700">
                                  🔒 {version.contract_count}
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Price */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-slate-900">${version.base_price?.toLocaleString()}</span>
                          </td>
                          {/* Date */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-slate-400">{new Date(version.created_at).toLocaleDateString('es-CL')}</span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {!version.is_published && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Publicar la versión ${version.version_number}?\nEsta será visible para los usuarios.`)) {
                                      onPublish?.(version.id);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                                  title="Publicar"
                                >
                                  <Play className="w-3 h-3" />
                                  Publicar
                                </button>
                              )}
                              <button
                                onClick={() => onDownload?.(version.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Descargar .docx"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              {!version.is_published && !version.has_contracts && onDelete && (
                                <button
                                  onClick={() => handleDeleteVersion(version.id, version.version_number)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                  title="Eliminar versión"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-md bg-slate-50/50">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500">No hay versiones aún</p>
                  <p className="text-sm text-slate-400 mt-1">Sube un archivo .docx para crear la primera versión</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Bottom Save Bar ────────────────────────────────────────── */}
        {!showUploader && (
          <div className="border-t border-slate-200 -mx-6 -mb-6 px-6 py-4 bg-slate-50/80">
            <button
              onClick={handleSaveAll}
              disabled={saving || !isDirty}
              className={`
                w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all
                ${isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
                disabled:opacity-60
              `}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Guardado correctamente
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TemplateDetailModal;
