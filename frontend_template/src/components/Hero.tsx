import { ContractMockup } from './ContractMockup';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 lg:space-y-10">
            <div className="inline-flex items-center gap-2 bg-white border border-cyan-200 rounded-full px-4 py-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-700">Firma electrónica avanzada incluida</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-slate-900 max-w-xl">
                Contratos legales{' '}
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                  al instante
                </span>
              </h1>
              <h2 className="text-slate-600 max-w-lg">
                Sin abogados, sin esperas. Genera, personaliza y firma contratos legalmente válidos en minutos. Simple, rápido y seguro.
              </h2>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-3xl text-slate-900">5 min</div>
                <div className="text-sm text-slate-600">Tiempo promedio</div>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <div className="text-3xl text-slate-900">2,847</div>
                <div className="text-sm text-slate-600">Contratos generados</div>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <div className="text-3xl text-slate-900">100%</div>
                <div className="text-sm text-slate-600">Validez legal</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              <span className="text-slate-700">Explora los contratos disponibles abajo</span>
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