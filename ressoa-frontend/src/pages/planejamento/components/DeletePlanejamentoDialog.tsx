import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Planejamento } from '../hooks/usePlanejamentos';
import { useDeletePlanejamento } from '../hooks/useDeletePlanejamento';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeletePlanejamentoDialogProps {
  planejamento: Planejamento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeletePlanejamentoDialog = ({
  planejamento,
  open,
  onOpenChange,
}: DeletePlanejamentoDialogProps) => {
  const deleteMutation = useDeletePlanejamento();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(planejamento.id);
      toast.success('Planejamento excluído com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      const message = error.message || 'Erro ao excluir planejamento';
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir planejamento?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Esta ação não pode ser desfeita. Tem certeza?</p>
            <p className="text-sm">
              <strong>Planejamento:</strong> {planejamento.turma.nome} - Bimestre{' '}
              {planejamento.bimestre}/{planejamento.ano_letivo}
            </p>
            {/* Warning if there might be linked classes (we don't have this data in list, but backend will validate) */}
            <p className="text-orange-600 text-sm flex items-center gap-2">
              <IconAlertTriangle className="size-4 flex-shrink-0" />
              Se houver aulas vinculadas a este planejamento, a exclusão falhará.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
