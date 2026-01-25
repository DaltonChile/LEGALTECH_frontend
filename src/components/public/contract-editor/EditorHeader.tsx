import { ArrowLeft, Check } from 'lucide-react';
import { formatPrice } from './utils/formatPrice';

interface Step {
  id: string;
  label: string;
}

interface EditorHeaderProps {
  steps: Step[];
  currentStep: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  totalPrice?: number;
}

export function EditorHeader({
  steps,
  currentStep,
  onBack,
  rightAction,
  totalPrice,
}: EditorHeaderProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-white border-b border-slate-200 shrink-0">
      <div className="min-h-16 md:h-20 flex flex-col md:flex-row items-stretch md:items-center px-3 md:px-8 py-3 md:py-0 gap-3 md:gap-0 justify-between w-full max-w-[1920px] mx-auto">
        {/* Left: Back Button */}
        <div className="flex items-center md:w-[200px] order-1 md:order-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-navy-900 transition-colors font-sans text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Volver</span>
            </button>
          )}
        </div>

        {/* Center: Progress Steps */}
        <div className="flex-1 flex items-center overflow-x-auto md:overflow-visible pb-2 md:pb-0 order-2 md:order-2 -mx-3 md:mx-0 px-3 md:px-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="flex items-center w-full min-w-max md:min-w-0">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div 
                      className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-semibold font-sans transition-all
                        ${isCompleted 
                          ? 'bg-navy-900 text-white' 
                          : isCurrent 
                            ? 'bg-navy-900 text-white ring-2 md:ring-4 ring-navy-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    <span className={`text-xs md:text-sm font-sans hidden sm:block whitespace-nowrap
                      ${isCurrent ? 'text-navy-900 font-semibold' : isCompleted ? 'text-slate-600 font-medium' : 'text-slate-400'}
                    `}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* Connector */}
                  {!isLast && (
                    <div className={`flex-1 h-px mx-2 md:mx-3 ${
                      isCompleted ? 'bg-navy-900' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions & Price */}
        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 shrink-0 order-3 md:order-3">
          {totalPrice !== undefined && (
            <div className="text-left md:text-right">
              <div className="text-xs text-slate-500 font-sans">Total</div>
              <div className="text-base md:text-lg font-bold text-navy-900 font-sans whitespace-nowrap">{formatPrice(totalPrice)}</div>
            </div>
          )}
          {rightAction}
        </div>
      </div>
    </div>
  );
}
