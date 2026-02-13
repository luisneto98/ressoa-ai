import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateObjetivoDto, ObjetivoCustom } from '@/types/objetivo';
import api from '@/lib/api';

/**
 * Hook para criar múltiplos objetivos em batch
 * (usado ao avançar Step 2 → Step 3 do wizard de planejamento)
 *
 * @returns Mutation para POST /turmas/:id/objetivos/batch
 */
export function useCreateObjetivosBatch(turmaId: string) {
  const queryClient = useQueryClient();

  return useMutation<ObjetivoCustom[], Error, CreateObjetivoDto[]>({
    mutationFn: async (objetivos) => {
      // Fallback: batch endpoint not implemented in backend (Story 11.4)
      // Use individual POSTs instead
      const results = await Promise.all(
        objetivos.map(objetivo =>
          api.post(`/turmas/${turmaId}/objetivos`, objetivo)
        )
      );
      return results.map((r: any) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos', turmaId] });
    },
  });
}
