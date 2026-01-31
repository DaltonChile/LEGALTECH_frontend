/**
 * Reusable page footer component for Contrato Seguro
 * Displays "Contrato Seguro" branding with "powered by Dalton" text
 */

interface PageFooterProps {
  /** Additional CSS classes for the footer container */
  className?: string;
}

export function PageFooter({ className = '' }: PageFooterProps) {
  return (
    <footer className={`bg-navy-900 py-12 px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-legal-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-serif font-bold">CS</span>
            </div>
            <span className="text-white text-xl font-serif">Contrato Seguro</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400 text-sm font-sans">
            <a href="/ayuda" className="hover:text-white transition-colors">Ayuda</a>
            <a href="/seguimiento" className="hover:text-white transition-colors">Rastrear documento</a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-slate-400 text-sm font-sans">
              © 2025 Contrato Seguro. Tu notaría digital.
            </p>
            <p className="text-slate-500 text-xs font-sans mt-1">
              powered by Dalton
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
