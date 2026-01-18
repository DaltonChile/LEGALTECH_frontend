import { Navbar, Hero } from '../../components/landing';
import { ContractCatalog } from '../../components/public/contracts';

export function HomePage() {
  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <ContractCatalog />
        
        <footer className="bg-slate-900 py-12 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">L</span>
                </div>
                <span className="text-white text-xl">legaltech</span>
              </div>
              <p className="text-slate-400 text-sm">
                © 2025 legaltech. Contratos legales al instante.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
