import { Clock, Scale, Copy, ArrowRight, Gavel, Mail } from 'lucide-react';
import { EditorHeader } from './EditorHeader';

interface WaitingNotaryStepProps {
  trackingCode: string;
  steps: { id: string; label: string }[];
  title?: string;
  description?: string;
}

/**
 * Componente para mostrar cuando el contrato está esperando al notario
 * Usado en el caso 2: sin firma + con notario
 */
export function WaitingNotaryStep({ 
  trackingCode, 
  steps,
  title = 'Esperando Notario',
  description = 'Tu contrato ha sido enviado al notario para su revisión y validación oficial. Te notificaremos cuando esté listo.'
}: WaitingNotaryStepProps) {
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 relative">
      <EditorHeader 
        steps={steps} 
        currentStep="review"
        rightAction={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold">EN PROCESO</span>
          </div>
        }
      />
      
      <div className="flex-1 overflow-y-auto min-h-0 container-snap">
        <div className="max-w-4xl mx-auto p-8 relative z-10 space-y-8">
            
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden animate-fade-in-up">
            
            {/* Card Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy-900 text-lg">Contrato Seguro Notaría</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
                    <span>Ref: {trackingCode}</span>
                    <button 
                      onClick={copyToClipboard} 
                      className="hover:text-legal-emerald-600 transition-colors p-1 rounded-md hover:bg-slate-50" 
                      title="Copiar código"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {title}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
              
              {/* Status Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center animate-pulse">
                  <Gavel className="w-12 h-12 text-amber-500" />
                </div>
              </div>
              
              {/* Status Text */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-navy-900 mb-3">{title}</h2>
                <p className="text-slate-600 max-w-md mx-auto font-sans">
                  {description}
                </p>
              </div>

              {/* Tracking Info Alert */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200">
                <h3 className="font-semibold text-navy-900 mb-2 flex items-center gap-2 font-sans">
                  <Mail className="w-5 h-5 text-slate-500" />
                  Guarda tu código de seguimiento
                </h3>
                <p className="text-slate-600 text-sm mb-4 font-sans">
                  Podrás consultar el estado de tu contrato en cualquier momento utilizando este código en nuestra página de seguimiento.
                </p>
                <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <code className="text-xl font-mono text-navy-900 font-bold">{trackingCode}</code>
                  <button 
                    onClick={copyToClipboard} 
                    className="text-legal-emerald-600 font-medium text-sm hover:underline font-sans"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-legal-emerald-50 rounded-lg p-4 border border-legal-emerald-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-legal-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-legal-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-legal-emerald-900 text-sm font-sans">Notificación por Email</h4>
                      <p className="text-legal-emerald-700 text-xs mt-1 font-sans">
                        Recibirás un correo cuando el notario haya validado tu documento.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-navy-50 rounded-lg p-4 border border-navy-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Scale className="w-4 h-4 text-navy-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-900 text-sm font-sans">Validez Legal</h4>
                      <p className="text-navy-700 text-xs mt-1 font-sans">
                        La firma notarial otorga plena validez legal a tu documento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => (window.location.href = '/')}
              className="group flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white border border-slate-200 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
              <span>Comprar otro contrato</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
