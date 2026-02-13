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
