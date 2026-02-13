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
import { CurriculoTypeBadge } from '@/components/CurriculoTypeBadge';
import { getItensPlanejadasLabel, getItensTrabalhadasLabel } from '@/lib/cobertura-helpers';

interface CoberturaItem {
  turma_id: string;
  turma_nome: string;
  curriculo_tipo: 'BNCC' | 'CUSTOM'; // Story 11.8: Curriculum type
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

  // Story 11.8 AC3 Fix: Determine if table has mixed types or single type
  const hasMixedTypes = cobertura.length > 1 &&
    cobertura.some(c => c.curriculo_tipo === 'BNCC') &&
    cobertura.some(c => c.curriculo_tipo === 'CUSTOM');

  // Use generic labels for mixed, specific labels for single type
  const planejadasLabel = hasMixedTypes
    ? 'Objetivos Planejados'
    : getItensPlanejadasLabel(cobertura[0]?.curriculo_tipo);
  const trabalhadasLabel = hasMixedTypes
    ? 'Objetivos Trabalhados'
    : getItensTrabalhadasLabel(cobertura[0]?.curriculo_tipo);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Turma</TableHead>
          <TableHead className="text-center">{planejadasLabel}</TableHead>
          <TableHead className="text-center">
            {trabalhadasLabel}
          </TableHead>
          <TableHead>% Cobertura</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cobertura.map((c) => (
          <TableRow key={c.turma_id}>
            <TableCell>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-deep-navy">{c.turma_nome}</span>
                <CurriculoTypeBadge curriculo_tipo={c.curriculo_tipo} />
              </div>
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
