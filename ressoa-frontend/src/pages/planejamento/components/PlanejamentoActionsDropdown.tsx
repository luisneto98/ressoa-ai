import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Copy, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { ViewPlanejamentoDialog } from './ViewPlanejamentoDialog';
import { DeletePlanejamentoDialog } from './DeletePlanejamentoDialog';
import { CopyPlanejamentoDialog } from './CopyPlanejamentoDialog';

interface PlanejamentoActionsDropdownProps {
  planejamento: Planejamento;
}

export const PlanejamentoActionsDropdown = ({
  planejamento,
}: PlanejamentoActionsDropdownProps) => {
  const navigate = useNavigate();
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <MoreVertical className="h-4 w-4 mr-2" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/planejamentos/${planejamento.id}/editar`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCopyOpen(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
};
