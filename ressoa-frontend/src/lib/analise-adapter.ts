/**
 * Adapter para normalizar análises de diferentes versões (v2 → v3)
 *
 * V3 Changes:
 * - cobertura_bncc.habilidades: "codigo" → "objetivo_codigo", nivel_cobertura: string → number
 * - analise_qualitativa: estrutura reorganizada com aninhamento duplo
 * - alertas: "nivel" → "severidade", "mensagem" → "descricao", "acoes_sugeridas" → "recomendacao"
 * - exercicios_original: "exercicios" → aninhado dentro
 */

export type NivelCobertura = 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
export type NivelAlerta = 'INFO' | 'WARNING' | 'CRITICAL';

interface HabilidadeV3 {
  objetivo_codigo: string;
  nivel_cobertura: number; // 1-3
  evidencias: string[];
  observacoes?: string;
  criterios_atendidos?: string[];
  nivel_bloom_detectado?: string;
  nivel_bloom_planejado?: string;
  tempo_estimado_minutos?: number;
  adequacao_nivel_cognitivo?: string;
  // Campos v2 (backward compat)
  codigo?: string;
  descricao?: string;
  unidade_tematica?: string;
}

interface HabilidadeNormalized {
  codigo: string;
  descricao: string;
  nivel_cobertura: NivelCobertura;
  evidencias: Array<{ texto_literal: string }>;
  observacoes?: string;
  criterios_atendidos?: string[];
  nivel_bloom_detectado?: string;
  nivel_bloom_planejado?: string;
  tempo_estimado_minutos?: number;
  adequacao_nivel_cognitivo?: string;
  unidade_tematica?: string;
}

interface AlertaV3 {
  tipo: string;
  titulo: string;
  descricao: string;
  severidade: 'RECONHECIMENTO' | 'ATENCAO' | 'IMPORTANTE' | 'CRITICO';
  recomendacao: string;
  dados_suporte?: any;
}

interface AlertaNormalized {
  tipo: string;
  nivel: NivelAlerta;
  titulo: string;
  mensagem: string;
  acoes_sugeridas: string[];
  metadata?: any;
}

interface AnaliseQualitativaV3 {
  analise_qualitativa: {
    pontos_fortes?: string[];
    pontos_melhoria?: string[];
    adequacao_publico?: string;
    clareza_conceitual?: string;
    engajamento_alunos?: string;
    comentario_sintetico?: string;
    niveis_bloom_estimulados?: string[];
    estrategias_metodologicas?: string[];
  };
}

interface AnaliseQualitativaNormalized {
  taxonomia_bloom?: any;
  metodologia?: any;
  adequacao_linguistica?: any;
  engajamento?: any;
  clareza_comunicacao?: any;
  coerencia_narrativa?: any;
  resumo_geral?: {
    nota_geral: number;
    pontos_fortes: string[];
    pontos_atencao: string[];
  };
}

interface QuestaoV3 {
  id: number;
  tipo: string;
  titulo?: string;
  enunciado: string;
  gabarito: string; // v3 usa string direta
  nivel_bloom: string;
  justificativa?: string;
  habilidades_trabalhadas?: string[];
  // Campos v2 (backward compat)
  numero?: number;
}

interface QuestaoNormalized {
  numero: number;
  tipo?: string;
  enunciado: string;
  gabarito?: {
    resposta_curta?: string;
  };
  nivel_bloom: string | number;
  habilidade_bncc?: string;
  justificativa_pedagogica?: string;
}

/**
 * Converte nivel_cobertura numérico (v3) para string enum (v2)
 */
export function normalizeNivelCobertura(nivel: unknown): NivelCobertura {
  if (typeof nivel === 'string') {
    const upper = nivel.toUpperCase();
    if (['COMPLETE', 'PARTIAL', 'MENTIONED', 'NOT_COVERED'].includes(upper)) {
      return upper as NivelCobertura;
    }
  }
  if (typeof nivel === 'number') {
    if (nivel >= 3) return 'COMPLETE';
    if (nivel === 2) return 'PARTIAL';
    if (nivel === 1) return 'MENTIONED';
    return 'NOT_COVERED';
  }
  return 'NOT_COVERED';
}

/**
 * Normaliza habilidade v3 → v2
 */
export function normalizeHabilidade(hab: HabilidadeV3): HabilidadeNormalized {
  const codigo = hab.objetivo_codigo || hab.codigo || 'N/A';
  const descricao = hab.descricao || hab.observacoes || '';
  const nivel_cobertura = normalizeNivelCobertura(hab.nivel_cobertura);

  // Evidências: v3 usa string[], v2 usa {texto_literal: string}[]
  let evidencias: Array<{ texto_literal: string }> = [];
  if (Array.isArray(hab.evidencias)) {
    evidencias = hab.evidencias.map((ev: any) =>
      typeof ev === 'string' ? { texto_literal: ev } : ev
    );
  }

  return {
    codigo,
    descricao,
    nivel_cobertura,
    evidencias,
    observacoes: hab.observacoes,
    criterios_atendidos: hab.criterios_atendidos,
    nivel_bloom_detectado: hab.nivel_bloom_detectado,
    nivel_bloom_planejado: hab.nivel_bloom_planejado,
    tempo_estimado_minutos: hab.tempo_estimado_minutos,
    adequacao_nivel_cognitivo: hab.adequacao_nivel_cognitivo as 'ADEQUADO' | 'ABAIXO' | 'ACIMA' | undefined,
    unidade_tematica: hab.unidade_tematica,
  };
}

/**
 * Mapeia severidade v3 → nivel v2
 */
