import * as React from "react"

import { cn } from "@/lib/utils"

export interface GradientCardProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  headerActions?: React.ReactNode
}

/**
 * GradientCard - Card com header animado usando gradient Deep Navy → Tech Blue
 *
 * Usa animação gradient-x definida em src/index.css para movimento suave.
 * Background gradient configurado com background-size: 200% para permitir animação.
 *
 * @example
 * <GradientCard
 *   title="Relatório de Aula"
 *   description="Análise pedagógica completa"
 *   headerActions={<Button>Editar</Button>}
 * >
 *   <p>Conteúdo do card</p>
 * </GradientCard>
 */
function GradientCard({
  className,
  title,
  description,
  headerActions,
  children,
  ...props
}: GradientCardProps) {
  return (
    <div
      data-slot="gradient-card"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      {/* Animated Gradient Header */}
      <div
        className={cn(
          "relative flex items-center justify-between gap-4 px-6 py-4",
          "bg-gradient-to-r from-deep-navy via-tech-blue to-deep-navy",
          "bg-[length:200%_100%]",
          "animate-[var(--animate-gradient-x)]"
        )}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white leading-none">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-sm text-white/90 leading-snug">
              {description}
            </p>
          )}
        </div>
        {headerActions && (
          <div className="flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  )
}

export { GradientCard }
