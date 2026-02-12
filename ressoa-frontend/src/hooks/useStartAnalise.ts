import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/axios';
import { toast } from 'sonner';

export const useStartAnalise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aulaId: string) => {
      const response = await apiClient.post(`/analise/${aulaId}`, {
        timeout: 5000, // 5s timeout - não espera análise terminar
      });
      return response.data;
    },
    onSuccess: (data) => {
      const estimatedTime = data.estimated_time_seconds || 60;
      toast.success(
        `Análise iniciada! Aguarde ~${estimatedTime}s. A página atualizará automaticamente.`,
        { duration: 5000 }
      );
      // Invalidar imediatamente para mostrar status EM_ANALISE
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao iniciar análise';
      toast.error(message);
    },
  });
};
