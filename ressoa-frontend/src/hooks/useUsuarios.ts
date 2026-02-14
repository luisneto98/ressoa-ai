import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsuarios, updateUsuario } from '@/api/usuarios';
import type { UsuariosQueryParams, UpdateUsuarioData } from '@/api/usuarios';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  list: (params: UsuariosQueryParams) =>
    [...usuariosKeys.lists(), params] as const,
};

export function useUsuarios(params: UsuariosQueryParams) {
  return useQuery({
    queryKey: usuariosKeys.list(params),
    queryFn: () => fetchUsuarios(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUsuarioData }) =>
      updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}
