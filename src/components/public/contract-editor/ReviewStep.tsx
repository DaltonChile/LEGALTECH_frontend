import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, Shield, Zap, RefreshCw, ArrowRight } from 'lucide-react';
import { EditorHeader } from './EditorHeader';

interface ReviewStepProps {
  contractId: string;
  trackingCode: string;
  buyerRut: string;
  totalPrice: number;
  steps: { id: string; label: string }[];
  onApprove: () => void;
  onBack: () => void;
  isProcessing?: boolean;
  signatureType?: 'simple' | 'fea' | 'none';
}

export function ReviewStep({
  contractId,
  trackingCode,
  buyerRut,
  totalPrice,
  steps,
  onApprove,
  onBack,
  isProcessing = false,
  signatureType = 'simple',
}: ReviewStepProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current && contractId && trackingCode && buyerRut) {
      hasLoadedRef.current = true;
      loadPdfPreview();
    }
  }, [contractId, trackingCode, buyerRut]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const loadPdfPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Solicitando PDF preview del backend...');
      
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = `${apiUrl}/contracts/${contractId}/preview-pdf?tracking_code=${trackingCode}&rut=${encodeURIComponent(buyerRut)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(blobUrl);
      
      console.log('✅ PDF preview cargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error loading PDF preview:', err);
      setError(err.message || 'Error al cargar la vista previa del PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (loading || isProcessing) return;
    onApprove();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
       {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Header */}
      <EditorHeader
         steps={steps}
         currentStep="review"
         onBack={onBack}
         rightAction={
             <button
              onClick={handleApprove}
              disabled={loading || isProcessing || !pdfUrl}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 whitespace-nowrap"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Aprobar y Enviar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
         }
      />

      <div className="flex-1 flex gap-6 max-w-[1920px] mx-auto w-full p-6 relative z-10 overflow-hidden min-h-0">
        {/* PDF Preview */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-xs">Vista previa del contrato</div>
                <div className="text-white font-semibold">Revisa tu contrato antes de firmar</div>
              </div>
            </div>
            
            {/* Botón recargar */}
            <button
              onClick={() => {
                hasLoadedRef.current = false;
                loadPdfPreview();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden relative bg-slate-100">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Generando vista previa...</p>
                  <p className="text-slate-500 text-sm mt-2">Esto puede tomar unos segundos</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-6">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al cargar preview</h3>
                  <p className="text-slate-600 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      hasLoadedRef.current = false;
                      loadPdfPreview();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Intentar nuevamente
                  </button>
                </div>
              </div>
            )}

            {pdfUrl && !loading && !error && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Vista previa del contrato"
              />
            )}
          </div>
        </div>

        {/* Sidebar - Resumen y Acciones */}
        <div className="w-80 flex flex-col gap-4">
          {/* Info de firma seleccionada */}
          {signatureType !== 'none' && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Firma Electrónica
              </h3>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                signatureType === 'fea' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
              }`}>
                {signatureType === 'fea' ? (
                  <Shield className="w-5 h-5 text-blue-600" />
                ) : (
                  <Zap className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <span className="font-semibold text-sm">
                    {signatureType === 'fea' ? 'FEA (Avanzada)' : 'FES (Simple)'}
                  </span>
                  <p className="text-xs text-gray-600">
                    Incluida en tu pago
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Precio Total */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total pagado</h3>
            <div className="text-3xl font-bold text-slate-900">
              {formatPrice(totalPrice)}
            </div>
            <p className="text-xs text-slate-500 mt-1">IVA incluido</p>
          </div>

          {/* Instrucciones */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-cyan-200 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Próximo paso</h4>
                <p className="text-sm text-slate-600">
                  Al aprobar, todas las partes recibirán un enlace por correo electrónico para firmar el contrato.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {/* Moved to Header */}
        </div>
      </div>
    </div>
  );
}
