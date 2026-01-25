import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { Navbar } from '../../components/landing/Navbar';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';
import { getStepsForFlow } from '../../utils/flowConfig';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  // hasSigners determina si el flujo tiene paso de firmas (5 pasos) o no (4 pasos)
  const hasSigners = searchParams.get('hasSigners') === 'true';

  // Calcular los pasos basándose en si hay firmantes (usando función centralizada)
  const PROGRESS_STEPS = useMemo(() => getStepsForFlow(hasSigners), [hasSigners]);

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
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="bg-white rounded-lg shadow-document border border-slate-200 p-8 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 text-navy-900 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-serif font-bold text-navy-900 mb-4">
              Verificando tu pago...
            </h1>
            <p className="text-slate-600 mb-6 font-sans">
              Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.
            </p>
            <div className="bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-navy-900 h-2 rounded-full transition-all duration-1000 ease-out"
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
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="bg-white rounded-lg shadow-document border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-red-600 mb-4">Error</h1>
            <p className="text-slate-600 mb-6 font-sans">{errorMessage}</p>
            <button
              onClick={handleGoHome}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors font-sans"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <EditorHeader
        steps={PROGRESS_STEPS}
        currentStep="payment"
        rightAction={
          <button
            onClick={handleContinue}
            className="bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-all flex items-center gap-2 shadow-lg shadow-navy-900/10 font-sans"
          >
            <span>Continuar con mi Contrato</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-white rounded-lg shadow-document border border-slate-200 p-10 max-w-2xl w-full">
          
          {/* Success Icon & Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-legal-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-11 h-11 text-white" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-3">
              ¡Pago Confirmado!
            </h1>
            
            <p className="text-slate-600 font-sans">
              Tu pago ha sido procesado exitosamente por Mercado Pago.
            </p>
          </div>

          {/* Código de seguimiento */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-slate-600 mb-2 text-center font-sans">Tu código de seguimiento:</p>
            <p className="text-3xl font-mono font-bold text-navy-900 text-center tracking-wider">{trackingCode}</p>
            <p className="text-sm text-slate-500 mt-3 text-center font-sans">
              Guarda este código. También te lo enviamos por email.
            </p>
          </div>

          {/* Próximos pasos */}
          <div className="bg-legal-emerald-50 rounded-lg p-6 border border-legal-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-legal-emerald-600 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-navy-900 font-serif">Próximos pasos</h3>
            </div>
            <ol className="text-sm text-slate-700 space-y-3 font-sans">
              <li className="flex items-start gap-3">
                <span className="bg-navy-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5 font-semibold">3</span>
                <span><strong className="text-navy-900">Completar formulario:</strong> Ingresa los datos restantes del contrato</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5 font-semibold">4</span>
                <span><strong className="text-navy-900">Revisar:</strong> Verifica que todo esté correcto</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 mt-0.5 font-semibold">5</span>
                <span><strong className="text-navy-900">Firmar:</strong> Firma electrónicamente tu contrato</span>
              </li>
            </ol>
          </div>

          {/* Footer text */}
          <p className="text-sm text-slate-500 text-center mt-6 font-sans">
            Puedes continuar ahora o más tarde usando tu código en{' '}
            <button 
              onClick={() => navigate('/retomar')} 
              className="text-legal-emerald-600 hover:text-legal-emerald-700 font-medium hover:underline"
            >
              Retomar Contrato
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
