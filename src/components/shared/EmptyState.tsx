import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <p className="text-slate-500 text-lg mb-4">{title}</p>
      {description && (
        <p className="text-slate-400 text-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-2xl font-semibold hover:bg-cyan-200 transition-all shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
