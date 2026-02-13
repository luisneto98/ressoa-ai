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

interface CoberturaItem {
  turma_id: string;
  turma_nome: string;
  disciplina: string;
  bimestre: number;
  habilidades_planejadas: number;
  habilidades_trabalhadas: number;
  percentual_cobertura: number;
}

interface CoberturaTableProps {
  cobertura: CoberturaItem[];
}

export function CoberturaTable({ cobertura }: CoberturaTableProps) {
  const getStatusBadge = (percentual: number) => {
    if (percentual >= 70) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          No Ritmo
        </Badge>
      );
    } else if (percentual >= 50) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Atenção
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Atraso</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Turma</TableHead>
          <TableHead className="text-center">Habilidades Planejadas</TableHead>
          <TableHead className="text-center">
            Habilidades Trabalhadas
          </TableHead>
          <TableHead>% Cobertura</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cobertura.map((c) => (
          <TableRow key={c.turma_id}>
            <TableCell className="font-semibold text-deep-navy">
              {c.turma_nome}
            </TableCell>
            <TableCell className="text-center text-deep-navy/80">
              {c.habilidades_planejadas}
            </TableCell>
            <TableCell className="text-center text-deep-navy/80">
              {c.habilidades_trabalhadas}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Progress
                  value={Number(c.percentual_cobertura)}
                  className="w-32 h-2"
                />
                <span className="font-semibold text-deep-navy min-w-[60px] text-right">
                  {Number(c.percentual_cobertura).toFixed(1)}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {getStatusBadge(Number(c.percentual_cobertura))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
