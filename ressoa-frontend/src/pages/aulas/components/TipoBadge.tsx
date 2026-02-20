import { Badge } from '@/components/ui/badge';
import { IconMusic, IconFileText, IconPencil, IconClock } from '@tabler/icons-react';

type TipoEntrada = 'AUDIO' | 'TRANSCRICAO' | 'MANUAL' | null;

const tipoConfig: Record<string, {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  AUDIO: {
    label: 'Áudio',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: IconMusic,
  },
  TRANSCRICAO: {
    label: 'Transcrição',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: IconFileText,
  },
  MANUAL: {
    label: 'Manual',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: IconPencil,
  },
  RASCUNHO: {
    label: 'Rascunho',
    color: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: IconClock,
  },
};

interface TipoBadgeProps {
  tipo: TipoEntrada;
}

export const TipoBadge = ({ tipo }: TipoBadgeProps) => {
  const config = tipoConfig[tipo ?? 'RASCUNHO'];
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={config.color}>
      <IconComponent className="size-4 mr-1" />
      {config.label}
    </Badge>
  );
};
