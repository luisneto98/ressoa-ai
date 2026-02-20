import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAulaRascunho, type CreateAulaRascunhoDto } from '@/api/aulas';
import { toast } from 'sonner';

export const useCreateRascunho = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAulaRascunhoDto) => createAulaRascunho(data),
    onSuccess: () => {
      toast.success('Rascunho de aula criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar rascunho');
    },
  });
};
