import { FileCheck, User, Calendar, DollarSign } from 'lucide-react';

export function ContractMockup() {
  return (
    <div className="relative">
      {/* Main Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-xs">Contrato</div>
                <div className="text-white font-semibold">Arrendamiento</div>
              </div>
            </div>
            <div className="bg-lime-400/90 text-slate-900 text-xs px-3 py-1 rounded-full font-medium">
              Activo
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <User className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500">Arrendatario</div>
              <div className="text-sm text-slate-900 font-medium">María González</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500">Vigencia</div>
              <div className="text-sm text-slate-900 font-medium">12 meses</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-500">Monto mensual</div>
              <div className="text-sm text-slate-900 font-medium">$450.000 CLP</div>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all">
            Firmar electrónicamente
          </button>
        </div>
      </div>
      
      {/* Floating Badge */}
      <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-900 font-medium">Listo en 5 min</span>
        </div>
      </div>
      
      {/* Floating Stats */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-200 px-4 py-3">
        <div className="text-xs text-slate-500">Contratos generados</div>
        <div className="text-2xl text-blue-600 font-bold">2,847</div>
      </div>
    </div>
  );
}
