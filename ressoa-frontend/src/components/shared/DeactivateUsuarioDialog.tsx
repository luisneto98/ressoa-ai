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
import { useDeactivateUsuario } from '@/hooks/useUsuarios';

interface DeactivateUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: { id: string; nome: string };
}

export function DeactivateUsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: DeactivateUsuarioDialogProps) {
  const { mutateAsync, isPending } = useDeactivateUsuario();

  const handleConfirm = async () => {
    try {
      await mutateAsync(usuario.id);
      toast.success('Usuário desativado com sucesso');
      onOpenChange(false);
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;

      if (status === 403) {
        toast.error('Sem permissão para desativar este usuário');
      } else if (status === 404) {
        toast.error('Usuário não encontrado');
      } else if (status === 409) {
        toast.error('Usuário já está desativado');
      } else {
        toast.error('Erro ao desativar usuário. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Desativar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desativar <strong>{usuario.nome}</strong>? O
            usuário perderá acesso ao sistema.
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Desativando...
              </>
            ) : (
              'Desativar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
