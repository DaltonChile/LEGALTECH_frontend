import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, CreditCard, Shield, FileText, Mail, ChevronRight } from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';
import { getStepsForFlow, getCustomDocumentSteps } from '../../utils/flowConfig';

const POSSIBLE_CAUSES = [
  'Fondos insuficientes en la tarjeta',
  'Datos de la tarjeta incorrectos',
  'Límite de compra diario excedido',
  'Problema temporal con el banco emisor',
];

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  const hasSigners = searchParams.get('hasSigners') === 'true';

  // Custom document params
  const isCustomDocument = searchParams.get('isCustom') === 'true';

  // Calculate steps based on document type
  const PROGRESS_STEPS = useMemo(() => {
    if (isCustomDocument) {
      return getCustomDocumentSteps(hasSigners);
    }
    return getStepsForFlow(hasSigners);
  }, [isCustomDocument, hasSigners]);

  const handleRetry = () => {
    const customParams = isCustomDocument
      ? `&isCustom=true`
      : '';
    navigate(`/payment/${contractId}?tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
  };

  const handleContactSupport = () => {
    window.location.href = `mailto:soporte@dalton.cl?subject=Problema con pago - ${trackingCode}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Navbar */}
      <Navbar />

      {/* Header with progress steps */}
      <EditorHeader
        steps={PROGRESS_STEPS}
        currentStep="payment"
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-white rounded-lg shadow-document-hover border border-slate-200 p-8 max-w-4xl w-full">

          {/* Header del Card - same as PaymentPage */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-navy-900">Completar Pago</h1>
              <p className="text-slate-500 font-sans">Finaliza tu compra de forma segura con Mercado Pago</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Order info */}
            <div className="space-y-6">
              {/* Tracking code */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 font-sans">
                  <FileText className="w-4 h-4" />
                  Tu pedido
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-sans">Código de seguimiento</span>
                  <span className="font-mono font-medium text-slate-700">{trackingCode}</span>
                </div>
              </div>

              {/* Possible causes */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2 font-sans text-sm">
                  Posibles causas
                </h3>
                <ul className="space-y-1.5">
                  {POSSIBLE_CAUSES.map((cause, i) => (
                    <li key={i} className="text-xs text-slate-500 flex items-start gap-2 font-sans">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security badge */}
              <div className="bg-legal-emerald-50 border border-legal-emerald-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-legal-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-legal-emerald-800 text-sm font-sans">No se realizó ningún cobro</p>
                    <p className="text-xs text-legal-emerald-700 mt-1 font-sans">
                      Tu tarjeta no fue cargada. Puedes intentar nuevamente de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Error state (replaces Payment Brick) */}
            <div className="flex flex-col">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 flex flex-col items-center text-center flex-1 justify-center">
                {/* Error icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-5">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">
                  Pago no procesado
                </h2>
                <p className="text-slate-500 text-sm mb-8 font-sans max-w-xs">
                  No pudimos procesar tu pago. Revisa los datos de tu tarjeta e intenta nuevamente.
                </p>

                {/* Retry button */}
                <button
                  onClick={handleRetry}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors font-sans flex items-center justify-center gap-2"
                >
                  Reintentar Pago
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Support link */}
                <button
                  onClick={handleContactSupport}
                  className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-6 rounded-lg transition-colors font-sans flex items-center justify-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Contactar Soporte
                </button>

                <p className="text-xs text-slate-400 mt-5 font-sans">
                  soporte@dalton.cl
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
