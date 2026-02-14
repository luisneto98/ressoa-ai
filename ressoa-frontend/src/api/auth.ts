import { apiClient } from './axios';

export interface ValidateTokenResponse {
  email: string;
  nome: string;
  escolaNome: string;
}

export interface AcceptInvitationRequest {
  token: string;
  senha: string;
}

export interface AcceptInvitationResponse {
  message: string;
}

export const authApi = {
  validateToken: async (token: string): Promise<ValidateTokenResponse> => {
    const { data } = await apiClient.get<ValidateTokenResponse>(
      `/auth/validate-token?token=${encodeURIComponent(token)}`,
    );
    return data;
  },

  acceptInvitation: async (
    request: AcceptInvitationRequest,
  ): Promise<AcceptInvitationResponse> => {
    const { data } = await apiClient.post<AcceptInvitationResponse>(
      '/auth/accept-invitation',
      request,
    );
    return data;
  },
};
