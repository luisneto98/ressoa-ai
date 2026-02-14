import { type ReactNode } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconAlertCircle } from '@tabler/icons-react';

interface FormFieldWithTooltipProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  tooltipContent: ReactNode;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
  rows?: number;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

/**
 * Reusable form field component with tooltip
 *
 * Story 12.3.1 - AC#8
 *
 * Features:
 * - Input or Textarea with informative tooltip
 * - Tooltip icon: IconAlertCircle in Focus Orange (#F97316)
 * - Tooltip appears on hover/focus
 * - Accessible with aria-describedby (Radix UI automatic)
 * - Label + tooltip icon side by side
 *
 * Usage:
 * ```tsx
 * <FormFieldWithTooltip
 *   control={form.control}
 *   name="objetivo_geral"
 *   label="Objetivo Geral do Curso"
 *   tooltipContent={
 *     <>
 *       <p>Descreva o propósito do curso de forma clara.</p>
 *       <p className="mt-2 text-xs italic">
 *         Exemplo: "Preparar alunos para ENEM 2026 com foco em redação nota 1000"
 *       </p>
 *     </>
 *   }
 *   type="textarea"
 *   rows={4}
 *   maxLength={500}
 *   required
 * />
 * ```
 */
export function FormFieldWithTooltip<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  tooltipContent,
  description,
  placeholder,
  type = 'text',
  rows = 3,
  maxLength,
  required = false,
  className,
}: FormFieldWithTooltipProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;

        return (
          <FormItem className={className}>
            <div className="flex items-center gap-2">
              <FormLabel htmlFor={name} className="font-medium text-sm text-deep-navy">
                {label} {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconAlertCircle
                      className="h-4 w-4 text-focus-orange cursor-help flex-shrink-0"
                      aria-label={`Informações sobre ${label}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {tooltipContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              {type === 'textarea' ? (
                <Textarea
                  id={name}
                  rows={rows}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  aria-invalid={hasError}
                  className="resize-none"
                  {...field}
                />
              ) : (
                <Input
                  id={name}
                  type="text"
                  maxLength={maxLength}
                  placeholder={placeholder}
                  aria-invalid={hasError}
                  {...field}
                />
              )}
            </FormControl>
            {description && (
              <FormDescription className="text-sm text-muted-foreground">
                {description}
              </FormDescription>
            )}
            <FormMessage aria-live="polite" />
          </FormItem>
        );
      }}
    />
  );
}
