import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  acceptInvitationSchema,
  type AcceptInvitationFormData,
} from '@/lib/validation/accept-invitation.schema';
import { useAcceptInvitation, useValidateToken } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { IconCheck, IconX } from '@tabler/icons-react';

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  // Validate token on mount
  const { data: tokenData, isLoading: isValidating } = useValidateToken(
    token || '',
  );

  // Redirect if no token or invalid
  useEffect(() => {
    if (!token || token.length !== 64) {
      toast.error('Link inválido. Solicite novo convite.');
      navigate('/login');
    }
  }, [token, navigate]);

  const acceptInvitationMutation = useAcceptInvitation();

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      token: token || '',
      senha: '',
      senhaConfirmacao: '',
    },
    mode: 'onChange', // Real-time validation
  });

  // Real-time password strength feedback
  useEffect(() => {
    const senha = form.watch('senha');
    setPasswordRequirements({
      minLength: senha.length >= 8,
      hasUppercase: /[A-Z]/.test(senha),
      hasLowercase: /[a-z]/.test(senha),
      hasNumber: /\d/.test(senha),
    });
  }, [form.watch('senha')]);

  const handleSubmit = async (data: AcceptInvitationFormData) => {
    try {
      await acceptInvitationMutation.mutateAsync({
        token: data.token,
        senha: data.senha,
      });
      toast.success('Convite aceito! Faça login com sua nova senha.');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2s
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Erro ao aceitar convite';
      const status = (error as { response?: { status?: number } })?.response
        ?.status;

      if (status === 401) {
        toast.error('Token inválido ou expirado. Solicite novo convite.');
        navigate('/login');
      } else if (status === 409) {
        toast.error(
          'Email já cadastrado. Entre em contato com o administrador.',
        );
        navigate('/login');
      } else if (status === 400) {
        toast.error(message);
      } else {
        toast.error('Erro ao aceitar convite. Tente novamente.');
      }
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ghost-white">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-tech-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-deep-navy">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-ghost-white px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-montserrat text-deep-navy mb-2">
            Bem-vindo ao Ressoa AI!
          </h1>
          <p className="text-deep-navy/80">
            Olá, <strong>{tokenData.nome}</strong>!
          </p>
          <p className="text-deep-navy/80 mt-2">
            Você foi convidado para ser <strong>Diretor</strong> da escola{' '}
            <strong>{tokenData.escolaNome}</strong>.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Email (readonly) */}
            <FormField
              control={form.control}
              name="token"
              render={() => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      value={tokenData.email}
                      disabled
                      className="bg-ghost-white cursor-not-allowed"
                    />
                  </FormControl>
                  <FormDescription>Este será seu email de login</FormDescription>
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="senha">Senha *</FormLabel>
                  <FormControl>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Digite sua senha"
                      aria-invalid={!!form.formState.errors.senha}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage aria-live="polite" />

                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1 text-sm" aria-live="polite">
                    <p className="font-semibold text-deep-navy/80">
                      Sua senha deve conter:
                    </p>
                    <RequirementItem met={passwordRequirements.minLength}>
                      Mínimo de 8 caracteres
                    </RequirementItem>
                    <RequirementItem met={passwordRequirements.hasUppercase}>
                      Pelo menos uma letra maiúscula
                    </RequirementItem>
                    <RequirementItem met={passwordRequirements.hasLowercase}>
                      Pelo menos uma letra minúscula
                    </RequirementItem>
                    <RequirementItem met={passwordRequirements.hasNumber}>
                      Pelo menos um número
                    </RequirementItem>
                  </div>
                </FormItem>
              )}
            />

            {/* Confirmar Senha */}
            <FormField
              control={form.control}
              name="senhaConfirmacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="senhaConfirmacao">
                    Confirmar Senha *
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="senhaConfirmacao"
                      type="password"
                      placeholder="Digite sua senha novamente"
                      aria-invalid={!!form.formState.errors.senhaConfirmacao}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage aria-live="polite" />
                </FormItem>
              )}
            />

            <SubmitButton
              isLoading={
                acceptInvitationMutation.isPending ||
                form.formState.isSubmitting
              }
              label="Criar Senha e Acessar"
              loadingLabel="Criando..."
              className="w-full"
            />
          </form>
        </Form>
      </div>
    </div>
  );
}

// Helper component for password requirements
function RequirementItem({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <IconCheck
          className="h-4 w-4 text-green-600"
          aria-label="Requisito atendido"
        />
      ) : (
        <IconX
          className="h-4 w-4 text-gray-400"
          aria-label="Requisito não atendido"
        />
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>
        {children}
      </span>
    </div>
  );
}
