import { describe, it, expect } from 'vitest';
import { getCoberturaLabel, getItensPlanejadasLabel, getItensTrabalhadasLabel } from './cobertura-helpers';

describe('cobertura-helpers - Story 11.8 AC3', () => {
  describe('getCoberturaLabel', () => {
    it('returns BNCC label when curriculo_tipo is BNCC', () => {
      const result = getCoberturaLabel('BNCC');

      expect(result.title).toBe('% Habilidades BNCC');
      expect(result.tooltip).toContain('habilidades BNCC planejadas');
    });

    it('returns CUSTOM label when curriculo_tipo is CUSTOM', () => {
      const result = getCoberturaLabel('CUSTOM');

      expect(result.title).toBe('% Objetivos Customizados');
      expect(result.tooltip).toContain('objetivos de aprendizagem customizados');
    });

    it('returns general label when curriculo_tipo is TODOS', () => {
      const result = getCoberturaLabel('TODOS');

      expect(result.title).toBe('% Cobertura Geral');
      expect(result.tooltip).toContain('BNCC + Customizados');
    });

    it('returns general label when curriculo_tipo is undefined', () => {
      const result = getCoberturaLabel();

      expect(result.title).toBe('% Cobertura Geral');
      expect(result.tooltip).toContain('objetivos planejados');
    });
  });

  describe('getItensPlanejadasLabel', () => {
    it('returns "Objetivos Planejados" for CUSTOM', () => {
      expect(getItensPlanejadasLabel('CUSTOM')).toBe('Objetivos Planejados');
    });

    it('returns "Habilidades Planejadas" for BNCC', () => {
      expect(getItensPlanejadasLabel('BNCC')).toBe('Habilidades Planejadas');
    });
  });

  describe('getItensTrabalhadasLabel', () => {
    it('returns "Objetivos Trabalhados" for CUSTOM', () => {
      expect(getItensTrabalhadasLabel('CUSTOM')).toBe('Objetivos Trabalhados');
    });

    it('returns "Habilidades Trabalhadas" for BNCC', () => {
      expect(getItensTrabalhadasLabel('BNCC')).toBe('Habilidades Trabalhadas');
    });
  });
});
