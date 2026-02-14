import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIBadge } from '@/components/ui/ai-badge';
import { HabilidadeBadgeList } from './HabilidadeBadgeList';
import { calcularProgresso } from '../utils/calcularProgresso';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { Planejamento } from '../hooks/usePlanejamentos';
import {
  IconCheck,
  IconClock,
  IconCircleDashed,
  IconCalendarOff,
  IconPlus,
  IconPencil,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

interface TimelineBimestreCardProps {
  bimestre: number; // 1, 2, 3, ou 4
  planejamento?: Planejamento; // undefined se vazio
  turmaId?: string; // Para gerar chave de expansão
  onEdit?: (planejamentoId: string) => void;
  onCreate?: (bimestre: number) => void;
}

/**
 * TimelineBimestreCard - Card individual de bimestre na timeline
 *
 * Exibe informações visuais de um planejamento bimestral:
 * - Badge do bimestre (Tech Blue)
 * - Status visual (planejado, em andamento, vazio)
 * - Progresso de cobertura (barra visual)
 * - Expansão/colapso de detalhes (habilidades BNCC)
 *
 * Estados:
 * - Planejamento existe: Mostra header + progresso + habilidades (expansível)
 * - Planejamento vazio: Mostra empty state + botão "Criar Planejamento"
 *
 * Accessibility:
 * - role="article" com aria-labelledby
 * - aria-expanded para estado de expansão
 * - Navegação por teclado (Enter/Space para expandir)
 *
 * @param bimestre - Número do bimestre (1-4)
 * @param planejamento - Dados do planejamento (undefined = vazio)
 * @param turmaId - ID da turma para gerar chave de expansão persistente
 * @param onEdit - Callback ao clicar em "Editar"
 * @param onCreate - Callback ao clicar em "Criar Planejamento"
 */
export const TimelineBimestreCard = React.memo<TimelineBimestreCardProps>(
  ({ bimestre, planejamento, turmaId, onEdit, onCreate }) => {
    const expansionKey = turmaId
      ? `turma-${turmaId}-bimestre-${bimestre}`
      : `bimestre-${bimestre}`;
    const isExpanded =
      useUIStore((state) => state.expandedBimestres[expansionKey]) || false;
    const toggleBimestre = useUIStore((state) => state.toggleBimestre);

    const progresso = calcularProgresso(planejamento);

    // Status icon
    const StatusIcon = planejamento
      ? planejamento.validado_coordenacao
        ? IconCheck
        : IconClock
      : IconCircleDashed;

    const statusColor = planejamento
      ? planejamento.validado_coordenacao
        ? 'text-green-600'
        : 'text-yellow-600'
      : 'text-gray-400';

    // Bimestre vazio (sem planejamento)
    if (!planejamento) {
      return (
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6 text-center">
            <IconCalendarOff
              className="w-12 h-12 text-gray-400 mb-3"
              aria-hidden="true"
            />
            <div className="mb-1">
              <AIBadge variant="status" status="default" size="md">
                {bimestre}º Bimestre
              </AIBadge>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Planejamento não criado ainda
            </p>
            <Button
              onClick={() => onCreate?.(bimestre)}
              className="bg-tech-blue hover:bg-tech-blue/90"
              size="sm"
            >
              <IconPlus className="w-4 h-4 mr-2" aria-hidden="true" />
              Criar Planejamento
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Planejamento existente
    return (
      <Card
        role="article"
        aria-labelledby={`bimestre-${bimestre}-title`}
        className="transition-all duration-200 hover:shadow-md"
      >
        <CardHeader className="pb-3">
          {/* Header: Badge + Status Icon + Count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AIBadge variant="status" status="default" size="md">
                {bimestre}º Bimestre
              </AIBadge>
              <StatusIcon className={cn('w-5 h-5', statusColor)} aria-hidden="true" />
            </div>
            <span className="text-sm text-gray-500 font-inter">
              {planejamento.habilidades.length}{' '}
              {planejamento.habilidades.length === 1
                ? 'habilidade'
                : 'habilidades'}
            </span>
          </div>

          {/* Progresso visual */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-tech-blue transition-all duration-300"
              style={{ width: `${progresso}%` }}
              role="progressbar"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso do planejamento: ${progresso}%`}
            />
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleBimestre(expansionKey)}
            aria-expanded={isExpanded}
            aria-controls={`bimestre-${bimestre}-details`}
            className="flex items-center gap-2 text-sm text-tech-blue hover:text-tech-blue/80 mt-3 focus:outline-none focus:ring-2 focus:ring-tech-blue rounded px-2 py-1 -mx-2"
          >
            <span className="font-medium">
              {isExpanded ? 'Ocultar' : 'Ver'} detalhes
            </span>
            {isExpanded ? (
              <IconChevronUp
                className="w-4 h-4 transition-transform duration-300"
                aria-hidden="true"
              />
            ) : (
              <IconChevronDown
                className="w-4 h-4 transition-transform duration-300"
                aria-hidden="true"
              />
            )}
          </button>
        </CardHeader>

        {/* Expanded Content */}
        <div
          id={`bimestre-${bimestre}-details`}
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <CardContent className="pt-0 space-y-4">
            {/* Habilidades BNCC */}
            <div>
              <h3 className="text-sm font-montserrat font-medium text-gray-700 mb-2">
                Habilidades BNCC
              </h3>
              <HabilidadeBadgeList habilidades={planejamento.habilidades} />
            </div>

            {/* Metadados */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-3 border-t border-border">
              <span>
                📅 Ano Letivo: <strong>{planejamento.ano_letivo}</strong>
              </span>
              <span>
                {planejamento.validado_coordenacao ? '✅' : '⏳'} Validação:{' '}
                <strong>
                  {planejamento.validado_coordenacao
                    ? 'Aprovado'
                    : 'Pendente'}
                </strong>
              </span>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => onEdit?.(planejamento.id)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <IconPencil className="w-4 h-4 mr-2" aria-hidden="true" />
              Editar Planejamento
            </Button>
          </CardContent>
        </div>
      </Card>
    );
  }
);

TimelineBimestreCard.displayName = 'TimelineBimestreCard';
