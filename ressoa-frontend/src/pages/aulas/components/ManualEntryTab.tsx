import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AulaFormFields, commonFormSchema } from './AulaFormFields';
import { entradaManual } from '@/api/aulas';

// Form schema for manual entry tab
const manualSchema = commonFormSchema.extend({
  resumo: z
    .string()
    .min(200, 'Mínimo 200 caracteres')
    .max(5000, 'Máximo 5.000 caracteres'),
});

type ManualFormData = z.infer<typeof manualSchema>;

export function ManualEntryTab() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualFormData>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      turma_id: '',
      data: '',
      planejamento_id: '',
      resumo: '',
    },
  });

  const resumo = form.watch('resumo');
  const charCount = resumo?.length || 0;

  // Determine counter color based on validation
  const getCounterColor = () => {
    if (charCount < 200) return 'text-yellow-600';
    if (charCount > 5000) return 'text-red-600';
    return 'text-green-600';
  };

  const handleSubmit = async (data: ManualFormData) => {
    try {
      setIsSubmitting(true);

      await entradaManual({
        turma_id: data.turma_id,
        data: data.data,
        planejamento_id: data.planejamento_id || undefined,
        resumo: data.resumo,
      });

      toast.success('Resumo salvo! Análise em andamento...');
      navigate('/minhas-aulas');
    } catch (error) {
      console.error('Error saving manual entry:', error);
      toast.error('Erro ao salvar resumo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Common form fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <AulaFormFields form={form} />
          </CardContent>
        </Card>

        {/* Manual entry textarea */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="resumo"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-deep-navy">Resumo Manual *</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-focus-orange cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              ⚠️ Resumo manual tem confiança menor na análise. Use transcrição completa quando possível.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className={`text-sm font-medium ${getCounterColor()}`}>
                      {charCount.toLocaleString()} / 5.000
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva em 3-5 parágrafos o que foi ensinado..."
                      className="min-h-[250px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={!form.formState.isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Resumo'
          )}
        </Button>
      </form>
    </Form>
  );
}
