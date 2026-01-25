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
    description: 'Encriptación de nivel bancario. Tus datos están protegidos en todo momento.'
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
            Crear documentos legales nunca fue tan fácil. En 4 simples pasos tendrás tu documento firmado y validado.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8 mb-20">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-slate-200" />
              )}
              
              <div className="text-center relative">
                {/* Step number */}
              
                
                {/* Icon */}
                <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <step.icon className="w-7 h-7 text-navy-900" />
                </div>
                
                <h3 className="font-serif font-bold text-navy-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 font-sans leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
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
  );
}
