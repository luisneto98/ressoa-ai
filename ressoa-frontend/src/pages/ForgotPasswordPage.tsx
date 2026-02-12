import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Placeholder page for forgot password functionality
 * Informs users that the feature is under development and provides alternative action
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2647] to-[#2563EB] px-4">
      <Card className="w-full max-w-md" role="region" aria-label="Recuperação de senha">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 p-3">
              <AlertCircle
                className="size-6"
                style={{ color: '#F97316' }}
                aria-hidden="true"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-montserrat">
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription className="text-sm">
            Funcionalidade em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            A recuperação de senha estará disponível em breve.
            Por enquanto, entre em contato com o administrador da sua escola para redefinir sua senha.
          </p>

          <Button
            onClick={() => navigate('/login')}
            className="w-full"
            variant="default"
          >
            Voltar para Login
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
