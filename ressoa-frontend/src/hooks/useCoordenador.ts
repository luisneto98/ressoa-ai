import { useMutation } from '@tanstack/react-query';
import { coordenadorApi } from '@/api/coordenador';
import type { InviteProfessorFormData } from '@/lib/validation/invite-professor.schema';

export function useInviteProfessor() {
  return useMutation({
    mutationFn: async (data: InviteProfessorFormData) => {
      return coordenadorApi.inviteProfessor(data);
    },
  });
}
