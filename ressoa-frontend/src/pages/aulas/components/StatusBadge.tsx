import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StatusProcessamento } from '@/api/aulas';
import {
  IconCircle,
  IconRefresh,
  IconClock,
  IconFileText,
  IconCircleCheck,
  IconCheck,
  IconCircleX,
  IconAlertTriangle,
  IconHelp,
} from '@tabler/icons-react';

const statusConfig: Record<StatusProcessamento, {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  animated?: boolean;
  tooltip: string;
}> = {
  CRIADA: {
    label: 'Criada',
    color: 'bg-gray-100 text-gray-800',
    icon: IconCircle,
    tooltip: 'Aula criada, aguardando upload ou entrada de dados',
  },
  UPLOAD_PROGRESSO: {
    label: 'Enviando...',
    color: 'bg-blue-100 text-blue-800',
    icon: IconRefresh,
    animated: true,
    tooltip: 'Upload de áudio em progresso',
  },
  AGUARDANDO_TRANSCRICAO: {
    label: 'Aguardando transcrição',
    color: 'bg-yellow-100 text-yellow-800',
    icon: IconClock,
    tooltip: 'Áudio enviado, aguardando transcrição',
  },
  TRANSCRITA: {
    label: 'Transcrita',
    color: 'bg-cyan-100 text-cyan-800',
    icon: IconFileText,
    tooltip: 'Transcrição completa, aguardando análise',
  },
  ANALISANDO: {
    label: 'Analisando...',
    color: 'bg-purple-100 text-purple-800',
    icon: IconRefresh,
    animated: true,
    tooltip: 'Análise pedagógica em andamento',
  },
  ANALISADA: {
    label: 'Pronta para revisão',
    color: 'bg-green-100 text-green-800',
    icon: IconCircleCheck,
    tooltip: 'Análise completa, pronta para sua revisão',
  },
  APROVADA: {
    label: 'Aprovada',
    color: 'bg-green-600 text-white',
    icon: IconCheck,
    tooltip: 'Aula aprovada e finalizada',
  },
  REJEITADA: {
    label: 'Rejeitada',
    color: 'bg-red-100 text-red-800',
    icon: IconCircleX,
    tooltip: 'Aula rejeitada, requer reprocessamento',
  },
  ERRO: {
    label: 'Erro',
    color: 'bg-red-600 text-white',
    icon: IconAlertTriangle,
    tooltip: 'Erro no processamento, clique para reprocessar',
  },
};

// Fallback for unknown status
const UNKNOWN_STATUS_CONFIG = {
  label: 'Desconhecido',
  color: 'bg-gray-200 text-gray-700',
  icon: IconHelp,
  tooltip: 'Status desconhecido - entre em contato com o suporte',
};

interface StatusBadgeProps {
  status: StatusProcessamento;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || UNKNOWN_STATUS_CONFIG;
  const IconComponent = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} ${config.animated ? 'animate-pulse' : ''}`}>
            <IconComponent className="size-4 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
