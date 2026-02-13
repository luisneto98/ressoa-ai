import { Badge } from '@/components/ui/badge';
import { IconMusic, IconFileText, IconPencil } from '@tabler/icons-react';

type TipoEntrada = 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';

const tipoConfig: Record<TipoEntrada, {
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
};

interface TipoBadgeProps {
  tipo: TipoEntrada;
}

export const TipoBadge = ({ tipo }: TipoBadgeProps) => {
  const config = tipoConfig[tipo];
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={config.color}>
      <IconComponent className="size-4 mr-1" />
      {config.label}
    </Badge>
  );
};
