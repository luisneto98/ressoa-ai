import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CriteriosEvidenciaCollapseProps {
  criterios: string[];
  criterios_atendidos: string[];
}

/**
 * Collapsible component to display evidence criteria for custom objectives
 * Story 11.9 AC4
 *
 * @param criterios - All criteria defined in planning
 * @param criterios_atendidos - Criteria that were met according to AI analysis
 */
export function CriteriosEvidenciaCollapse({
  criterios,
  criterios_atendidos,
}: CriteriosEvidenciaCollapseProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!criterios || criterios.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-700 hover:text-deep-navy transition-colors">
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
        <span className="font-medium">Ver Critérios de Evidência</span>
        <span className="text-xs text-gray-500">
          ({criterios_atendidos?.length || 0}/{criterios.length} atendidos)
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
        <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
          {criterios.map((criterio, idx) => {
            const isAtendido = criterios_atendidos?.includes(criterio);

            return (
              <div key={idx} className="flex items-start gap-2.5">
                {isAtendido ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm leading-relaxed',
                    isAtendido ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {criterio}
                </span>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
