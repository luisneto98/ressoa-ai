import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { IconLoader2 } from '@tabler/icons-react';
import type { Turma } from '@/types/turma';

/**
 * Confirmation dialog for deleting a turma
 * Story 10.4 - AC#9
 *
 * Features:
 * - Displays turma name in confirmation message
 * - Warning about soft delete (data preserved)
 * - Cancel (ghost button) and Delete (destructive button)
 * - Loading state during deletion
 * - Closes on ESC (Radix UI native)
 */

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turma: Turma | null;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  turma,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!turma) return;

    setIsDeleting(true);
    try {
      await onConfirm(turma.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const loading = isLoading || isDeleting;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-deep-navy font-semibold">
            Deletar turma?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            {turma && (
              <>
                Deletar turma <strong className="text-gray-900">&quot;{turma.nome}&quot;</strong>?
                <br />
                <br />
                Planejamentos e aulas serão preservados, mas a turma ficará inativa.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-tech-blue hover:text-tech-blue/80 hover:bg-tech-blue/10"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Deletar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
