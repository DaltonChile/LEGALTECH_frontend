import React from 'react';
import { Clock, CheckCircle, FileText } from 'lucide-react';

interface NotaryStatsCardsProps {
  pending: number;
  completed: number;
  total: number;
}

export const NotaryStatsCards: React.FC<NotaryStatsCardsProps> = ({ 
  pending, 
  completed, 
  total 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Firmados</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
