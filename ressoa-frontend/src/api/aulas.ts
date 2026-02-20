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
  bimestre: number;
  ano_letivo: number;
  turma_id: string;
  turma: {
    id: string;
    nome: string;
    disciplina: string;
    serie: string;
  };
  habilidades?: Array<{
    id: string;
    habilidade: {
      codigo: string;
      descricao: string;
    };
  }>;
  _count?: {
    habilidades: number;
    objetivos: number;
  };
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
  escola_id: string;
  professor_id: string;
  turma_id: string;
  data: string;
  planejamento_id?: string;
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL' | null; // Story 16.2: null para rascunhos
  descricao?: string | null; // Story 16.2: objetivo/intenção da aula
  status_processamento: StatusProcessamento;
  created_at: string;
}

export interface AulaListItem {
  id: string;
  turma_id: string;
  turma_nome: string;
  data: string;
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL' | null; // Story 16.2: null para rascunhos
  descricao?: string | null; // Story 16.2: objetivo/intenção da aula
  status_processamento: StatusProcessamento;
  arquivo_tamanho?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export type StatusProcessamento =
  | 'RASCUNHO' // Story 16.2: Aula planejada, aguardando envio de áudio ou texto
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
  const response = await apiClient.get('/turmas');
  return response.data;
};

// GET planejamentos filtrados por turma
export const fetchTurmaPlanejamentos = async (turmaId: string): Promise<Planejamento[]> => {
  const response = await apiClient.get(`/planejamentos?turma_id=${turmaId}`);
  return response.data;
};

// POST criar aula (AUDIO tipo_entrada)
export const createAula = async (data: CreateAulaDto): Promise<Aula> => {
  const response = await apiClient.post('/aulas', data);
  return response.data;
};

// POST upload transcricao
export const uploadTranscricao = async (data: UploadTranscricaoDto): Promise<Aula> => {
  const response = await apiClient.post('/aulas/upload-transcricao', data);
  return response.data;
};

// POST entrada manual
export const entradaManual = async (data: EntradaManualDto): Promise<Aula> => {
  const response = await apiClient.post('/aulas/entrada-manual', data);
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

  const response = await apiClient.get(`/aulas?${queryParams}`);
  return response.data;
};

// POST reprocessar aula com erro
export const reprocessAula = async (aulaId: string): Promise<void> => {
  await apiClient.post(`/aulas/${aulaId}/reprocessar`);
};

// DELETE aula
export const deleteAula = async (aulaId: string): Promise<void> => {
  await apiClient.delete(`/aulas/${aulaId}`);
};

// ─────────────────────────────────────────────────────────────
// Story 16.2: Rascunho de Aula
// ─────────────────────────────────────────────────────────────

export interface CreateAulaRascunhoDto {
  turma_id: string;
  data: string;
  planejamento_id?: string;
  descricao?: string;
}

export interface UpdateAulaDescricaoDto {
  descricao?: string;
}

export interface IniciarProcessamentoDto {
  tipo_entrada: 'AUDIO' | 'TRANSCRICAO' | 'MANUAL';
  transcricao_texto?: string;
  resumo?: string;
}

// POST criar rascunho de aula (datas futuras permitidas)
export const createAulaRascunho = async (data: CreateAulaRascunhoDto): Promise<Aula> => {
  const response = await apiClient.post('/aulas/rascunho', data);
  return response.data;
};

// PATCH editar descrição de rascunho (somente status RASCUNHO)
export const updateAulaDescricao = async (aulaId: string, data: UpdateAulaDescricaoDto): Promise<Aula> => {
  const response = await apiClient.patch(`/aulas/${aulaId}/descricao`, data);
  return response.data;
};

// POST iniciar processamento de rascunho (RASCUNHO → CRIADA ou TRANSCRITA)
export const iniciarProcessamento = async (aulaId: string, data: IniciarProcessamentoDto): Promise<Aula> => {
  const response = await apiClient.post(`/aulas/${aulaId}/iniciar`, data);
  return response.data;
};
