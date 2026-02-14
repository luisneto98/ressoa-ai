import { apiClient } from '@/api/axios';

export interface ConviteListItem {
  id: string;
  email: string;
  nome_completo: string;
  tipo_usuario: 'professor' | 'coordenador' | 'diretor';
  escola_id: string;
  escola_nome: string;
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado';
  expira_em: string;
  criado_em: string;
  aceito_em: string | null;
  dados_extras: Record<string, unknown> | null;
}

export interface ConvitesListResponse {
  data: ConviteListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConvitesQueryParams {
  page: number;
  limit?: number;
  status?: string;
}

export async function fetchConvites(
  params: ConvitesQueryParams,
): Promise<ConvitesListResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.status) queryParams.set('status', params.status);

  const { data } = await apiClient.get<ConvitesListResponse>(
    `/convites?${queryParams}`,
  );
  return data;
}

export async function cancelarConvite(
  id: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    `/convites/${id}/cancelar`,
  );
  return data;
}

export async function reenviarConvite(
  id: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    `/convites/${id}/reenviar`,
  );
  return data;
}
