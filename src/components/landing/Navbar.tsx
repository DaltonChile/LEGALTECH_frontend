import { ChevronDown, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Text } from '../ui/primitives/Text';
import { Button } from '../ui/primitives/Button';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const mobileNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img src="/assets/logo_contratoseguro.png" alt="Contrato Seguro" className="w-10 h-10 object-contain" />
              <Text as="span" variant="h4" className="text-xl tracking-tight">Contrato Seguro</Text>
            </button>

            {/* Desktop nav links */}
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

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[73px] bg-black/20 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`
          md:hidden fixed top-[73px] left-0 right-0 z-50
          bg-white border-b border-slate-200 shadow-lg
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
      >
        <div className="max-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {/* Documentos section */}
            <div className="pb-2">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Documentos
              </p>
              <button
                onClick={() => {
                  if (location.pathname !== '/') {
                    mobileNavigate('/');
                    setTimeout(() => {
                      document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    document.getElementById('documentos')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'text-navy-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Ver catálogo completo
              </button>
              <button
                onClick={() => mobileNavigate('/documento-personalizado')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/documento-personalizado') ? 'text-navy-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Subir mi documento
              </button>
            </div>

            <div className="border-t border-slate-100" />

            {/* Other links */}
            <button
              onClick={() => mobileNavigate('/validez-legal')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/validez-legal') ? 'text-navy-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              Validez legal
            </button>

            <button
              onClick={() => mobileNavigate('/seguimiento')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/seguimiento') ? 'text-navy-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              Seguimiento
            </button>

            <button
              onClick={() => mobileNavigate('/ayuda')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/ayuda') ? 'text-navy-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              Ayuda
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
