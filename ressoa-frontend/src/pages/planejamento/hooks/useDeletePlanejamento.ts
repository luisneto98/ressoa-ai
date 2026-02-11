import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';

export const useDeletePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/planejamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        throw new Error('Não é possível excluir planejamento com aulas vinculadas');
      }
      throw error;
    },
  });
};
