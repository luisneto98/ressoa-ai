import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, FileText, RotateCw, Trash2, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { TipoBadge } from './TipoBadge';
import { formatDate } from '@/lib/utils';
import type { AulaListItem } from '@/api/aulas';

interface AulasTableProps {
  aulas: AulaListItem[];
  onViewDetails: (id: string) => void;
  onReview: (id: string) => void;
  onReprocess: (id: string) => void;
  onDelete: (id: string) => void;
  onStartAnalise: (id: string) => void;
}

export const AulasTable = ({
  aulas,
  onViewDetails,
  onReview,
  onReprocess,
  onDelete,
  onStartAnalise,
}: AulasTableProps) => {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Data</TableHead>
            <TableHead scope="col">Turma</TableHead>
            <TableHead scope="col">Tipo</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aulas.map((aula) => (
            <TableRow key={aula.id}>
              <TableCell className="font-medium">
                {formatDate(aula.data)}
              </TableCell>
              <TableCell>{aula.turma_nome}</TableCell>
              <TableCell>
                <TipoBadge tipo={aula.tipo_entrada} />
              </TableCell>
              <TableCell>
                <StatusBadge status={aula.status_processamento} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Ações para aula ${aula.turma_nome} ${formatDate(aula.data)}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(aula.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>

                    {aula.status_processamento === 'TRANSCRITA' && (
                      <DropdownMenuItem onClick={() => onStartAnalise(aula.id)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Iniciar Análise
                      </DropdownMenuItem>
                    )}

                    {['ANALISADA', 'APROVADA'].includes(aula.status_processamento) && (
                      <DropdownMenuItem onClick={() => onReview(aula.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Revisar Relatório
                      </DropdownMenuItem>
                    )}

                    {aula.status_processamento === 'ERRO' && (
                      <DropdownMenuItem onClick={() => onReprocess(aula.id)}>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Reprocessar
                      </DropdownMenuItem>
                    )}

                    {['CRIADA', 'ERRO'].includes(aula.status_processamento) && (
                      <DropdownMenuItem
                        onClick={() => onDelete(aula.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
