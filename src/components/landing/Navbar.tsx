import { Scale, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Text } from '../ui/primitives/Text';
import { Button } from '../ui/primitives/Button';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleMouseEnter = (dropdown: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
              {/* Documentos Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('documentos')}
                onMouseLeave={handleMouseLeave}
              >
                <Button 
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-1 ${isActive('/') ? 'text-navy-900 bg-slate-100' : ''}`}
                >
                  Documentos
                  <ChevronDown className="w-4 h-4" />
                </Button>
                
                {openDropdown === 'documentos' && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 animate-fade-in z-50"
                    onMouseEnter={() => handleMouseEnter('documentos')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => {
                        if (location.pathname !== '/') {
                          navigate('/');
                          setTimeout(() => {
                            document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        } else {
                          document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' });
                        }
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Ver catálogo completo
                    </button>
                    <button
                      onClick={() => {
                        navigate('/documento-personalizado');
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Subir mi documento
                    </button>
                  </div>
                )}
              </div>

              {/* Validez Legal */}
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/validez-legal')}
                className={isActive('/validez-legal') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Validez legal
              </Button>

              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/seguimiento')}
                className={isActive('/seguimiento') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Seguimiento
              </Button>

              {/* Ayuda */}
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ayuda')}
                className={isActive('/ayuda') ? 'text-navy-900 bg-slate-100' : ''}
              >
                Ayuda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
