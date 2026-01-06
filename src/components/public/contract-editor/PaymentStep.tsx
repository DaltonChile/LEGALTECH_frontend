import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PaymentStepProps {
  contractId: string | null;
  trackingCode: string;
  buyerRut: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
  onBack: () => void;
}

export function PaymentStep({
  contractId,
  trackingCode,
  buyerRut,
  totalAmount,
  onPaymentSuccess,
  onPaymentFailed,
  onBack,
}: PaymentStepProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  useEffect(() => {
    if (contractId) {
      initiatePayment();
    }
  }, [contractId]);

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/${contractId}/initiate`,
        {
          contract_id: contractId,
          tracking_code: trackingCode,
          rut: buyerRut,
        }
      );

      if (response.data.success) {
        setPaymentUrl(response.data.payment_url);
        // Simular pago exitoso después de 3 segundos (MOCK)
        // En producción, esto vendría del webhook de la pasarela
        setTimeout(() => {
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);
        }, 3000);
      } else {
        setError(response.data.error || 'Error al iniciar pago');
        setPaymentStatus('failed');
      }
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setError(err.response?.data?.error || 'Error al procesar el pago');
      setPaymentStatus('failed');
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
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Proceso de Pago</h2>
            <p className="text-slate-600 text-sm">Completa el pago para continuar</p>
          </div>
        </div>

        {/* Estado del pago */}
        {paymentStatus === 'pending' && (
          <div className="mb-6">
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600 font-medium">Iniciando proceso de pago...</p>
              </div>
            )}

            {!loading && paymentUrl && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600 font-medium mb-2">Procesando pago...</p>
                <p className="text-slate-500 text-sm">Por favor espera un momento</p>
              </div>
            )}
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="mb-6 text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¡Pago exitoso!</h3>
            <p className="text-slate-600">Tu pago se ha procesado correctamente</p>
            <p className="text-sm text-slate-500 mt-2">Redirigiendo a firmas...</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-6 text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pago fallido</h3>
            <p className="text-slate-600 mb-4">{error || 'Hubo un problema al procesar el pago'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={initiatePayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={onPaymentFailed}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Volver a revisión
              </button>
            </div>
          </div>
        )}

        {/* Resumen de pago */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600">Total a pagar:</span>
            <span className="text-3xl font-bold text-slate-900">
              {formatPrice(totalAmount)}
            </span>
          </div>
          
          <div className="text-sm text-slate-600 space-y-2 border-t border-cyan-200 pt-4">
            <div className="flex justify-between">
              <span>Código de seguimiento:</span>
              <span className="font-mono font-medium text-cyan-600">{trackingCode}</span>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {paymentStatus === 'pending' && !loading && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 text-center">
              <strong className="text-slate-900">Mock de pago:</strong> Esta es una simulación.
              <br />
              En producción, se integrará con Webpay, Flow o MercadoPago.
            </p>
          </div>
        )}

        {/* Botón volver (solo si no está pagado) */}
        {paymentStatus !== 'success' && (
          <button
            onClick={onBack}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Volver a revisión
          </button>
        )}
      </div>
    </div>
  );
}
