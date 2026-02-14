import { useQuery } from '@tanstack/react-query';
import { fetchUsuarios } from '@/api/usuarios';
import type { UsuariosQueryParams } from '@/api/usuarios';

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
