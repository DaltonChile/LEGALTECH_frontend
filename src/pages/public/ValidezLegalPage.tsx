import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import { Scale, FileText, CheckCircle, UserCheck, Clock, Lock, Award } from 'lucide-react';

export function ValidezLegalPage() {
  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}


        {/* Ley Section */}
        <section className="py-20 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
                Respaldo Legal
              </h2>
              <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
                Cumplimos con la normativa chilena para documentos electrónicos y firma digital
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 md:p-12 border border-slate-200 shadow-document">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-navy-900 mb-2">
                    Ley Nº 19.799 de Firma Electrónica
                  </h3>
                  <p className="text-slate-600 font-sans">
                    Vigente en Chile desde abril de 2002
                  </p>
                </div>
              </div>
              
              <div className="bg-navy-900 text-white rounded-xl p-8">
                <p className="text-base leading-relaxed mb-6 text-slate-200 font-sans">
                  Los documentos electrónicos tienen la misma validez legal que los documentos en papel, 
                  siempre que cumplan con requisitos de seguridad y autenticidad.
                </p>
                <div className="border-l-4 border-legal-emerald-600 pl-6">
                  <p className="font-semibold mb-2 text-slate-100 font-sans">Artículo 3º</p>
                  <p className="text-slate-200 italic leading-relaxed text-sm font-sans">
                    "Los actos y contratos otorgados o celebrados por personas naturales o jurídicas, 
                    suscritos por medio de firma electrónica, serán válidos de la misma manera y producirán 
                    los mismos efectos que los celebrados por escrito y en soporte de papel."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
                Características de Seguridad
              </h2>
              <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
                Múltiples capas de protección para garantizar la validez de cada documento
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: UserCheck,
                  title: 'Autenticación de Identidad',
                  description: 'Verificamos la identidad mediante RUT y validación de datos personales'
                },
                {
                  icon: Clock,
                  title: 'Timestamp de Firma',
                  description: 'Sello de tiempo que certifica la fecha y hora exacta de cada firma'
                },
                {
                  icon: Lock,
                  title: 'Hash Criptográfico',
                  description: 'Identificador único que garantiza la integridad del documento'
                },
                {
                  icon: Award,
                  title: 'Trazabilidad Completa',
                  description: 'Registro de cada acción para auditorías futuras'
                }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-lg p-6 border border-slate-200 shadow-document hover:shadow-document-hover transition-shadow"
                >
                  <div className="w-12 h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-legal-emerald-600" />
                  </div>
                  <h3 className="font-serif font-bold text-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 font-sans">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Types */}
        <section className="py-20 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
                Tipos de Documentos
              </h2>
              <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
                Ofrecemos diferentes niveles de validación según tus necesidades
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-document hover:shadow-document-hover transition-shadow">
                <div className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3 font-serif">Firma Electrónica Avanzada</h3>
                <p className="text-slate-600 mb-4 font-sans text-sm">
                  Válidos para contratos privados entre particulares y empresas. Incluyen arriendos, servicios, acuerdos comerciales y más.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <span>Mayoría de contratos</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 border-2 border-legal-emerald-600 shadow-document hover:shadow-document-hover transition-shadow">
                <div className="w-12 h-12 bg-legal-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3 font-serif">Validación Notarial</h3>
                <p className="text-slate-600 mb-4 font-sans text-sm">
                  Con validación de notario público digital. Misma validez que firma presencial ante notario.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <span>Mayor formalidad legal</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-document hover:shadow-document-hover transition-shadow">
                <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3 font-serif">Documentos Personalizados</h3>
                <p className="text-slate-600 mb-4 font-sans text-sm">
                  Sube tu PDF y recolecta firmas electrónicas con validez legal, manteniendo tu formato.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <span>Tu propio documento</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-document border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-serif font-bold text-navy-900 mb-1">¿Tienes dudas legales?</h3>
                <p className="text-slate-500 text-sm font-sans">Nuestro equipo está disponible para resolver consultas sobre validez legal</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/ayuda'}
                  className="px-4 py-2 text-sm font-medium font-sans text-navy-900 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                >
                  Ver centro de ayuda
                </button>
              </div>
            </div>
          </div>
        </section>
        
        <PageFooter />
      </div>
    </div>
  );
}
