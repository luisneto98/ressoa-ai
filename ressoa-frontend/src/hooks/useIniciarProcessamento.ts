import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { iniciarProcessamento, type IniciarProcessamentoDto } from '@/api/aulas';
import { toast } from 'sonner';

export const useIniciarProcessamento = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ aulaId, data }: { aulaId: string; data: IniciarProcessamentoDto }) =>
      iniciarProcessamento(aulaId, data),
    onSuccess: (aula, variables) => {
      toast.success('Processamento iniciado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      // Navigate to upload page for AUDIO type
      if (variables.data.tipo_entrada === 'AUDIO') {
        navigate('/aulas/upload', { state: { aulaId: aula.id } });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao iniciar processamento');
    },
  });
};
