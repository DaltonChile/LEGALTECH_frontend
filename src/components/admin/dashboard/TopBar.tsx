import React from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const TopBar = () => {
  const { user } = useAuth();
  const date = new Date().toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Hola, {user?.full_name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-sm text-slate-500 capitalize">{date}</p>
      </div>

      <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-all">
        <Calendar className="w-4 h-4" />
        <span>Últimos 30 días</span>
      </button>
    </div>
  );
};