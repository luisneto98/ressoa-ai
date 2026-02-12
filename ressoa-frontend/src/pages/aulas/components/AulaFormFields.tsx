import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchProfessorTurmas, fetchTurmaPlanejamentos } from '@/api/aulas';

// Common form schema for all tabs
export const commonFormSchema = z.object({
  turma_id: z.string().uuid('Selecione uma turma válida'),
  data: z.string().refine(
    (date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return selectedDate <= today;
    },
    'Data não pode estar no futuro'
  ),
  planejamento_id: z.string().uuid().optional().or(z.literal('')),
});

export type CommonFormData = z.infer<typeof commonFormSchema>;

interface AulaFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function AulaFormFields({ form }: AulaFormFieldsProps) {
  const turmaId = form.watch('turma_id');

  // Fetch turmas do professor autenticado
  const { data: turmas, isLoading: isLoadingTurmas } = useQuery({
    queryKey: ['turmas'],
    queryFn: fetchProfessorTurmas,
  });

  // Fetch planejamentos filtrados por turma selecionada
  const { data: planejamentos, isLoading: isLoadingPlanejamentos } = useQuery({
    queryKey: ['planejamentos', turmaId],
    queryFn: () => fetchTurmaPlanejamentos(turmaId),
    enabled: !!turmaId,
  });

  // Reset planejamento quando turma muda
  useEffect(() => {
    if (turmaId) {
      form.setValue('planejamento_id', '');
    }
  }, [turmaId, form]);

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Turma Field */}
      <FormField
        control={form.control}
        name="turma_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-deep-navy">Turma *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoadingTurmas}
            >
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={isLoadingTurmas ? 'Carregando turmas...' : 'Selecione a turma'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {turmas?.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.ano}º ano ({turma.disciplina})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Data da Aula Field */}
      <FormField
        control={form.control}
        name="data"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-deep-navy">Data da Aula *</FormLabel>
            <FormControl>
              <Input
                type="date"
                max={today}
                className="h-11"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Planejamento Field (Optional) */}
      <FormField
        control={form.control}
        name="planejamento_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-deep-navy">Planejamento (opcional)</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ''}
              disabled={!turmaId || isLoadingPlanejamentos}
            >
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={
                      !turmaId
                        ? 'Selecione uma turma primeiro'
                        : isLoadingPlanejamentos
                        ? 'Carregando planejamentos...'
                        : 'Selecione um planejamento (opcional)'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">Nenhum planejamento</SelectItem>
                {planejamentos?.map((planejamento) => (
                  <SelectItem key={planejamento.id} value={planejamento.id}>
                    {planejamento.titulo} ({planejamento.periodo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
