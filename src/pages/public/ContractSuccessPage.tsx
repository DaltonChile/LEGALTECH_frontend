import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, FileText, Mail, Copy } from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';

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
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden">
            
            {/* Header with Success Icon */}
            <div className="text-center pt-10 pb-8 px-8">
              <div className="w-20 h-20 bg-legal-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-11 h-11 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-navy-900 mb-3">¡Contrato Completado!</h1>
              <p className="text-slate-600 font-sans">Tu contrato ha sido procesado y firmado exitosamente</p>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 space-y-5">
              
              {/* Tracking Code */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-navy-900 font-sans">Código de Seguimiento</h3>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-2xl font-mono font-bold text-navy-900">
                    {trackingCode}
                  </code>
                  <button
                    onClick={copyTrackingCode}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium font-sans"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-3 font-sans">
                  Guarda este código para consultar tu contrato en cualquier momento
                </p>
              </div>

              {/* Email Notice */}
              <div className="bg-legal-emerald-50 rounded-lg p-6 border border-legal-emerald-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-legal-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1.5 font-serif text-sm">
                      Revisa tu correo electrónico
                    </h4>
                    <p className="text-sm text-slate-700 font-sans leading-relaxed">
                      Hemos enviado una copia del contrato firmado a tu correo electrónico con el PDF adjunto.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="font-semibold text-navy-900 mb-4 font-serif">Próximos pasos</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-slate-700 font-sans">
                    <div className="w-5 h-5 bg-legal-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span>El contrato firmado está disponible en tu correo electrónico</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700 font-sans">
                    <div className="w-5 h-5 bg-legal-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span>Todas las partes han recibido una copia del documento</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700 font-sans">
                    <div className="w-5 h-5 bg-legal-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span>Puedes consultar el contrato usando tu código de seguimiento</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors font-sans"
                >
                  <Home className="w-5 h-5" />
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-6 text-sm text-slate-600 font-sans">
            <p>¿Necesitas ayuda? Visita nuestra sección de <button onClick={() => navigate('/ayuda')} className="text-legal-emerald-600 hover:text-legal-emerald-700 font-medium hover:underline">Ayuda y Soporte</button></p>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
