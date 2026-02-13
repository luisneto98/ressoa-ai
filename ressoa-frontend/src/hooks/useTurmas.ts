import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchTurmas,
  fetchTurmaById,
  createTurma,
  updateTurma,
  deleteTurma,
} from '@/api/turmas';
import type { CreateTurmaDto, UpdateTurmaDto } from '@/types/turma';

/**
 * React Query hooks for Turmas CRUD operations
 * Story 10.4 - Frontend Gestão de Turmas
 *
 * Patterns:
 * - staleTime: 5 minutes (turmas are relatively stable data)
 * - Query invalidation after mutations (create, update, delete)
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 */

// Query key factory
export const turmasKeys = {
  all: ['turmas'] as const,
  lists: () => [...turmasKeys.all, 'list'] as const,
  list: (filters?: { tipo_ensino?: string }) => [...turmasKeys.lists(), filters] as const,
  details: () => [...turmasKeys.all, 'detail'] as const,
  detail: (id: string) => [...turmasKeys.details(), id] as const,
};

/**
 * Hook to fetch all turmas
 * @param filters Optional filters (tipo_ensino)
 * @returns Query result with turmas list
 */
export const useTurmas = (filters?: { tipo_ensino?: string }) => {
  return useQuery({
    queryKey: turmasKeys.list(filters),
    queryFn: async () => {
      const turmas = await fetchTurmas();
      // Client-side filtering if tipo_ensino provided
      if (filters?.tipo_ensino) {
        return turmas.filter((t) => t.tipo_ensino === filters.tipo_ensino);
      }
      return turmas;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch single turma by ID
 * @param id Turma ID
 * @returns Query result with turma details
 */
export const useTurma = (id: string) => {
  return useQuery({
    queryKey: turmasKeys.detail(id),
    queryFn: () => fetchTurmaById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id, // Only fetch if id is provided
  });
};

/**
 * Hook to create new turma
 * @returns Mutation with createTurma function
 */
export const useCreateTurma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTurmaDto) => createTurma(data),
    onSuccess: () => {
      // Invalidate all turmas queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: turmasKeys.all });
      toast.success('Turma criada com sucesso');
    },
    onError: (error: any) => {
      // Handle 403 Forbidden (RBAC violation) - redirect to dashboard
      if (error.response?.status === 403) {
        toast.error('Você não tem permissão para criar turmas');
        window.location.href = '/dashboard';
        return;
      }

      // Extract error message from backend response
      const message = error.response?.data?.message;
      const errorMessage = Array.isArray(message) ? message[0] : message || 'Erro ao criar turma';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to update existing turma
 * @returns Mutation with updateTurma function
 */
export const useUpdateTurma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTurmaDto }) => updateTurma(id, data),
    onSuccess: () => {
      // Invalidate all turmas queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: turmasKeys.all });
      toast.success('Turma atualizada com sucesso');
    },
    onError: (error: any) => {
      // Handle 403 Forbidden (RBAC violation) - redirect to dashboard
      if (error.response?.status === 403) {
        toast.error('Você não tem permissão para editar turmas');
        window.location.href = '/dashboard';
        return;
      }

      const message = error.response?.data?.message;
      const errorMessage = Array.isArray(message)
        ? message[0]
        : message || 'Erro ao atualizar turma';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to delete turma (soft delete on backend)
 * @returns Mutation with deleteTurma function
 */
export const useDeleteTurma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTurma(id),
    onSuccess: () => {
      // Invalidate all turmas queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: turmasKeys.all });
      toast.success('Turma deletada com sucesso');
    },
    onError: (error: any) => {
      // Handle 403 Forbidden (RBAC violation) - redirect to dashboard
      if (error.response?.status === 403) {
        toast.error('Você não tem permissão para deletar turmas');
        window.location.href = '/dashboard';
        return;
      }

      const message = error.response?.data?.message;
      const errorMessage = Array.isArray(message)
        ? message[0]
        : message || 'Erro ao deletar turma';
      toast.error(errorMessage);
    },
  });
};
