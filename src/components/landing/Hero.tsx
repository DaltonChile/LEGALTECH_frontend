import { ContractMockup } from '../public/contracts/ContractMockup';
import { ArrowRight } from 'lucide-react';
import { Text } from '../ui/primitives/Text';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50">
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 lg:space-y-10">

            <div className="space-y-5">
              <Text as="h1" variant="h1" className="max-w-xl text-5xl md:text-6xl leading-tight text-balance">
                Contratos legales{' '}
                <span className="text-legal-emerald-700">
                  al instante
                </span>
              </Text>
              <Text variant="body-lg" color="muted" className="max-w-lg leading-relaxed">
                Genera y firma contratos con validación notarial. En minutos.
              </Text>
            </div>

            <div>
              <button
                onClick={() => document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-navy-900 text-white text-lg font-semibold rounded-xl hover:bg-navy-800 transition-all duration-200 shadow-lg shadow-navy-900/25 hover:shadow-xl hover:shadow-navy-900/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Ver plantillas
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <ContractMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
