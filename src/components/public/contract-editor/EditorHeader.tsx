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
    <div className="h-24 flex items-center px-8 justify-between relative z-20 shrink-0 w-full max-w-[1920px] mx-auto">
      {/* Left: Back Button */}
      <div className="flex items-center w-[300px]">
        {onBack && (
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-xl hover:bg-white/50"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 shadow-sm transition-all">
               <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Volver</span>
          </button>
        )}
      </div>

      {/* Center: Progress Bar (Tracking Style) */}
      <div className="flex-1 max-w-2xl px-8">
        <div className="relative">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
          
          {/* Active Line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-500"
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all z-10 shadow-sm
                      ${isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-white border-green-500 text-green-500 scale-110 shadow-md' 
                          : 'bg-white border-slate-200 text-slate-300'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`absolute -bottom-8 w-max text-xs font-bold transition-all
                    ${isCurrent ? 'text-slate-900 translate-y-0 opacity-100' : 'text-slate-400 translate-y-1 opacity-100'}
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
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Total estimado</div>
              <div className="text-xl font-bold text-slate-900 leading-none">{formatPrice(totalPrice)}</div>
           </div>
        )}
        {rightAction}
      </div>
    </div>
  );
}
