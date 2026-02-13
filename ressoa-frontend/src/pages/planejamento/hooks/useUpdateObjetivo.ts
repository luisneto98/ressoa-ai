import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateObjetivoDto, ObjetivoCustom } from '@/types/objetivo';
import api from '@/lib/api';

/**
 * Hook para atualizar um objetivo de aprendizagem
 *
 * @returns Mutation para PATCH /turmas/:id/objetivos/:objetivoId
 */
export function useUpdateObjetivo(turmaId: string) {
  const queryClient = useQueryClient();

  return useMutation<ObjetivoCustom, Error, { objetivoId: string; data: UpdateObjetivoDto }>({
    mutationFn: async ({ objetivoId, data }) => {
      const { data: response } = await api.patch(`/turmas/${turmaId}/objetivos/${objetivoId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos', turmaId] });
    },
  });
}
