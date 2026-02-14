import { AIBadge } from '@/components/ui/ai-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Habilidade {
  habilidade_id: string;
  habilidade: {
    codigo: string;
    descricao: string;
  };
  peso?: number;
  aulas_previstas?: number;
}

interface HabilidadeBadgeListProps {
  habilidades: Habilidade[];
}

/**
 * HabilidadeBadgeList - Lista de badges de habilidades BNCC
 *
 * Renderiza habilidades como AIBadge variant="skill" com tooltips descritivos.
 * Usado em timeline de planejamentos para visualização rápida de cobertura curricular.
 *
 * Accessibility:
 * - role="list" com role="listitem" para screen readers
 * - Tooltips com descrição completa da habilidade
 * - ARIA labels descritivos
 *
 * @param habilidades - Array de habilidades vinculadas ao planejamento
 *
 * @example
 * <HabilidadeBadgeList habilidades={planejamento.habilidades} />
 */
export function HabilidadeBadgeList({ habilidades }: HabilidadeBadgeListProps) {
  if (habilidades.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Nenhuma habilidade planejada
      </p>
    );
  }

  return (
    <TooltipProvider>
      <ul role="list" className="flex flex-wrap gap-2">
        {habilidades.map((h) => (
          <li key={h.habilidade_id} role="listitem">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <AIBadge
                    variant="skill"
                    size="sm"
                    className="cursor-help transition-transform hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-tech-blue focus:outline-none"
                  >
                    {h.habilidade.codigo}
                  </AIBadge>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-sm mb-1">
                  {h.habilidade.codigo}
                </p>
                <p className="text-xs text-gray-300 mb-2">
                  {h.habilidade.descricao}
                </p>
                {(h.aulas_previstas || h.peso) && (
                  <div className="flex gap-3 text-xs text-gray-400 pt-2 border-t border-gray-700">
                    {h.aulas_previstas && (
                      <span>📚 {h.aulas_previstas} aulas previstas</span>
                    )}
                    {h.peso && (
                      <span>
                        ⚖️ Peso{' '}
                        {h.peso === 1
                          ? 'Baixo'
                          : h.peso === 2
                          ? 'Médio'
                          : 'Alto'}
                      </span>
                    )}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
    </TooltipProvider>
  );
}
