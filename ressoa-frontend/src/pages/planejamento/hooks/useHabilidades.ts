import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';
import type { Habilidade } from './usePlanejamentoWizard';

interface UseHabilidadesParams {
  disciplina?: string;
  serie?: number;
  unidade_tematica?: string;
  search?: string;
}

export const useHabilidades = (params: UseHabilidadesParams) => {
  return useQuery({
    queryKey: ['habilidades', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Habilidade[]>('/habilidades', {
        params,
      });
      return data;
    },
    enabled: !!params.disciplina && !!params.serie,
  });
};
