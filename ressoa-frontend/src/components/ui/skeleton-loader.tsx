import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

export interface SkeletonLoaderProps extends React.ComponentProps<"div"> {
  /** Preset variant */
  variant: "card" | "table" | "chart"
  /** Number of skeletons to render (useful for list loading) */
  count?: number
}

/**
 * SkeletonLoader - Componentes de loading states reutilizáveis
 *
 * Extends o componente Skeleton base do shadcn/ui com presets comuns.
 *
 * @variant card - Retângulo com header simulado + linhas de texto
 * @variant table - Grid de linhas para tabelas
 * @variant chart - Retângulo alto com barras simuladas
 *
 * @param count - Quantas vezes repetir o skeleton (padrão: 1)
 *
 * @example
 * <SkeletonLoader variant="card" count={3} />
 * <SkeletonLoader variant="table" count={5} />
 * <SkeletonLoader variant="chart" />
 */
function SkeletonLoader({ variant, count = 1, className, ...props }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {skeletons.map((index) => (
        <div key={index}>
          {variant === "card" && <SkeletonCard />}
          {variant === "table" && <SkeletonTableRow />}
          {variant === "chart" && <SkeletonChart />}
        </div>
      ))}
    </div>
  )
}

/**
 * Card skeleton preset
 * Simula: Card com header (largo) + descrição (médio) + 3 linhas de texto
 */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border p-6 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Content lines */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton preset
 * Simula: Linha de tabela com 4 colunas
 */
function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/5" />
      <Skeleton className="h-4 w-1/6" />
    </div>
  )
}

/**
 * Chart skeleton preset
 * Simula: Gráfico de barras com 6 barras de alturas variadas
 */
function SkeletonChart() {
  return (
    <div className="rounded-xl border border-border p-6">
      {/* Chart title */}
      <Skeleton className="h-5 w-48 mb-6" />

      {/* Bar chart simulation */}
      <div className="flex items-end justify-between gap-3 h-48">
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-36" />
        <Skeleton className="w-full h-28" />
        <Skeleton className="w-full h-44" />
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between gap-3 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  )
}

export { SkeletonLoader, SkeletonCard, SkeletonTableRow, SkeletonChart }
