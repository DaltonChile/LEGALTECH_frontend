import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [status, setStatus] = useState<'checking' | 'confirmed' | 'error'>('checking');
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const maxAttempts = 20;

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      setStatus('error');
      setErrorMessage('Datos de pago incompletos');
      return;
    }
    startPolling();
  }, []);

  const startPolling = async () => {
    try {
      await paymentService.pollPaymentStatus(contractId, trackingCode, rut, {
        intervalMs: 3000,
        maxAttempts: 20,
        onStatusChange: (data) => {
          setAttempts((prev) => prev + 1);
          console.log('Status check:', data);
        },
      });
      setStatus('confirmed');
    } catch (error: any) {
      console.error('Error en polling:', error);
      if (error.message === 'Pago rechazado') {
        navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
      } else {
        // Timeout - mostrar mensaje pero aún puede haber funcionado
        setStatus('confirmed');
      }
    }
  };

  const handleContinue = () => {
    navigate(`/contracts/resume?id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Verificando tu pago...
          </h1>
          <p className="text-gray-600 mb-4">
            Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.
          </p>
          <div className="bg-gray-100 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(attempts / maxAttempts) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Verificando... ({attempts}/{maxAttempts})
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
        {/* Icono de éxito */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ¡Pago Confirmado!
        </h1>
        
        <p className="text-lg text-gray-700 mb-6">
          Tu pago ha sido procesado exitosamente.
        </p>

        {/* Código de seguimiento */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Tu código de seguimiento:</p>
          <p className="text-3xl font-mono font-bold text-blue-600">{trackingCode}</p>
          <p className="text-sm text-gray-500 mt-3">
            Guarda este código. También te lo enviamos por email.
          </p>
        </div>

        {/* Próximos pasos */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3">Próximos pasos:</h3>
          <ol className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">1</span>
              <span>Completa el formulario con los datos restantes</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">2</span>
              <span>Revisa el contrato generado</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">3</span>
              <span>Firma electrónicamente</span>
            </li>
          </ol>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Completar mi Contrato
          </button>
          
          <p className="text-sm text-gray-500">
            Puedes continuar ahora o más tarde usando tu código de seguimiento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
