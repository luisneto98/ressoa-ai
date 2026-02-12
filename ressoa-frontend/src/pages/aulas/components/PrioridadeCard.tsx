import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, TrendingUp, Check } from 'lucide-react';

interface PrioridadeCardProps {
  prioridade: {
    tipo: 'gap_curricular' | 'reforco' | 'avanco';
    habilidade_bncc: string;
    descricao: string;
    justificativa: string;
    recursos_sugeridos: string[];
  };
}

export function PrioridadeCard({ prioridade }: PrioridadeCardProps) {
  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'gap_curricular':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          badge: { variant: 'destructive' as const, label: 'Gap Curricular' },
          borderColor: 'border-orange-300',
        };
      case 'reforco':
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          badge: { variant: 'default' as const, label: 'Reforço' },
          borderColor: 'border-blue-300',
        };
      case 'avanco':
        return {
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
          badge: { variant: 'secondary' as const, label: 'Avançar' },
          borderColor: 'border-green-300',
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          badge: { variant: 'outline' as const, label: 'Outro' },
          borderColor: 'border-gray-300',
        };
    }
  };

  const config = getTipoConfig(prioridade.tipo);

  return (
    <div className={`border rounded-lg p-4 bg-white ${config.borderColor}`}>
      {/* Header com ícone, badges */}
      <div className="flex items-center gap-3 mb-3">
        {config.icon}
        <Badge variant={config.badge.variant}>{config.badge.label}</Badge>
        <Badge variant="outline" className="text-xs">
          {prioridade.habilidade_bncc}
        </Badge>
      </div>

      {/* Descrição */}
      <h4 className="font-semibold text-gray-900 mb-2">{prioridade.descricao}</h4>
      <p className="text-sm text-gray-600 mb-3">{prioridade.justificativa}</p>

      {/* Recursos Sugeridos */}
      {prioridade.recursos_sugeridos && prioridade.recursos_sugeridos.length > 0 && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Recursos Sugeridos:</p>
          <ul className="text-sm space-y-1">
            {prioridade.recursos_sugeridos.map((recurso, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{recurso}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
