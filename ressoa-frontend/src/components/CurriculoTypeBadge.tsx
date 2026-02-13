import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CurriculoTypeBadgeProps {
  curriculo_tipo: 'BNCC' | 'CUSTOM';
}

/**
 * Badge component for displaying curriculum type
 * - BNCC: Blue badge (#2563EB - Tech Blue)
 * - CUSTOM: Purple badge (#9333EA)
 *
 * Story 11.8 AC2: Visual indicator of curriculum type in turma cards
 */
export function CurriculoTypeBadge({ curriculo_tipo }: CurriculoTypeBadgeProps) {
  const badgeConfig = {
    BNCC: {
      label: 'BNCC',
      className: 'bg-tech-blue text-white hover:bg-tech-blue',
      tooltip: 'Baseado em habilidades da Base Nacional Comum Curricular',
    },
    CUSTOM: {
      label: 'Curso Customizado',
      className: 'bg-purple-600 text-white hover:bg-purple-600',
      tooltip: 'Baseado em objetivos customizados',
    },
  };

  const config = badgeConfig[curriculo_tipo];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={config.className}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
