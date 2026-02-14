import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConvites, cancelarConvite, reenviarConvite } from '@/api/convites';
import type { ConvitesQueryParams } from '@/api/convites';

export const convitesKeys = {
  all: ['convites'] as const,
  lists: () => [...convitesKeys.all, 'list'] as const,
  list: (params: ConvitesQueryParams) =>
    [...convitesKeys.lists(), params] as const,
};

export function useConvites(params: ConvitesQueryParams) {
  return useQuery({
    queryKey: convitesKeys.list(params),
    queryFn: () => fetchConvites(params),
    staleTime: 30 * 1000,
  });
}

export function useCancelConvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelarConvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: convitesKeys.all });
    },
  });
}

export function useReenviarConvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reenviarConvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: convitesKeys.all });
    },
  });
}
