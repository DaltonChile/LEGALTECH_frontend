import { ContractMockup } from '../public/contracts/ContractMockup';
import { ArrowRight } from 'lucide-react';
import { Text } from '../ui/primitives/Text';
import { Box } from '../ui/primitives/Box';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50">
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 lg:space-y-10">

            <div className="space-y-6">
              <Text as="h1" variant="h1" className="max-w-xl text-5xl md:text-6xl leading-tight text-balance">
                Contratos legales{' '}
                <span className="text-legal-emerald-700">
                  al instante
                </span>
              </Text>
              <Text variant="body-lg" color="muted" className="max-w-lg leading-relaxed">
                Sin trámites burocráticos. Genera y personaliza tus contratos en minutos, con opción de Firma Electrónica Avanzada o Validación Notarial integrada. Todo en un solo lugar.
              </Text>
            </div>

            {/* Stats */}
            <Box className="flex items-center gap-4 pt-2 bg-transparent border-none shadow-none">
              <div className="text-center">
                <Text variant="h3" className="text-3xl font-sans">10 min</Text>
                <Text variant="body-sm" color="muted">Tiempo promedio</Text>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <Text variant="h3" className="text-3xl font-sans">138</Text>
                <Text variant="body-sm" color="muted">Contratos disponibles</Text>
              </div>
              <div className="w-px h-12 bg-slate-300"></div>
              <div className="text-center">
                <Text variant="h3" className="text-3xl font-sans">100%</Text>
                <Text variant="body-sm" color="muted">Validez legal</Text>
              </div>
            </Box>

            <div className="pt-4">
              <button
                onClick={() => document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-legal-emerald-700 text-white font-medium rounded-lg hover:bg-legal-emerald-800 transition-colors"
              >
                Ver plantillas
                <ArrowRight className="w-5 h-5" />
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
