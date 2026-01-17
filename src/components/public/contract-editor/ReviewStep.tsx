import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { FileText, CheckCircle, AlertCircle, Shield, Zap } from 'lucide-react';

export interface SignatureInfo {
  numberOfSigners: number;
  requiresNotary: boolean;
  requiresSignatures: boolean;
  pricing: {
    fes: {
      pricePerSigner: number;
      totalPrice: number;
    };
    fea: {
      pricePerSigner: number;
      totalPrice: number;
    };
  };
}

interface ReviewStepProps {
  renderedContractHtml: string;
  totalPrice: number;
  onApprove: (pdfBlob: Blob, signatureType?: 'simple' | 'fea' | 'none') => void;
  onBack: () => void;
  isProcessing?: boolean;
  signatureInfo?: SignatureInfo;
  // Nuevas props para el nuevo flujo
  isNewFlow?: boolean;
  contractId?: string;
  trackingCode?: string;
  buyerRut?: string;
  onApproveAndSign?: () => void;
}

export function ReviewStep({
  renderedContractHtml,
  totalPrice,
  onApprove,
  onBack,
  isProcessing = false,
  signatureInfo,
  isNewFlow = false,
  contractId,
  trackingCode,
  buyerRut,
  onApproveAndSign,
}: ReviewStepProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'simple' | 'fea' | 'none'>('simple');
  const hasGeneratedRef = useRef(false);

  const requiresSignature = signatureInfo?.requiresSignatures || false;

  useEffect(() => {
    if (!requiresSignature) {
      setSignatureType('none');
    }
  }, [requiresSignature]);

  useEffect(() => {
    // Only generate once to prevent duplicate uploads
    // Using ref instead of state to avoid dependency issues
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generatePreview();
    }
  }, []);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Sanitize HTML and apply safe inline styles to every element
  const sanitizeHtmlForPdf = (html: string): string => {
    // Use DOMParser to safely parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove style and link tags first
    doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el: Element) => {
      el.remove();
    });
    
    // CRITICAL: Remove ALL existing style and class attributes FIRST
    doc.querySelectorAll('*').forEach((el: Element) => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('id');
    });
    
    // Apply explicit safe styles to ALL elements - use setAttribute to ensure clean values
    doc.querySelectorAll('*').forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      // Build a complete style string with ALL safe values
      let styleStr = 'color: rgb(31, 41, 55); background-color: rgba(0, 0, 0, 0);';
      
      switch (tag) {
        case 'h1':
          styleStr = 'font-size: 24px; font-weight: bold; color: rgb(17, 24, 39); margin: 16px 0px 8px 0px; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'h2':
          styleStr = 'font-size: 20px; font-weight: bold; color: rgb(17, 24, 39); margin: 16px 0px 8px 0px; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'h3':
          styleStr = 'font-size: 18px; font-weight: bold; color: rgb(17, 24, 39); margin: 14px 0px 7px 0px; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'h4':
        case 'h5':
        case 'h6':
          styleStr = 'font-size: 16px; font-weight: bold; color: rgb(17, 24, 39); margin: 12px 0px 6px 0px; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'p':
          styleStr = 'color: rgb(31, 41, 55); margin: 8px 0px; line-height: 1.6; text-align: justify; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'strong':
        case 'b':
          styleStr = 'font-weight: bold; color: rgb(17, 24, 39); background-color: rgba(0, 0, 0, 0);';
          break;
        case 'em':
        case 'i':
          styleStr = 'font-style: italic; color: rgb(31, 41, 55); background-color: rgba(0, 0, 0, 0);';
          break;
        case 'ul':
        case 'ol':
          styleStr = 'margin: 8px 0px; padding-left: 20px; color: rgb(31, 41, 55); background-color: rgba(0, 0, 0, 0);';
          break;
        case 'li':
          styleStr = 'margin: 4px 0px; color: rgb(31, 41, 55); background-color: rgba(0, 0, 0, 0);';
          break;
        case 'table':
          styleStr = 'width: 100%; border-collapse: collapse; margin: 8px 0px; background-color: rgba(0, 0, 0, 0);';
          break;
        case 'td':
          styleStr = 'border: 1px solid rgb(209, 213, 219); padding: 8px; text-align: left; color: rgb(31, 41, 55); background-color: rgb(255, 255, 255);';
          break;
        case 'th':
          styleStr = 'border: 1px solid rgb(209, 213, 219); padding: 8px; text-align: left; color: rgb(17, 24, 39); background-color: rgb(243, 244, 246); font-weight: bold;';
          break;
        case 'div':
        case 'span':
          styleStr = 'color: rgb(31, 41, 55); background-color: rgba(0, 0, 0, 0);';
          break;
      }
      
      // Set the complete style attribute at once
      htmlEl.setAttribute('style', styleStr);
    });
    
    // Return only the body content
    return doc.body.innerHTML;
  };

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Generando PDF en el navegador...');
      console.log('📝 HTML original length:', renderedContractHtml.length);
      
      // Sanitize HTML FIRST to remove all inline styles and style tags
      const sanitizedHtml = sanitizeHtmlForPdf(renderedContractHtml);
      console.log('🧹 HTML sanitizado length:', sanitizedHtml.length);
      console.log('🧹 Primeros 500 chars:', sanitizedHtml.substring(0, 500));
      
      // Create an IFRAME to completely isolate from page CSS
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 210mm; height: 297mm; border: none;';
      document.body.appendChild(iframe);
      
      // Wait for iframe to be ready
      await new Promise(resolve => {
        if (iframe.contentWindow && iframe.contentDocument) {
          resolve(null);
        } else {
          iframe.onload = () => resolve(null);
        }
      });
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('No se pudo crear el documento iframe');
      }
      
      // Write the complete isolated HTML document with NO CSS to avoid any parsing issues
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background: rgb(255, 255, 255); color: rgb(31, 41, 55); padding: 20px; font-size: 14px; line-height: 1.6; margin: 0;">${sanitizedHtml}</body>
</html>`);
      iframeDoc.close();
      
      // Wait a bit for the iframe content to fully render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const iframeBody = iframeDoc.body;
      console.log('📦 Iframe body creado. Inner HTML length:', iframeBody.innerHTML.length);
      console.log('📦 Iframe body text content length:', iframeBody.textContent?.length || 0);
      
      // Configure html2pdf options with aggressive CSS avoidance
      const options = {
        margin: [20, 20, 20, 20] as [number, number, number, number], // 20mm margins
        filename: 'preview_contrato.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: 'white',
          removeContainer: true,
          windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
          windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
          onclone: (clonedDoc: Document) => {
            // Remove ALL stylesheets from the cloned document to prevent CSS parsing
            const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            allStyles.forEach(style => style.remove());
            
            // Remove any remaining class or id attributes that could reference external CSS
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              el.removeAttribute('class');
              el.removeAttribute('id');
            });
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const
        },
      };
      
      // Generate PDF from the isolated iframe body with our sanitized content
      const generatedPdfBlob = await html2pdf()
        .set(options)
        .from(iframeBody)
        .output('blob');
      
      // Store blob for later upload
      setPdfBlob(generatedPdfBlob);
      
      // Create blob URL for iframe preview
      const blobUrl = URL.createObjectURL(generatedPdfBlob);
      setPdfUrl(blobUrl);
      
      // Cleanup - remove the temporary iframe
      document.body.removeChild(iframe);
      
      console.log('✅ PDF generado exitosamente en el cliente');
    } catch (err: any) {
      console.error('❌ Error generating PDF:', err);
      setError('Error al generar PDF de previsualización. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getSignaturePrice = () => {
    if (!signatureInfo || signatureType === 'none') return 0;
    return signatureType === 'fea' 
      ? signatureInfo.pricing.fea.totalPrice 
      : signatureInfo.pricing.fes.totalPrice;
  };

  const getTotalPriceWithSignature = () => {
    return totalPrice + getSignaturePrice();
  };

  const handleApprove = () => {
    // Si es el nuevo flujo, usar la función de aprobar y firmar
    if (isNewFlow && onApproveAndSign) {
      onApproveAndSign();
      return;
    }
    
    // Flujo original
    if (!pdfBlob || loading || isProcessing) return;
    onApprove(pdfBlob, signatureType);
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
        {/* PDF Preview (flex-1 will take 4/5 of space) */}
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

        {/* Sidebar - Resumen y Acciones (w-1/5 will take 1/5 of space) */}
        <div className="w-1/5 flex flex-col gap-4">
          {/* Signature Selection */}
          {requiresSignature && signatureInfo && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Tipo de Firma
              </h3>
              
              <div className="space-y-3">
                {/* FES Option */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  signatureType === 'simple' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="signatureType"
                    value="simple"
                    checked={signatureType === 'simple'}
                    onChange={(e) => setSignatureType(e.target.value as 'simple')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm">FES (Simple)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Firma electrónica simple
                    </p>
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {formatPrice(signatureInfo.pricing.fes.totalPrice)}
                    </p>
                  </div>
                </label>

                {/* FEA Option */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  signatureType === 'fea' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="signatureType"
                    value="fea"
                    checked={signatureType === 'fea'}
                    onChange={(e) => setSignatureType(e.target.value as 'fea')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm">FEA (Avanzada)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Firma electrónica avanzada
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {formatPrice(signatureInfo.pricing.fea.totalPrice)}
                    </p>
                  </div>
                </label>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                {signatureInfo.numberOfSigners} {signatureInfo.numberOfSigners === 1 ? 'firmante' : 'firmantes'}
                {signatureInfo.requiresNotary && ' + firma manual notario'}
              </p>
            </div>
          )}

          {/* Precio Total */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total a pagar</h3>
            {requiresSignature && getSignaturePrice() > 0 && (
              <div className="text-sm text-slate-600 mb-2">
                <div className="flex justify-between">
                  <span>Contrato base:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firma electrónica:</span>
                  <span>{formatPrice(getSignaturePrice())}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
              </div>
            )}
            <div className="text-3xl font-bold text-slate-900">
              {formatPrice(getTotalPriceWithSignature())}
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
                  Las cápsulas seleccionadas aparecen difuminadas. Se desbloquearán tras el pago.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleApprove}
              disabled={!pdfUrl || !pdfBlob || loading || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                !pdfUrl || !pdfBlob || loading || isProcessing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105'
              }`}
            >
              {isProcessing ? 'Procesando...' : isNewFlow ? 'Aprobar y Firmar →' : 'Aprobar y continuar al pago →'}
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
