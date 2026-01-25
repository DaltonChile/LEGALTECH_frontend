import React from 'react';
import { Search } from 'lucide-react';

type FilterType = 'pending' | 'completed' | 'all';

interface NotaryFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearDates: () => void;
}

export const NotaryFilters: React.FC<NotaryFiltersProps> = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDates
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, código o contrato..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['pending', 'completed', 'all'] as const).map((status) => (
            <button 
              key={status}
              onClick={() => onFilterChange(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === status 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'pending' && 'Pendientes'}
              {status === 'completed' && 'Firmados'}
              {status === 'all' && 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">Desde:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">Hasta:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </label>
        {(startDate || endDate) && (
          <button
            onClick={onClearDates}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            Limpiar fechas
          </button>
        )}
      </div>
    </div>
  );
};
