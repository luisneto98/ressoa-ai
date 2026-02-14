import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  inviteDirectorSchema,
  type InviteDirectorFormData,
} from '@/lib/validation/invite-director.schema';
import { toast } from 'sonner';

interface InviteDirectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId: string;
  escolaNome: string;
  onSubmit: (data: InviteDirectorFormData & { escola_id: string }) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Dialog de convite de Diretor por email (Epic 13 Story 13.2)
 *
 * Features:
 * - Validação Zod em tempo real (mode: onChange)
 * - Erro 409 (email duplicado) exibe erro no campo email
 * - Erro 404/400 exibe toast e fecha dialog
 * - WCAG AAA compliant (aria-invalid, aria-describedby, focus ring)
 * - Loading state desabilita botão e exibe spinner
 *
 * @param open - Estado de abertura do dialog
 * @param onOpenChange - Callback para alterar estado de abertura
 * @param escolaId - ID da escola (vem do contexto)
 * @param escolaNome - Nome da escola (exibido no header)
 * @param onSubmit - Callback de envio do convite
 * @param isLoading - Estado de loading do mutation
 */
export function InviteDirectorDialog({
  open,
  onOpenChange,
  escolaId,
  escolaNome,
  onSubmit,
  isLoading = false,
}: InviteDirectorDialogProps) {
  const form = useForm<InviteDirectorFormData>({
    resolver: zodResolver(inviteDirectorSchema),
    defaultValues: {
      email: '',
      nome: '',
    },
    mode: 'onChange', // Validação em tempo real (AC11)
  });

  /** Handle form submission with error handling (AC12, AC13) */
  const handleSubmit = async (data: InviteDirectorFormData) => {
    try {
      await onSubmit({ ...data, escola_id: escolaId });
      toast.success(`Convite enviado para ${data.email}!`);
      onOpenChange(false);
      form.reset();
    } catch (error: unknown) {
      // Log error for debugging (Code Review LOW-2 fix)
      console.error('Invite director error:', error);

      const message = (error as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message || 'Erro ao enviar convite';
      const status = (error as { response?: { status?: number } })?.response?.status;

      // AC13: 409 Conflict (email duplicado) → field error
      if (status === 409) {
        form.setError('email', {
          type: 'manual',
          message: 'Email já cadastrado nesta escola',
        });
      }
      // AC13: 404 Not Found (escola não encontrada)
      else if (status === 404) {
        toast.error('Escola não encontrada');
        onOpenChange(false); // Close dialog
      }
      // AC13: 400 Bad Request (escola inativa ou validação)
      else if (status === 400) {
        if (message.includes('inativa')) {
          toast.error('Escola inativa ou suspensa');
          onOpenChange(false); // Close dialog
        } else {
          toast.error(message); // Validation errors
        }
      }
      // AC13: 500 or other errors
      else {
        toast.error('Erro ao enviar convite. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Diretor</DialogTitle>
          <DialogDescription className="text-sm text-ghost-white/80 mt-2">
            Escola: <strong>{escolaNome}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Email do Diretor (AC11) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email do Diretor *</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="diretor@escola.com.br"
                      aria-invalid={!!form.formState.errors.email}
                      aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="email-error" aria-live="polite" />
                </FormItem>
              )}
            />

            {/* Nome do Diretor (AC11) */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="nome">Nome Completo *</FormLabel>
                  <FormControl>
                    <Input
                      id="nome"
                      placeholder="Ex: João Silva"
                      aria-invalid={!!form.formState.errors.nome}
                      aria-describedby={form.formState.errors.nome ? 'nome-error' : undefined}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="nome-error" aria-live="polite" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <SubmitButton
                isLoading={isLoading || form.formState.isSubmitting}
                label="Enviar Convite"
                loadingLabel="Enviando..."
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
