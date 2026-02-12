import { Badge } from '@/components/ui/badge';

type TipoEntrada = 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';

const tipoConfig: Record<TipoEntrada, {
  label: string;
  color: string;
  icon: string;
}> = {
  AUDIO: {
    label: 'Áudio',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '🎵',
  },
  TRANSCRICAO: {
    label: 'Transcrição',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '📝',
  },
  MANUAL: {
    label: 'Manual',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: '✍️',
  },
};

interface TipoBadgeProps {
  tipo: TipoEntrada;
}

export const TipoBadge = ({ tipo }: TipoBadgeProps) => {
  const config = tipoConfig[tipo];

  return (
    <Badge variant="outline" className={config.color}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
};
