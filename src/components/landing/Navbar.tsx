import { Scale } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-white shadow-md from-slate-50 via-cyan-50/30 to-lime-50/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-md flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl tracking-tight text-slate-900">legaltech</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#productos" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                Productos
              </a>
              <a href="#soluciones" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                Soluciones
              </a>
              <a href="#tarifas" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                Tarifas
              </a>
              <a href="#soporte" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                Soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