function mapSeveridadeToNivel(severidade: string): NivelAlerta {
  const upper = severidade.toUpperCase();
  if (upper === 'CRITICO') return 'CRITICAL';
  if (upper === 'IMPORTANTE' || upper === 'ATENCAO') return 'WARNING';
  return 'INFO'; // RECONHECIMENTO, etc
}

/**
 * Normaliza alerta v3 → v2
 */
export function normalizeAlerta(alerta: AlertaV3): AlertaNormalized {
  return {
    tipo: alerta.tipo,
    nivel: mapSeveridadeToNivel(alerta.severidade),
    titulo: alerta.titulo,
    mensagem: alerta.descricao,
    acoes_sugeridas: alerta.recomendacao ? [alerta.recomendacao] : [],
    metadata: alerta.dados_suporte,
  };
}

/**
 * Calcula nota geral baseada no score_geral_aula (v3)
 */
function calcularNotaGeral(score?: number): number {
  if (!score) return 7; // Default neutro
  // score_geral_aula está em escala 0-100, converter para 0-10
  return Math.round((score / 100) * 10 * 10) / 10; // Arredonda para 1 casa decimal
}

/**
 * Normaliza questão v3 → v2
 * V3: { id, gabarito: string, habilidades_trabalhadas: string[] }
 * V2: { numero, gabarito: { resposta_curta }, habilidade_bncc: string }
 */
export function normalizeQuestao(questao: QuestaoV3): QuestaoNormalized {
  // Se já está no formato v2 (tem numero ao invés de id), retorna direto
  if (questao.numero !== undefined) {
    return questao as any;
  }

  return {
    numero: questao.id,
    tipo: questao.tipo,
    enunciado: questao.enunciado,
    gabarito: typeof questao.gabarito === 'string'
      ? { resposta_curta: questao.gabarito }
      : questao.gabarito,
    nivel_bloom: questao.nivel_bloom,
    habilidade_bncc: questao.habilidades_trabalhadas?.[0], // Pega a primeira habilidade
    justificativa_pedagogica: questao.justificativa,
  };
}

/**
 * Normaliza analise_qualitativa v3 → v2
 * V3 tem aninhamento duplo: { analise_qualitativa: { pontos_fortes, ... } }
 */
export function normalizeAnaliseQualitativa(
  qualitativaV3: AnaliseQualitativaV3 | any,
  scoreGeralAula?: number
): AnaliseQualitativaNormalized {
  // Se já está no formato v2, retorna direto
  if (qualitativaV3?.taxonomia_bloom || qualitativaV3?.resumo_geral) {
    return qualitativaV3;
  }

  // Extrai o objeto aninhado v3
  const qual = qualitativaV3?.analise_qualitativa || qualitativaV3 || {};

  // Mapeia para estrutura v2
  return {
    resumo_geral: {
      nota_geral: calcularNotaGeral(scoreGeralAula),
      pontos_fortes: qual.pontos_fortes || [],
      pontos_atencao: qual.pontos_melhoria || [], // v3 usa "pontos_melhoria"
    },
    taxonomia_bloom: {
      niveis_identificados: qual.niveis_bloom_estimulados || [],
      nivel_dominante: qual.niveis_bloom_estimulados?.[0] || 'Compreender',
    },
    metodologia: {
      dominante: qual.estrategias_metodologicas?.[0] || 'Exposição dialogada',
      metodos_identificados: qual.estrategias_metodologicas || [],
    },
    engajamento: {
      nivel: qual.engajamento_alunos || 'MEDIO',
      observacoes: qual.comentario_sintetico || '',
    },
    clareza_comunicacao: {
      score: qual.clareza_conceitual === 'ALTA' ? 9 : qual.clareza_conceitual === 'MEDIA' ? 7 : 5,
    },
    adequacao_linguistica: {
      adequada_para_serie: qual.adequacao_publico !== 'INADEQUADO',
    },
    coerencia_narrativa: {
      estrutura_presente: true, // Inferido
    },
    comentario_sintetico: qual.comentario_sintetico, // V3: Preserva comentário sintético
  };
}

/**
 * Adapter principal: converte análise completa v3 → v2
 */
export function normalizeAnaliseV3(analise: any): any {
  const isV3 = analise.metadata?.prompt_versoes?.cobertura?.startsWith('v3');

  if (!isV3) {
    return analise; // Já está em v2 ou formato legado
  }

  return {
    ...analise,
    cobertura_bncc: {
      habilidades: (analise.cobertura_bncc?.habilidades || []).map(normalizeHabilidade),
    },
    analise_qualitativa: normalizeAnaliseQualitativa(
      analise.analise_qualitativa,
      analise.alertas?.score_geral_aula
    ),
    alertas: {
      alertas: (analise.alertas?.alertas || []).map(normalizeAlerta),
      sugestoes_proxima_aula: analise.alertas?.sugestoes_proxima_aula || [],
      resumo: {
        total_alertas: (analise.alertas?.resumo_alertas?.atencao || 0) + (analise.alertas?.resumo_alertas?.criticos || 0) + (analise.alertas?.resumo_alertas?.importantes || 0),
        alertas_criticos: analise.alertas?.resumo_alertas?.criticos || 0,
        alertas_atencao: (analise.alertas?.resumo_alertas?.atencao || 0) + (analise.alertas?.resumo_alertas?.importantes || 0),
        alertas_informativos: analise.alertas?.resumo_alertas?.reconhecimentos || 0,
        status_geral: analise.alertas?.score_geral_aula >= 80 ? 'EXCELENTE' :
                       analise.alertas?.score_geral_aula >= 60 ? 'BOM' : 'ATENCAO',
      },
      score_geral_aula: analise.alertas?.score_geral_aula,
    },
    exercicios: {
      questoes: (analise.exercicios?.questoes || []).map(normalizeQuestao),
    },
  };
}
