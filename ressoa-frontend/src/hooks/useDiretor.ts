import { useMutation } from '@tanstack/react-query';
import { diretorApi } from '@/api/diretor';
import type { InviteCoordenadorFormData } from '@/lib/validation/invite-coordenador.schema';

export function useInviteCoordenador() {
  return useMutation({
    mutationFn: async (data: InviteCoordenadorFormData) => {
      return diretorApi.inviteCoordenador(data);
    },
  });
}
