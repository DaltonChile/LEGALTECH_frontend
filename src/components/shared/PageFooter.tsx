/**
 * Reusable page footer component for Contrato Seguro
 * Displays "Contrato Seguro" branding with "powered by Dalton" logo
 */

import { Mail } from 'lucide-react';

interface PageFooterProps {
  /** Additional CSS classes for the footer container */
  className?: string;
}

export function PageFooter({ className = '' }: PageFooterProps) {
  return (
    <footer className={`bg-navy-900 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo y descripción */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/assets/logo_contratoseguro.png" alt="Contrato Seguro" className="w-10 h-10 object-contain" />
              <span className="text-xl font-serif font-bold">Contrato Seguro</span>
            </div>
            <p className="text-slate-400 text-sm font-sans leading-relaxed">
              Tu notaría digital. Contratos legales al instante con firma electrónica.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-serif font-bold text-white mb-4">Servicios</h3>
            <ul className="space-y-2">
              <li>
                <a href="/#documentos" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Ver catálogo completo
                </a>
              </li>
              <li>
                <a href="/documento-personalizado" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Subir mi documento
                </a>
              </li>
              <li>
                <a href="/seguimiento" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Verificar documento
                </a>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="font-serif font-bold text-white mb-4">Información</h3>
            <ul className="space-y-2">
              <li>
                <a href="/validez-legal" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Validez legal
                </a>
              </li>
              <li>
                <a href="/ayuda" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Preguntas frecuentes
                </a>
              </li>
              <li>
                <a href="/ayuda#politicas" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Políticas y términos
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-serif font-bold text-white mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:soporte@contratoseguro.cl" className="text-slate-400 text-sm hover:text-white transition-colors font-sans flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  soporte@contratoseguro.cl
                </a>
              </li>
              <li>
                <a href="/ayuda" className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                  Chat de soporte
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-sans">
              © 2025 Contrato Seguro. Todos los derechos reservados.
            </p>
            <a 
              href="https://dalton.cl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity group"
              title="Powered by Dalton"
            >
              <span className="text-slate-500 text-sm font-sans">powered by</span>
              <img 
                src="/assets/logo_dalton.png" 
                alt="Dalton" 
                className="h-10 w-auto rounded-lg shadow-md"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
