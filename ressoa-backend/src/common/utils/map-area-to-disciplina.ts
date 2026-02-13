/**
 * Maps Ensino Médio BNCC areas to existing disciplinas
 * Story 10.3: Ensino Médio support
 *
 * @param area - BNCC Ensino Médio area name (e.g., "Linguagens e suas Tecnologias")
 * @returns Disciplina code (e.g., "LINGUA_PORTUGUESA")
 */
export function mapAreaToDisciplina(area: string): string {
  const map: Record<string, string> = {
    'Linguagens e suas Tecnologias': 'LINGUA_PORTUGUESA', // MVP: foco em LP
    'Matemática e suas Tecnologias': 'MATEMATICA',
    'Ciências da Natureza e suas Tecnologias': 'CIENCIAS', // Bio+Fís+Qui
    'Ciências Humanas e Sociais Aplicadas': 'CIENCIAS_HUMANAS', // NEW
  };

  return map[area] || 'OUTROS';
}
