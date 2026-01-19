import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const handleRetry = () => {
    navigate(`/payment/${contractId}?tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // Abrir email de soporte
    window.location.href = 'mailto:soporte@dalton.cl?subject=Problema con pago - ' + trackingCode;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
        {/* Icono de error */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Pago Rechazado
        </h1>
        
        <p className="text-lg text-gray-700 mb-6">
          No pudimos procesar tu pago. Por favor intenta nuevamente.
        </p>

        {/* Posibles causas */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Posibles causas:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-2">
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Código de seguimiento: <span className="font-mono font-bold">{trackingCode}</span>
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reintentar Pago
          </button>
          
          <button
            onClick={handleContactSupport}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Contactar Soporte
          </button>

          <button
            onClick={handleGoHome}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
          >
            Volver al inicio
          </button>
        </div>

        {/* Información de contacto */}
        <div className="mt-6 pt-6 border-t text-sm text-gray-500">
          <p>¿Necesitas ayuda?</p>
          <p className="font-medium">soporte@dalton.cl</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
