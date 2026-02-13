import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, Cpu } from 'lucide-react';

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

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  AGUARDANDO_REVISAO: { label: 'Aguardando Revisão', variant: 'default' },
  ANALISADA: { label: 'Analisada', variant: 'secondary' },
  APROVADA: { label: 'Aprovada', variant: 'outline' },
  REJEITADA: { label: 'Rejeitada', variant: 'destructive' },
};

const SERIE_MAP: Record<string, string> = {
  SEXTO_ANO: '6º Ano',
  SETIMO_ANO: '7º Ano',
  OITAVO_ANO: '8º Ano',
  NONO_ANO: '9º Ano',
};

const DISCIPLINA_MAP: Record<string, string> = {
  MATEMATICA: 'Matemática',
  LINGUA_PORTUGUESA: 'Língua Portuguesa',
  CIENCIAS: 'Ciências',
  HISTORIA: 'História',
  GEOGRAFIA: 'Geografia',
};

export function AulaHeader({ aula, metadata }: AulaHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  const statusConfig = STATUS_MAP[aula.status] || { label: aula.status, variant: 'secondary' as const };
  const serie = SERIE_MAP[aula.turma.serie] || aula.turma.serie;
  const disciplina = DISCIPLINA_MAP[aula.turma.disciplina] || aula.turma.disciplina;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-montserrat font-bold text-deep-navy">{aula.titulo}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-deep-navy/70 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(aula.data_aula)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Turma {aula.turma.nome}
              </span>
              <Badge variant="outline" className="font-normal text-deep-navy/70">
                {serie} &middot; {disciplina}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-deep-navy/50 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(metadata.tempo_processamento_ms)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" />
              US$ {metadata.custo_total_usd.toFixed(3)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
