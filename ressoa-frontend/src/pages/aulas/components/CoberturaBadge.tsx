import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { getStatusLabel } from '@/lib/cobertura-helpers';
import type { NivelCobertura, NivelBloom } from '@/types/analise';
import { CriteriosEvidenciaCollapse } from './CriteriosEvidenciaCollapse';

interface CoberturaBadgeProps {
  curriculo_tipo?: 'BNCC' | 'CUSTOM';
  codigo: string;
  descricao: string;
  nivel: NivelCobertura;
  evidencias: Array<{ texto_literal: string }>;

  // BNCC-specific (optional)
  unidade_tematica?: string;

  // Custom-specific (optional)
  nivel_bloom_planejado?: NivelBloom;
  nivel_bloom_detectado?: NivelBloom;
  criterios_evidencia?: string[];
  criterios_atendidos?: string[];
}

export function CoberturaBadge({
  curriculo_tipo = 'BNCC',
  codigo,
  descricao,
  nivel,
  evidencias,
  unidade_tematica,
  nivel_bloom_planejado,
  nivel_bloom_detectado,
  criterios_evidencia,
  criterios_atendidos,
}: CoberturaBadgeProps) {
  const getBadgeConfig = (nivel: NivelCobertura) => {
    const label = getStatusLabel(curriculo_tipo, nivel);

    switch (nivel) {
      case 'COMPLETE':
        return {
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label,
        };
      case 'PARTIAL':
        return {
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          label,
        };
      case 'MENTIONED':
        return {
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          label,
        };
      case 'NOT_COVERED':
        return {
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          label,
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          label: nivel ?? 'Desconhecido',
        };
    }
  };

  const config = getBadgeConfig(nivel);

  // AC2: Check if Bloom levels differ for custom objectives
  const bloomLevelsDiffer =
    curriculo_tipo === 'CUSTOM' &&
    nivel_bloom_planejado &&
    nivel_bloom_detectado &&
    nivel_bloom_planejado !== nivel_bloom_detectado;

  return (
    <Card className="p-4 border-l-4 border-l-cyan-500">
      <div className="space-y-3">
        {/* Status Badge + Code */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={config.className}>{config.label}</Badge>
          <span className="font-semibold text-deep-navy">{codigo}</span>

          {/* AC2: Bloom levels for custom objectives */}
          {curriculo_tipo === 'CUSTOM' && nivel_bloom_planejado && (
            <>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Planejado: {nivel_bloom_planejado}
              </Badge>
              {nivel_bloom_detectado && (
                <Badge className="bg-cyan-100 text-cyan-800 text-xs">
                  Detectado: {nivel_bloom_detectado}
                </Badge>
              )}
              {bloomLevelsDiffer && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-focus-orange cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Nível cognitivo abordado difere do planejado. Considere aprofundar na próxima aula.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600">{descricao}</p>

        {/* BNCC-specific: Unidade Temática */}
        {curriculo_tipo === 'BNCC' && unidade_tematica && (
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Unidade Temática:</span> {unidade_tematica}
          </p>
        )}

        {/* AC4: Critérios de Evidência collapse (CUSTOM only) */}
        {curriculo_tipo === 'CUSTOM' && criterios_evidencia && criterios_evidencia.length > 0 && (
          <CriteriosEvidenciaCollapse
            criterios={criterios_evidencia}
            criterios_atendidos={criterios_atendidos || []}
          />
        )}

        {/* Evidências literais (AC6) */}
        {evidencias && evidencias.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Evidências:
            </p>
            {evidencias.slice(0, 3).map((ev, idx) => (
              <blockquote
                key={idx}
                className="text-sm italic border-l-4 border-cyan-500 pl-3 text-gray-700"
              >
                "{ev.texto_literal}"
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
