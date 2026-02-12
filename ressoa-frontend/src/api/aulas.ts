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
