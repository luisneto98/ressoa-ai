/**
 * Types for Análise entities and related data structures
 * Story 11.9: Support for BNCC and Custom curriculum objectives
 */

export type NivelCobertura = 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';

export type NivelBloom =
  | 'LEMBRAR'
  | 'ENTENDER'
  | 'APLICAR'
  | 'ANALISAR'
  | 'AVALIAR'
  | 'CRIAR';

/**
 * Generic objective interface (can be BNCC habilidade or custom objetivo)
 */
export interface ObjetivoAnalise {
  codigo: string;
  descricao: string;
  nivel_cobertura: NivelCobertura;
  evidencias: Array<{ texto_literal: string }>;

  // BNCC-specific (optional)
  unidade_tematica?: string;

  // Custom-specific (optional)
  nivel_bloom_planejado?: NivelBloom;
  nivel_bloom_detectado?: NivelBloom;
  criterios_evidencia?: string[];
  criterios_atendidos?: string[];
}
