import type { Planejamento } from '../hooks/usePlanejamentos';

/**
 * Calcula progresso de cobertura de um planejamento
 * Baseado em habilidades planejadas vs status de validação
 *
 * MVP simplificado:
 * - Planejamento validado pela coordenação: 100%
 * - Planejamento com habilidades mas não validado: 50%
 * - Sem habilidades: 0%
 *
 * Futura melhoria (Epic 6-7): Integrar com aulas ministradas para cobertura real
 *
 * @param planejamento - Planejamento do bimestre
 * @returns Percentual 0-100
 */
export function calcularProgresso(planejamento: Planejamento | undefined): number {
  if (!planejamento) return 0;

  // Planejamento validado = cobertura completa
  if (planejamento.validado_coordenacao) {
    return 100;
  }

  // Tem habilidades planejadas, mas não validado ainda = em progresso
  if (planejamento.habilidades.length > 0) {
    return 50;
  }

  // Vazio ou sem habilidades
  return 0;
}
