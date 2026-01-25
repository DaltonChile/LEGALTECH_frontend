import { FileCheck, User, Calendar, DollarSign } from 'lucide-react';

export function ContractMockup() {
  return (
    <div className="relative">
      {/* Main Card - Document style with navy accent */}
      <div className="relative bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden">
        {/* Navy header with professional look */}
        <div className="bg-navy-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white/70 text-xs font-sans">Contrato</div>
                <div className="text-white font-serif font-semibold">Arrendamiento</div>
              </div>
            </div>
            <div className="bg-legal-emerald-500 text-white text-xs px-3 py-1 rounded-md font-medium font-sans">
              Activo
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
            <User className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500 font-sans">Arrendatario</div>
              <div className="text-sm text-navy-900 font-medium font-sans">María González</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500 font-sans">Vigencia</div>
              <div className="text-sm text-navy-900 font-medium font-sans">12 meses</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500 font-sans">Monto mensual</div>
              <div className="text-sm text-navy-900 font-medium font-sans">$450.000 CLP</div>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <button className="w-full bg-navy-900 text-white py-2.5 rounded-md text-sm font-medium font-sans hover:bg-navy-800 transition-all">
            Firmar electrónicamente
          </button>
        </div>
      </div>
      
      {/* Floating Badge */}
      <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-document-hover border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-legal-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-navy-900 font-medium font-sans">Listo en 5 min</span>
        </div>
      </div>
      
      {/* Floating Stats */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-document-hover border border-slate-200 px-4 py-3">
        <div className="text-xs text-slate-500 font-sans">Contratos generados</div>
        <div className="text-2xl text-navy-900 font-bold font-sans">2,847</div>
      </div>
    </div>
  );
}
