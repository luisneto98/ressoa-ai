/**
 * Ressoa AI Chart Theme Configuration
 *
 * Tema customizado para Recharts alinhado com o Design System Ressoa AI.
 * Usa a paleta de cores principal para garantir consistência visual.
 *
 * Usage:
 * ```tsx
 * import { ressoaChartTheme } from '@/lib/chart-theme'
 *
 * <BarChart data={data}>
 *   <Bar dataKey="value" fill={ressoaChartTheme.colors[0]} />
 *   <XAxis {...ressoaChartTheme.axis} />
 *   <YAxis {...ressoaChartTheme.axis} />
 *   <Tooltip {...ressoaChartTheme.tooltip} />
 *   <CartesianGrid {...ressoaChartTheme.grid} />
 * </BarChart>
 * ```
 */

/**
 * Color palette for charts
 * Ordem de prioridade: Tech Blue > Cyan AI > Focus Orange > Deep Navy
 */
export const CHART_COLORS = [
  '#2563EB', // Tech Blue - Primary data color
  '#06B6D4', // Cyan AI - Secondary data color
  '#F97316', // Focus Orange - Accent/highlight color
  '#0A2647', // Deep Navy - Additional data color
] as const

/**
 * Chart theme configuration object
 */
export const ressoaChartTheme = {
  /**
   * Data colors for bars, lines, areas, etc.
   * Apply in sequence for multi-series charts
   */
  colors: CHART_COLORS,

  /**
   * Grid styling (CartesianGrid component)
   */
  grid: {
    stroke: '#E5E7EB', // Gray-200
    strokeDasharray: '3 3', // Dashed line
    strokeWidth: 1,
  },

  /**
   * Axis styling (XAxis, YAxis components)
   */
  axis: {
    stroke: '#9CA3AF', // Gray-400
    tick: {
      fill: '#6B7280', // Gray-500
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
    },
    axisLine: {
      stroke: '#E5E7EB', // Gray-200
      strokeWidth: 1,
    },
  },

  /**
   * Tooltip styling (Tooltip component)
   * Uses Deep Navy background with white text for high contrast
   */
  tooltip: {
    contentStyle: {
      backgroundColor: '#0A2647', // Deep Navy
      border: '1px solid #06B6D4', // Cyan AI border
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#FFFFFF',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    labelStyle: {
      color: '#FFFFFF',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#F8FAFC', // Ghost White
      padding: '2px 0',
    },
    cursor: {
      fill: 'rgba(6, 182, 212, 0.1)', // Cyan AI with transparency
    },
  },

  /**
   * Legend styling (Legend component)
   */
  legend: {
    iconType: 'circle' as const,
    wrapperStyle: {
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#0A2647', // Deep Navy
    },
  },
} as const

/**
 * TypeScript types for theme configuration
 */
export type ChartTheme = typeof ressoaChartTheme
export type ChartColor = typeof CHART_COLORS[number]

/**
 * Helper function to get color by index with wraparound
 * Useful for dynamic datasets with unknown length
 *
 * @example
 * const color = getChartColor(5) // Returns CHART_COLORS[1] (wraps around)
 */
export function getChartColor(index: number): ChartColor {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/* ============================================
 * Example Usage with BarChart
 * ============================================

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ressoaChartTheme, getChartColor } from '@/lib/chart-theme'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
]

function ExampleChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid {...ressoaChartTheme.grid} />
        <XAxis
          dataKey="name"
          {...ressoaChartTheme.axis}
        />
        <YAxis {...ressoaChartTheme.axis} />
        <Tooltip {...ressoaChartTheme.tooltip} />
        <Bar
          dataKey="value"
          fill={ressoaChartTheme.colors[0]}
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

*/
