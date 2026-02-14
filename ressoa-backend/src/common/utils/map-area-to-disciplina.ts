/**
 * Maps Ensino Médio BNCC areas to existing disciplinas
 * Story 10.3: Ensino Médio support
 *
 * @param area - BNCC Ensino Médio area name or disciplina code
 * @returns Disciplina code (e.g., "LINGUA_PORTUGUESA")
 */
export function mapAreaToDisciplina(area: string): string {
  // Se já é um código de disciplina válido, retorna direto
  const validCodes = [
    'MATEMATICA',
    'LINGUA_PORTUGUESA',
    'CIENCIAS',
    'HISTORIA',
    'GEOGRAFIA',
    'ARTE',
    'EDUCACAO_FISICA',
    'LINGUA_INGLESA',
    'ENSINO_RELIGIOSO',
    'COMPUTACAO',
    'CIENCIAS_HUMANAS',
  ];

  if (validCodes.includes(area)) {
    return area;
  }

  // Mapear nomes de áreas para códigos
  const map: Record<string, string> = {
    'Linguagens e suas Tecnologias': 'LINGUA_PORTUGUESA',
    'Matemática e suas Tecnologias': 'MATEMATICA',
    'Ciências da Natureza e suas Tecnologias': 'CIENCIAS',
    'Ciências Humanas e Sociais Aplicadas': 'CIENCIAS_HUMANAS',
  };

  return map[area] || 'OUTROS';
}
