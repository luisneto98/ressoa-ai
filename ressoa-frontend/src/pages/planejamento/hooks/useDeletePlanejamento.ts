import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';

export const useDeletePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(`/planejamentos/${id}`);
      } catch (error: any) {
        // Transform error message for better UX
        if (error.response?.status === 400) {
          throw new Error('Não é possível excluir planejamento com aulas vinculadas');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
    },
  });
};
