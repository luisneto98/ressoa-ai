import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  inviteCoordenadorSchema,
  type InviteCoordenadorFormData,
} from '@/lib/validation/invite-coordenador.schema';
import { useInviteCoordenador } from '@/hooks/useDiretor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InviteCoordenadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaNome: string;
  onSuccess?: () => void;
}

export function InviteCoordenadorDialog({
  open,
  onOpenChange,
  escolaNome,
  onSuccess,
}: InviteCoordenadorDialogProps) {
  const form = useForm<InviteCoordenadorFormData>({
    resolver: zodResolver(inviteCoordenadorSchema),
    defaultValues: { email: '', nome: '' },
    mode: 'onChange',
  });

  const { mutateAsync: inviteCoordenador, isPending } =
    useInviteCoordenador();

  const onSubmit = async (data: InviteCoordenadorFormData) => {
    try {
      await inviteCoordenador(data);
      toast.success(`Convite enviado para ${data.email}!`);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

      // Field-level error (409 Conflict)
      if (status === 409) {
        form.setError('email', {
          type: 'manual',
          message: 'Email já cadastrado nesta escola',
        });
      }
      // Global errors (400/500)
      else if (status === 400) {
        const errorMessage =
          message || 'Escola inativa ou dados inválidos';
        toast.error(errorMessage);
        onOpenChange(false);
      } else {
        toast.error('Erro ao enviar convite. Tente novamente.');
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Coordenador</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um coordenador à escola{' '}
            <strong>{escolaNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email do Coordenador</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="coordenador@escola.com.br"
                      aria-invalid={!!form.formState.errors.email}
                      aria-describedby={
                        form.formState.errors.email
                          ? 'email-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="email-error" aria-live="polite" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="nome">Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Maria Silva"
                      aria-invalid={!!form.formState.errors.nome}
                      aria-describedby={
                        form.formState.errors.nome ? 'nome-error' : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="nome-error" aria-live="polite" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending || form.formState.isSubmitting}
              >
                {isPending || form.formState.isSubmitting
                  ? 'Enviando...'
                  : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
