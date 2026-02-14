import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi, type AcceptInvitationRequest } from '@/api/auth';

export function useValidateToken(token: string) {
  return useQuery({
    queryKey: ['validate-token', token],
    queryFn: async () => {
      if (!token || token.length !== 64) {
        return null;
      }

      return authApi.validateToken(token);
    },
    enabled: !!token && token.length === 64,
    retry: false, // Don't retry on 401
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (data: AcceptInvitationRequest) => {
      return authApi.acceptInvitation(data);
    },
  });
}
