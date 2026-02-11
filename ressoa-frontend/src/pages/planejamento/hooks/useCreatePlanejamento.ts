import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

interface CreatePlanejamentoPayload {
  turma_id: string;
  bimestre: number;
  ano_letivo: number;
  habilidades: Array<{ habilidade_id: string }>;
}

export const useCreatePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePlanejamentoPayload) => {
      const { data } = await apiClient.post('/planejamentos', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
    },
  });
};
