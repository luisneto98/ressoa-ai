import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricasProfessor {
  professor_id: string;
  professor_nome: string;
  disciplina: string;
  total_turmas: number;
  media_cobertura: number;
  total_habilidades_planejadas: number;
  total_habilidades_trabalhadas: number;
  total_aulas: number;
  tempo_medio_revisao: number;
}

interface Props {
  metricas: MetricasProfessor[];
}

export function ProfessoresTable({ metricas }: Props) {
  const navigate = useNavigate();

  if (metricas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum professor encontrado para os filtros selecionados.
        </p>
      </div>
    );
  }

  const formatTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${minutos}min ${secs}s`;
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 70) {
      return <Badge className="bg-green-100 text-green-800">No Ritmo</Badge>;
    } else if (percentual >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    } else {
      return <Badge variant="destructive">Atraso</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ranking</TableHead>
          <TableHead>Professor</TableHead>
          <TableHead>Turmas</TableHead>
          <TableHead>Aulas Aprovadas</TableHead>
          <TableHead>% Cobertura Média</TableHead>
          <TableHead>Tempo Médio Revisão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metricas.map((prof, idx) => (
          <TableRow
            key={prof.professor_id}
            className="cursor-pointer hover:bg-gray-50"
          >
            <TableCell>
              <div className="flex items-center gap-2">
                {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                <span className="font-semibold">#{idx + 1}</span>
              </div>
            </TableCell>
            <TableCell className="font-semibold">
              {prof.professor_nome}
            </TableCell>
            <TableCell>{prof.total_turmas}</TableCell>
            <TableCell>{prof.total_aulas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Progress
                  value={Number(prof.media_cobertura)}
                  className="w-24"
                />
                <span className="font-semibold">
                  {Number(prof.media_cobertura).toFixed(1)}%
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  'font-semibold',
                  Number(prof.tempo_medio_revisao) < 300 && 'text-green-600', // <5min = verde
                  Number(prof.tempo_medio_revisao) >= 300 &&
                    Number(prof.tempo_medio_revisao) < 600 &&
                    'text-yellow-600',
                  Number(prof.tempo_medio_revisao) >= 600 && 'text-red-600', // >10min = vermelho
                )}
              >
                {formatTempo(Number(prof.tempo_medio_revisao))}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(Number(prof.media_cobertura))}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/dashboard/coordenador/professores/${prof.professor_id}/turmas`,
                  )
                }
              >
                Ver Turmas
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
