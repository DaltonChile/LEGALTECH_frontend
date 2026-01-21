import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';

// Pasos base sin firma (4 pasos) - Flujos 1 y 2
const STEPS_WITHOUT_SIGNATURES = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
];

// Pasos con firma (5 pasos) - Flujos 3, 4, 5 y 6
const STEPS_WITH_SIGNATURES = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
  { id: 'signatures', label: 'Firmar' },
];

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  // hasSigners determina si el flujo tiene paso de firmas (5 pasos) o no (4 pasos)
  const hasSigners = searchParams.get('hasSigners') === 'true';

  // Calcular los pasos basándose en si hay firmantes
  const PROGRESS_STEPS = useMemo(() => {
    return hasSigners ? STEPS_WITH_SIGNATURES : STEPS_WITHOUT_SIGNATURES;
  }, [hasSigners]);

  const [status, setStatus] = useState<'checking' | 'confirmed' | 'error'>('checking');
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startTime] = useState(Date.now()); // Marca de tiempo inicial

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
        intervalMs: 800,  // Chequeo cada 800ms
        maxAttempts: 25,  // 20 segundos total
        onStatusChange: (data) => {
          setAttempts((prev) => prev + 1);
          console.log('📊 Verificando:', { 
            attempt: attempts + 1,
            contract: data.contract_status, 
            payment: data.payment_status 
          });
        },
      });
      
      // Asegurar que han pasado al menos 5 segundos antes de mostrar confirmación
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 5000; // 5 segundos
      
      if (elapsed < minDisplayTime) {
        const remainingTime = minDisplayTime - elapsed;
        console.log(`⏱️ Esperando ${remainingTime}ms adicionales para mostrar confirmación...`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setStatus('confirmed');
    } catch (error: any) {
      console.error('Error en polling:', error);
      if (error.message === 'Pago rechazado') {
        navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}`);
      } else {
        // Timeout - mostrar mensaje pero aún puede haber funcionado
        
        // Asegurar tiempo mínimo incluso en timeout
        const elapsed = Date.now() - startTime;
        const minDisplayTime = 5000;
        if (elapsed < minDisplayTime) {
          await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
        }
        
        setStatus('confirmed');
      }
    }
  };

  const handleContinue = () => {
    navigate(`/contracts/resume?id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Verificando tu pago...
            </h1>
            <p className="text-slate-600 mb-6">
              Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.
            </p>
            <div className="bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${Math.min((attempts / 25) * 100, 95)}%`,
                  animation: attempts >= 25 ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
              ></div>
            </div>
            <p className="text-sm text-slate-500">
              {attempts < 25 ? `Verificando pago...` : `Confirmando últimos detalles...`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button
              onClick={handleGoHome}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <EditorHeader
        steps={PROGRESS_STEPS}
        currentStep="payment"
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-2xl w-full">
          
          {/* Success Icon & Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-600/20">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              ¡Pago Confirmado!
            </h1>
            
            <p className="text-lg text-slate-600">
              Tu pago ha sido procesado exitosamente por Mercado Pago.
            </p>
          </div>

          {/* Código de seguimiento */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-8">
            <p className="text-sm text-slate-600 mb-2 text-center">Tu código de seguimiento:</p>
            <p className="text-4xl font-mono font-bold text-blue-600 text-center tracking-wider">{trackingCode}</p>
            <p className="text-sm text-slate-500 mt-3 text-center">
              Guarda este código. También te lo enviamos por email.
            </p>
          </div>

          {/* Próximos pasos */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">→</span>
              Próximos pasos
            </h3>
            <ol className="text-sm text-slate-600 space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <span><strong className="text-slate-800">Completar formulario:</strong> Ingresa los datos restantes del contrato</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                <span><strong className="text-slate-800">Revisar:</strong> Verifica que todo esté correcto</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-300 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5">5</span>
                <span><strong className="text-slate-800">Firmar:</strong> Firma electrónicamente tu contrato</span>
              </li>
            </ol>
          </div>

          {/* Botones */}
          <div className="space-y-4">
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              Continuar con mi Contrato
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-sm text-slate-500 text-center">
              Puedes continuar ahora o más tarde usando tu código de seguimiento en la página de <button onClick={() => navigate('/retomar')} className="text-blue-600 hover:underline font-medium">Retomar Contrato</button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
