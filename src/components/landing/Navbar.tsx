import { Scale } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md from-slate-50 via-cyan-50/30 to-lime-50/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 rounded-md flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl tracking-tight text-slate-900">Contrato Seguro</span>
            </button>
            
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => navigate('/')}
                className={`text-sm transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Catálogo
              </button>
              <button 
                onClick={() => navigate('/seguimiento')}
                className={`text-sm transition-colors ${
                  isActive('/seguimiento') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Seguimiento
              </button>
              <button 
                onClick={() => navigate('/ayuda')}
                className={`text-sm transition-colors ${
                  isActive('/ayuda') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Ayuda y Políticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
