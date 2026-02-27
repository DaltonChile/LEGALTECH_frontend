import { FileText, PenTool, Shield, Scale, Clock, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Elige tu documento',
    description: 'Selecciona entre contratos, poderes, finiquitos, acuerdos y más plantillas diseñadas por abogados.'
  },
  {
    icon: PenTool,
    title: 'Completa los datos',
    description: 'Ingresa la información de las partes. Nuestro sistema te guía paso a paso y valida todo automáticamente.'
  },
  {
    icon: Shield,
    title: 'Firma electrónica',
    description: 'Las partes firman desde cualquier dispositivo. Cada firma queda certificada con marca de tiempo.'
  },
  {
    icon: CheckCircle2,
    title: 'Documento listo',
    description: 'Recibe tu documento con validez legal por email. Validado ante un notario si es necesario.'
  }
];

const features = [
  {
    icon: Scale,
    title: 'Validez Legal Completa',
    description: 'Todos los documentos cumplen con la Ley N° 19.799 de Firma Electrónica de Chile.'
  },
  {
    icon: Clock,
    title: 'Rápido y Simple',
    description: 'En 10-15 minutos tienes tu documento listo. Sin filas, sin esperas, desde donde estés.'
  },
  {
    icon: Shield,
    title: 'Seguro y Confidencial',
    description: 'Tus datos están protegidos en todo momento.'
  }
];

export function HowItWorks() {
  return (
    <section className="py-12 sm:py-20 px-5 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-slate-600 font-sans text-base sm:text-lg max-w-2xl mx-auto px-2 text-balance">
            Crear documentos legales nunca fue tan fácil. En 4 simples pasos tendrás tu documento firmado y validado.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-20">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-slate-200" />
              )}
              
              <div className="text-center relative">
                {/* Step number */}
              
                
                {/* Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                  <step.icon className="w-5 h-5 sm:w-7 sm:h-7 text-navy-900" />
                </div>
                
                <h3 className="font-serif font-bold text-navy-900 text-xs sm:text-base mb-1 sm:mb-2 text-balance">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed hidden sm:block">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-lg p-4 sm:p-6 border border-slate-200 shadow-document hover:shadow-document-hover transition-shadow"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-legal-emerald-600" />
              </div>
              <h3 className="font-serif font-bold text-navy-900 text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-sans">{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
