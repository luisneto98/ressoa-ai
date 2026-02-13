/**
 * Tipos e constantes para Objetivos de Aprendizagem Customizados
 *
 * Taxonomia de Bloom: 6 níveis cognitivos que descrevem como os alunos processam
 * e aplicam conhecimento, do mais simples (Lembrar) ao mais complexo (Criar).
 *
 * @see https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/
 */

/**
 * Níveis Cognitivos da Taxonomia de Bloom (ordem crescente de complexidade)
 */
export const NivelBloom = {
  LEMBRAR: 'LEMBRAR',
  ENTENDER: 'ENTENDER',
  APLICAR: 'APLICAR',
  ANALISAR: 'ANALISAR',
  AVALIAR: 'AVALIAR',
  CRIAR: 'CRIAR',
} as const;

export type NivelBloom = typeof NivelBloom[keyof typeof NivelBloom];

/**
 * Interface completa de um Objetivo de Aprendizagem Customizado
 */
export interface ObjetivoCustom {
  id: string;
  codigo: string;
  descricao: string;
  nivel_cognitivo: NivelBloom;
  area_conhecimento?: string;
  criterios_evidencia: string[];
  ordem: number;
  turma_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para criação de objetivo (sem id e timestamps)
 */
export interface CreateObjetivoDto {
  codigo: string;
  descricao: string;
  nivel_cognitivo: NivelBloom;
  area_conhecimento?: string;
  criterios_evidencia: string[];
  ordem: number;
}

/**
 * DTO para atualização parcial de objetivo
 */
export type UpdateObjetivoDto = Partial<CreateObjetivoDto>;

/**
 * Labels amigáveis para cada nível Bloom
 */
export const NIVEL_BLOOM_LABELS: Record<NivelBloom, string> = {
  [NivelBloom.LEMBRAR]: 'Lembrar',
  [NivelBloom.ENTENDER]: 'Entender',
  [NivelBloom.APLICAR]: 'Aplicar',
  [NivelBloom.ANALISAR]: 'Analisar',
  [NivelBloom.AVALIAR]: 'Avaliar',
  [NivelBloom.CRIAR]: 'Criar',
};

/**
 * Descrições pedagógicas para cada nível Bloom
 * (usadas em tooltips e ajuda contextual)
 */
export const NIVEL_BLOOM_DESCRIPTIONS: Record<NivelBloom, string> = {
  [NivelBloom.LEMBRAR]: 'Recordar informações (ex: definir, listar, nomear)',
  [NivelBloom.ENTENDER]: 'Explicar ideias com próprias palavras (ex: descrever, explicar)',
  [NivelBloom.APLICAR]: 'Usar conhecimento em situações práticas (ex: resolver, demonstrar)',
  [NivelBloom.ANALISAR]: 'Examinar e relacionar partes (ex: comparar, diferenciar)',
  [NivelBloom.AVALIAR]: 'Julgar valor baseado em critérios (ex: justificar, criticar)',
  [NivelBloom.CRIAR]: 'Produzir algo novo ou original (ex: projetar, desenvolver)',
};

/**
 * Cores Tailwind para badges de nível Bloom (visual pedagógico)
 */
export const NIVEL_BLOOM_COLORS: Record<NivelBloom, { bg: string; text: string; border: string }> = {
  [NivelBloom.LEMBRAR]: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  [NivelBloom.ENTENDER]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  [NivelBloom.APLICAR]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  [NivelBloom.ANALISAR]: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  [NivelBloom.AVALIAR]: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  [NivelBloom.CRIAR]: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
};
