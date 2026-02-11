import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';
import type { Planejamento } from './usePlanejamentos';

interface UpdatePlanejamentoDto {
  bimestre?: number;
  ano_letivo?: number;
  habilidades?: Array<{
    habilidade_id: string;
    peso?: number;
    aulas_previstas?: number;
  }>;
}

export const useUpdatePlanejamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePlanejamentoDto }) => {
      const { data } = await apiClient.patch<Planejamento>(`/planejamentos/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamentos'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento'] });
    },
  });
};
