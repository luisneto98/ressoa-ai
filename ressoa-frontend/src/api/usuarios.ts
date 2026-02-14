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

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
}

export interface UpdateUsuarioResponse {
  id: string;
  nome: string;
  email: string;
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN' | null;
  created_at: string;
  updated_at: string;
}

export async function updateUsuario(
  id: string,
  data: UpdateUsuarioData,
): Promise<UpdateUsuarioResponse> {
  const response = await apiClient.patch<UpdateUsuarioResponse>(`/usuarios/${id}`, data);
  return response.data;
}

export interface DeactivateUsuarioResponse {
  id: string;
  nome: string;
  email: string;
  role: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'ADMIN' | null;
  deleted_at: string;
  created_at: string;
  updated_at: string;
}

export async function deactivateUsuario(id: string): Promise<DeactivateUsuarioResponse> {
  const response = await apiClient.patch<DeactivateUsuarioResponse>(`/usuarios/${id}/desativar`);
  return response.data;
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
