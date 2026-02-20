/**
 * Adapter para normalizar análises de diferentes versões (v2 → v3 → v4)
 *
 * V3 Changes:
 * - cobertura_bncc.habilidades: "codigo" → "objetivo_codigo", nivel_cobertura: string → number
 * - analise_qualitativa: estrutura reorganizada com aninhamento duplo
 * - alertas: "nivel" → "severidade", "mensagem" → "descricao", "acoes_sugeridas" → "recomendacao"
 * - exercicios_original: "exercicios" → aninhado dentro
 *
 * V4 Changes (incrementais sobre V3):
 * - cobertura_bncc.habilidades[].evidencias: string[] → {tipo, texto, speaker}[]
 * - analise_qualitativa.analise_qualitativa: adiciona campo participacao_alunos
 * - alertas: adiciona campo speaker_analysis
 * - exercicios_original: usa chave "exercicios" em vez de "questoes"
 */

export type NivelCobertura = 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED';
export type NivelAlerta = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AderenciaObjetivoJson {
  faixa_aderencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'TOTAL';
  descricao_faixa: string;
  analise_qualitativa: string;
  pontos_atingidos: string[];
  pontos_nao_atingidos: string[];
  recomendacao: string;
}

interface EvidenciaV4 {
  tipo: string;
  texto: string;
  speaker: 'PROFESSOR' | 'ALUNO';
}

interface HabilidadeV3 {
  objetivo_codigo: string;
  nivel_cobertura: number; // 1-3
  evidencias: string[] | EvidenciaV4[] | Array<{ texto_literal: string }>;
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
  evidencias: Array<{ texto_literal: string; speaker?: string; tipo?: string }>;
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

interface ParticipacaoAlunos {
  observacoes: string;
  perguntas_alunos: number;
  respostas_alunos: number;
  qualidade_interacoes: string;
  intervencoes_contadas: number;
  tempo_estimado_fala_alunos_pct: number;
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
    participacao_alunos?: ParticipacaoAlunos; // V4
  };
}

interface AnaliseQualitativaNormalized {
  taxonomia_bloom?: any;
  metodologia?: any;
  adequacao_linguistica?: any;
  engajamento?: any;
  clareza_comunicacao?: any;
  coerencia_narrativa?: any;
  participacao_alunos?: {
    perguntas_alunos: number;
    respostas_alunos: number;
    intervencoes_contadas: number;
    tempo_fala_alunos_pct: number;
    qualidade_interacoes: string;
    observacoes: string;
  };
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
  gabarito: string | object; // v3 usa string direta
  nivel_bloom: string;
  justificativa?: string;
  habilidades_trabalhadas?: string[];
  alternativas?: Array<{ letra: string; texto: string; correta?: boolean }>;
  // Campos v2 (backward compat)
  numero?: number;
}

interface QuestaoNormalized {
  numero: number;
  tipo?: string;
  enunciado: string;
  alternativas?: Array<{ letra: string; texto: string; correta: boolean }>;
  gabarito?: {
    resposta_curta?: string;
  };
  nivel_bloom: string | number;
  habilidade_bncc?: string;
  justificativa_pedagogica?: string;
}

/**
 * Converte nivel_cobertura numérico (v3/v4) para string enum (v2)
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
 * Normaliza habilidade v3/v4 → v2
 * V4 evidencias: {tipo, texto, speaker}[] → {texto_literal, speaker?, tipo?}[]
 */
