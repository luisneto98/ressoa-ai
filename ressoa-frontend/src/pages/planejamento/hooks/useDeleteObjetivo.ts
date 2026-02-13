import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hook para deletar um objetivo de aprendizagem
 *
 * @returns Mutation para DELETE /turmas/:id/objetivos/:objetivoId
 */
export function useDeleteObjetivo(turmaId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (objetivoId) => {
      await api.delete(`/turmas/${turmaId}/objetivos/${objetivoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos', turmaId] });
    },
  });
}
