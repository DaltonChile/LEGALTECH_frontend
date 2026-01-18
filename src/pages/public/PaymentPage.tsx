import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet } from '@mercadopago/sdk-react';
import paymentService from '../../services/paymentService';
import mercadoPagoConfig from '../../config/mercadopago';

const PaymentPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      setError('Faltan datos del contrato');
      setLoading(false);
      return;
    }
    createPreference();
  }, [contractId, trackingCode, rut]);

  const createPreference = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentService.createPreference({
        contract_id: contractId!,
        tracking_code: trackingCode,
        rut: rut
      });

      if (response.success && response.data) {
        setPreferenceId(response.data.preference_id);
        setAmount(response.data.amount);
      } else {
        throw new Error('Error al crear preferencia de pago');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error creando preferencia:', err);
      setError(err.response?.data?.error || err.message || 'Error al iniciar el pago');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-4 text-center">Error</h1>
          <p className="text-gray-700 text-center mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => createPreference()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Completar Pago</h1>
          <p className="text-gray-600">Finaliza tu compra de forma segura con Mercado Pago</p>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Resumen del pedido</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Código de seguimiento:</span>
              <span className="font-mono font-bold text-blue-600">{trackingCode}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total a pagar:</span>
              <span className="text-2xl font-bold text-green-600">
                ${amount.toLocaleString('es-CL')} CLP
              </span>
            </div>
          </div>
        </div>

        {/* Advertencia de modo test */}
        {mercadoPagoConfig.isTestMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-yellow-500 text-xl mr-3">🧪</span>
              <div>
                <p className="font-medium text-yellow-800">Modo de Prueba</p>
                <p className="text-sm text-yellow-700">
                  Usa las tarjetas de test de Mercado Pago. No se cobrará dinero real.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Brick */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Método de pago</h2>
          {preferenceId ? (
            <div className="wallet-brick-container min-h-[200px]">
              <Wallet
                initialization={{ preferenceId }}
                customization={{
                  texts: {
                    valueProp: 'security_safety',
                  },
                }}
                onSubmit={() => {
                  console.log('Procesando pago...');
                }}
                onReady={() => {
                  console.log('Wallet Brick listo');
                }}
                onError={(error) => {
                  console.error('Error en Wallet Brick:', error);
                  setError('Error al cargar el método de pago');
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Cargando métodos de pago...
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-500 text-xl mr-3">🔒</span>
            <div>
              <p className="font-medium text-blue-800">Pago seguro</p>
              <p className="text-sm text-blue-700">
                Tu información está protegida y el pago es procesado por Mercado Pago.
                Después del pago, recibirás un email para continuar con tu contrato.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
