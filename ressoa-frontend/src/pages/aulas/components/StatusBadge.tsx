import { AIBadge } from '@/components/ui/ai-badge';
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
  /** AIBadge variant - 'processing' for animated states, 'status' for others */
  variant: 'status' | 'processing';
  /** AIBadge status color - only applies when variant="status" */
  statusColor?: 'default' | 'success' | 'warning' | 'error';
  /** Custom classes for special cases */
  customClasses?: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}> = {
  CRIADA: {
    label: 'Criada',
    variant: 'status',
    statusColor: 'default', // Gray
    icon: IconCircle,
    tooltip: 'Aula criada, aguardando upload ou entrada de dados',
  },
  UPLOAD_PROGRESSO: {
    label: 'Enviando...',
    variant: 'processing', // Animated with pulse
    customClasses: 'bg-tech-blue text-white',
    icon: IconRefresh,
    tooltip: 'Upload de áudio em progresso',
  },
  AGUARDANDO_TRANSCRICAO: {
    label: 'Aguardando transcrição',
    variant: 'status',
    statusColor: 'warning', // Yellow/Amber
    icon: IconClock,
    tooltip: 'Áudio enviado, aguardando transcrição',
  },
  TRANSCRITA: {
    label: 'Transcrita',
    variant: 'status',
    customClasses: 'bg-tech-blue text-white', // Tech Blue
    icon: IconFileText,
    tooltip: 'Transcrição completa, aguardando análise',
  },
  ANALISANDO: {
    label: 'Analisando...',
    variant: 'processing', // Animated with pulse
    customClasses: 'bg-tech-blue text-white',
    icon: IconRefresh,
    tooltip: 'Análise pedagógica em andamento',
  },
  ANALISADA: {
    label: 'Pronta para revisão',
    variant: 'status',
    statusColor: 'warning', // Amber (awaiting approval)
    icon: IconCircleCheck,
    tooltip: 'Análise completa, pronta para sua revisão',
  },
  APROVADA: {
    label: 'Aprovada',
    variant: 'status',
    statusColor: 'success', // Green
    customClasses: 'bg-green-600 text-white font-semibold',
    icon: IconCheck,
    tooltip: 'Aula aprovada e finalizada',
  },
  REJEITADA: {
    label: 'Rejeitada',
    variant: 'status',
    statusColor: 'error',
    icon: IconCircleX,
    tooltip: 'Aula rejeitada, requer reprocessamento',
  },
  ERRO: {
    label: 'Erro',
    variant: 'status',
    customClasses: 'bg-focus-orange text-white', // Focus Orange (not red!)
    icon: IconAlertTriangle,
    tooltip: 'Erro no processamento, clique para reprocessar',
  },
};

// Fallback for unknown status
const UNKNOWN_STATUS_CONFIG = {
  label: 'Desconhecido',
  variant: 'status' as const,
  statusColor: 'default' as const,
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
          <AIBadge
            variant={config.variant}
            status={config.statusColor}
            className={config.customClasses}
            role="status"
            aria-live={config.variant === 'processing' ? 'polite' : undefined}
          >
            <IconComponent className="size-4 mr-1" />
            {config.label}
          </AIBadge>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
