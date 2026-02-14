import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface SubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  isLoading: boolean;
  label: string;
  loadingLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * Reusable submit button with consistent loading state
 *
 * Story 12.3.1 - AC#4
 *
 * Features:
 * - Loading state with IconLoader2 spinner (animate-spin)
 * - Label changes when loading: "Salvar" → "Salvando..."
 * - Disabled when loading
 * - aria-busy={isLoading} for screen readers
 * - cursor-not-allowed when disabled
 * - Opacity 50% when disabled
 * - min-h-[44px] touch target (mobile accessibility)
 *
 * Usage:
 * ```tsx
 * <SubmitButton
 *   isLoading={isLoading}
 *   label="Salvar"
 *   loadingLabel="Salvando..."
 *   variant="default"
 * />
 *
 * <SubmitButton
 *   isLoading={isCreating}
 *   label="Criar Turma"
 *   loadingLabel="Criando..."
 *   icon={<IconPlus className="h-4 w-4" />}
 * />
 * ```
 */
export function SubmitButton({
  isLoading,
  label,
  loadingLabel,
  icon,
  variant = 'default',
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isLoading}
      aria-busy={isLoading}
      className={cn(
        'min-h-[44px]',
        isLoading && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingLabel || label}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </>
      )}
    </Button>
  );
}
