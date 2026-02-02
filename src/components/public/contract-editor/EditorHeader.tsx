import { Check, ChevronRight, Upload, FileText, PenTool, Users, CreditCard, CheckCircle } from 'lucide-react';
import { formatPrice } from './utils/formatPrice';

// Map step IDs to icons
const STEP_ICONS: Record<string, React.ReactNode> = {
  'upload': <Upload className="w-4 h-4 md:w-5 md:h-5" />,
  'options': <PenTool className="w-4 h-4 md:w-5 md:h-5" />,
  'signers': <Users className="w-4 h-4 md:w-5 md:h-5" />,
  'signatures': <PenTool className="w-4 h-4 md:w-5 md:h-5" />,
  'payment': <CreditCard className="w-4 h-4 md:w-5 md:h-5" />,
  'review': <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />,
  'confirm': <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />,
  'formulario-inicial': <FileText className="w-4 h-4 md:w-5 md:h-5" />,
  'completar': <FileText className="w-4 h-4 md:w-5 md:h-5" />,
};

interface Step {
  id: string;
  label: string;
}

interface EditorHeaderProps {
  steps: Step[];
  currentStep: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: React.ReactNode;
  totalPrice?: number;
}

export function EditorHeader({
  steps,
  currentStep,
  onBack,
  backLabel = 'Volver',
  rightAction,
  totalPrice,
}: EditorHeaderProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back Button */}
          <div className="shrink-0">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-slate-600 hover:text-navy-900 transition-colors text-sm font-medium"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            )}
          </div>

          {/* Center: Progress Steps */}
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-none">
            <div className="flex items-center">
              {steps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;
                const icon = STEP_ICONS[step.id] || <FileText className="w-4 h-4 md:w-5 md:h-5" />;
                
                return (
                  <div key={step.id} className="flex items-center">
                    {/* Step */}
                    <div className={`
                      flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full transition-all
                      ${isCurrent ? 'bg-navy-900 text-white' : ''}
                      ${isCompleted ? 'text-legal-emerald-600' : ''}
                      ${!isCurrent && !isCompleted ? 'text-slate-400' : ''}
                    `}>
                      {isCompleted ? (
                        <Check className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        icon
                      )}
                      <span className="text-sm font-medium hidden md:block whitespace-nowrap">
                        {step.label}
                      </span>
                    </div>
                    
                    {/* Connector */}
                    {!isLast && (
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 mx-1 md:mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Actions & Price */}
          <div className="flex items-center gap-3 shrink-0">
            {totalPrice !== undefined && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500 font-sans">Total</div>
                <div className="text-base md:text-lg font-bold text-navy-900 font-sans whitespace-nowrap">{formatPrice(totalPrice)}</div>
              </div>
            )}
            {rightAction}
          </div>
        </div>
      </div>
    </div>
  );
}
