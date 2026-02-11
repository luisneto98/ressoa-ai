import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Clock } from 'lucide-react';

interface StatusBadgeProps {
  validado: boolean;
}

export const StatusBadge = ({ validado }: StatusBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {validado ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Validado
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1">
              <Clock className="h-3 w-3" />
              Aguardando validação
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {validado
              ? 'Planejamento validado pela coordenação'
              : 'Aguardando validação da coordenação (não bloqueia uso)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
