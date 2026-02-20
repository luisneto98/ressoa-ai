/**
 * Vocabulary/context prompts for STT providers (Whisper, Groq).
 *
 * These are NOT instructions — they provide vocabulary context so the
 * speech-recognition model can better handle domain-specific terms.
 *
 * Limit: 224 tokens (~800 characters) per prompt.
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text/prompting
 */
export const STT_PROMPTS: Record<string, string> = {
  matematica: `Frações, equações, álgebra, geometria, probabilidade, estatística.
Habilidades BNCC: EF06MA01, EF07MA02, EF08MA03, EF09MA04.
Termos: mínimo múltiplo comum, máximo divisor comum, plano cartesiano,
números racionais, expressões algébricas, teorema de Pitágoras.`,

  lingua_portuguesa: `Gêneros textuais, coesão, coerência, morfossintaxe, semântica.
Habilidades BNCC: EF67LP01, EF69LP03, EF89LP05.
Termos: substantivo, adjetivo, advérbio, conjunção, oração subordinada,
figuras de linguagem, dissertação argumentativa, crônica, resenha.`,

  ciencias: `Ecossistema, célula, átomo, molécula, energia, fotossíntese.
Habilidades BNCC: EF06CI01, EF07CI02, EF08CI03, EF09CI04.
Termos: sistema digestório, cadeia alimentar, tabela periódica,
reação química, gravitação, eletromagnetismo, camada de ozônio.`,

  default: `Habilidades BNCC, competências, objetivos de aprendizagem.
Termos pedagógicos: avaliação formativa, sequência didática,
plano de aula, metodologia ativa, aprendizagem significativa.`,
};

/**
 * Maximum prompt length in characters (~224 tokens).
 * Whisper API rejects prompts exceeding this limit.
 */
export const STT_PROMPT_MAX_LENGTH = 800;

/**
 * Maps a discipline name (from Disciplina.nome) to its STT_PROMPTS key.
 *
 * Uses normalized lowercase comparison with diacritic removal.
 */
export function resolveSttPromptKey(disciplinaNome: string): string {
  const normalized = disciplinaNome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('matematica')) return 'matematica';
  if (
    normalized.includes('lingua portuguesa') ||
    normalized.includes('portugues')
  )
    return 'lingua_portuguesa';
  if (normalized.includes('ciencia')) return 'ciencias';

  return 'default';
}
