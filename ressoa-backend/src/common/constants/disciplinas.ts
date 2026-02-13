export const DISCIPLINAS = [
  'MATEMATICA',
  'LINGUA_PORTUGUESA',
  'CIENCIAS',
  'HISTORIA',
  'GEOGRAFIA',
  'ARTE',
  'EDUCACAO_FISICA',
  'INGLES',
] as const;

export type Disciplina = (typeof DISCIPLINAS)[number];
