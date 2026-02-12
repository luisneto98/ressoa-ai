import { apiClient } from './axios';

// Interfaces
export interface Turma {
  id: string;
  nome: string;
  ano: string;
  disciplina: string;
}

export interface Planejamento {
  id: string;
  titulo: string;
  periodo: string;
}

export interface CreateAulaDto {
  turma_id: string;
  data: string;
  planejamento_id?: string;
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';
}

export interface UploadTranscricaoDto {
  turma_id: string;
  data: string;
  planejamento_id?: string;
  transcricao_texto: string;
}

export interface EntradaManualDto {
  turma_id: string;
  data: string;
  planejamento_id?: string;
  resumo: string;
}

export interface Aula {
  id: string;
  turma_id: string;
  data: string;
  planejamento_id?: string;
  tipo_entrada: string;
  status_processamento: string;
  created_at: string;
}

export interface AulaListItem {
  id: string;
  turma_id: string;
  turma_nome: string;
  data: string;
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';
  status_processamento: StatusProcessamento;
  arquivo_tamanho?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export type StatusProcessamento =
  | 'CRIADA'
  | 'UPLOAD_PROGRESSO'
  | 'AGUARDANDO_TRANSCRICAO'
  | 'TRANSCRITA'
  | 'ANALISANDO'
  | 'ANALISADA'
  | 'APROVADA'
  | 'REJEITADA'
  | 'ERRO';

export interface FetchAulasParams {
  turma_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string[];
  page?: number;
  limit?: number;
}

// GET turmas do professor autenticado
export const fetchProfessorTurmas = async (): Promise<Turma[]> => {
  const response = await apiClient.get('/api/v1/turmas');
  return response.data;
};

// GET planejamentos filtrados por turma
export const fetchTurmaPlanejamentos = async (turmaId: string): Promise<Planejamento[]> => {
  const response = await apiClient.get(`/api/v1/planejamentos?turma_id=${turmaId}`);
  return response.data;
};

// POST criar aula (AUDIO tipo_entrada)
export const createAula = async (data: CreateAulaDto): Promise<Aula> => {
  const response = await apiClient.post('/api/v1/aulas', data);
  return response.data;
};

// POST upload transcricao
export const uploadTranscricao = async (data: UploadTranscricaoDto): Promise<Aula> => {
  const response = await apiClient.post('/api/v1/aulas/upload-transcricao', data);
  return response.data;
};

// POST entrada manual
export const entradaManual = async (data: EntradaManualDto): Promise<Aula> => {
  const response = await apiClient.post('/api/v1/aulas/entrada-manual', data);
  return response.data;
};

// GET aulas com filtros (Story 3.5)
export const fetchAulas = async (params: FetchAulasParams): Promise<AulaListItem[]> => {
  const queryParams = new URLSearchParams();
  if (params.turma_id) queryParams.append('turma_id', params.turma_id);
  if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio);
  if (params.data_fim) queryParams.append('data_fim', params.data_fim);
  if (params.status?.length) {
    params.status.forEach(s => queryParams.append('status', s));
  }
  queryParams.append('page', String(params.page || 1));
  queryParams.append('limit', String(params.limit || 20));

  const response = await apiClient.get(`/api/v1/aulas?${queryParams}`);
  return response.data;
};

// POST reprocessar aula com erro
export const reprocessAula = async (aulaId: string): Promise<void> => {
  await apiClient.post(`/api/v1/aulas/${aulaId}/reprocessar`);
};

// DELETE aula
export const deleteAula = async (aulaId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/aulas/${aulaId}`);
};
