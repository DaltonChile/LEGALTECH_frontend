import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: string;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white'
                        : isCurrent
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isCompleted || isCurrent
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-4 bg-slate-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'w-full bg-gradient-to-r from-blue-600 to-cyan-500'
                          : 'w-0 bg-slate-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
