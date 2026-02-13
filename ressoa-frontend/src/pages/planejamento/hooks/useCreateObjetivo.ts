import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateObjetivoDto, ObjetivoCustom } from '@/types/objetivo';
import { api } from '@/lib/api';

/**
 * Hook para criar um objetivo de aprendizagem
 *
 * @returns Mutation para POST /turmas/:id/objetivos
 */
export function useCreateObjetivo(turmaId: string) {
  const queryClient = useQueryClient();

  return useMutation<ObjetivoCustom, Error, CreateObjetivoDto>({
    mutationFn: async (objetivo) => {
      const { data } = await api.post(`/turmas/${turmaId}/objetivos`, objetivo);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos', turmaId] });
    },
  });
}
