import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StatusProcessamento } from '@/api/aulas';

const statusConfig: Record<StatusProcessamento, {
  label: string;
  color: string;
  icon: string;
  animated?: boolean;
  tooltip: string;
}> = {
  CRIADA: {
    label: 'Criada',
    color: 'bg-gray-100 text-gray-800',
    icon: '⚪',
    tooltip: 'Aula criada, aguardando upload ou entrada de dados',
  },
  UPLOAD_PROGRESSO: {
    label: 'Enviando...',
    color: 'bg-blue-100 text-blue-800',
    icon: '🔄',
    animated: true,
    tooltip: 'Upload de áudio em progresso',
  },
  AGUARDANDO_TRANSCRICAO: {
    label: 'Aguardando transcrição',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
    tooltip: 'Áudio enviado, aguardando transcrição',
  },
  TRANSCRITA: {
    label: 'Transcrita',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '📄',
    tooltip: 'Transcrição completa, aguardando análise',
  },
  ANALISANDO: {
    label: 'Analisando...',
    color: 'bg-purple-100 text-purple-800',
    icon: '🔄',
    animated: true,
    tooltip: 'Análise pedagógica em andamento',
  },
  ANALISADA: {
    label: 'Pronta para revisão',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    tooltip: 'Análise completa, pronta para sua revisão',
  },
  APROVADA: {
    label: 'Aprovada',
    color: 'bg-green-600 text-white',
    icon: '✔️',
    tooltip: 'Aula aprovada e finalizada',
  },
  REJEITADA: {
    label: 'Rejeitada',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    tooltip: 'Aula rejeitada, requer reprocessamento',
  },
  ERRO: {
    label: 'Erro',
    color: 'bg-red-600 text-white',
    icon: '⚠️',
    tooltip: 'Erro no processamento, clique para reprocessar',
  },
};

// Fallback for unknown status
const UNKNOWN_STATUS_CONFIG = {
  label: 'Desconhecido',
  color: 'bg-gray-200 text-gray-700',
  icon: '❓',
  tooltip: 'Status desconhecido - entre em contato com o suporte',
};

interface StatusBadgeProps {
  status: StatusProcessamento;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || UNKNOWN_STATUS_CONFIG;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} ${config.animated ? 'animate-pulse' : ''}`}>
            <span className="mr-1">{config.icon}</span>
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
