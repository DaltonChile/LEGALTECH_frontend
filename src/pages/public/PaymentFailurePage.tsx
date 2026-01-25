import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  const hasSigners = searchParams.get('hasSigners') || 'true';

  const handleRetry = () => {
    navigate(`/payment/${contractId}?tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // Abrir email de soporte
    window.location.href = 'mailto:soporte@dalton.cl?subject=Problema con pago - ' + trackingCode;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-document border border-slate-200 p-8 max-w-lg w-full text-center">
        {/* Icono de error */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-serif font-bold text-red-600 mb-4">
          Pago Rechazado
        </h1>
        
        <p className="text-lg text-slate-700 mb-6 font-sans">
          No pudimos procesar tu pago. Por favor intenta nuevamente.
        </p>

        {/* Posibles causas */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center font-sans">
            <span className="mr-2">💡</span>
            Posibles causas:
          </h3>
          <ul className="text-sm text-amber-700 space-y-2 font-sans">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Fondos insuficientes en la tarjeta</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Datos de la tarjeta incorrectos</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Límite de compra diario excedido</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Problema con el banco emisor</span>
            </li>
          </ul>
        </div>

        {/* Información del contrato */}
        {trackingCode && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            <p className="text-sm text-slate-600 font-sans">
              Código de seguimiento: <span className="font-mono font-bold">{trackingCode}</span>
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors font-sans"
          >
            Reintentar Pago
          </button>
          
          <button
            onClick={handleContactSupport}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg transition-colors font-sans"
          >
            Contactar Soporte
          </button>

          <button
            onClick={handleGoHome}
            className="w-full text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors font-sans"
          >
            Volver al inicio
          </button>
        </div>

        {/* Información de contacto */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500 font-sans">
          <p>¿Necesitas ayuda?</p>
          <p className="font-medium text-navy-900">soporte@dalton.cl</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
