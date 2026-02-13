import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconSchool, IconCertificate } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { CurriculoTipo, CURRICULO_TIPO_LABELS, CURRICULO_TIPO_DESCRIPTIONS } from '@/types/turma';

/**
 * Badge component for displaying curriculo tipo (BNCC vs Custom)
 * Story 11.5 - AC#6
 *
 * Features:
 * - Visual distinction: Tech Blue (BNCC) vs Cyan AI (Custom)
 * - Icons: School (BNCC) vs Certificate (Custom)
 * - Tooltip with full description
 * - Accessible with aria-labels
 */

interface CurriculoTipoBadgeProps {
  tipo?: CurriculoTipo;
  className?: string;
}

export function CurriculoTipoBadge({ tipo = 'BNCC', className }: CurriculoTipoBadgeProps) {
  const config = {
    BNCC: {
      icon: IconSchool,
      label: CURRICULO_TIPO_LABELS.BNCC,
      description: CURRICULO_TIPO_DESCRIPTIONS.BNCC,
      bgColor: 'bg-tech-blue/10',
      borderColor: 'border-tech-blue',
      textColor: 'text-tech-blue',
      ariaLabel: 'Turma de currículo BNCC',
    },
    CUSTOM: {
      icon: IconCertificate,
      label: CURRICULO_TIPO_LABELS.CUSTOM,
      description: CURRICULO_TIPO_DESCRIPTIONS.CUSTOM,
      bgColor: 'bg-cyan-ai/10',
      borderColor: 'border-cyan-ai',
      textColor: 'text-cyan-ai',
      ariaLabel: 'Turma de curso customizado',
    },
  }[tipo];

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5',
              config.bgColor,
              config.borderColor,
              config.textColor,
              className
            )}
            aria-label={config.ariaLabel}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span className="font-medium text-xs">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
