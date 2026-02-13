// Types for Turma (Class) entity
// Generated for Story 10.4 - Frontend CRUD de Turmas

export const TipoEnsino = {
  FUNDAMENTAL: 'FUNDAMENTAL',
  MEDIO: 'MEDIO',
} as const;

export type TipoEnsino = typeof TipoEnsino[keyof typeof TipoEnsino];

export const Serie = {
  // Ensino Fundamental (6º-9º ano)
  SEXTO_ANO: 'SEXTO_ANO',
  SETIMO_ANO: 'SETIMO_ANO',
  OITAVO_ANO: 'OITAVO_ANO',
  NONO_ANO: 'NONO_ANO',
  // Ensino Médio (1º-3º ano EM)
  PRIMEIRO_ANO_EM: 'PRIMEIRO_ANO_EM',
  SEGUNDO_ANO_EM: 'SEGUNDO_ANO_EM',
  TERCEIRO_ANO_EM: 'TERCEIRO_ANO_EM',
} as const;

export type Serie = typeof Serie[keyof typeof Serie];

export const Turno = {
  MATUTINO: 'MATUTINO',
  VESPERTINO: 'VESPERTINO',
  INTEGRAL: 'INTEGRAL',
} as const;

export type Turno = typeof Turno[keyof typeof Turno];

export interface Turma {
  id: string;
  nome: string;
  tipo_ensino: TipoEnsino;
  serie: Serie;
  disciplina: string;
  ano_letivo: number;
  turno: Turno;
  quantidade_alunos: number | null;
  escola_id: string;
  professor_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTurmaDto {
  nome: string;
  tipo_ensino: TipoEnsino;
  serie: Serie;
  disciplina: string;
  ano_letivo: number;
  turno: Turno;
  quantidade_alunos?: number | null;
}

export interface UpdateTurmaDto {
  nome?: string;
  tipo_ensino?: TipoEnsino;
  serie?: Serie;
  disciplina?: string;
  ano_letivo?: number;
  turno?: Turno;
  quantidade_alunos?: number | null;
}

// Helper type for form data (used with zod schema)
export type TurmaFormData = Omit<CreateTurmaDto, 'quantidade_alunos'> & {
  quantidade_alunos: number | null;
};

// Display helpers
export const SERIE_LABELS: Record<Serie, string> = {
  [Serie.SEXTO_ANO]: '6º Ano',
  [Serie.SETIMO_ANO]: '7º Ano',
  [Serie.OITAVO_ANO]: '8º Ano',
  [Serie.NONO_ANO]: '9º Ano',
  [Serie.PRIMEIRO_ANO_EM]: '1º Ano (EM)',
  [Serie.SEGUNDO_ANO_EM]: '2º Ano (EM)',
  [Serie.TERCEIRO_ANO_EM]: '3º Ano (EM)',
};

export const TURNO_LABELS: Record<Turno, string> = {
  [Turno.MATUTINO]: 'Matutino',
  [Turno.VESPERTINO]: 'Vespertino',
  [Turno.INTEGRAL]: 'Integral',
};

export const TIPO_ENSINO_LABELS: Record<TipoEnsino, string> = {
  [TipoEnsino.FUNDAMENTAL]: 'Fundamental',
  [TipoEnsino.MEDIO]: 'Médio',
};

// Helper to get series by tipo_ensino
export const getSeriesByTipoEnsino = (tipoEnsino: TipoEnsino): Serie[] => {
  if (tipoEnsino === TipoEnsino.FUNDAMENTAL) {
    return [Serie.SEXTO_ANO, Serie.SETIMO_ANO, Serie.OITAVO_ANO, Serie.NONO_ANO];
  }
  return [Serie.PRIMEIRO_ANO_EM, Serie.SEGUNDO_ANO_EM, Serie.TERCEIRO_ANO_EM];
};
