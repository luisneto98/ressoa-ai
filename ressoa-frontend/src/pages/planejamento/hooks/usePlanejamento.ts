import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';
import type { Planejamento } from './usePlanejamentos';

export const usePlanejamento = (id: string | undefined) => {
  return useQuery({
    queryKey: ['planejamento', id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const { data } = await apiClient.get<Planejamento>(`/planejamentos/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
