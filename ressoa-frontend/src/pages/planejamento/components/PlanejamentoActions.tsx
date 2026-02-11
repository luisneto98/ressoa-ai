import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { ViewPlanejamentoDialog } from './ViewPlanejamentoDialog';
import { DeletePlanejamentoDialog } from './DeletePlanejamentoDialog';
import { CopyPlanejamentoDialog } from './CopyPlanejamentoDialog';

interface PlanejamentoActionsProps {
  planejamento: Planejamento;
}

export const PlanejamentoActions = ({ planejamento }: PlanejamentoActionsProps) => {
  const navigate = useNavigate();
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Visualizar planejamento de ${planejamento.turma.nome} bimestre ${planejamento.bimestre}`}
        onClick={() => setViewOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Editar planejamento de ${planejamento.turma.nome} bimestre ${planejamento.bimestre}`}
        onClick={() => navigate(`/planejamentos/${planejamento.id}/editar`)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Copiar planejamento de ${planejamento.turma.nome} bimestre ${planejamento.bimestre}`}
        onClick={() => setCopyOpen(true)}
      >
        <Copy className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Excluir planejamento de ${planejamento.turma.nome} bimestre ${planejamento.bimestre}`}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {/* Dialogs */}
      <ViewPlanejamentoDialog
        planejamento={planejamento}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <DeletePlanejamentoDialog
        planejamento={planejamento}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <CopyPlanejamentoDialog
        planejamento={planejamento}
        open={copyOpen}
        onOpenChange={setCopyOpen}
      />
    </div>
  );
};
