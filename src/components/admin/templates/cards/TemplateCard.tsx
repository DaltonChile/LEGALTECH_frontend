import React from 'react';
import { ChevronDown, Download } from 'lucide-react';
import type { Template } from '../../../../types/templates';

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  onDownload?: (versionId: number) => void;
  onToggleActive?: (templateId: number, currentStatus: boolean) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick, onDownload, onToggleActive }) => {
  const latestVersion = template.versions?.[0];
  const hasPublishedVersion = template.versions?.some(v => v.is_published);
  const publishedVersion = template.versions?.find(v => v.is_published);
  
  const getStatus = () => {
    if (!template.is_active) return { label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-300' };
    if (hasPublishedVersion) return { label: 'Publicado', color: 'bg-gradient-to-r from-lime-100 to-cyan-100 text-slate-800 border-lime-400' };
    return { label: 'Borrador', color: 'bg-amber-50 text-amber-700 border-amber-300' };
  };
  
  const status = getStatus();
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (publishedVersion && onDownload) {
      onDownload(publishedVersion.id);
    }
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleActive) {
      onToggleActive(template.id, template.is_active);
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Header con badge de estado y título */}
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 text-center mb-1">
          {template.title}
        </h3>
      </div>

      {/* Precio centrado */}
      <div className="px-6 py-8 flex flex-col items-center justify-center min-h-[120px]">
        {publishedVersion ? (
          <p className="text-4xl font-bold text-slate-900">
            ${publishedVersion.base_price?.toLocaleString() || 0}
          </p>
        ) : latestVersion ? (
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-400">
              ${latestVersion.base_price?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-slate-400 mt-2">(No publicado)</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin versiones</p>
        )}

      </div>

      {/* Botones Editar, Publicar/Desactivar y Descargar en la parte inferior */}
      <div className="p-6 flex items-center gap-3">
        <button className="flex-1 py-3 px-4 flex items-center justify-center gap-2 bg-cyan-100 text-slate-700 border-2 border-cyan-300 rounded-xl font-semibold hover:bg-cyan-200 transition-all">
          <span>Editar</span>
        </button>
        {template.is_active ? (
          <button 
            onClick={handleToggleActive}
            className="py-3 px-4 bg-white border-2 border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
            title="Esconder template del catálogo público"
          >
            Esconder
          </button>
        ) : (
          <button 
            onClick={handleToggleActive}
            className="py-3 px-4 bg-gradient-to-r from-lime-100 to-cyan-100 border-2 border-lime-400 rounded-xl text-slate-700 font-semibold hover:from-lime-200 hover:to-cyan-200 transition-all"
            title="Publicar template en el catálogo público"
            disabled={!latestVersion}
          >
            Publicar
          </button>
        )}
        {publishedVersion && (
          <button 
            onClick={handleDownload}
            className="p-3 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
            title="Descargar versión publicada"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
