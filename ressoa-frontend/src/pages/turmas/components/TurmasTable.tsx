import { IconEdit, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TipoEnsinoBadge } from './TipoEnsinoBadge';
import { CurriculoTipoBadge } from './CurriculoTipoBadge';
import { SERIE_LABELS, TURNO_LABELS } from '@/types/turma';
import type { Turma } from '@/types/turma';

/**
 * Table component for displaying turmas list
 * Story 10.4 - AC#2, #8, #9, #10
 * Story 11.5 - AC#6 (Curriculo Tipo Badge)
 *
 * Features:
 * - 9 columns: Nome, Currículo, Série, Tipo Ensino (badge), Disciplina, Ano Letivo, Turno, Professor, Ações
 * - Curriculo Tipo badge: BNCC (tech-blue) vs Custom (cyan-ai)
 * - Edit and Delete action buttons
 * - Hover states
 * - Responsive (handled by parent/CSS)
 * - Accessibility: aria-labels, touch targets 44px
 */

interface TurmasTableProps {
  turmas: Turma[];
  onEdit: (turma: Turma) => void;
  onDelete: (turma: Turma) => void;
}

export function TurmasTable({ turmas, onEdit, onDelete }: TurmasTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-heading font-semibold text-deep-navy">Nome</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Currículo</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Série</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Tipo Ensino</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Disciplina</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Ano Letivo</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Turno</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy">Professor</TableHead>
            <TableHead className="font-heading font-semibold text-deep-navy text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {turmas.map((turma) => (
            <TableRow
              key={turma.id}
              className="hover:bg-ghost-white/50 transition-colors"
            >
              <TableCell className="font-medium text-deep-navy">{turma.nome}</TableCell>
              <TableCell>
                <CurriculoTipoBadge tipo={turma.curriculo_tipo ?? 'BNCC'} />
              </TableCell>
              <TableCell className="text-gray-700">{SERIE_LABELS[turma.serie]}</TableCell>
              <TableCell>
                <TipoEnsinoBadge tipo_ensino={turma.tipo_ensino} />
              </TableCell>
              <TableCell className="text-gray-700">{turma.disciplina}</TableCell>
              <TableCell className="text-gray-700">{turma.ano_letivo}</TableCell>
              <TableCell className="text-gray-700">{TURNO_LABELS[turma.turno]}</TableCell>
              <TableCell className="text-gray-700">
                {turma.professor?.nome ?? '—'}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(turma)}
                    aria-label={`Editar turma ${turma.nome}`}
                    className="h-11 w-11 text-tech-blue hover:text-tech-blue hover:bg-tech-blue/10 focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                  >
                    <IconEdit size={18} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(turma)}
                    aria-label={`Deletar turma ${turma.nome}`}
                    className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  >
                    <IconTrash size={18} aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
