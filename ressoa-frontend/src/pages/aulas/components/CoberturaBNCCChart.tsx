import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { NivelCobertura } from '@/types/analise';

interface HabilidadeData {
  codigo: string;
  nivel_cobertura: NivelCobertura;
  descricao?: string;
}

interface CoberturaBNCCChartProps {
  habilidades: HabilidadeData[];
  curriculo_tipo?: 'BNCC' | 'CUSTOM';
}

// Custom tooltip component (defined outside render to avoid re-creation)
interface TooltipPayload {
  codigo: string;
  cobertura: number;
  nivel: string;
  descricao: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-semibold text-sm text-deep-navy mb-1">{data.codigo}</p>
      <p className="text-xs text-gray-600 mb-2">
        {data.nivel} ({data.cobertura}%)
      </p>
      {data.descricao && (
        <p className="text-xs text-gray-500 leading-snug line-clamp-3">
          {data.descricao}
        </p>
      )}
    </div>
  );
}

/**
 * AC3: Gráfico interativo de cobertura curricular usando Recharts
 *
 * Features:
 * - BarChart responsivo com cores semânticas por nível
 * - Tooltip interativo com descrição completa
 * - SVG <desc> para acessibilidade
 * - Domain fixo 0-100% para consistência visual
 * - Paleta Ressoa AI (Tech Blue, Cyan AI, Grid Gray)
 */
export function CoberturaBNCCChart({
  habilidades,
  curriculo_tipo = 'BNCC',
}: CoberturaBNCCChartProps) {
  // Mapear nível de cobertura para percentual visual
  const getCoberturaNumerica = (nivel: NivelCobertura): number => {
    switch (nivel) {
      case 'COMPLETE':
        return 100;
      case 'PARTIAL':
        return 65;
      case 'MENTIONED':
        return 35;
      case 'NOT_COVERED':
        return 0;
      default:
        return 0;
    }
  };

  // Mapear nível para cor (paleta semântica)
  const getColorByCobertura = (nivel: NivelCobertura): string => {
    switch (nivel) {
      case 'COMPLETE':
        return '#10B981'; // green-500
      case 'PARTIAL':
        return '#F59E0B'; // yellow-500
      case 'MENTIONED':
        return '#3B82F6'; // blue-500
      case 'NOT_COVERED':
        return '#9CA3AF'; // gray-400
      default:
        return '#9CA3AF';
    }
  };

  // Mapear nível para label em português
  const getNivelLabel = (nivel: NivelCobertura): string => {
    switch (nivel) {
      case 'COMPLETE':
        return 'Consolidada';
      case 'PARTIAL':
        return 'Trabalhada';
      case 'MENTIONED':
        return 'Introdutória';
      case 'NOT_COVERED':
        return 'Não Coberta';
      default:
        return nivel;
    }
  };

  // Preparar dados do gráfico
  const chartData = useMemo(
    () =>
      habilidades.map((hab) => ({
        codigo: hab.codigo,
        cobertura: getCoberturaNumerica(hab.nivel_cobertura),
        nivel: getNivelLabel(hab.nivel_cobertura),
        nivel_raw: hab.nivel_cobertura,
        descricao: hab.descricao || '',
      })),
    [habilidades]
  );

  if (!habilidades || habilidades.length === 0) {
    return null;
  }

  const entityLabel = curriculo_tipo === 'CUSTOM' ? 'objetivos' : 'habilidades';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-tech-blue" />
          Cobertura Curricular
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* AC3: Gráfico Recharts com ResponsiveContainer */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            {/* AC9: SVG <desc> para acessibilidade */}
            <desc>
              Gráfico de barras mostrando cobertura percentual de {chartData.length}{' '}
              {entityLabel} {curriculo_tipo === 'CUSTOM' ? 'customizados' : 'BNCC'}{' '}
              trabalhados na aula.
            </desc>

            {/* Grid de fundo */}
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

            {/* Eixo X - Códigos das habilidades */}
            <XAxis
              dataKey="codigo"
              stroke="#6B7280"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            {/* Eixo Y - Percentual 0-100 */}
            <YAxis
              domain={[0, 100]}
              stroke="#6B7280"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{
                value: '% Cobertura',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#6B7280' },
              }}
            />

            {/* Tooltip interativo */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }} />

            {/* Barras com cores por nível */}
            <Bar dataKey="cobertura" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorByCobertura(entry.nivel_raw)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda semântica */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-gray-600">Consolidada (100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span className="text-xs text-gray-600">Trabalhada (65%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-xs text-gray-600">Introdutória (35%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-400" />
            <span className="text-xs text-gray-600">Não Coberta (0%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
