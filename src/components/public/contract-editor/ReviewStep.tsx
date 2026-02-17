import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, Shield, Zap, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../../../services/api';
import { formatPrice } from './utils/formatPrice';
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
      
      const response = await api.get(
        `/contracts/${contractId}/preview-pdf?tracking_code=${trackingCode}&rut=${encodeURIComponent(buyerRut)}`,
        { responseType: 'blob' }
      );
      
      const pdfBlob = response.data;
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

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Header */}
      <EditorHeader
         steps={steps}
         currentStep="review"
         onBack={onBack}
         rightAction={
             <button
              onClick={handleApprove}
              disabled={loading || isProcessing || !pdfUrl}
              className="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 whitespace-nowrap text-sm md:text-base"
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

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 max-w-[1920px] mx-auto w-full p-3 md:p-6 relative z-10 overflow-hidden min-h-0">
        {/* PDF Preview */}
        <div className="flex-1 bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
          {/* Header simplificado */}
          <div className="border-b border-slate-200 p-3 md:p-5 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-navy-900 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-serif font-semibold text-navy-900">Vista previa del contrato</h2>
                <p className="text-xs md:text-sm text-slate-500 font-sans hidden sm:block">Revisa cuidadosamente antes de aprobar</p>
              </div>
            </div>
            
            {/* Botón recargar minimalista */}
            <button
              onClick={() => {
                hasLoadedRef.current = false;
                loadPdfPreview();
              }}
              disabled={loading}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-slate-600 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-colors text-xs md:text-sm font-medium font-sans"
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recargar</span>
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden relative bg-slate-50">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-t-navy-900 mx-auto mb-4"></div>
                  <p className="text-navy-900 font-semibold font-sans">Generando vista previa...</p>
                  <p className="text-slate-500 text-sm mt-1 font-sans">Esto puede tomar unos segundos</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-navy-900 mb-2">Error al cargar la vista previa</h3>
                  <p className="text-slate-600 mb-6 font-sans">{error}</p>
                  <button
                    onClick={() => {
                      hasLoadedRef.current = false;
                      loadPdfPreview();
                    }}
                    className="px-6 py-2.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors font-medium font-sans"
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
        <div className="w-full lg:w-80 flex flex-col gap-3 md:gap-4 lg:order-last overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-none">
          {/* Info de firma seleccionada */}
          {signatureType !== 'none' && (
            <div className="bg-white rounded-lg shadow-document border border-slate-200 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Shield className="w-4 h-4 text-legal-emerald-600" />
                <h3 className="text-sm font-semibold text-navy-900 font-sans">Firma Electrónica</h3>
              </div>
              
              <div className={`flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg border ${
                signatureType === 'fea' 
                  ? 'border-legal-emerald-200 bg-legal-emerald-50' 
                  : 'border-legal-emerald-200 bg-legal-emerald-50'
              }`}>
                <div className="w-8 h-8 bg-legal-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {signatureType === 'fea' ? (
                    <Shield className="w-4 h-4 text-white" />
                  ) : (
                    <Zap className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-navy-900 font-sans text-sm">
                    {signatureType === 'fea' ? 'FEA (Avanzada)' : 'FES (Simple)'}
                  </div>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">
                    Incluida en tu pago
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Precio Total */}
          <div className="bg-white rounded-lg shadow-document border border-slate-200 p-4 md:p-5">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 font-sans">Total pagado</div>
            <div className="text-2xl md:text-3xl font-bold text-navy-900 font-sans mb-1">
              {formatPrice(totalPrice)}
            </div>
            <p className="text-xs text-slate-500 font-sans">IVA incluido</p>
          </div>

          {/* Instrucciones */}
          <div className="bg-legal-emerald-50 rounded-lg border border-legal-emerald-100 p-4 md:p-5">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-8 h-8 bg-legal-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-900 mb-1.5 font-serif text-sm">Próximo paso</h4>
                <p className="text-sm text-slate-700 font-sans leading-relaxed">
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
