import { useRef, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { contractEditorStyles } from './styles';
import { formatVariableName } from './utils/templateParser';

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
  visiblePercentage?: number; // Percentage of FIELDS to show (not document height)
  lockedOverlayContent?: React.ReactNode; // Contenido a mostrar sobre la parte bloqueada
  allVariables?: string[]; // List of all variable names to calculate field-based blur
}

export function DocumentPreview({
  templateText,
  renderedContract,
  activeField,
  variablesMetadata = [],
  onHtmlReady,
  visiblePercentage,
  lockedOverlayContent,
  allVariables = []
}: DocumentPreviewProps) {
  const contractRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [currentDescription, setCurrentDescription] = useState<string | null>(null);
  const [currentFieldName, setCurrentFieldName] = useState<string | null>(null);
  const [visibleHeight, setVisibleHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contractRef.current) {
      contractRef.current.innerHTML = renderedContract;

      // Notificar al padre cuando el HTML esté listo
      if (onHtmlReady && renderedContract) {
        onHtmlReady(renderedContract);
      }

      // Calculate visible height based on field positions (not document percentage)
      if (visiblePercentage !== undefined && allVariables.length > 0 && contractRef.current) {
        setTimeout(() => {
          const container = contractRef.current;
          if (!container) return;

          // Calculate how many fields should be visible
          const visibleFieldCount = Math.ceil((allVariables.length * visiblePercentage) / 100);

          // Find all variable spans in the document
          const variableSpans = container.querySelectorAll('[data-variable]');

          if (variableSpans.length > 0 && visibleFieldCount > 0) {
            // Get the position of the last visible field
            const lastVisibleIndex = Math.min(visibleFieldCount - 1, variableSpans.length - 1);
            const lastVisibleSpan = variableSpans[lastVisibleIndex];

            if (lastVisibleSpan) {
              const containerRect = container.getBoundingClientRect();
              const spanRect = lastVisibleSpan.getBoundingClientRect();
              // Calculate height from top of container to bottom of last visible field 
              // + extra padding + gradient height (120px) to ensure the field is fully visible and not blurred
              const heightToField = spanRect.bottom - containerRect.top + 180;
              // Cap at total height to avoid empty space if document is short
              setVisibleHeight(Math.min(heightToField, container.scrollHeight));
            }
          } else {
            // Fallback: use percentage of total height
            const height = container.scrollHeight || 0;
            setVisibleHeight((height * visiblePercentage) / 100);
          }
        }, 150);
      }
    }
  }, [renderedContract, onHtmlReady, visiblePercentage, allVariables]);

  // Efecto para hacer scroll a la variable activa y mostrar descripción
  useEffect(() => {
    console.log('🎯 Active field changed:', activeField);
    console.log('📚 Variables metadata available:', variablesMetadata);

    if (!activeField || !contractRef.current || !scrollContainerRef.current) {
      setCurrentDescription(null);
      setCurrentFieldName(null);
      return;
    }

    const scrollContainer = scrollContainerRef.current;

    // Buscar el span con la variable activa en el DOM
    const variableSpan = contractRef.current.querySelector(`[data-variable="${activeField}"]`);

    if (!variableSpan) {
      console.warn('⚠️ No span found with data-variable:', activeField);
      setCurrentDescription(null);
      setCurrentFieldName(null);
      return;
    }

    console.log('✅ Found variable span:', variableSpan);

    // Buscar la descripción de la variable activa
    const variableData = variablesMetadata.find(v => v.name === activeField);
    console.log('🔍 Variable data found:', variableData);

    if (variableData?.description) {
      setCurrentDescription(variableData.description);
      setCurrentFieldName(activeField);
    } else {
      setCurrentDescription(null);
      setCurrentFieldName(null);
    }

    // Hacer scroll al elemento de forma suave
    const spanRect = variableSpan.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const scrollTop = scrollContainer.scrollTop;

    // Calcular posición para centrar el elemento en el viewport
    const targetScrollTop = scrollTop + spanRect.top - containerRect.top - (containerRect.height / 2) + (spanRect.height / 2);

    scrollContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }, [activeField, renderedContract, variablesMetadata]);

  // Determinar si mostrar el documento parcialmente (con gradiente)
  const isPartialView = visiblePercentage !== undefined && visiblePercentage < 100;

  return (
    <>
      <div className="h-full flex flex-col bg-slate-100 p-6">
        {/* Paper Sheet */}
        <div className="flex-1 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden flex flex-col mx-auto w-full max-w-3xl">

          {/* Description Banner - Fixed at top with smooth transition */}
          <div 
            className={`bg-navy-900 text-white border-b border-navy-800 flex items-start gap-3 overflow-hidden transition-all duration-500 ease-out ${
              currentDescription && currentFieldName 
                ? 'h-24 opacity-100 px-6 py-3' 
                : 'h-0 opacity-0 px-6 py-0'
            }`}
          >
            <div className="w-6 h-6 bg-legal-emerald-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-legal-emerald-400 mb-1 font-sans">
                {currentFieldName ? formatVariableName(currentFieldName) : ''}
              </p>
              <p className="text-sm leading-relaxed font-sans line-clamp-3">{currentDescription || ''}</p>
            </div>
          </div>

          {/* Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-12 py-10 relative scroll-smooth">
            {!templateText || templateText.trim() === '' ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium font-sans">No hay contenido</p>
              </div>
            ) : (
              <div className="relative">
                {/* Contenedor con altura limitada si es vista parcial */}
                <div
                  ref={contentWrapperRef}
                  className={`relative ${isPartialView ? 'overflow-hidden' : ''}`}
                  style={isPartialView && visibleHeight ? {
                    maxHeight: `${visibleHeight}px`,
                  } : {}}
                >
                  <div
                    ref={contractRef}
                    className="contract-preview prose prose-sm max-w-none select-none font-serif"
                    dangerouslySetInnerHTML={{ __html: renderedContract }}
                  />

                  {/* Gradiente con blur y transparencia si es vista parcial */}
                  {isPartialView && visibleHeight && (
                    <div
                      className="absolute bottom-0 left-0 right-0 pointer-events-none"
                      style={{
                        height: '120px',
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
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        ${contractEditorStyles}
      `}</style>
    </>
  );
}
