import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Loading skeleton for TurmasTable
 * Story 10.4 - AC#12
 *
 * Displays 5 skeleton rows with same height as real table rows
 * Columns: Nome, Série, Tipo Ensino, Disciplina, Ano Letivo, Turno, Qtd Alunos, Ações
 */

export function TurmasTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Série</TableHead>
          <TableHead>Tipo Ensino</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Ano Letivo</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead className="text-center">Qtd Alunos</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="h-12">
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="h-4 w-8 mx-auto" />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
