import { Check } from 'lucide-react';

interface ProgressStepperProps {
  currentStep: number; // 1, 2, or 3
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const steps = [
    { number: 1, label: 'Información' },
    { number: 2, label: 'Pagar' },
    { number: 3, label: 'Firmar' },
  ];

  return (
    <div className="w-full max-w-xl sticky top-30 z-50 mx-auto">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step */}
              <div className="flex items-center gap-3">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isActive
                      ? 'border-2 border-blue-600 text-blue-600 bg-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-blue-600 transition-all duration-300 ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
