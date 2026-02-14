import * as React from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UploadErrorCardProps extends React.ComponentProps<typeof Card> {
  /** Error code or type */
  errorType?: 'file-corrupt' | 'network-timeout' | 'invalid-format' | 'generic';
  /** Custom error message (optional - will use default based on errorType) */
  message?: string;
  /** Callbacks for action buttons */
  onRetry?: () => void;
  onChooseAnother?: () => void;
  onManualEntry?: () => void;
  onDismiss?: () => void;
}

/**
 * UploadErrorCard - Empathetic error state component for upload failures
 *
 * Design Principles (UX Design Spec):
 * - "IA como lente, nunca como juiz" - errors are empathetic, not punitive
 * - Use Focus Orange (#F97316) for alerts (NOT red)
 * - Provide clear, actionable next steps
 * - Non-blocking (user can navigate away or try alternatives)
 *
 * Error Types:
 * - file-corrupt: File is corrupted or unsupported format
 * - network-timeout: Upload interrupted due to connection
 * - invalid-format: File format not supported
 * - generic: Fallback for unknown errors
 *
 * @example
 * <UploadErrorCard
 *   errorType="file-corrupt"
 *   onRetry={() => retryUpload()}
 *   onChooseAnother={() => resetFileInput()}
 *   onManualEntry={() => navigateToManualTab()}
 * />
 */
export function UploadErrorCard({
  className,
  errorType = 'generic',
  message,
  onRetry,
  onChooseAnother,
  onManualEntry,
  onDismiss,
  ...props
}: UploadErrorCardProps) {
  const errorMessages = {
    'file-corrupt': {
      title: 'Não conseguimos processar este áudio',
      detail: 'O arquivo pode estar corrompido ou em formato não suportado.',
      actions: ['retry', 'chooseAnother', 'manualText'] as const,
    },
    'network-timeout': {
      title: 'Upload interrompido',
      detail: 'Sua conexão pode estar instável. Vamos tentar retomar de onde parou.',
      actions: ['retry', 'cancel'] as const,
    },
    'invalid-format': {
      title: 'Formato de arquivo não suportado',
      detail: 'Use arquivos MP3, WAV, M4A ou WEBM.',
      actions: ['chooseAnother', 'manualText'] as const,
    },
    generic: {
      title: 'Erro no upload',
      detail: message || 'Ocorreu um erro inesperado. Tente novamente.',
      actions: ['retry', 'chooseAnother'] as const,
    },
  };

  const error = errorMessages[errorType];

  return (
    <Card
      className={cn('border-focus-orange/50 bg-focus-orange/5', className)}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <IconAlertTriangle
              className="h-10 w-10 sm:h-12 sm:w-12 text-focus-orange"
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Title */}
            <h3 className="text-lg font-montserrat font-medium text-deep-navy">
              {error.title}
            </h3>

            {/* Details */}
            <p className="text-sm text-gray-600 font-inter">
              {error.detail}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {error.actions.includes('retry') && onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="default"
                  className="min-h-[44px]"
                  aria-label="Tentar novamente upload"
                >
                  Tentar Novamente
                </Button>
              )}

              {error.actions.includes('chooseAnother') && onChooseAnother && (
                <Button
                  onClick={onChooseAnother}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                  aria-label="Escolher outro arquivo"
                >
                  Escolher Outro Arquivo
                </Button>
              )}

              {error.actions.includes('manualText') && onManualEntry && (
                <Button
                  onClick={onManualEntry}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                  aria-label="Digitar resumo manualmente"
                >
                  Digitar Resumo Manual
                </Button>
              )}

              {error.actions.includes('cancel') && onDismiss && (
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="min-h-[44px]"
                  aria-label="Cancelar"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
