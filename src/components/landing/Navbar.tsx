import { Scale } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Text } from '../ui/primitives/Text';
import { Button } from '../ui/primitives/Button';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <Text as="span" variant="h4" className="text-xl tracking-tight">Contrato Seguro</Text>
            </button>
            
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className={isActive('/') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Catálogo
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/seguimiento')}
                className={isActive('/seguimiento') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Seguimiento
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ayuda')}
                className={isActive('/ayuda') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Ayuda y Políticas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
