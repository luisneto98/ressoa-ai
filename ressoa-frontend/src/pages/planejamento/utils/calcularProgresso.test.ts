import { describe, it, expect } from 'vitest';
import { calcularProgresso } from './calcularProgresso';
import type { Planejamento } from '../hooks/usePlanejamentos';

describe('calcularProgresso', () => {
  const mockPlanejamentoBase: Planejamento = {
    id: 'plan-1',
    turma_id: 'turma-1',
    turma: {
      id: 'turma-1',
      nome: '6º Ano A',
      disciplina: 'MATEMATICA',
      serie: 6,
    },
    bimestre: 1,
    ano_letivo: 2026,
    validado_coordenacao: false,
    habilidades: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('deve retornar 0 quando planejamento é undefined', () => {
    const resultado = calcularProgresso(undefined);
    expect(resultado).toBe(0);
  });

  it('deve retornar 100 quando planejamento está validado pela coordenação', () => {
    const planejamentoValidado: Planejamento = {
      ...mockPlanejamentoBase,
      validado_coordenacao: true,
      habilidades: [
        {
          id: 'hab-1',
          habilidade_id: 'ef06ma01-id',
          habilidade: {
            codigo: 'EF06MA01',
            descricao: 'Comparar números naturais',
          },
          peso: 2,
          aulas_previstas: 3,
        },
      ],
    };

    const resultado = calcularProgresso(planejamentoValidado);
    expect(resultado).toBe(100);
  });

  it('deve retornar 50 quando planejamento tem habilidades mas não está validado', () => {
    const planejamentoComHabilidades: Planejamento = {
      ...mockPlanejamentoBase,
      validado_coordenacao: false,
      habilidades: [
        {
          id: 'hab-1',
          habilidade_id: 'ef06ma01-id',
          habilidade: {
            codigo: 'EF06MA01',
            descricao: 'Comparar números naturais',
          },
        },
      ],
    };

    const resultado = calcularProgresso(planejamentoComHabilidades);
    expect(resultado).toBe(50);
  });

  it('deve retornar 0 quando planejamento não tem habilidades', () => {
    const planejamentoVazio: Planejamento = {
      ...mockPlanejamentoBase,
      validado_coordenacao: false,
      habilidades: [],
    };

    const resultado = calcularProgresso(planejamentoVazio);
    expect(resultado).toBe(0);
  });

  it('deve retornar 100 para planejamento validado mesmo sem habilidades (edge case)', () => {
    // Edge case: coordenador validou planejamento vazio (talvez erro, mas deve respeitar flag)
    const planejamentoValidadoSemHabs: Planejamento = {
      ...mockPlanejamentoBase,
      validado_coordenacao: true,
      habilidades: [],
    };

    const resultado = calcularProgresso(planejamentoValidadoSemHabs);
    expect(resultado).toBe(100);
  });
});
