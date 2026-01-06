import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ReviewStepProps {
  renderedContractHtml: string;
  totalPrice: number;
  onApprove: () => void;
  onBack: () => void;
}

export function ReviewStep({
  renderedContractHtml,
  totalPrice,
  onApprove,
  onBack,
}: ReviewStepProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generatePreview();
  }, []);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        html: renderedContractHtml
      };
      
      console.log('📤 Generando preview con HTML renderizado');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contracts/generate-preview`,
        payload
      );

      if (response.data.success) {
        // Construir URL completa
        let url = response.data.pdf_url;
        if (url.startsWith('/uploads')) {
          // Los archivos estáticos se sirven desde la raíz, no desde /api/v1
          const baseUrl = import.meta.env.VITE_API_URL.replace('/api/v1', '');
          url = `${baseUrl}${url}`;
        }
        setPdfUrl(url);
      } else {
        setError(response.data.error || 'Error al generar preview');
      }
    } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.response?.data?.error || 'Error al generar PDF de previsualización');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6">
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full">
        {/* PDF Preview */}
        <div className="flex-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white/80 text-xs">Vista previa del contrato</div>
              <div className="text-white font-semibold">Revisa tu contrato antes de pagar</div>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden relative bg-slate-50">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Generando vista previa...</p>
                  <p className="text-slate-500 text-sm mt-2">Esto puede tomar unos segundos</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-6">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al generar preview</h3>
                  <p className="text-slate-600 mb-4">{error}</p>
                  <button
                    onClick={generatePreview}
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
        <div className="w-96 flex flex-col gap-4">
          {/* Precio Total */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total a pagar</h3>
            <div className="text-3xl font-bold text-slate-900">
              {formatPrice(totalPrice)}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-cyan-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Revisa cuidadosamente</h4>
                <p className="text-sm text-slate-600">
                  Verifica que toda la información esté correcta antes de continuar al pago.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Cápsulas con blur</h4>
                <p className="text-sm text-slate-600">
                  Las cápsulas no seleccionadas aparecen difuminadas. Se desbloquearán tras el pago.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onApprove}
              disabled={!pdfUrl || loading}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                !pdfUrl || loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105'
              }`}
            >
              Aprobar y continuar al pago →
            </button>

            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl font-medium text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Volver a editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
