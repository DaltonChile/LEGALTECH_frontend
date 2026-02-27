// LEGALTECH_frontend/src/pages/admin/TemplateCreatePage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, FileText, Check, ChevronDown, Package } from 'lucide-react';
import {
  createTemplate,
  uploadTemplateVersion,
  setCapsulePrices,
  getTemplateCategories,
  getAdminTemplates,
} from '../../services/api';
import { getErrorMessage } from '../../utils/validators';
import { DescriptionEditor } from '../../components/admin/templates/DescriptionEditor';
import FilesConfigEditor from '../../components/admin/templates/FilesConfigEditor';
import type { FilesConfigEditorHandle } from '../../components/admin/templates/FilesConfigEditor';
import type { CapsulePending } from '../../types/templates';

// ─── Step indicator ──────────────────────────────────────────────────────────
type Step = 'info' | 'capsules' | 'files';

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: 'info', label: 'Información', num: 1 },
  { id: 'capsules', label: 'Cápsulas', num: 2 },
  { id: 'files', label: 'Archivos', num: 3 },
];

// ─── Page ────────────────────────────────────────────────────────────────────
export const TemplateCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const filesEditorRef = useRef<FilesConfigEditorHandle>(null);

  // Steps
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Template info
  const [categories, setCategories] = useState<string[]>([]);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [templateData, setTemplateData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    requires_notary: false,
    category: '',
  });
  const [basePrice, setBasePrice] = useState('29990');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Created template state
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null);

  // Capsules
  const [capsulesPending, setCapsulesPending] = useState<CapsulePending[]>([]);
  const [hasCapsules, setHasCapsules] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories and existing slugs
  useEffect(() => {
    const load = async () => {
      try {
        const [cats, templatesRes] = await Promise.all([
          getTemplateCategories(),
          getAdminTemplates(),
        ]);
        setCategories(cats);
        setExistingSlugs(templatesRes.data.data.map((t: any) => t.slug));
      } catch {
        setCategories(['laboral', 'arrendamiento', 'compraventa', 'servicios', 'otros']);
      }
    };
    load();
  }, []);

  // Slug generation
  const generateSlug = (title: string): string => {
    let baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    if (!baseSlug) return '';
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return finalSlug;
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setTemplateData((prev) => ({ ...prev, title, slug }));
  };

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  });

  // ─── Step 1: Create template + upload version ──────────────────────────────
  const handleCreateTemplate = async () => {
    if (!templateData.title || !templateData.slug) {
      setError('Título es requerido');
      return;
    }
    if (!selectedFile) {
      setError('Selecciona un archivo .docx');
      return;
    }
    if (!basePrice || parseInt(basePrice) <= 0) {
      setError('Ingresa un precio base válido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create template
      const templateRes = await createTemplate(templateData);
      const templateId = templateRes.data.data.id;
      setCreatedTemplateId(templateId);

      // Upload version
      const versionRes = await uploadTemplateVersion(templateId, selectedFile, parseInt(basePrice));
      const versionData = versionRes.data;

      // Check for capsules that need pricing
      if (versionData.requires_capsule_pricing && versionData.data.capsules_pending_price) {
        const vId = versionData.data.version.id;
        setCreatedVersionId(vId);
        setCapsulesPending(
          versionData.data.capsules_pending_price.map((cap: CapsulePending) => ({
            ...cap,
            price: 10000,
          }))
        );
        setHasCapsules(true);
        setCompletedSteps((prev) => new Set([...prev, 'info']));
        setCurrentStep('capsules');
      } else {
        // No capsules — get version id and skip to files
        const vId = versionData.data?.version?.id || versionData.data?.id;
        setCreatedVersionId(vId);
        setCompletedSteps((prev) => new Set([...prev, 'info', 'capsules']));
        setCurrentStep('files');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al crear el template'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Step 2: Set capsule prices ────────────────────────────────────────────
  const handleSetCapsulePrices = async () => {
    if (!createdVersionId) return;

    const invalid = capsulesPending.filter((c) => !c.price || c.price <= 0);
    if (invalid.length > 0) {
      setError('Todas las cápsulas necesitan un precio válido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await setCapsulePrices(createdVersionId, capsulesPending);
      setCompletedSteps((prev) => new Set([...prev, 'capsules']));
      setCurrentStep('files');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al asignar precios'));
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (slug: string, price: string) => {
    setCapsulesPending((prev) =>
      prev.map((cap) => (cap.slug === slug ? { ...cap, price: parseInt(price) || 0 } : cap))
    );
  };

  // ─── Step 3: Finish (auto-save files if dirty) ──────────────────────────────────────
  const handleFinish = async () => {
    if (filesEditorRef.current?.isDirty) {
      const saved = await filesEditorRef.current.save();
      if (!saved) return; // validation error — stay on page
    }
    if (createdTemplateId) {
      navigate(`/admin/templates/${createdTemplateId}/edit`);
    } else {
      navigate('/admin/templates');
    }
  };

  const handleSkipFiles = () => {
    navigate(`/admin/templates/${createdTemplateId}/edit`);
  };

  // ─── Determine which steps to show in stepper ─────────────────────────────
  const visibleSteps = hasCapsules ? STEPS : STEPS.filter((s) => s.id !== 'capsules');

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/templates')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Volver a Plantillas"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Plantilla</h1>
          <p className="text-sm text-slate-500">Completa la información y sube el documento</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {visibleSteps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div className={`flex-1 h-px ${isCompleted ? 'bg-navy-900' : 'bg-slate-200'}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-navy-900 text-white'
                      : isCurrent
                      ? 'bg-navy-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-navy-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Template Info */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 'info' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej: Contrato de Arrendamiento"
              className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            />
            {templateData.slug && (
              <p className="text-xs text-slate-500">
                URL: /<span className="font-mono">{templateData.slug}</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Categoría</label>
            <div className="relative">
              <select
                value={templateData.category}
                onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
              >
                <option value="">Sin categoría</option>
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
              <span className="text-xs font-normal text-slate-400 ml-2">Para catálogo, máx 255</span>
            </label>
            <input
              type="text"
              value={templateData.short_description}
              onChange={(e) =>
                setTemplateData({ ...templateData, short_description: e.target.value.slice(0, 255) })
              }
              maxLength={255}
              placeholder="Breve resumen para mostrar en el catálogo"
              className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 text-right">{templateData.short_description.length}/255</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Descripción
              <span className="text-xs font-normal text-slate-400 ml-2">Markdown</span>
            </label>
            <DescriptionEditor
              value={templateData.description}
              onChange={(value) => setTemplateData({ ...templateData, description: value })}
            />
          </div>

          {/* Two-column row: Price + Notary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Price */}
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
                  placeholder="29990"
                  min="0"
                  step="1"
                  className="w-full pl-8 pr-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-md transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Requires Notary */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Opciones</label>
              <div className="flex items-center gap-3 px-4 py-2.5 border border-slate-300 rounded-md bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setTemplateData({ ...templateData, requires_notary: !templateData.requires_notary })
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    templateData.requires_notary ? 'bg-navy-900' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      templateData.requires_notary ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <span className="text-sm font-medium text-slate-700">Requiere Notario</span>
                  <p className="text-xs text-slate-400">Firma ante notario obligatoria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Documento .docx <span className="text-red-500">*</span>
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-navy-900 bg-navy-50'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">Click o arrastra para cambiar</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Arrastra un archivo .docx aquí</p>
                  <p className="text-xs text-slate-400 mt-1">o haz click para seleccionar</p>
                </>
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/admin/templates')}
              className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={saving || !templateData.title || !selectedFile}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-md text-sm font-semibold hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  Creando plantilla...
                </>
              ) : (
                'Crear y continuar'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Capsule Pricing */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 'capsules' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Precios de Cápsulas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Se detectaron {capsulesPending.length} cápsulas en el documento. Asigna un precio a cada una.
            </p>
          </div>

          <div className="space-y-3">
            {capsulesPending.map((capsule) => (
              <div
                key={capsule.slug}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md p-3"
              >
                <Package className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{capsule.title}</p>
                  <p className="text-xs text-slate-500">{capsule.variables_count} variables</p>
                </div>
                <div className="relative shrink-0" style={{ width: '140px' }}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    value={capsule.price || ''}
                    onChange={(e) => handlePriceChange(capsule.slug, e.target.value)}
                    min="0"
                    className="w-full pl-7 pr-3 py-2 text-sm text-right text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSetCapsulePrices}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-md text-sm font-semibold hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  Guardando...
                </>
              ) : (
                'Guardar precios y continuar'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: File Configuration */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 'files' && createdTemplateId && createdVersionId && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <FilesConfigEditor
              ref={filesEditorRef}
              templateId={createdTemplateId}
              versionId={createdVersionId}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkipFiles}
              className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Omitir por ahora
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-md text-sm font-semibold hover:bg-navy-800 transition-colors"
            >
              <Check className="w-4 h-4" />
              Finalizar y ver plantilla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
