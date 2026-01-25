import { useRef, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
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

  // Efecto para hacer scroll a la variable activa y posicionar el tooltip
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
    
    if (variableData?.description) {
      setCurrentDescription(variableData.description);
      console.log('✅ Description set:', variableData.description);
    } else {
      console.warn('⚠️ No description found for:', activeField);
      setCurrentDescription(null);
    }

    // Buscar el span con la variable activa en el DOM
    const variableSpan = contractRef.current.querySelector(`[data-variable="${activeField}"]`);
    console.log('🎯 Found span:', variableSpan);
    
    if (!variableSpan) {
      console.warn('⚠️ No span found with data-variable:', activeField);
      setTooltipPosition(null);
      return;
    }

    // Hacer scroll al elemento de forma suave
    const scrollContainer = contractRef.current.parentElement;
    if (scrollContainer) {
      const spanRect = variableSpan.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      
      // Calcular posición para centrar el elemento en el viewport
      const targetScrollTop = scrollTop + spanRect.top - containerRect.top - (containerRect.height / 2) + (spanRect.height / 2);
      
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      // Esperar a que termine el scroll para posicionar el tooltip
      setTimeout(() => {
        if (!variableData?.description) return;
        
        const rect = variableSpan.getBoundingClientRect();
        const updatedContainerRect = contractRef.current!.getBoundingClientRect();
        const updatedScrollTop = scrollContainer.scrollTop;

        // Calcular posición relativa al contenedor + scroll (debajo de la variable)
        const position = {
          top: rect.bottom - updatedContainerRect.top + updatedScrollTop + 12,
          left: rect.left - updatedContainerRect.left
        };
        
        console.log('📍 Tooltip position:', position);
        console.log('📜 Scroll position:', updatedScrollTop);
        setTooltipPosition(position);
      }, 300); // Esperar a que termine la animación del scroll
    }
  }, [activeField, renderedContract, variablesMetadata]);

  // Determinar si mostrar el documento parcialmente (con gradiente)
  const isPartialView = visiblePercentage !== undefined && visiblePercentage < 100;

  return (
    <>
      <div className="h-full flex flex-col bg-slate-100 p-6">
        {/* Paper Sheet */}
        <div className="flex-1 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden flex flex-col mx-auto w-full max-w-3xl">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-12 py-10 relative">
            {!templateText || templateText.trim() === '' ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium font-sans">No hay contenido</p>
              </div>
            ) : (
              <div className="relative">
                {/* Contenedor con altura limitada si es vista parcial */}
                <div className={`${isPartialView ? 'relative' : ''}`} style={isPartialView ? { maxHeight: `${visiblePercentage}vh`, overflow: 'hidden' } : {}}>
                  <div
                    ref={contractRef}
                    className="contract-preview prose prose-sm max-w-none select-none font-serif"
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
                      <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-navy-900"></div>
                    </div>
                    
                    {/* Contenido del bocadillo */}
                    <div className="bg-navy-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg max-w-sm">
                      <p className="font-normal text-sm leading-relaxed font-sans">{currentDescription}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
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
