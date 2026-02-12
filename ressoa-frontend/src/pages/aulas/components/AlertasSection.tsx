import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Alerta {
  tipo: string;
  nivel: 'INFO' | 'WARNING' | 'CRITICAL';
  titulo: string;
  mensagem: string;
  acoes_sugeridas: string[];
}

interface AlertasSectionProps {
  alertas: Alerta[];
}

export function AlertasSection({ alertas }: AlertasSectionProps) {
  const getAlertIcon = (nivel: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (nivel) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getAlertVariant = (nivel: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (nivel) {
      case 'INFO':
        return 'default';
      case 'WARNING':
        return 'default'; // Use custom styling instead of destructive
      case 'CRITICAL':
        return 'destructive';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Alertas Pedagógicos</h2>

      <div className="space-y-3">
        {alertas.map((alerta, idx) => (
          <Alert
            key={idx}
            variant={getAlertVariant(alerta.nivel)}
            className={
              alerta.nivel === 'WARNING'
                ? 'border-orange-200 bg-orange-50'
                : ''
            }
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alerta.nivel)}
              <div className="flex-1">
                <AlertTitle className="mb-1">{alerta.titulo}</AlertTitle>
                <AlertDescription className="mb-3">
                  {alerta.mensagem}
                </AlertDescription>

                {alerta.acoes_sugeridas && alerta.acoes_sugeridas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold mb-1">Ações sugeridas:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {alerta.acoes_sugeridas.map((acao, i) => (
                        <li key={i}>{acao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}
