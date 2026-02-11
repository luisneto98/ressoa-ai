import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';
import type { Turma } from './usePlanejamentoWizard';

export const useTurmas = () => {
  return useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data } = await apiClient.get<Turma[]>('/turmas');
      return data;
    },
  });
};
