import { apiClient } from '@/lib/api-client';
import type { InviteProfessorFormData } from '@/lib/validation/invite-professor.schema';

export const coordenadorApi = {
  inviteProfessor: async (
    data: InviteProfessorFormData,
  ): Promise<{ message: string }> => {
    const { data: response } = await apiClient.post<{ message: string }>(
      '/coordenador/invite-professor',
      data,
    );
    return response;
  },
};
