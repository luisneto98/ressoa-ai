/**
 * Helper functions for adaptive coverage labels and tooltips
 * Story 11.8 AC3: Dynamic metric labels based on curriculum type
 */

export interface CoberturaLabelConfig {
  title: string;
  tooltip: string;
}

/**
 * Returns appropriate label and tooltip based on curriculum type filter
 *
 * @param curriculo_tipo - 'BNCC', 'CUSTOM', or 'TODOS'
 * @returns Label configuration for coverage metrics
 */
export function getCoberturaLabel(
  curriculo_tipo?: 'BNCC' | 'CUSTOM' | 'TODOS'
): CoberturaLabelConfig {
  switch (curriculo_tipo) {
    case 'BNCC':
      return {
        title: '% Habilidades BNCC',
        tooltip: 'Percentual de habilidades BNCC planejadas que foram trabalhadas em aula',
      };
    case 'CUSTOM':
      return {
        title: '% Objetivos Customizados',
        tooltip: 'Percentual de objetivos de aprendizagem customizados que foram abordados',
      };
    case 'TODOS':
    default:
      return {
        title: '% Objetivos Gerais',
        tooltip: 'Percentual de objetivos planejados (BNCC + Customizados) que foram trabalhados',
      };
  }
}

/**
 * Returns label for "items planejados" column based on curriculum type
 */
export function getItensPlanejadasLabel(curriculo_tipo?: 'BNCC' | 'CUSTOM'): string {
  return curriculo_tipo === 'CUSTOM'
    ? 'Objetivos Planejados'
    : 'Habilidades Planejadas';
}

/**
 * Returns label for "items trabalhados" column based on curriculum type
 */
export function getItensTrabalhadasLabel(curriculo_tipo?: 'BNCC' | 'CUSTOM'): string {
  return curriculo_tipo === 'CUSTOM'
    ? 'Objetivos Trabalhados'
    : 'Habilidades Trabalhadas';
}

/**
 * Returns header label for coverage section in report view (Story 11.9 AC1)
 *
 * @param curriculo_tipo - 'BNCC' or 'CUSTOM'
 * @returns Header text for coverage section
 */
export function getCoberturaHeaderLabel(curriculo_tipo?: 'BNCC' | 'CUSTOM'): string {
  return curriculo_tipo === 'CUSTOM'
    ? 'Cobertura de Objetivos de Aprendizagem'
    : 'Cobertura de Habilidades BNCC';
}

/**
 * Returns status label for coverage badge (Story 11.9 AC3)
 *
 * @param curriculo_tipo - 'BNCC' or 'CUSTOM'
 * @param nivel_cobertura - Coverage level enum
 * @returns Localized status label
 */
export function getStatusLabel(
  curriculo_tipo: 'BNCC' | 'CUSTOM' | undefined,
  nivel_cobertura: 'COMPLETE' | 'PARTIAL' | 'MENTIONED' | 'NOT_COVERED'
): string {
  if (curriculo_tipo === 'CUSTOM') {
    switch (nivel_cobertura) {
      case 'COMPLETE':
        return 'Atingido';
      case 'PARTIAL':
        return 'Parcialmente Atingido';
      case 'MENTIONED':
        return 'Não Atingido'; // Custom não usa "Mencionado", mapeia para "Não Atingido"
      case 'NOT_COVERED':
        return 'Não Atingido';
      default:
        return 'Desconhecido';
    }
  }

  // BNCC (default)
  switch (nivel_cobertura) {
    case 'COMPLETE':
      return 'Completo';
    case 'PARTIAL':
      return 'Parcial';
    case 'MENTIONED':
      return 'Mencionado';
    case 'NOT_COVERED':
      return 'Não Coberto';
    default:
      return 'Desconhecido';
  }
}
