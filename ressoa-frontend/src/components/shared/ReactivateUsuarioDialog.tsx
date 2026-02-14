import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { IconLoader2 } from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReactivateUsuario } from '@/hooks/useUsuarios';

interface ReactivateUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: { id: string; nome: string };
}

export function ReactivateUsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: ReactivateUsuarioDialogProps) {
  const { mutateAsync, isPending } = useReactivateUsuario();

  const handleConfirm = async () => {
    try {
      await mutateAsync(usuario.id);
      toast.success('Usuário reativado com sucesso');
      onOpenChange(false);
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;

      if (status === 403) {
        toast.error('Sem permissão para reativar este usuário');
      } else if (status === 404) {
        toast.error('Usuário não encontrado');
      } else if (status === 409) {
        toast.error('Usuário já está ativo');
      } else {
        toast.error('Erro ao reativar usuário. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Reativar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja reativar <strong>{usuario.nome}</strong>? O
            usuário terá acesso ao sistema restaurado.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-h-[44px]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Reativando...
              </>
            ) : (
              'Reativar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
