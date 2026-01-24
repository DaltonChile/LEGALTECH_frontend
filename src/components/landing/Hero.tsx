import { ContractMockup } from '../public/contracts/ContractMockup';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 lg:space-y-10">

            
            <div className="space-y-6">
              <h1 className="text-slate-900 max-w-xl text-5xl font-bold">
                Contratos legales{' '}
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                  al instante
                </span>
              </h1>
              <h2 className="text-slate-600 max-w-lg text-lg">
                Sin abogados, sin esperas. Genera, personaliza y firma contratos legalmente válidos en minutos. Simple, rápido y seguro.
              </h2>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-3xl text-slate-900 font-bold">5 min</div>
                <div className="text-sm text-slate-600">Tiempo promedio</div>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <div className="text-3xl text-slate-900 font-bold">2,847</div>
                <div className="text-sm text-slate-600">Contratos generados</div>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <div className="text-3xl text-slate-900 font-bold">100%</div>
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
