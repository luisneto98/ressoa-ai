import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconAlertCircle } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface FormFieldWithCounterProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  placeholder?: string;
  maxLength: number;
  minLength?: number;
  rows?: number;
  required?: boolean;
  className?: string;
  tooltipContent?: React.ReactNode;
}

/**
 * Reusable form field component with character counter
 *
 * Story 12.3.1 - AC#7
 *
 * Features:
 * - Textarea with character counter visual
 * - Counter color changes when limit exceeded (red) or within limit (gray)
 * - Format: "{length}/{max} caracteres"
 * - Positioned with flex justify-between (error left, counter right)
 * - Accessible with aria-invalid
 *
 * Usage:
 * ```tsx
 * <FormFieldWithCounter
 *   control={form.control}
 *   name="description"
 *   label="Descrição"
 *   description="Descreva o objetivo do curso"
 *   placeholder="Ex: Preparar alunos para ENEM..."
 *   maxLength={500}
 *   minLength={100}
 *   rows={4}
 *   required
 * />
 * ```
 */
export function FormFieldWithCounter<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  maxLength,
  minLength: _, // Not used in UI, only for Zod validation
  tooltipContent,
  rows = 3,
  required = false,
  className,
}: FormFieldWithCounterProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const length = (field.value as string)?.length || 0;
        const hasError = !!fieldState.error;

        return (
          <FormItem className={className}>
            {tooltipContent ? (
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
            ) : (
              <FormLabel htmlFor={name} className="font-medium text-sm text-deep-navy">
                {label} {required && <span className="text-destructive">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Textarea
                id={name}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                aria-invalid={hasError}
                className="resize-none"
                {...field}
              />
            </FormControl>
            {description && (
              <FormDescription id={`${name}-description`} className="text-sm text-muted-foreground">
                {description}
              </FormDescription>
            )}
            <div className="flex items-start justify-between gap-4">
              <FormMessage id={`${name}-error`} className="flex-1" aria-live="polite" />
              <p
                className={cn(
                  'text-sm flex-shrink-0',
                  length > maxLength ? 'text-red-600 font-medium' : 'text-gray-500'
                )}
                aria-atomic="true"
              >
                {length}/{maxLength} caracteres
              </p>
            </div>
          </FormItem>
        );
      }}
    />
  );
}
