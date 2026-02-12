import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAula } from '@/api/aulas';
import { toast } from 'sonner';

export const useDeleteAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAula,
    onSuccess: () => {
      toast.success('Aula excluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir aula');
    },
  });
};
