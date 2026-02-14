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
import { useCancelConvite } from '@/hooks/useConvites';

interface CancelConviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convite: { id: string; email: string };
}

export function CancelConviteDialog({
  open,
  onOpenChange,
  convite,
}: CancelConviteDialogProps) {
  const { mutateAsync, isPending } = useCancelConvite();

  const handleConfirm = async () => {
    try {
      await mutateAsync(convite.id);
      toast.success(`Convite para ${convite.email} foi cancelado`);
      onOpenChange(false);
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;

      if (status === 400) {
        toast.error('Não é possível cancelar convite já aceito');
      } else if (status === 403) {
        toast.error('Sem permissão para cancelar este convite');
      } else if (status === 404) {
        toast.error('Convite não encontrado');
      } else if (status === 409) {
        toast.error('Convite já foi cancelado');
      } else {
        toast.error('Erro ao cancelar convite. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Cancelar Convite
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar o convite para{' '}
            <strong>{convite.email}</strong>? O link enviado por email deixará de
            funcionar.
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar Convite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
