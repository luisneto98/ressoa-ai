import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const aiBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold transition-colors",
  {
    variants: {
      variant: {
        skill: "bg-cyan-ai text-white",
        processing: "bg-tech-blue text-white",
        status: "",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "skill",
      size: "md",
    },
  }
)

export interface AIBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'status'>,
    Omit<VariantProps<typeof aiBadgeVariants>, 'variant'> {
  children: React.ReactNode
  variant?: "skill" | "processing" | "status"
  /** Status color variant - only applies when variant="status" */
  status?: "default" | "success" | "warning" | "error"
}

/**
 * AIBadge - Componente de badge AI-first do Ressoa AI
 *
 * @variant skill - Badge para habilidades BNCC (Cyan AI)
 * @variant processing - Badge para status de processamento com animação pulse
 * @variant status - Badge para status semântico (success/warning/error)
 *
 * @size sm|md|lg - Tamanho do badge
 *
 * @example
 * <AIBadge variant="skill">EF07MA18</AIBadge>
 * <AIBadge variant="processing">Analisando...</AIBadge>
 * <AIBadge variant="status" status="success">Aprovado</AIBadge>
 */
function AIBadge({ className, variant = "skill", size, status = "default", children, ...props }: AIBadgeProps) {
  // Processing variant has pulse animation and ARIA role
  const isProcessing = variant === "processing"
  const isStatusVariant = variant === "status"

  // Status color mapping
  const statusColors = {
    default: "bg-gray-200 text-gray-900 border border-border",
    success: "bg-green-100 text-green-800 border border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    error: "bg-red-100 text-red-800 border border-red-300",
  }

  return (
    <div
      role={isProcessing ? "status" : undefined}
      aria-live={isProcessing ? "polite" : undefined}
      className={cn(
        aiBadgeVariants({
          variant,
          size,
        }),
        isStatusVariant && statusColors[status],
        isProcessing && "animate-[var(--animate-pulse-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { AIBadge, aiBadgeVariants }
