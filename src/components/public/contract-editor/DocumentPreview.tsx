import { useRef, useEffect, useState } from 'react';
import { FileText, Lock } from 'lucide-react';
import { contractEditorStyles } from './styles';

interface VariableWithDescription {
  name: string;
  description: string | null;
  type: string;
}

interface DocumentPreviewProps {
  templateText: string;
  renderedContract: string;
  completionPercentage: number;
  activeField?: string | null;
  variablesMetadata?: VariableWithDescription[];
  onHtmlReady?: (html: string) => void;
  // Props para mostrar solo un porcentaje del documento (con gradiente blur)
  visiblePercentage?: number; // Si se define, muestra solo este % del documento
  lockedOverlayContent?: React.ReactNode; // Contenido a mostrar sobre la parte bloqueada
}

export function DocumentPreview({ 
  templateText, 
  renderedContract, 
  completionPercentage,
  activeField,
  variablesMetadata = [],
  onHtmlReady,
  visiblePercentage,
  lockedOverlayContent
}: DocumentPreviewProps) {
  const contractRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string | null>(null);

  useEffect(() => {
    if (contractRef.current) {
      contractRef.current.innerHTML = renderedContract;
      
      // Notificar al padre cuando el HTML esté listo
      if (onHtmlReady && renderedContract) {
        onHtmlReady(renderedContract);
      }
    }
  }, [renderedContract, onHtmlReady]);

  // Efecto para posicionar el tooltip al lado de la variable activa
  useEffect(() => {
    if (!activeField || !contractRef.current) {
      setTooltipPosition(null);
      setCurrentDescription(null);
      return;
    }

    // Buscar la descripción de la variable activa
    console.log('🔍 Active field:', activeField);
    console.log('📚 Variables metadata:', variablesMetadata);
    
    const variableData = variablesMetadata.find(v => v.name === activeField);
    console.log('📝 Found variable data:', variableData);
    
    if (!variableData?.description) {
      console.warn('⚠️ No description found for:', activeField);
      setTooltipPosition(null);
      setCurrentDescription(null);
      return;
    }

    setCurrentDescription(variableData.description);
    console.log('✅ Description set:', variableData.description);

    // Buscar el span con la variable activa en el DOM
    const variableSpan = contractRef.current.querySelector(`[data-variable="${activeField}"]`);
    console.log('🎯 Found span:', variableSpan);
    
    if (!variableSpan) {
      console.warn('⚠️ No span found with data-variable:', activeField);
      setTooltipPosition(null);
      return;
    }

    const rect = variableSpan.getBoundingClientRect();
    const containerRect = contractRef.current.getBoundingClientRect();

    // Obtener el scroll actual del contenedor
    const scrollTop = contractRef.current.parentElement?.scrollTop || 0;

    // Calcular posición relativa al contenedor + scroll (debajo de la variable)
    const position = {
      top: rect.bottom - containerRect.top + scrollTop + 12,
      left: rect.left - containerRect.left
    };
    
    console.log('📍 Tooltip position:', position);
    console.log('📜 Scroll position:', scrollTop);
    setTooltipPosition(position);
  }, [activeField, renderedContract, variablesMetadata]);

  // Determinar si mostrar el documento parcialmente (con gradiente)
  const isPartialView = visiblePercentage !== undefined && visiblePercentage < 100;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-xs">Vista previa</div>
                <div className="text-white font-semibold">Documento</div>
              </div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full font-medium bg-lime-400/90 text-slate-900">
              {completionPercentage}% completado
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {!templateText || templateText.trim() === '' ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay contenido</p>
            </div>
          ) : (
            <div className="relative">
              {/* Contenedor con altura limitada si es vista parcial */}
              <div className={`${isPartialView ? 'relative' : ''}`} style={isPartialView ? { maxHeight: '400px', overflow: 'hidden' } : {}}>
                <div
                  ref={contractRef}
                  className="contract-preview prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedContract }}
                />
                
                {/* Gradiente con blur y transparencia si es vista parcial */}
                {isPartialView && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.95) 100%)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)'
                    }}
                  />
                )}
              </div>
              
              {/* Sección bloqueada con overlay */}
              {isPartialView && lockedOverlayContent && (
                <div className="mt-4 py-8 flex flex-col items-center justify-center border-t border-slate-200">
                  {lockedOverlayContent}
                </div>
              )}
              
              {/* Popup tipo comic con la descripción */}
              {tooltipPosition && currentDescription && (
                <div
                  className="absolute z-[9999] animate-fade-in"
                  style={{
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="relative">
                    {/* Punta del bocadillo apuntando hacia arriba */}
                    <div className="absolute left-6 -top-2">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-slate-900"></div>
                    </div>
                    
                    {/* Contenido del bocadillo */}
                    <div className="bg-slate-900 text-white text-sm rounded-xl px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-sm border-2 border-slate-800">
                      <p className="font-normal text-sm leading-relaxed">{currentDescription}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        ${contractEditorStyles}
      `}</style>
    </>
  );
}
