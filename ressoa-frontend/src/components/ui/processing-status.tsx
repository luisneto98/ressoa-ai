import * as React from "react"
import { IconUpload, IconFileText, IconBrain, IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Enviando...", icon: IconUpload },
  { label: "Transcrevendo...", icon: IconFileText },
  { label: "Analisando...", icon: IconBrain },
  { label: "Pronto!", icon: IconCheck },
] as const

export interface ProcessingStatusProps extends React.ComponentProps<"div"> {
  /** Current step (1-4) */
  currentStep: 1 | 2 | 3 | 4
}

/**
 * ProcessingStatus - Stepper visual para processo de análise de aula
 *
 * Exibe 4 etapas fixas do fluxo de processamento:
 * 1. Enviando... (upload do áudio)
 * 2. Transcrevendo... (STT processing)
 * 3. Analisando... (LLM pipeline)
 * 4. Pronto! (análise completa)
 *
 * Layout responsivo:
 * - Desktop (>=md): Horizontal com linha conectora
 * - Mobile (<md): Vertical com linha conectora
 *
 * Estados visuais:
 * - Pending: Cinza claro
 * - Current: Cyan AI com pulse animation
 * - Complete: Tech Blue
 *
 * @example
 * <ProcessingStatus currentStep={2} />
 */
function ProcessingStatus({ className, currentStep, ...props }: ProcessingStatusProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Progresso de processamento: ${STEPS[currentStep - 1].label}`}
      className={cn("flex flex-col md:flex-row gap-4 md:gap-0", className)}
      {...props}
    >
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isPending = stepNumber > currentStep
        const Icon = step.icon

        return (
          <React.Fragment key={stepNumber}>
            {/* Step Item */}
            <div className="flex items-center gap-3 md:flex-col md:gap-2 flex-1">
              {/* Icon Circle */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full w-10 h-10 md:w-12 md:h-12 transition-all",
                  isComplete && "bg-tech-blue text-white",
                  isCurrent && "bg-cyan-ai text-white animate-[var(--animate-pulse-subtle)]",
                  isPending && "bg-gray-200 text-gray-500"
                )}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
              </div>

              {/* Label */}
              <p
                className={cn(
                  "text-sm font-medium transition-colors flex-1 md:flex-none md:text-center",
                  isComplete && "text-tech-blue",
                  isCurrent && "text-cyan-ai font-semibold",
                  isPending && "text-gray-500"
                )}
              >
                {step.label}
              </p>
            </div>

            {/* Connector Line (not after last step) */}
            {stepNumber < STEPS.length && (
              <div
                className="hidden md:flex items-center flex-1 px-2"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-0.5 w-full transition-colors",
                    isComplete && "bg-tech-blue",
                    isCurrent && "bg-cyan-ai",
                    isPending && "bg-gray-200"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export { ProcessingStatus, STEPS }
