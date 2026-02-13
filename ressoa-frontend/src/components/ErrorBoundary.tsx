import { Component, type ReactNode } from 'react';
import { Button } from './ui/button';
import { IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry in production
    console.error('React Error Boundary caught:', error, errorInfo);

    // TODO: Send to Sentry
    // window.Sentry?.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/'; // Full page reload to reset state
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ghost-white px-4">
          <div className="max-w-md rounded-lg border bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <IconAlertTriangle className="size-16 text-focus-orange" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-deep-navy">
              Algo deu errado
            </h1>
            <p className="mb-6 text-gray-600">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mb-4 rounded border bg-red-50 p-4 text-left text-sm">
                <summary className="cursor-pointer font-semibold text-red-700">
                  Detalhes do erro (dev only)
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-600">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button onClick={this.handleReset} className="flex-1">
                Recarregar Página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
