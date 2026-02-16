/**
 * Resultado da diarização via LLM.
 * Contém SRT formatado com labels [PROFESSOR]/[ALUNO] e métricas de speaker.
 */
export interface DiarizationResult {
  /** SRT formatado com identificação de falantes */
  srt: string;

  /** Provider utilizado (GEMINI_FLASH, GPT4_MINI, ou 'FALLBACK') */
  provider: string;

  /** Custo da chamada LLM em USD (0 para fallback) */
  custo_usd: number;

  /** Tempo de processamento da diarização em ms */
  tempo_processamento_ms: number;

  /** Número total de segmentos SRT gerados */
  segments_count: number;

  /** Estatísticas de falantes */
  speaker_stats: SpeakerStats;
}

/**
 * Estatísticas de identificação de falantes na diarização.
 */
export interface SpeakerStats {
  /** Número de segmentos identificados como professor */
  professor_segments: number;

  /** Número de segmentos identificados como aluno */
  aluno_segments: number;

  /** Percentual do tempo total atribuído ao professor (0-100) */
  professor_time_pct: number;
}
