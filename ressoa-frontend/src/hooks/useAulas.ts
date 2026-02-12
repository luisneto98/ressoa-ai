import { useQuery } from '@tanstack/react-query';
import { fetchAulas, type FetchAulasParams, type AulaListItem } from '@/api/aulas';

export const useAulas = (params: FetchAulasParams) => {
  return useQuery({
    queryKey: ['aulas', params],
    queryFn: () => fetchAulas(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (query) => {
      // Only poll if there are processing aulas
      try {
        const data = query.state.data;
        if (!data || !Array.isArray(data)) return false;

        const hasProcessing = data.some((aula: AulaListItem) =>
          ['UPLOAD_PROGRESSO', 'AGUARDANDO_TRANSCRICAO', 'ANALISANDO'].includes(
            aula.status_processamento
          )
        );
        return hasProcessing ? 5000 : false; // 5s if processing, else no polling
      } catch (error) {
        console.error('Error in refetchInterval logic:', error);
        return false; // Stop polling on error
      }
    },
  });
};
