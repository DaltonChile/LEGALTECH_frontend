import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

const PaymentPendingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      return;
    }

    // Intentar polling por un tiempo más corto
    const checkStatus = async () => {
      try {
        const result = await paymentService.pollPaymentStatus(contractId, trackingCode, rut, {
          intervalMs: 5000,
          maxAttempts: 12, // 1 minuto
        });

        if (result.contract_status === 'draft') {
          navigate(`/payment/success?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
        {/* Icono de pendiente */}
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-yellow-600 mb-4">
          Pago en Proceso
        </h1>
        
        <p className="text-lg text-gray-700 mb-6">
          Tu pago está siendo procesado. Esto puede tomar unos minutos.
        </p>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Tu código de seguimiento:</p>
          <p className="text-3xl font-mono font-bold text-blue-600">{trackingCode}</p>
          <p className="text-sm text-gray-500 mt-3">
            Guarda este código para consultar el estado de tu pago.
          </p>
        </div>

        {/* Estado del polling */}
        {checking && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-gray-600">Verificando estado del pago...</p>
            </div>
          </div>
        )}

        {/* Qué hacer */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3">¿Qué debo hacer?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Consultar Estado
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPendingPage;
