import { ArrowLeft, Check, Circle } from 'lucide-react';
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
    <div className="h-20 bg-white border-b border-slate-200 flex items-center px-6 justify-between relative z-20 shrink-0">
      {/* Left: Back Button */}
      <div className="flex items-center w-[300px]">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>
        )}
      </div>

      {/* Center: Progress Bar (Tracking Style) */}
      <div className="flex-1 max-w-3xl px-8">
        <div className="relative">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
          
          {/* Active Line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-slate-900 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative group">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all z-10 
                      ${isCompleted 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : isCurrent 
                          ? 'bg-white border-slate-900 text-slate-900' 
                          : 'bg-white border-slate-200 text-slate-300'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`absolute -bottom-6 w-max text-xs font-medium transition-colors hidden sm:block
                    ${isCurrent ? 'text-slate-900' : 'text-slate-400'}
                  `}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Actions & Price */}
      <div className="flex items-center justify-end w-[300px] gap-6">
        {totalPrice !== undefined && (
           <div className="text-right hidden xl:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total estimado</div>
              <div className="text-lg font-bold text-slate-900">{formatPrice(totalPrice)}</div>
           </div>
        )}
        {rightAction}
      </div>
    </div>
  );
}
