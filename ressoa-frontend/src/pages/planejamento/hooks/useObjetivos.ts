import { useQuery } from '@tanstack/react-query';
import { ObjetivoCustom } from '@/types/objetivo';
import { api } from '@/lib/api';

/**
 * Hook para listar objetivos de aprendizagem de uma turma
 *
 * @param turmaId - ID da turma
 * @returns Query com lista de objetivos ordenados por campo `ordem`
 */
export function useObjetivos(turmaId: string | undefined) {
  return useQuery<ObjetivoCustom[]>({
    queryKey: ['objetivos', turmaId],
    queryFn: async () => {
      const { data } = await api.get(`/turmas/${turmaId}/objetivos`);
      return data;
    },
    enabled: !!turmaId,
  });
}
