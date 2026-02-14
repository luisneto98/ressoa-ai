import { apiClient } from '@/lib/api-client';
import type { InviteCoordenadorFormData } from '@/lib/validation/invite-coordenador.schema';

export const diretorApi = {
  inviteCoordenador: async (
    data: InviteCoordenadorFormData,
  ): Promise<{ message: string }> => {
    const { data: response } = await apiClient.post<{ message: string }>(
      '/diretor/invite-coordenador',
      data,
    );
    return response;
  },
};
