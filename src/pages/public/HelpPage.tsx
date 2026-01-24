import { useState } from 'react';
import { HelpCircle, FileText, Shield, BookOpen, ChevronRight, Scale, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';

export function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen relative bg-slate-50">
      <Navbar />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10 font-sans max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
            

          <h1 className="text-4xl  font-bold text-slate-900 mb-2 tracking-tight">
            Ayuda y Centro de Políticas
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Encuentra respuestas rápidas, guías detalladas e información legal sobre nuestra plataforma de gestión contractual.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Cómo funciona - Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
                  </div>
                  <p className="text-slate-500">El proceso de creación de contratos simplificado en 5 pasos.</p>
               </div>
               
               <div className="p-8">
                  <div className="space-y-8">
                    {[
                      { title: "1. Configuración Inicial", desc: "Elige tu contrato y completa los datos clave para generar tu cotización inicial." },
                      { title: "2. Pago Seguro", desc: "Realiza el pago del servicio para habilitar la redacción completa y desbloquear el documento." },
                      { title: "3. Redacción Detallada", desc: "Completa el resto de la información en tu borrador habilitado. Tus respuestas redactan el contrato." },
                      { title: "4. Revisión Legal", desc: "Verifica el documento generado automáticamente. Si todo está correcto, apruébalo para firmas." },
                      { title: "5. Firma y Notaría", desc: "Se inicia el proceso de firma digital avanzado y gestión notarial si el documento lo requiere." }
                    ].map((step, index) => (
                      <div key={index} className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {index + 1}
                            </div>
                            {index < 4 && <div className="w-0.5 flex-1 bg-slate-100 my-2 group-hover:bg-slate-200 transition-colors"></div>}
                         </div>
                         <div className="pb-8">
                            <h3 className="font-semibold text-slate-900 text-lg mb-1">{step.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Preguntas Frecuentes</h2>
                  <p className="text-slate-500 text-sm">Respuestas a las dudas más comunes de nuestros usuarios.</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                {[
                  { q: "¿Cuánto tiempo tarda el proceso?", a: "El tiempo depende de cuándo todas las partes firmen el contrato. El proceso de creación automatizada y pago toma solo unos minutos." },
                  { q: "¿Puedo modificar el contrato después de pagar?", a: "Una vez pagado, tu contrato pasa a estado de borrador final. Puedes editar los datos antes de enviarlo a firmas, pero la estructura legal base se mantiene." },
                  { q: "¿Qué pasa si necesito ayuda de un notario?", a: "Algunos documentos requieren protocolización. Nuestra plataforma coordina automáticamente con notarios asociados si el trámite lo exige." },
                  { q: "¿Cómo hago seguimiento?", a: "Utiliza la sección 'Seguimiento' en el menú principal e ingresa el código único de 6 caracteres que recibiste tras la compra." },
                  { q: "¿Tienen validez legal?", a: "Absolutamente. Todos nuestros modelos son redactados por abogados expertos y las firmas electrónicas cumplen con la legislación chilena vigente." }
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl overflow-hidden transition-colors hover:bg-slate-100">
                    <button 
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full text-left p-5 flex items-start gap-3 focus:outline-none"
                    >
                      <span className={`text-emerald-500 mt-1 transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`}>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      <span className="font-semibold text-slate-900">{faq.q}</span>
                    </button>
                    
                    <div 
                      className={`grid transition-all duration-200 ease-in-out ${
                        openFaq === i ? 'grid-rows-[1fr] opacity-100 mb-5' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-slate-600 text-sm pl-12 pr-5 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column - Policies & Contact */}
          <div className="space-y-8">
            
            {/* Policies Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Políticas y Legal</h2>
                  <p className="text-xs text-slate-400">Términos de uso de la plataforma</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { title: "Privacidad de Datos", icon: Shield, desc: "Encriptación de grado militar para proteger tu información personal y sensible." },
                  { title: "Seguridad Bancaria", icon: Shield, desc: "Protocolos seguros para todas las transacciones financieras." },
                  { title: "Validez Jurídica", icon: FileText, desc: "Cumplimiento estricto con la legislación chilena vigente." },
                  { title: "Firma Electrónica", icon: CheckCircle2, desc: "Certificada bajo la Ley 19.799 de documentos electrónicos." }
                ].map((policy, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1">
                      <policy.icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{policy.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{policy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ver Términos de Servicio Completos
                </button>
              </div>
            </div>

          </div>
          
        </div>
                  <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
               <h3 className="font-bold text-slate-900 mb-1">¿Necesitas ayuda con tu contrato?</h3>
               <p className="text-slate-500 text-sm">Nuestro equipo de soporte está disponible 24/7</p>
             </div>
             <div className="flex gap-3">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  Contactar soporte
                </button>
             </div>
          </div>
      </div>
    </div>
  );
}
