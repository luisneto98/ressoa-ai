import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useUpdateUsuario } from '@/hooks/useUsuarios';

const editUsuarioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
});

type EditUsuarioFormData = z.infer<typeof editUsuarioSchema>;

interface EditUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: { id: string; nome: string; email: string; role: string };
  onSuccess?: () => void;
}

export function EditUsuarioDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: EditUsuarioDialogProps) {
  const { mutateAsync, isPending } = useUpdateUsuario();

  const form = useForm<EditUsuarioFormData>({
    resolver: zodResolver(editUsuarioSchema),
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
    },
    mode: 'onChange',
  });

  // Reset form when dialog opens with new user data
  useEffect(() => {
    if (open) {
      form.reset({
        nome: usuario.nome,
        email: usuario.email,
      });
    }
  }, [open, usuario.id, form]);

  const watchedNome = useWatch({ control: form.control, name: 'nome' });
  const watchedEmail = useWatch({ control: form.control, name: 'email' });
  const isFormUnchanged =
    watchedNome === usuario.nome && watchedEmail === usuario.email;

  const handleSubmit = async (data: EditUsuarioFormData) => {
    try {
      await mutateAsync({ id: usuario.id, data });
      toast.success('Usuário atualizado com sucesso');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;

      if (status === 409) {
        form.setError('email', {
          type: 'manual',
          message: 'Email já cadastrado nesta escola',
        });
      } else if (status === 403) {
        toast.error('Sem permissão para editar este usuário');
      } else if (status === 404) {
        toast.error('Usuário não encontrado');
      } else {
        toast.error('Erro ao atualizar usuário. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Altere os dados do usuário <strong>{usuario.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="edit-nome">Nome</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-nome"
                      type="text"
                      placeholder="Nome do usuário"
                      disabled={isPending}
                      aria-invalid={!!form.formState.errors.nome}
                      aria-describedby={
                        form.formState.errors.nome
                          ? 'edit-nome-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="edit-nome-error" aria-live="polite" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="edit-email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="email@escola.com.br"
                      disabled={isPending}
                      aria-invalid={!!form.formState.errors.email}
                      aria-describedby={
                        form.formState.errors.email
                          ? 'edit-email-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="edit-email-error" aria-live="polite" />
                </FormItem>
              )}
            />

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
                type="submit"
                disabled={
                  isPending || !form.formState.isValid || isFormUnchanged
                }
                className="bg-tech-blue hover:bg-tech-blue/90 min-h-[44px]"
              >
                {isPending ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
