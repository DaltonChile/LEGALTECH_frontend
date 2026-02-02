import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';

const PaymentPendingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  const hasSigners = searchParams.get('hasSigners') || 'true';
  
  // Custom document params
  const isCustomDocument = searchParams.get('isCustom') === 'true';
  const signatureType = searchParams.get('signatureType') || 'simple';
  const customNotary = searchParams.get('customNotary') || 'false';

  const [checking, setChecking] = useState(true);
  
  // Build custom params for redirect
  const customParams = isCustomDocument 
    ? `&isCustom=true&signatureType=${signatureType}&customNotary=${customNotary}`
    : '';

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      return;
    }

    // Intentar polling por un tiempo más corto
    const checkStatus = async () => {
      try {
        const result = await paymentService.pollPaymentStatus(contractId, trackingCode, rut, {
          intervalMs: 2000, // 2 segundos para pagos pendientes
          maxAttempts: 30,  // 1 minuto total
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-document border border-slate-200 p-8 max-w-lg w-full text-center">
        {/* Icono de pendiente */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-serif font-bold text-amber-600 mb-4">
          Pago en Proceso
        </h1>
        
        <p className="text-lg text-slate-700 mb-6 font-sans">
          Tu pago está siendo procesado. Esto puede tomar unos minutos.
        </p>

        {/* Información */}
        <div className="bg-legal-emerald-50 border border-legal-emerald-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-slate-600 mb-2 font-sans">Tu código de seguimiento:</p>
          <p className="text-3xl font-mono font-bold text-legal-emerald-700">{trackingCode}</p>
          <p className="text-sm text-slate-500 mt-3 font-sans">
            Guarda este código para consultar el estado de tu pago.
          </p>
        </div>

        {/* Estado del polling */}
        {checking && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-900 mr-3"></div>
              <p className="text-sm text-slate-600 font-sans">Verificando estado del pago...</p>
            </div>
          </div>
        )}

        {/* Qué hacer */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left border border-slate-200">
          <h3 className="font-semibold text-navy-900 mb-3 font-sans">¿Qué debo hacer?</h3>
          <ul className="text-sm text-slate-600 space-y-2 font-sans">
            <li className="flex items-start">
              <span className="mr-2">📧</span>
              <span>Recibirás un email cuando el pago sea confirmado</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🔍</span>
              <span>Puedes verificar el estado con tu código de seguimiento</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>Los pagos con transferencia pueden demorar hasta 24 horas</span>
            </li>
          </ul>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors font-sans"
          >
            Consultar Estado
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors font-sans"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
      </div>

      <PageFooter />
    </div>
  );
};

export default PaymentPendingPage;
