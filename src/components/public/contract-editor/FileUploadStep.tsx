import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

interface FileConfig {
  slug: string;
  title: string;
  file_type: string;
  required: boolean;
  accepted_formats: string;
  max_size_mb: number;
  description: string;
  display_order: number;
  uploaded: boolean;
  upload_status: 'pending' | 'uploaded' | 'validated' | 'rejected';
  file_id: string | null;
  original_filename: string | null;
  file_size_bytes: number | null;
  uploaded_at: string | null;
  rejection_reason: string | null;
}

interface FilesProgress {
  total_required: number;
  total_uploaded: number;
  all_required_uploaded: boolean;
  percentage: number;
}

interface FileUploadStepProps {
  contractId: string;
  trackingCode: string;
  buyerRut: string;
  onAllFilesUploaded: () => void;
  onFilesStatusChange?: (allUploaded: boolean) => void;
}

export function FileUploadStep({
  trackingCode,
  buyerRut,
  onAllFilesUploaded,
  onFilesStatusChange,
}: FileUploadStepProps) {
  const [files, setFiles] = useState<FileConfig[]>([]);
  const [progress, setProgress] = useState<FilesProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setError(null);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get(
        `${apiUrl}/contracts/${trackingCode}/files?rut=${encodeURIComponent(buyerRut)}`
      );

      if (response.data.success) {
        console.log('📁 FileUploadStep: Files loaded:', response.data.data.files.length, 'files');
        console.log('📊 FileUploadStep: Progress:', response.data.data.progress);
        setFiles(response.data.data.files);
        setProgress(response.data.data.progress);
        
        // Notificar si todos los archivos están subidos
        const allUploaded = response.data.data.progress.all_required_uploaded;
        onFilesStatusChange?.(allUploaded);
        
        if (allUploaded && response.data.data.files.length > 0) {
          onAllFilesUploaded();
        }
      }
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.response?.data?.error || 'Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  }, [trackingCode, buyerRut, onAllFilesUploaded, onFilesStatusChange]);

  useEffect(() => {
    console.log('🔄 FileUploadStep: Loading files for', trackingCode, 'rut:', buyerRut);
    loadFiles();
  }, [loadFiles]);

  const handleFileSelect = async (fileSlug: string, file: File) => {
    setUploadingSlug(fileSlug);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileSlug', fileSlug);

      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(
        `${apiUrl}/contracts/${trackingCode}/files?rut=${encodeURIComponent(buyerRut)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        // Recargar la lista de archivos
        await loadFiles();
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploadingSlug(null);
    }
  };

  const handleDelete = async (fileId: string, fileSlug: string) => {
    if (!confirm('¿Está seguro de eliminar este archivo?')) return;

    setUploadingSlug(fileSlug);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.delete(
        `${apiUrl}/contracts/${trackingCode}/files/${fileId}?rut=${encodeURIComponent(buyerRut)}`
      );

      // Recargar la lista de archivos
      await loadFiles();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setError(err.response?.data?.error || 'Error al eliminar el archivo');
    } finally {
      setUploadingSlug(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'identification':
      case 'passport':
        return '🪪';
      case 'certificate':
        return '📜';
      case 'authorization':
        return '📋';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Cargando archivos...</span>
      </div>
    );
  }

  // Si no hay archivos requeridos, no mostrar nada
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-document border border-slate-200 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-navy-900" />
          <h3 className="text-base font-semibold text-navy-900 font-sans">
            Documentos Requeridos
          </h3>
        </div>
        {progress && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600 font-sans">
              {progress.total_uploaded} de {progress.total_required}
            </div>
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-legal-emerald-500 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {files.map((fileConfig) => (
          <div
            key={fileConfig.slug}
            className={`border rounded-lg p-4 transition-all ${
              fileConfig.uploaded
                ? 'border-legal-emerald-200 bg-legal-emerald-50/50'
                : 'border-slate-200 bg-slate-50 hover:border-navy-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-2xl shrink-0">
                {getFileTypeIcon(fileConfig.file_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-navy-900 font-sans text-sm">
                    {fileConfig.title}
                  </h4>
                  {fileConfig.required && (
                    <span className="text-xs text-red-600 font-medium">*</span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Formatos: {fileConfig.accepted_formats.replace(/\./g, '').toUpperCase()} 
                  {' · '}
                  Máx: {fileConfig.max_size_mb}MB
                </p>

                {fileConfig.uploaded && fileConfig.original_filename && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-legal-emerald-600" />
                    <span className="text-sm text-slate-700 truncate">
                      {fileConfig.original_filename}
                    </span>
                    {fileConfig.file_size_bytes && (
                      <span className="text-xs text-slate-400">
                        ({formatFileSize(fileConfig.file_size_bytes)})
                      </span>
                    )}
                  </div>
                )}

                {fileConfig.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    Motivo de rechazo: {fileConfig.rejection_reason}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0">
                {uploadingSlug === fileConfig.slug ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-navy-600" />
                  </div>
                ) : fileConfig.uploaded ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-legal-emerald-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-legal-emerald-600" />
                    </div>
                    <button
                      onClick={() => handleDelete(fileConfig.file_id!, fileConfig.slug)}
                      className="w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept={fileConfig.accepted_formats}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(fileConfig.slug, file);
                        }
                        e.target.value = ''; // Reset para permitir subir el mismo archivo
                      }}
                    />
                    <div className="px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Subir
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {progress && !progress.all_required_uploaded && (
        <p className="mt-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg font-sans">
          ⚠️ Debes subir todos los documentos requeridos para poder continuar.
        </p>
      )}
    </div>
  );
}
