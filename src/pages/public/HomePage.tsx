import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { ContractCatalog } from '../../components/ContractCatalog';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
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
  );
}
