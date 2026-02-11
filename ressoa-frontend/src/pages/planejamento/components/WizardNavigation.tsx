import { cn } from '../../../lib/utils';

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const steps = [
  { number: 1, label: 'Dados Gerais' },
  { number: 2, label: 'Habilidades' },
  { number: 3, label: 'Revisão' },
];

export const WizardNavigation = ({
  currentStep,
  onStepClick,
}: WizardNavigationProps) => {
  return (
    <nav aria-label="Progresso do wizard de planejamento" className="mb-8">
      <ol className="flex items-center justify-between md:justify-center md:gap-8">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isClickable = step.number < currentStep && onStepClick;

          return (
            <li
              key={step.number}
              aria-current={isActive ? 'step' : undefined}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number as 1 | 2 | 3)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isClickable && 'cursor-pointer hover:opacity-80',
                  !isClickable && 'cursor-default',
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                    isActive &&
                      'border-tech-blue bg-tech-blue text-white',
                    isCompleted &&
                      'border-green-500 bg-green-500 text-white',
                    !isActive &&
                      !isCompleted &&
                      'border-gray-300 text-gray-500',
                  )}
                >
                  {isCompleted ? '✓' : step.number}
                </div>
                <span
                  className={cn(
                    'hidden text-sm font-medium md:block',
                    isActive && 'text-tech-blue',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-500',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {step.number < 3 && (
                <div
                  className={cn(
                    'ml-2 hidden h-0.5 w-16 md:block',
                    isCompleted ? 'bg-green-500' : 'bg-gray-300',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
