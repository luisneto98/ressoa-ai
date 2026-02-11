import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { StatusBadge } from './StatusBadge';
import { PlanejamentoActions } from './PlanejamentoActions';

interface PlanejamentosTableProps {
  planejamentos: Planejamento[];
}

export const PlanejamentosTable = ({ planejamentos }: PlanejamentosTableProps) => {
  return (
    <Table aria-label="Lista de planejamentos cadastrados">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Turma</TableHead>
          <TableHead scope="col">Bimestre</TableHead>
          <TableHead scope="col">Ano Letivo</TableHead>
          <TableHead scope="col">Habilidades</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {planejamentos.map((planejamento) => (
          <TableRow key={planejamento.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{planejamento.turma.nome}</span>
                <span className="text-sm text-muted-foreground">
                  {planejamento.turma.disciplina} - {planejamento.turma.serie}º ano
                </span>
              </div>
            </TableCell>
            <TableCell>{planejamento.bimestre}</TableCell>
            <TableCell>{planejamento.ano_letivo}</TableCell>
            <TableCell>{planejamento.habilidades.length}</TableCell>
            <TableCell>
              <StatusBadge validado={planejamento.validado_coordenacao} />
            </TableCell>
            <TableCell>
              <PlanejamentoActions planejamento={planejamento} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
