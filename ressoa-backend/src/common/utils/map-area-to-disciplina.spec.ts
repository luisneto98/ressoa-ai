/**
 * Unit tests for mapAreaToDisciplina helper
 * Story 10.3: Ensino Médio BNCC area → disciplina mapping
 */

import { mapAreaToDisciplina } from './map-area-to-disciplina';

describe('mapAreaToDisciplina', () => {
  it('should map LGG to LINGUA_PORTUGUESA', () => {
    expect(mapAreaToDisciplina('Linguagens e suas Tecnologias')).toBe(
      'LINGUA_PORTUGUESA',
    );
  });

  it('should map MAT to MATEMATICA', () => {
    expect(mapAreaToDisciplina('Matemática e suas Tecnologias')).toBe(
      'MATEMATICA',
    );
  });

  it('should map CNT to CIENCIAS', () => {
    expect(mapAreaToDisciplina('Ciências da Natureza e suas Tecnologias')).toBe(
      'CIENCIAS',
    );
  });

  it('should map CHS to CIENCIAS_HUMANAS', () => {
    expect(mapAreaToDisciplina('Ciências Humanas e Sociais Aplicadas')).toBe(
      'CIENCIAS_HUMANAS',
    );
  });

  it('should return OUTROS for unknown area', () => {
    expect(mapAreaToDisciplina('Área Desconhecida')).toBe('OUTROS');
  });

  it('should return OUTROS for empty string', () => {
    expect(mapAreaToDisciplina('')).toBe('OUTROS');
  });

  it('should be case-sensitive', () => {
    // Test that exact case matching is required
    expect(mapAreaToDisciplina('linguagens e suas tecnologias')).toBe('OUTROS');
    expect(mapAreaToDisciplina('MATEMÁTICA E SUAS TECNOLOGIAS')).toBe('OUTROS');
  });
});
