import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, TrendingUp } from 'lucide-react';

interface AulaHeaderProps {
  aula: {
    titulo: string;
    data_aula: string;
    turma: {
      nome: string;
      serie: string;
      disciplina: string;
    };
    status: string;
  };
  metadata: {
    tempo_processamento_ms: number;
    custo_total_usd: number;
    created_at: string;
  };
}

export function AulaHeader({ aula, metadata }: AulaHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{aula.titulo}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(aula.data_aula)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{aula.turma.nome}</span>
              </div>
              <Badge variant="secondary">
                {aula.turma.serie} - {aula.turma.disciplina}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={aula.status === 'ANALISADA' ? 'default' : 'secondary'}
            >
              {aula.status}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Processado em {formatDuration(metadata.tempo_processamento_ms)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>Custo: ${metadata.custo_total_usd.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
