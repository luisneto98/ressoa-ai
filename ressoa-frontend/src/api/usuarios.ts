import { apiClient } from '@/api/axios';

export interface UsuarioListItem {
  id: string;
  nome: string;
  email: string;
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN' | null;
  created_at: string;
  escola_nome?: string;
  escola_id?: string;
}

export interface UsuariosListResponse {
  data: UsuarioListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UsuariosQueryParams {
  page: number;
  limit?: number;
  search?: string;
  role?: string;
  escola_id?: string;
}

export async function fetchUsuarios(
  params: UsuariosQueryParams,
): Promise<UsuariosListResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.role) queryParams.set('role', params.role);
  if (params.escola_id) queryParams.set('escola_id', params.escola_id);

  const { data } = await apiClient.get<UsuariosListResponse>(
    `/usuarios?${queryParams}`,
  );
  return data;
}
