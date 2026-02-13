import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateObjetivoDto, ObjetivoCustom } from '@/types/objetivo';
import { api } from '@/lib/api';

/**
 * Hook para criar múltiplos objetivos em batch
 * (usado ao avançar Step 2 → Step 3 do wizard de planejamento)
 *
 * @returns Mutation para POST /turmas/:id/objetivos/batch
 */
export function useCreateObjetivosBatch(turmaId: string) {
  const queryClient = useQueryClient();

  return useMutation<ObjetivoCustom[], Error, CreateObjetivoDto[]>({
    mutationFn: async (objetivos) => {
      const { data } = await api.post(`/turmas/${turmaId}/objetivos/batch`, objetivos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos', turmaId] });
    },
  });
}
