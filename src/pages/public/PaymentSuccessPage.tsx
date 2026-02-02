import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight, FileText, Users, Stamp, PenTool } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { Navbar } from '../../components/landing/Navbar';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';
import { getStepsForFlow, getStepsForCustomDocument } from '../../utils/flowConfig';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  
  // Detect document type
  const isCustomDocument = searchParams.get('isCustom') === 'true';
  
  // For templates: hasSigners determines flow (5 steps vs 4 steps)
  const hasSigners = searchParams.get('hasSigners') === 'true';
  
  // For custom documents: signature type and notary
  const signatureType = searchParams.get('signatureType') || 'simple';
  const customNotary = searchParams.get('customNotary') === 'true';

  // Calculate steps based on document type
  const PROGRESS_STEPS = useMemo(() => {
    if (isCustomDocument) {
      return getStepsForCustomDocument(signatureType as 'none' | 'simple' | 'fea', customNotary);
    }
    return getStepsForFlow(hasSigners);
  }, [isCustomDocument, hasSigners, signatureType, customNotary]);

  const [status, setStatus] = useState<'checking' | 'confirmed' | 'error'>('checking');
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

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
        intervalMs: 800,
        maxAttempts: 25,
        onStatusChange: (data) => {
          setAttempts((prev) => prev + 1);
          console.log('📊 Verificando:', { 
            attempt: attempts + 1,
            contract: data.contract_status, 
            payment: data.payment_status 
          });
        },
      });
      
      // Ensure at least 5 seconds before showing confirmation
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 5000;
      
      if (elapsed < minDisplayTime) {
        const remainingTime = minDisplayTime - elapsed;
        console.log(`⏱️ Esperando ${remainingTime}ms adicionales...`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setStatus('confirmed');
    } catch (error: any) {
      console.error('Error en polling:', error);
      if (error.message === 'Pago rechazado') {
        if (isCustomDocument) {
          navigate(`/documento-personalizado/estado/${trackingCode}?payment=failed&rut=${encodeURIComponent(rut)}`);
        } else {
          navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}`);
        }
      } else {
        // Timeout - show confirmation anyway
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
    if (isCustomDocument) {
      navigate(`/documento-personalizado/estado/${trackingCode}?rut=${encodeURIComponent(rut)}`);
    } else {
      navigate(`/contracts/resume?id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}`);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Get next steps based on document type and configuration
  const getNextSteps = () => {
    if (isCustomDocument) {
      const steps = [];
      
      if (signatureType !== 'none') {
        steps.push({
          icon: Users,
          title: 'Firma de participantes',
          description: 'Los firmantes recibirán un email con las instrucciones'
        });
      }
      
      if (customNotary) {
        steps.push({
          icon: Stamp,
          title: 'Validación notarial',
          description: 'Un notario revisará y validará tu documento'
        });
      }
      
      steps.push({
        icon: FileText,
        title: 'Documento listo',
        description: 'Podrás descargar tu documento finalizado'
      });
      
      return steps;
    } else {
      // Template-based flow
      const steps = [
        {
          icon: PenTool,
          title: 'Completar formulario',
          description: 'Ingresa los datos restantes del contrato'
        },
        {
          icon: FileText,
          title: 'Revisar',
          description: 'Verifica que todo esté correcto'
        }
      ];
      
      if (hasSigners) {
        steps.push({
          icon: Users,
          title: 'Firmar',
          description: 'Firma electrónicamente tu contrato'
        });
      }
      
      return steps;
    }
  };

  const nextSteps = getNextSteps();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-3">
              Verificando tu pago...
            </h1>
            <p className="text-slate-600 mb-6">
              Estamos confirmando tu pago con Mercado Pago.
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
        />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-3">Error</h1>
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
      <Navbar />
      <EditorHeader
        steps={PROGRESS_STEPS}
        currentStep="payment"
        rightAction={
          <button
            onClick={handleContinue}
            className="bg-navy-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-navy-800 transition-all flex items-center gap-2"
          >
            <span>{isCustomDocument ? 'Ver estado' : 'Continuar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-lg w-full">
          
          {/* Success Icon & Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              ¡Pago Confirmado!
            </h1>
            
            <p className="text-slate-600">
              Tu pago ha sido procesado exitosamente por Mercado Pago.
            </p>
          </div>

          {/* Tracking Code */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <p className="text-sm text-slate-500 mb-1.5 text-center">Tu código de seguimiento:</p>
            <p className="text-2xl font-mono font-bold text-slate-900 text-center tracking-wider">
              {trackingCode}
            </p>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Guarda este código. También te lo enviamos por email.
            </p>
          </div>

          {/* Next Steps - Dynamic */}
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900">Próximos pasos</h3>
            </div>
            
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    index === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <step.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{step.title}</p>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-slate-500 text-center mt-6">
            Puedes continuar ahora o más tarde usando tu código en{' '}
            <button 
              onClick={() => navigate('/retomar')} 
              className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
              Retomar {isCustomDocument ? 'Documento' : 'Contrato'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
