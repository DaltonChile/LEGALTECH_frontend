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
      <div className="h-20 flex items-center px-8 justify-between w-full max-w-[1920px] mx-auto">
        {/* Left: Back Button */}
        <div className="flex items-center w-[200px]">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step */}
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-sans transition-all
                        ${isCompleted 
                          ? 'bg-navy-900 text-white' 
                          : isCurrent 
                            ? 'bg-navy-900 text-white ring-4 ring-navy-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    <span className={`text-sm font-sans hidden sm:block
                      ${isCurrent ? 'text-navy-900 font-semibold' : isCompleted ? 'text-slate-600 font-medium' : 'text-slate-400'}
                    `}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* Connector */}
                  {!isLast && (
                    <div className={`w-8 h-px mx-2 ${
                      isCompleted ? 'bg-navy-900' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions & Price */}
        <div className="flex items-center justify-end gap-4 shrink-0">
          {totalPrice !== undefined && (
            <div className="text-right hidden lg:block">
              <div className="text-xs text-slate-500 font-sans">Total</div>
              <div className="text-lg font-bold text-navy-900 font-sans whitespace-nowrap">{formatPrice(totalPrice)}</div>
            </div>
          )}
          {rightAction}
        </div>
      </div>
    </div>
  );
}
