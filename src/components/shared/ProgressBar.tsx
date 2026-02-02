import { Check, ChevronRight, Upload, FileText, PenTool, Users, CreditCard, CheckCircle } from 'lucide-react';

// Map step IDs to icons
const STEP_ICONS: Record<string, React.ReactNode> = {
  'upload': <Upload className="w-5 h-5" />,
  'options': <PenTool className="w-5 h-5" />,
  'signers': <Users className="w-5 h-5" />,
  'signatures': <PenTool className="w-5 h-5" />,
  'payment': <CreditCard className="w-5 h-5" />,
  'review': <CheckCircle className="w-5 h-5" />,
  'confirm': <CheckCircle className="w-5 h-5" />,
  'formulario-inicial': <FileText className="w-5 h-5" />,
  'completar': <FileText className="w-5 h-5" />,
};

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
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;
            const icon = STEP_ICONS[step.id] || <FileText className="w-5 h-5" />;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step */}
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all
                  ${isCurrent ? 'bg-navy-900 text-white' : ''}
                  ${isCompleted ? 'text-legal-emerald-600' : ''}
                  ${!isCurrent && !isCompleted ? 'text-slate-400' : ''}
                `}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    icon
                  )}
                  <span className="hidden sm:inline font-medium text-sm">{step.label}</span>
                </div>

                {/* Connector */}
                {!isLast && (
                  <ChevronRight className="w-5 h-5 text-slate-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
