import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Logo } from '@/components/ui/logo';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/api/axios';
import { getHomeRoute } from '@/utils/routing';

// Zod schema for login validation
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  // Initialize React Hook Form with Zod resolver
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { accessToken, refreshToken, user } = response.data;

      // Save to store (persists to localStorage)
      // Map backend response (escola: {id, nome}) to flat escola_id
      login({ accessToken, refreshToken }, {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        escola_id: user.escola?.id,
      });

      // Show success toast
      toast.success(`Bem-vindo, ${user.nome}!`);

      // Redirect based on role (centralized logic)
      navigate(getHomeRoute(user.role));
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Email ou senha incorretos');
        } else if (error.response?.status === 500) {
          toast.error('Erro no servidor. Tente novamente mais tarde.');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2647] to-[#2563EB] px-4">
      <Card className="w-full max-w-md" role="region" aria-label="Formulário de login">
        <CardHeader className="text-center space-y-4">
          <Logo
            variant="full"
            className="w-full"
            iconClassName="w-full h-auto max-h-20"
          />
          <CardDescription className="text-sm">
            Inteligência de Aula, Análise e Previsão de Conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="professor@escola.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-live="polite"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm inline-block px-2 py-1"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
