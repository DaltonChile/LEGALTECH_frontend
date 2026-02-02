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

export interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStep: string;
}

export function StepProgressBar({ steps, currentStep }: StepProgressBarProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isPast = currentIndex > index;
        const icon = step.icon || STEP_ICONS[step.id] || <FileText className="w-5 h-5" />;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all
              ${isActive ? 'bg-navy-900 text-white' : ''}
              ${isPast ? 'text-legal-emerald-600' : ''}
              ${!isActive && !isPast ? 'text-slate-400' : ''}
            `}>
              {isPast ? (
                <Check className="w-5 h-5" />
              ) : (
                icon
              )}
              <span className="hidden sm:inline font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 text-slate-300 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
