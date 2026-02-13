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

interface DeleteObjetivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objetivoCodigo: string;
  onConfirm: () => void;
}

/**
 * Dialog de confirmação para remoção de objetivo
 *
 * @param open - Estado de abertura do dialog
 * @param onOpenChange - Callback para mudança de estado
 * @param objetivoCodigo - Código do objetivo a ser removido
 * @param onConfirm - Callback de confirmação
 */
export function DeleteObjetivoDialog({
  open,
  onOpenChange,
  objetivoCodigo,
  onConfirm,
}: DeleteObjetivoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Objetivo</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o objetivo <strong>{objetivoCodigo}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
