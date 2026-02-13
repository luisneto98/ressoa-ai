import type { Turma } from '@/types/turma';

/**
 * Sugere código automático para objetivo de aprendizagem baseado em:
 * - Prefixo do contexto pedagógico da turma (ex: "Preparatório PM" → "PM")
 * - Sigla da área de conhecimento (ex: "Matemática" → "MAT")
 * - Número sequencial verificando duplicatas (01, 02, 03...)
 *
 * @param turma - Turma customizada
 * @param area - Área de conhecimento (opcional)
 * @param existingCodes - Códigos já existentes (para evitar duplicatas)
 * @returns Código sugerido (ex: "PM-MAT-01")
 *
 * @example
 * suggestObjetivoCodigo(
 *   { contexto_pedagogico: { objetivo_geral: 'Preparatório PM-SP 2026' } },
 *   'Matemática - Raciocínio',
 *   ['PM-MAT-01']
 * ) // → 'PM-MAT-02'
 */
export function suggestObjetivoCodigo(
  turma: Turma | undefined,
  area?: string,
  existingCodes: string[] = []
): string {
  // Extrair prefixo do contexto pedagógico
  let prefixo = 'CUR'; // Fallback padrão

  if (turma?.contexto_pedagogico?.objetivo_geral) {
    const objetivo = turma.contexto_pedagogico.objetivo_geral;

    // Tentar extrair prefixo de padrões comuns
    const patterns = [
      /Preparatório\s+([\w\-]+)/i, // "Preparatório PM-SP" → "PM"
      /Curso\s+([\w]+)/i, // "Curso Inglês" → "ING"
      /([\w]+)\s+Técnico/i, // "Enfermagem Técnico" → "ENF"
      /^([\w]+)/i, // Primeira palavra
    ];

    for (const pattern of patterns) {
      const match = objetivo.match(pattern);
      if (match && match[1]) {
        const extracted = match[1]
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3);
        // Skip if result is numeric-only (e.g., "2026")
        if (!/^\d+$/.test(extracted)) {
          prefixo = extracted;
          break;
        }
      }
    }
  }

  // Extrair sigla da área de conhecimento
  let areaSigla = 'GEN'; // Fallback padrão

  if (area && area.trim()) {
    // Extrair primeira palavra da área (antes de hífen ou vírgula)
    const areaPrimeiraPalavra = area.split(/[-,]/)[0].trim();
    areaSigla = areaPrimeiraPalavra
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3);
  }

  // Gerar número sequencial verificando duplicatas
  let seq = 1;
  while (existingCodes.includes(`${prefixo}-${areaSigla}-${String(seq).padStart(2, '0')}`)) {
    seq++;
    if (seq > 99) {
      // Fallback: adicionar sufixo aleatório se > 99 objetivos
      return `${prefixo}-${areaSigla}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    }
  }

  return `${prefixo}-${areaSigla}-${String(seq).padStart(2, '0')}`;
}
