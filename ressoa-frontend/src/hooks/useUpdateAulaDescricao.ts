import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAulaDescricao, type UpdateAulaDescricaoDto } from '@/api/aulas';
import { toast } from 'sonner';

export const useUpdateAulaDescricao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ aulaId, data }: { aulaId: string; data: UpdateAulaDescricaoDto }) =>
      updateAulaDescricao(aulaId, data),
    onSuccess: () => {
      toast.success('Descrição atualizada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar descrição');
    },
  });
};
