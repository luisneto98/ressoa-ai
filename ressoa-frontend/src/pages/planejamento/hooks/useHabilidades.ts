import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';
import type { Habilidade } from './usePlanejamentoWizard';

interface UseHabilidadesParams {
  disciplina?: string;
  serie?: number;
  unidade_tematica?: string;
  search?: string;
}

interface HabilidadesResponse {
  data: Habilidade[];
  total: number;
  limit: number;
  offset: number;
}

export const useHabilidades = (params: UseHabilidadesParams) => {
  return useQuery({
    queryKey: ['habilidades', params],
    queryFn: async () => {
      const { data } = await apiClient.get<HabilidadesResponse>('/habilidades', {
        params,
      });
      // Backend returns pagination response, extract just the array
      return data.data;
    },
    enabled: !!params.disciplina && !!params.serie,
  });
};
