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
import { useReenviarConvite } from '@/hooks/useConvites';

interface ReenviarConviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convite: { id: string; email: string };
}

export function ReenviarConviteDialog({
  open,
  onOpenChange,
  convite,
}: ReenviarConviteDialogProps) {
  const { mutateAsync, isPending } = useReenviarConvite();

  const handleConfirm = async () => {
    try {
      await mutateAsync(convite.id);
      toast.success(`Convite reenviado para ${convite.email}`);
      onOpenChange(false);
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;

      if (status === 400) {
        toast.error('Não é possível reenviar convite já aceito');
        onOpenChange(false);
      } else if (status === 403) {
        toast.error('Sem permissão para reenviar este convite');
        onOpenChange(false);
      } else if (status === 404) {
        toast.error('Convite não encontrado');
        onOpenChange(false);
      } else {
        toast.error('Erro ao reenviar convite. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Reenviar Convite
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja reenviar o convite para{' '}
            <strong>{convite.email}</strong>? Um novo link será gerado e enviado
            por email.
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
            Voltar
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
                Reenviando...
              </>
            ) : (
              'Reenviar Convite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
