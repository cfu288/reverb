import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

/**
 * A step indicator component that shows progress through a multi-step process
 */
export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-5 left-0 h-0.5 w-full bg-gray-200">
          <div
            className="absolute h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.title} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300",
                    {
                      "border-primary bg-primary text-white":
                        isCompleted || isCurrent,
                      "border-gray-300 bg-white": !isCompleted && !isCurrent,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-6 w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step text */}
                <div className="mt-2 text-center">
                  <div
                    className={cn("text-sm font-medium", {
                      "text-primary": isCurrent,
                      "text-gray-900": isCompleted,
                      "text-gray-500": !isCompleted && !isCurrent,
                    })}
                  >
                    {step.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
