import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Trash2, Loader2, CreditCard, FileCheck, Shield, IdCard } from 'lucide-react';
import api from '../../../services/api';
import { getErrorMessage } from '../../../utils/validators';

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
    // Validar que tenemos los datos necesarios antes de hacer la llamada
    if (!trackingCode || !buyerRut) {
      console.warn('📁 FileUploadStep: Missing trackingCode or buyerRut, skipping file load');
      console.warn('  trackingCode:', trackingCode);
      console.warn('  buyerRut:', buyerRut);
      // Si no hay datos, asumir que no hay archivos requeridos
      setLoading(false);
      onFilesStatusChange?.(true);
      onAllFilesUploaded();
      return;
    }

    try {
      setError(null);
      const response = await api.get(
        `/contracts/${trackingCode}/files?rut=${encodeURIComponent(buyerRut)}`
      );

      if (response.data.success) {
        console.log('📁 FileUploadStep: Files loaded:', response.data.data.files.length, 'files');
        console.log('📊 FileUploadStep: Progress:', response.data.data.progress);
        setFiles(response.data.data.files);
        setProgress(response.data.data.progress);
        
        // Notificar si todos los archivos están subidos
        const allUploaded = response.data.data.progress.all_required_uploaded;
        onFilesStatusChange?.(allUploaded);
        
        // Si no hay archivos requeridos, marcar como completado
        if (response.data.data.files.length === 0) {
          console.log('📁 FileUploadStep: No files required, marking as complete');
          onFilesStatusChange?.(true);
          onAllFilesUploaded();
        } else if (allUploaded) {
          onAllFilesUploaded();
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading files:', err);
      
      // Manejar error de red (backend no disponible)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('📁 FileUploadStep: Network error - backend might not be running');
        // En caso de error de red, asumir que no hay archivos requeridos
        // para no bloquear el flujo del usuario
        setError('No se pudo conectar con el servidor. Intentando continuar...');
        onFilesStatusChange?.(true);
        onAllFilesUploaded();
        return;
      }
      
      // Si el error es 404, probablemente no hay archivos requeridos para este template
      // Marcar como completado y no mostrar error
      if (err.response?.status === 404) {
        console.log('📁 FileUploadStep: No files endpoint or contract not found, assuming no files required');
        onFilesStatusChange?.(true);
        onAllFilesUploaded();
        return;
      }
      
      setError(getErrorMessage(err, 'Error al cargar los archivos'));
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

      const response = await api.post(
        `/contracts/${trackingCode}/files?rut=${encodeURIComponent(buyerRut)}`,
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
      
      // Manejar error de red
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Error de conexión. Por favor verifica tu conexión a internet e intenta de nuevo.');
        return;
      }
      
      setError(getErrorMessage(err, 'Error al subir el archivo'));
    } finally {
      setUploadingSlug(null);
    }
  };

  const handleDelete = async (fileId: string, fileSlug: string) => {
    if (!confirm('¿Está seguro de eliminar este archivo?')) return;

    setUploadingSlug(fileSlug);
    setError(null);

    try {
      await api.delete(
        `/contracts/${trackingCode}/files/${fileId}?rut=${encodeURIComponent(buyerRut)}`
      );

      // Recargar la lista de archivos
      await loadFiles();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      
      // Manejar error de red
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Error de conexión. Por favor verifica tu conexión a internet e intenta de nuevo.');
        return;
      }
      
      setError(getErrorMessage(err, 'Error al eliminar el archivo'));
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
    const iconClass = "w-5 h-5";
    switch (fileType) {
      case 'identification':
        return <IdCard className={iconClass} />;
      case 'passport':
        return <CreditCard className={iconClass} />;
      case 'certificate':
        return <FileCheck className={iconClass} />;
      case 'authorization':
        return <Shield className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
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
    <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900 font-sans">
            Documentos Requeridos
          </h3>
        </div>
        {progress && (
          <div className="text-sm text-slate-600 font-sans">
            {progress.total_uploaded} de {progress.total_required}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {files.map((fileConfig) => (
          <div
            key={fileConfig.slug}
            className={`border rounded-lg p-4 transition-all ${
              fileConfig.uploaded
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                fileConfig.uploaded
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {getFileTypeIcon(fileConfig.file_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900 font-sans text-sm">
                    {fileConfig.title}
                  </h4>
                  {fileConfig.required && (
                    <span className="text-xs text-red-600 font-medium">*</span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Formatos: {fileConfig.accepted_formats.replace(/\./g, '').toUpperCase()} · Máx: {fileConfig.max_size_mb}MB
                </p>

                {fileConfig.uploaded && fileConfig.original_filename && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
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
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                  </div>
                ) : fileConfig.uploaded ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-600" />
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
                        e.target.value = '';
                      }}
                    />
                    <div className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
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
    </div>
  );
}
