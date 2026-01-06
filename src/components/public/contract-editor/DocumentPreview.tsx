import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface DocumentPreviewProps {
  templateText: string;
  renderedContract: string;
  completionPercentage: number;
  onHtmlReady?: (html: string) => void;
}

export function DocumentPreview({ 
  templateText, 
  renderedContract, 
  completionPercentage,
  onHtmlReady
}: DocumentPreviewProps) {
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contractRef.current) {
      contractRef.current.innerHTML = renderedContract;
      
      // Notificar al padre cuando el HTML esté listo
      if (onHtmlReady && renderedContract) {
        onHtmlReady(renderedContract);
      }
    }
  }, [renderedContract, onHtmlReady]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-5">
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
            <div className="bg-lime-400/90 text-slate-900 text-xs px-3 py-1 rounded-full font-medium">
              {completionPercentage}% completado
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!templateText || templateText.trim() === '' ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay contenido</p>
            </div>
          ) : (
            <div
              ref={contractRef}
              className="contract-preview prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedContract }}
            />
          )}
        </div>
      </div>
  );
}
