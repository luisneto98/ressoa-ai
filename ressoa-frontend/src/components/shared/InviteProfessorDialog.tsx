import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  inviteProfessorSchema,
  type InviteProfessorFormData,
  Disciplina,
} from '@/lib/validation/invite-professor.schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InviteProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InviteProfessorFormData) => Promise<void>;
  isLoading: boolean;
  escolaNome: string;
}

const disciplinaLabels: Record<Disciplina, string> = {
  [Disciplina.MATEMATICA]: 'Matemática',
  [Disciplina.LINGUA_PORTUGUESA]: 'Língua Portuguesa',
  [Disciplina.CIENCIAS]: 'Ciências',
};

export function InviteProfessorDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  escolaNome,
}: InviteProfessorDialogProps) {
  const form = useForm<InviteProfessorFormData>({
    resolver: zodResolver(inviteProfessorSchema),
    defaultValues: {
      email: '',
      nome: '',
      disciplina: Disciplina.MATEMATICA,
      formacao: '',
      registro: '',
      telefone: '',
    },
    mode: 'onChange',
  });

  const handleSubmit = async (data: InviteProfessorFormData) => {
    try {
      await onSubmit(data);
      toast.success(`Convite enviado para ${data.email}!`);
      onOpenChange(false);
      form.reset();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

      // AC15: Field-level error (409 Conflict - email duplicado)
      if (status === 409) {
        form.setError('email', {
          type: 'manual',
          message: 'Email já cadastrado nesta escola',
        });
      }
      // AC15: Global errors (400 - escola inativa / validation)
      else if (status === 400) {
        const errorMessage = message || 'Escola inativa ou dados inválidos';
        toast.error(errorMessage);
      }
      // AC15: Generic error (500)
      else {
        toast.error('Erro ao enviar convite. Tente novamente.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-deep-navy">
            Convidar Professor
          </DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um professor à escola{' '}
            <strong>{escolaNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* AC13: Campo 1 - Email (obrigatório) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email do Professor</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="professor@escola.com.br"
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

            {/* AC13: Campo 2 - Nome (obrigatório) */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="nome">Nome do Professor</FormLabel>
                  <FormControl>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="João da Silva"
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

            {/* AC13: Campo 3 - Disciplina (obrigatório) */}
            <FormField
              control={form.control}
              name="disciplina"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="disciplina">
                    Disciplina Principal
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        id="disciplina"
                        aria-invalid={!!form.formState.errors.disciplina}
                        aria-describedby={
                          form.formState.errors.disciplina
                            ? 'disciplina-error'
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(disciplinaLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage id="disciplina-error" aria-live="polite" />
                </FormItem>
              )}
            />

            {/* AC13: Campo 4 - Formação (opcional) */}
            <FormField
              control={form.control}
              name="formacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="formacao">
                    Formação <span className="text-gray-500">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="formacao"
                      type="text"
                      placeholder="Licenciatura em Matemática"
                      aria-invalid={!!form.formState.errors.formacao}
                      aria-describedby={
                        form.formState.errors.formacao
                          ? 'formacao-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="formacao-error" aria-live="polite" />
                </FormItem>
              )}
            />

            {/* AC13: Campo 5 - Registro Profissional (opcional) */}
            <FormField
              control={form.control}
              name="registro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="registro">
                    Registro Profissional{' '}
                    <span className="text-gray-500">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="registro"
                      type="text"
                      placeholder="RP 12345-SP"
                      aria-invalid={!!form.formState.errors.registro}
                      aria-describedby={
                        form.formState.errors.registro
                          ? 'registro-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="registro-error" aria-live="polite" />
                </FormItem>
              )}
            />

            {/* AC13: Campo 6 - Telefone (opcional) */}
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="telefone">
                    Telefone <span className="text-gray-500">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      aria-invalid={!!form.formState.errors.telefone}
                      aria-describedby={
                        form.formState.errors.telefone
                          ? 'telefone-error'
                          : undefined
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="telefone-error" aria-live="polite" />
                </FormItem>
              )}
            />

            <DialogFooter>
              {/* AC14: Submit button with loading state */}
              <Button
                type="submit"
                disabled={isLoading || form.formState.isSubmitting}
                className="bg-tech-blue hover:bg-tech-blue/90 min-h-[44px]"
              >
                {isLoading || form.formState.isSubmitting
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
