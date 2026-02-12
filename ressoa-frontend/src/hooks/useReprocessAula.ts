import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reprocessAula } from '@/api/aulas';
import { toast } from 'sonner';

export const useReprocessAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reprocessAula,
    onSuccess: () => {
      toast.success('Aula adicionada à fila de processamento');
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao reprocessar aula');
    },
  });
};
