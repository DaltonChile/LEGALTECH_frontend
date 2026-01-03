import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import type { Template } from '../../../../types/templates';

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const latestVersion = template.versions?.[0];
  const hasPublishedVersion = template.versions?.some(v => v.is_published);
  
  const getStatus = () => {
    if (!template.is_active) return { label: 'Inactivo', color: 'bg-slate-100 text-slate-500' };
    if (hasPublishedVersion) return { label: 'Publicado', color: 'bg-green-100 text-green-700' };
    return { label: 'Borrador', color: 'bg-amber-100 text-amber-700' };
  };
  
  const status = getStatus();
  
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300 cursor-pointer"
    >
      <div className="w-14 h-14 bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-600 rounded-xl flex items-center justify-center mb-5 transition-all duration-300">
        <FileText className="w-7 h-7 text-slate-600 group-hover:text-white transition-colors duration-300" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
        {template.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
        {template.description || 'Sin descripción'}
      </p>

      {latestVersion && (
        <p className="text-lg font-bold text-slate-900 mb-4">
          ${latestVersion.base_price?.toLocaleString() || 0}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {template.versions?.length || 0} versión{template.versions?.length !== 1 ? 'es' : ''}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
      </div>
    </div>
  );
};

export default TemplateCard;
