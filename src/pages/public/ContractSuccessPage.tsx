import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, FileText, Mail } from 'lucide-react';

export function ContractSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingCode = searchParams.get('tracking_code');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!trackingCode) {
      navigate('/');
    }
  }, [trackingCode, navigate]);

  const copyTrackingCode = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 flex items-center justify-center p-6">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
          
          {/* Header with Success Icon */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">¡Contrato Completado!</h1>
            <p className="text-green-50">Tu contrato ha sido procesado exitosamente</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            
            {/* Tracking Code */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Código de Seguimiento</h3>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-center justify-between gap-4 mt-3">
                <code className="text-2xl font-mono font-bold text-blue-600">
                  {trackingCode}
                </code>
                <button
                  onClick={copyTrackingCode}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors text-sm font-medium text-blue-700"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                Guarda este código para consultar el estado de tu contrato en cualquier momento
              </p>
            </div>

            {/* Email Notice */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    Revisa tu correo electrónico
                  </h4>
                  <p className="text-sm text-slate-600">
                    Hemos enviado una copia del contrato final a tu correo electrónico con el PDF adjunto. 
                    También recibirás un enlace para descargarlo cuando lo necesites.
                  </p>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">¿Qué sigue?</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Tu contrato ha sido generado y está listo para ser usado</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Recibirás un correo con el PDF del contrato</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Puedes consultar el estado con tu código de seguimiento</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">

              <button
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                <Home className="w-5 h-5" />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-slate-600">
          <p>¿Tienes preguntas? Contáctanos o revisa nuestra sección de ayuda</p>
        </div>
      </div>
    </div>
  );
}
