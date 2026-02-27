import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2, GripVertical, FileText, Save, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { getFilesConfig, updateFilesConfig } from '../../../services/api';
import type { FileConfigItem } from '../../../services/api';

export interface FilesConfigEditorHandle {
  save: () => Promise<boolean>;
  isDirty: boolean;
}

interface FilesConfigEditorProps {
  templateId: string;
  versionId: string;
  onUpdate?: () => void;
}

const FILE_TYPES: { value: FileConfigItem['file_type']; label: string }[] = [
  { value: 'identification', label: 'Identificación (Cédula/DNI)' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'authorization', label: 'Poder / Autorización' },
  { value: 'document', label: 'Documento general' },
];

const FORMAT_OPTIONS = [
  { value: '.pdf', label: 'PDF' },
  { value: '.jpg', label: 'JPG' },
  { value: '.jpeg', label: 'JPEG' },
  { value: '.png', label: 'PNG' },
];

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 50);
};

const createEmptyFile = (order: number): FileConfigItem => ({
  slug: '',
  title: '',
  file_type: 'document',
  display_order: order,
  required: true,
  accepted_formats: '.pdf,.jpg,.jpeg,.png',
  max_size_mb: 5,
  description: '',
});

const FilesConfigEditor = forwardRef<FilesConfigEditorHandle, FilesConfigEditorProps>(({
  templateId,
  versionId,
  onUpdate,
}, ref) => {
  const [files, setFiles] = useState<FileConfigItem[]>([]);
  const [originalFiles, setOriginalFiles] = useState<FileConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFilesConfig(templateId, versionId);
      setFiles(data);
      setOriginalFiles(data);
    } catch (err: any) {
      console.error('Error loading files config:', err);
      setError('Error al cargar la configuración de archivos');
    } finally {
      setLoading(false);
    }
  }, [templateId, versionId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const isDirty = JSON.stringify(files) !== JSON.stringify(originalFiles);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty,
  }));

  const handleAddFile = () => {
    setFiles(prev => [...prev, createEmptyFile(prev.length + 1)]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((f, i) => ({ ...f, display_order: i + 1 }));
    });
  };

  const handleUpdateFile = (index: number, field: keyof FileConfigItem, value: any) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-generate slug from title
      if (field === 'title') {
        updated[index].slug = generateSlug(value);
        if (!updated[index].description) {
          updated[index].description = `Por favor suba ${value}`;
        }
      }

      return updated;
    });
  };

  const handleToggleFormat = (index: number, format: string) => {
    setFiles(prev => {
      const updated = [...prev];
      const current = updated[index].accepted_formats.split(',').filter(Boolean);
      const idx = current.indexOf(format);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(format);
      }
      updated[index] = { ...updated[index], accepted_formats: current.join(',') };
      return updated;
    });
  };

  const handleSave = async (): Promise<boolean> => {
    // Validate
    for (const f of files) {
      if (!f.title.trim()) {
        setError('Todos los archivos deben tener un título');
        return false;
      }
      if (!f.accepted_formats) {
        setError(`El archivo "${f.title}" debe tener al menos un formato aceptado`);
        return false;
      }
    }

    // Check duplicate slugs
    const slugs = files.map(f => f.slug);
    const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    if (duplicates.length > 0) {
      setError(`Slugs duplicados: ${[...new Set(duplicates)].join(', ')}. Use títulos diferentes.`);
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      await updateFilesConfig(templateId, versionId, files);
      setOriginalFiles([...files]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdate?.();
      return true;
    } catch (err: any) {
      console.error('Error saving files config:', err);
      setError(err.response?.data?.error || 'Error al guardar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((f, i) => ({ ...f, display_order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((f, i) => ({ ...f, display_order: i + 1 }));
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-navy-900 border-t-transparent" />
        <span className="ml-3 text-sm text-slate-500">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Archivos requeridos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura qué archivos debe subir el usuario al completar el contrato
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 text-white text-sm font-medium rounded-md hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
              ) : saveSuccess ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Guardando...' : saveSuccess ? 'Guardado' : 'Guardar'}
            </button>
          )}
          <button
            onClick={handleAddFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar archivo
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No hay archivos requeridos configurados</p>
          <p className="text-xs text-slate-400 mt-1">
            Agrega archivos que el usuario deberá subir (ej: cédula, certificados)
          </p>
          <button
            onClick={handleAddFile}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-navy-900 border border-navy-900 rounded-md hover:bg-navy-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar primer archivo
          </button>
        </div>
      )}

      {/* File list */}
      {files.map((file, index) => (
        <div
          key={index}
          className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:border-slate-300 transition-colors"
        >
          {/* Top row: drag handle, title, type, delete */}
          <div className="flex items-start gap-3">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                title="Mover arriba"
              >
                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
              </button>
              <GripVertical className="w-3.5 h-3.5 text-slate-300" />
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === files.length - 1}
                className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                title="Mover abajo"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title */}
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Título</label>
              <input
                type="text"
                value={file.title}
                onChange={(e) => handleUpdateFile(index, 'title', e.target.value)}
                placeholder="Ej: Cédula de Identidad"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-900 focus:border-navy-900"
              />
              {file.slug && (
                <span className="text-xs text-slate-400 mt-0.5 block">slug: {file.slug}</span>
              )}
            </div>

            {/* File type */}
            <div className="w-48">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo</label>
              <select
                value={file.file_type}
                onChange={(e) => handleUpdateFile(index, 'file_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-900 focus:border-navy-900 bg-white"
              >
                {FILE_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleRemoveFile(index)}
              className="mt-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Second row: formats, size, required */}
          <div className="flex items-center gap-4 pl-8">
            {/* Formats */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Formatos</label>
              <div className="flex gap-1.5">
                {FORMAT_OPTIONS.map(fmt => {
                  const isActive = file.accepted_formats.includes(fmt.value);
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => handleToggleFormat(index, fmt.value)}
                      className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                        isActive
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max size */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Máx MB</label>
              <input
                type="number"
                min={1}
                max={10}
                value={file.max_size_mb}
                onChange={(e) => handleUpdateFile(index, 'max_size_mb', parseInt(e.target.value) || 5)}
                className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>

            {/* Required toggle */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Obligatorio</label>
              <button
                onClick={() => handleUpdateFile(index, 'required', !file.required)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  file.required ? 'bg-navy-900' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    file.required ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="pl-8">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Descripción (para el usuario)</label>
            <input
              type="text"
              value={file.description}
              onChange={(e) => handleUpdateFile(index, 'description', e.target.value)}
              placeholder="Ej: Por favor suba una copia de su cédula de identidad"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-900 focus:border-navy-900"
            />
          </div>
        </div>
      ))}
    </div>
  );
});

FilesConfigEditor.displayName = 'FilesConfigEditor';

export default FilesConfigEditor;
