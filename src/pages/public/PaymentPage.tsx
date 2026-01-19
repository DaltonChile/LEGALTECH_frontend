import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Payment } from '@mercadopago/sdk-react';
import { CreditCard, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import paymentService from '../../services/paymentService';
import mercadoPagoConfig from '../../config/mercadopago';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';

const PROGRESS_STEPS = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
  { id: 'signatures', label: 'Firmar' },
];

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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <EditorHeader
           steps={PROGRESS_STEPS}
           currentStep="payment"
           onBack={() => navigate(-1)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 font-medium">Preparando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <EditorHeader
           steps={PROGRESS_STEPS}
           currentStep="payment"
           onBack={() => navigate(-1)}
        />
         <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Error iniciando el pago</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => createPreference()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Header */}
      <EditorHeader
         steps={PROGRESS_STEPS}
         currentStep="payment"
         onBack={() => navigate(-1)}
         totalPrice={amount}
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-4xl w-full">
          
          {/* Header del Card */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Completar Pago</h1>
              <p className="text-slate-500">Finaliza tu compra de forma segura con Mercado Pago</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             {/* Left Column: Summary */}
             <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Resumen del pedido
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Código de seguimiento</span>
                      <span className="font-mono font-medium text-slate-700">{trackingCode}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                      <span className="text-slate-500">RUT Comprador</span>
                      <span className="font-mono font-medium text-slate-700">{rut}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center mt-2">
                      <span className="font-semibold text-slate-800">Total a pagar</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${amount.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Advertencia de modo test */}
                {mercadoPagoConfig.isTestMode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 text-sm">Modo de Prueba</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Usa las tarjetas de test de Mercado Pago. No se cobrará dinero real.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 text-sm">Pago 100% seguro</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Tu información está encriptada y procesada por Mercado Pago.
                      </p>
                    </div>
                  </div>
                </div>
             </div>

             {/* Right Column: Payment Brick */}
             <div>
                {preferenceId && amount ? (
                   <div className="payment-brick-container">
                    <Payment
                        initialization={{ 
                          amount: amount,
                          preferenceId: preferenceId
                        }}
                        customization={{
                          paymentMethods: {
                            creditCard: 'all',
                            debitCard: 'all',
                            mercadoPago: 'all'
                          },
                          visual: {
                            style: {
                              theme: 'default'
                            }
                          }
                        }}
                        onSubmit={async ({ selectedPaymentMethod, formData }) => {
                          console.log('💳 Procesando pago:', { selectedPaymentMethod, formData });
                          
                          return new Promise(async (resolve, reject) => {
                            try {
                              const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/process`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  ...formData,
                                  contract_id: contractId,
                                  tracking_code: trackingCode,
                                  rut: rut
                                }),
                              });

                              const result = await response.json();
                              
                              if (result.success) {
                                // Pago exitoso - redirigir a página de éxito
                                resolve(undefined);
                                navigate(`/payment/success?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}`);
                              } else {
                                reject();
                                setError(result.error || 'Error procesando el pago');
                              }
                            } catch (error: any) {
                              console.error('❌ Error procesando pago:', error);
                              reject();
                              setError(error.message);
                            }
                          });
                        }}
                        onReady={() => console.log('✅ Payment Brick listo')}
                        onError={(error) => {
                           console.error('❌ Error en Payment Brick:', error);
                           setError('Error al cargar el método de pago');
                        }}
                    />
                   </div>
                ) : (
                   <div className="h-40 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-2" />
                      <p className="text-slate-400 text-sm">Cargando pasarela de pago...</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
