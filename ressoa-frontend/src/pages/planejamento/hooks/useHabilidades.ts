import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';
import type { Habilidade } from './usePlanejamentoWizard';

interface UseHabilidadesParams {
  tipo_ensino?: 'FUNDAMENTAL' | 'MEDIO'; // Story 10.5
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
    // Story 10.5: Enable query for EM without serie, or for FUNDAMENTAL with serie
    enabled:
      !!params.disciplina &&
      (params.tipo_ensino === 'MEDIO' || !!params.serie),
    staleTime: 5 * 60 * 1000, // 5 minutes - habilidades are stable
  });
};
