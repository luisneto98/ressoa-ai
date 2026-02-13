import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { ObjetivoFormData } from '@/lib/validation/objetivo.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface CriteriosEvidenciaFieldProps {
  form: UseFormReturn<ObjetivoFormData>;
}

/**
 * Campo de array dinâmico para Critérios de Evidência
 *
 * - Add/remove critérios (mín 1, máx 5)
 * - Validação inline por critério (10-200 chars)
 * - Renumeração automática ao remover
 *
 * @param form - Instância do React Hook Form
 */
export function CriteriosEvidenciaField({ form }: CriteriosEvidenciaFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'criterios_evidencia',
  });

  const handleAddCriterio = () => {
    if (fields.length < 5) {
      append('');
    }
  };

  const handleRemoveCriterio = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="criterios_evidencia">
          Critérios de Evidência (1-5 itens obrigatórios)
        </Label>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const error = form.formState.errors.criterios_evidencia?.[index];
          const value = form.watch(`criterios_evidencia.${index}`) || '';

          return (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium w-20">
                    Critério {index + 1}:
                  </span>
                  <Input
                    {...form.register(`criterios_evidencia.${index}`)}
                    placeholder="Ex: Identificar dados do problema"
                    className={cn(error && 'border-red-500')}
                    aria-label={`Critério de evidência ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCriterio(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remover critério ${index + 1}`}
                  >
                    <IconTrash className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                {error && (
                  <p className="text-xs text-red-600 mt-1 ml-20">{error.message}</p>
                )}
                {!error && value && (
                  <p
                    className={cn(
                      'text-xs mt-1 ml-20',
                      value.length < 10
                        ? 'text-red-600 font-medium'
                        : value.length > 200
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                    )}
                  >
                    {value.length}/200 caracteres
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddCriterio}
        disabled={fields.length >= 5}
        className="w-full"
      >
        <IconPlus className="h-4 w-4 mr-2" />
        Adicionar Critério {fields.length < 5 && `(${fields.length}/5)`}
      </Button>

      {form.formState.errors.criterios_evidencia && typeof form.formState.errors.criterios_evidencia === 'object' && !Array.isArray(form.formState.errors.criterios_evidencia) && (
        <p className="text-sm text-red-600">
          {/* @ts-expect-error - Zod array error message */}
          {form.formState.errors.criterios_evidencia.message}
        </p>
      )}
    </div>
  );
}
