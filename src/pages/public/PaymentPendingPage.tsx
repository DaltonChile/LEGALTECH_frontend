import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Loader2, CreditCard, FileText, Shield, Mail, Search } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { Navbar } from '../../components/landing/Navbar';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';
import { getStepsForFlow, getCustomDocumentSteps } from '../../utils/flowConfig';

const PaymentPendingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  const hasSigners = searchParams.get('hasSigners') === 'true';

  // Custom document params
  const isCustomDocument = searchParams.get('isCustom') === 'true';
  const signatureType = searchParams.get('signatureType') || 'simple';
  const customNotary = searchParams.get('customNotary') || 'false';

  const [checking, setChecking] = useState(true);

  // Build custom params for redirect
  const customParams = isCustomDocument
    ? `&isCustom=true&signatureType=${signatureType}&customNotary=${customNotary}`
    : '';

  // Calculate steps based on document type
  const PROGRESS_STEPS = useMemo(() => {
    if (isCustomDocument) {
      return getCustomDocumentSteps(hasSigners);
    }
    return getStepsForFlow(hasSigners);
  }, [isCustomDocument, hasSigners]);

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      return;
    }

    const checkStatus = async () => {
      try {
        const result = await paymentService.pollPaymentStatus(contractId, trackingCode, rut, {
          intervalMs: 2000,
          maxAttempts: 30,
        });

        if (result.contract_status === 'draft' || result.contract_status === 'waiting_signatures' || result.contract_status === 'waiting_notary') {
          navigate(`/payment/success?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
        }
      } catch {
        setChecking(false);
      }
    };

    checkStatus();
  }, [contractId, trackingCode, rut, navigate]);

  const handleCheckStatus = () => {
    navigate(`/tracking?code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
  };

  const handleGoHome = () => {
    navigate('/');
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

          {/* Header del Card */}
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
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-sans">Código de seguimiento</span>
                    <span className="font-mono font-medium text-slate-700">{trackingCode}</span>
                  </div>
                </div>
              </div>

              {/* What to do */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <h3 className="font-semibold text-navy-900 mb-3 font-sans">¿Qué debo hacer?</h3>
                <ul className="text-sm text-slate-600 space-y-2.5 font-sans">
                  <li className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Recibirás un email cuando el pago sea confirmado</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Search className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Puedes verificar el estado con tu código de seguimiento</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Los pagos con transferencia pueden demorar hasta 24 horas</span>
                  </li>
                </ul>
              </div>

              {/* Security badge */}
              <div className="bg-legal-emerald-50 border border-legal-emerald-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-legal-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-legal-emerald-800 text-sm font-sans">Pago 100% seguro</p>
                    <p className="text-xs text-legal-emerald-700 mt-1 font-sans">
                      Tu información está encriptada y procesada por Mercado Pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pending state (replaces Payment Brick) */}
            <div className="flex flex-col">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 flex flex-col items-center text-center flex-1 justify-center">
                {/* Pending icon */}
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-5">
                  {checking ? (
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  ) : (
                    <Clock className="w-8 h-8 text-amber-600" />
                  )}
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">
                  Pago en Proceso
                </h2>
                <p className="text-slate-500 text-sm mb-8 font-sans max-w-xs">
                  {checking
                    ? 'Estamos verificando tu pago con Mercado Pago. Esto puede tomar unos momentos.'
                    : 'Tu pago está siendo procesado. Recibirás una confirmación por email.'}
                </p>

                {/* Check status button */}
                <button
                  onClick={handleCheckStatus}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors font-sans flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Consultar Estado
                </button>

                {/* Go home link */}
                <button
                  onClick={handleGoHome}
                  className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-6 rounded-lg transition-colors font-sans text-sm"
                >
                  Volver al Inicio
                </button>

                {checking && (
                  <p className="text-xs text-slate-400 mt-5 font-sans">
                    Verificando estado del pago...
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentPendingPage;
