import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Turma {
  turma_id: string;
  turma_nome: string;
  turma_serie: string;
  disciplina: string;
  bimestre: number;
  percentual_cobertura: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  total_aulas_aprovadas: number;
}

interface Props {
  turmas: Turma[];
}

export function TurmasTable({ turmas }: Props) {
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
          <TableHead>Turma</TableHead>
          <TableHead>Série</TableHead>
          <TableHead>Habilidades Planejadas</TableHead>
          <TableHead>Habilidades Trabalhadas</TableHead>
          <TableHead>% Cobertura</TableHead>
          <TableHead>Aulas Aprovadas</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {turmas.map((turma) => (
          <TableRow key={turma.turma_id}>
            <TableCell className="font-semibold">{turma.turma_nome}</TableCell>
            <TableCell>{turma.turma_serie.replace('_', ' ')}</TableCell>
            <TableCell>{turma.habilidades_planejadas}</TableCell>
            <TableCell>{turma.habilidades_trabalhadas}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Progress
                  value={Number(turma.percentual_cobertura)}
                  className="w-24"
                />
                <span className="font-semibold">
                  {Number(turma.percentual_cobertura).toFixed(1)}%
                </span>
              </div>
            </TableCell>
            <TableCell>{turma.total_aulas_aprovadas}</TableCell>
            <TableCell>
              {getStatusBadge(Number(turma.percentual_cobertura))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
