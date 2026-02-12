/**
 * Application-wide constants and configurable thresholds
 */

/**
 * Coverage threshold for identifying teachers needing support
 * Default: 70% - Teachers below this threshold are flagged as "abaixo da meta"
 * Can be overridden via environment variable COBERTURA_META_THRESHOLD
 */
export const COBERTURA_META_THRESHOLD = parseInt(
  process.env.COBERTURA_META_THRESHOLD || '70',
  10,
);

/**
 * Review time thresholds (in seconds) for color-coding
 */
export const TEMPO_REVISAO_THRESHOLDS = {
  FAST: 300, // < 5min = green
  MEDIUM: 600, // 5-10min = yellow
  // > 10min = red
};
