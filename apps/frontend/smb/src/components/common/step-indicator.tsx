import { cn } from '@ui';

export interface Step {
  number: number;
  label: string;
}

export interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  className?: string;
}

export function StepIndicator({
  currentStep,
  steps,
  className,
}: StepIndicatorProps) {
  // Helper function to get step circle className based on state
  const getStepCircleClassName = (stepNumber: number): string => {
    const isCompleted = currentStep > stepNumber;
    const isActive = currentStep === stepNumber;

    return cn(
      'text-sm w-5 h-5 rounded-full flex items-center justify-center transition-all',
      {
        // Completed state: solid primary background
        'bg-primary text-primary-foreground': isCompleted,
        // Active state: light background with ring highlight
        'bg-primary/10 text-primary ring-2 ring-primary ring-offset-2':
          isActive,
        // Upcoming state: muted grey
        'bg-muted text-muted-foreground': !isCompleted && !isActive,
      }
    );
  };

  // Helper function to get step label className based on state
  const getStepLabelClassName = (stepNumber: number): string => {
    const isCompleted = currentStep > stepNumber;
    const isActive = currentStep === stepNumber;

    return cn('transition-all', {
      // Active step: bold and dark
      'font-semibold text-foreground': isActive,
      // Completed step: medium weight
      'font-medium text-foreground': isCompleted,
      // Upcoming step: muted
      'text-muted-foreground': !isCompleted && !isActive,
    });
  };

  // Helper function to get connector line className based on state
  const getConnectorClassName = (stepNumber: number): string => {
    const isCompleted = currentStep > stepNumber;

    return cn('w-12 h-px transition-all', {
      // Connector turns primary when step before it is completed
      'bg-primary': isCompleted,
      'bg-border': !isCompleted,
    });
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-2">
          {/* Step Circle and Label */}
          <div className="flex items-center gap-2">
            <div className={getStepCircleClassName(step.number)}>
              {step.number}
            </div>
            <span className={getStepLabelClassName(step.number)}>
              {step.label}
            </span>
          </div>

          {/* Connector Line (not after last step) */}
          {index < steps.length - 1 && (
            <div className={getConnectorClassName(step.number)} />
          )}
        </div>
      ))}
    </div>
  );
}