export function normalizeHabilidade(hab: HabilidadeV3): HabilidadeNormalized {
  const codigo = hab.objetivo_codigo || hab.codigo || 'N/A';
  const descricao = hab.descricao || hab.observacoes || '';
  const nivel_cobertura = normalizeNivelCobertura(hab.nivel_cobertura);

  // Evidências: v4 usa {tipo, texto, speaker}[], v3 usa string[], v2 usa {texto_literal}[]
  let evidencias: Array<{ texto_literal: string; speaker?: string; tipo?: string }> = [];
  if (Array.isArray(hab.evidencias)) {
    evidencias = hab.evidencias.map((ev: any) => {
      if (typeof ev === 'string') return { texto_literal: ev };
      // V4 format: { tipo, texto, speaker }
      if ('texto' in ev) return { texto_literal: ev.texto, speaker: ev.speaker, tipo: ev.tipo };
      // V2 format: { texto_literal, speaker?, tipo? }
      return ev;
    });
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
 * Mapeia severidade v3/v4 → nivel v2
 */
function mapSeveridadeToNivel(severidade: string): NivelAlerta {
  const upper = severidade.toUpperCase();
  if (upper === 'CRITICO') return 'CRITICAL';
  if (upper === 'IMPORTANTE' || upper === 'ATENCAO') return 'WARNING';
  return 'INFO'; // RECONHECIMENTO, etc
}

/**
 * Normaliza alerta v3/v4 → v2
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
 * Calcula nota geral baseada no score_geral_aula (v3/v4)
 */
function calcularNotaGeral(score?: number): number {
  if (!score) return 7; // Default neutro
  // score_geral_aula está em escala 0-100, converter para 0-10
  return Math.round((score / 100) * 10 * 10) / 10; // Arredonda para 1 casa decimal
}

/**
 * Normaliza questão v3/v4 → v2
 * V3/V4: { id, gabarito: string, habilidades_trabalhadas: string[] }
 * V2: { numero, gabarito: { resposta_curta }, habilidade_bncc: string }
 */
export function normalizeQuestao(questao: QuestaoV3): QuestaoNormalized {
  // Se já está no formato v2 (tem numero ao invés de id), retorna direto
  if (questao.numero !== undefined) {
    return questao as any;
  }

  const isMultipla = questao.tipo === 'MULTIPLA_ESCOLHA';
  const gabaritoStr = typeof questao.gabarito === 'string' ? questao.gabarito : undefined;

  // Preserva alternativas e marca a correta com base no gabarito (só para múltipla escolha)
  const alternativas = questao.alternativas?.map((alt) => ({
    letra: alt.letra,
    texto: alt.texto,
    correta: isMultipla && gabaritoStr
      ? alt.letra.toUpperCase() === gabaritoStr.toUpperCase()
      : (alt.correta ?? false),
  }));

  return {
    numero: questao.id,
    tipo: questao.tipo,
    enunciado: questao.enunciado,
    alternativas,
    // Para múltipla escolha o gabarito já está embutido nas alternativas marcadas
    gabarito: isMultipla
      ? undefined
      : typeof questao.gabarito === 'string'
        ? { resposta_curta: questao.gabarito }
        : (questao.gabarito as QuestaoNormalized['gabarito']),
    nivel_bloom: questao.nivel_bloom,
    habilidade_bncc: questao.habilidades_trabalhadas?.[0], // Pega a primeira habilidade
    justificativa_pedagogica: questao.justificativa,
  };
}

/**
 * Normaliza analise_qualitativa v3/v4 → v2
 * V3/V4 tem aninhamento duplo: { analise_qualitativa: { pontos_fortes, ..., participacao_alunos? } }
 */
export function normalizeAnaliseQualitativa(
  qualitativaV3: AnaliseQualitativaV3 | any,
  scoreGeralAula?: number
): AnaliseQualitativaNormalized {
  // Se já está no formato v2, retorna direto
  if (qualitativaV3?.taxonomia_bloom || qualitativaV3?.resumo_geral) {
    return qualitativaV3;
  }

  // Extrai o objeto aninhado v3/v4
  const qual = qualitativaV3?.analise_qualitativa || qualitativaV3 || {};

  // Normaliza participacao_alunos (V4)
  const participacaoAlunos = qual.participacao_alunos
    ? {
        perguntas_alunos: qual.participacao_alunos.perguntas_alunos,
        respostas_alunos: qual.participacao_alunos.respostas_alunos,
        intervencoes_contadas: qual.participacao_alunos.intervencoes_contadas,
        tempo_fala_alunos_pct: qual.participacao_alunos.tempo_estimado_fala_alunos_pct,
        qualidade_interacoes: qual.participacao_alunos.qualidade_interacoes,
        observacoes: qual.participacao_alunos.observacoes,
      }
    : undefined;

  // Mapeia para estrutura v2
  return {
    resumo_geral: {
      nota_geral: calcularNotaGeral(scoreGeralAula),
      pontos_fortes: qual.pontos_fortes || [],
      pontos_atencao: qual.pontos_melhoria || [], // v3/v4 usa "pontos_melhoria"
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
    comentario_sintetico: qual.comentario_sintetico, // V3/V4: Preserva comentário sintético
    participacao_alunos: participacaoAlunos, // V4: dados de participação
  };
}

/**
 * Adapter principal: normaliza análise completa v3/v4 → v2.
 * Para v5+, retorna o objeto original sem transformação (pass-through).
 * Garante que aderencia_objetivo_json é propagado em todas as versões.
 */
export function normalizeAnaliseV3(analise: any): any {
  const version = analise.metadata?.prompt_versoes?.cobertura;
  const needsNormalization = version?.startsWith('v3') || version?.startsWith('v4');

  if (!needsNormalization) {
    return analise; // Já está em v2 ou formato legado
  }

  // exercicios_original: V4 usa chave "exercicios" (não "questoes")
  // V3 usa "questoes" (mesmo formato que exercicios)
  const exerciciosOriginalQuestoes =
    analise.exercicios_original?.questoes ??
    analise.exercicios_original?.exercicios; // V4

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
      speaker_analysis: analise.alertas?.speaker_analysis, // V4
    },
    exercicios: {
      questoes: (analise.exercicios?.questoes || []).map(normalizeQuestao),
    },
    exercicios_original: exerciciosOriginalQuestoes
      ? { questoes: exerciciosOriginalQuestoes.map(normalizeQuestao) }
      : analise.exercicios_original,
    aderencia_objetivo_json: analise.aderencia_objetivo_json ?? null,
  };
}
