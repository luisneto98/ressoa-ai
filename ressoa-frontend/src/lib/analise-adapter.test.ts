import { describe, it, expect } from 'vitest';
import {
  normalizeNivelCobertura,
  normalizeHabilidade,
  normalizeAlerta,
  normalizeAnaliseQualitativa,
  normalizeQuestao,
  normalizeAnaliseV3,
} from './analise-adapter';

describe('analise-adapter', () => {
  describe('normalizeNivelCobertura', () => {
    it('should convert numeric levels to string enums', () => {
      expect(normalizeNivelCobertura(3)).toBe('COMPLETE');
      expect(normalizeNivelCobertura(2)).toBe('PARTIAL');
      expect(normalizeNivelCobertura(1)).toBe('MENTIONED');
      expect(normalizeNivelCobertura(0)).toBe('NOT_COVERED');
    });

    it('should pass through valid string enums', () => {
      expect(normalizeNivelCobertura('COMPLETE')).toBe('COMPLETE');
      expect(normalizeNivelCobertura('partial')).toBe('PARTIAL');
    });

    it('should handle invalid inputs', () => {
      expect(normalizeNivelCobertura(null)).toBe('NOT_COVERED');
      expect(normalizeNivelCobertura(undefined)).toBe('NOT_COVERED');
      expect(normalizeNivelCobertura('invalid')).toBe('NOT_COVERED');
    });
  });

  describe('normalizeHabilidade', () => {
    it('should normalize v3 habilidade to v2 format', () => {
      const habV3 = {
        objetivo_codigo: 'EF09HI01',
        nivel_cobertura: 2,
        evidencias: ['Evidência 1', 'Evidência 2'],
        observacoes: 'Descrição da habilidade',
        criterios_atendidos: ['critério 1'],
        nivel_bloom_detectado: 'Compreender',
        nivel_bloom_planejado: 'Compreender',
        tempo_estimado_minutos: 25,
        adequacao_nivel_cognitivo: 'ADEQUADO',
      };

      const result = normalizeHabilidade(habV3);

      expect(result.codigo).toBe('EF09HI01');
      expect(result.nivel_cobertura).toBe('PARTIAL');
      expect(result.evidencias).toHaveLength(2);
      expect(result.evidencias[0]).toEqual({ texto_literal: 'Evidência 1' });
      expect(result.descricao).toBe('Descrição da habilidade');
      expect(result.criterios_atendidos).toEqual(['critério 1']);
    });

    it('should handle v2 format (backward compat)', () => {
      const habV2 = {
        codigo: 'EF09HI01',
        descricao: 'Descrição',
        nivel_cobertura: 'COMPLETE',
        evidencias: [{ texto_literal: 'Evidência' }],
      };

      const result = normalizeHabilidade(habV2 as any);

      expect(result.codigo).toBe('EF09HI01');
      expect(result.nivel_cobertura).toBe('COMPLETE');
      expect(result.evidencias).toHaveLength(1);
    });
  });

  describe('normalizeAlerta', () => {
    it('should normalize v3 alerta to v2 format', () => {
      const alertaV3 = {
        tipo: 'EXCELENTE_COBERTURA',
        titulo: 'Excelente cobertura curricular atingida',
        descricao: 'A aula apresentou 80% de cobertura...',
        severidade: 'RECONHECIMENTO' as any,
        recomendacao: 'Manter essa abordagem sistemática...',
        dados_suporte: { percentual_cobertura: 80 },
      };

      const result = normalizeAlerta(alertaV3);

      expect(result.tipo).toBe('EXCELENTE_COBERTURA');
      expect(result.nivel).toBe('INFO'); // RECONHECIMENTO → INFO
      expect(result.titulo).toBe('Excelente cobertura curricular atingida');
      expect(result.mensagem).toBe('A aula apresentou 80% de cobertura...');
      expect(result.acoes_sugeridas).toEqual(['Manter essa abordagem sistemática...']);
      expect(result.metadata).toEqual({ percentual_cobertura: 80 });
    });

    it('should map severidade correctly', () => {
      expect(normalizeAlerta({ tipo: '', titulo: '', descricao: '', severidade: 'CRITICO' as any, recomendacao: '' }).nivel).toBe('CRITICAL');
      expect(normalizeAlerta({ tipo: '', titulo: '', descricao: '', severidade: 'IMPORTANTE' as any, recomendacao: '' }).nivel).toBe('WARNING');
      expect(normalizeAlerta({ tipo: '', titulo: '', descricao: '', severidade: 'ATENCAO' as any, recomendacao: '' }).nivel).toBe('WARNING');
      expect(normalizeAlerta({ tipo: '', titulo: '', descricao: '', severidade: 'RECONHECIMENTO' as any, recomendacao: '' }).nivel).toBe('INFO');
    });
  });

  describe('normalizeAnaliseQualitativa', () => {
    it('should normalize v3 nested structure', () => {
      const qualitativaV3 = {
        analise_qualitativa: {
          pontos_fortes: ['Ponto forte 1', 'Ponto forte 2'],
          pontos_melhoria: ['Melhoria 1'],
          adequacao_publico: 'ADEQUADO',
          clareza_conceitual: 'MEDIA',
          engajamento_alunos: 'MEDIO',
          comentario_sintetico: 'Aula bem estruturada',
          niveis_bloom_estimulados: ['LEMBRAR', 'ENTENDER'],
          estrategias_metodologicas: ['Exposição dialogada', 'Perguntas diretas'],
        },
      };

      const result = normalizeAnaliseQualitativa(qualitativaV3, 72);

      expect(result.resumo_geral?.nota_geral).toBe(7.2);
      expect(result.resumo_geral?.pontos_fortes).toEqual(['Ponto forte 1', 'Ponto forte 2']);
      expect(result.resumo_geral?.pontos_atencao).toEqual(['Melhoria 1']); // pontos_melhoria → pontos_atencao
      expect(result.taxonomia_bloom?.niveis_identificados).toEqual(['LEMBRAR', 'ENTENDER']);
      expect(result.metodologia?.metodos_identificados).toEqual(['Exposição dialogada', 'Perguntas diretas']);
      expect(result.engajamento?.nivel).toBe('MEDIO');
    });

    it('should handle v2 format (backward compat)', () => {
      const qualitativaV2 = {
        taxonomia_bloom: { niveis_identificados: [1, 2] },
        resumo_geral: { nota_geral: 8, pontos_fortes: [] },
      };

      const result = normalizeAnaliseQualitativa(qualitativaV2);

      expect(result.taxonomia_bloom).toEqual({ niveis_identificados: [1, 2] });
      expect(result.resumo_geral?.nota_geral).toBe(8);
    });
  });

  describe('normalizeQuestao', () => {
    it('should normalize v3 questao to v2 format', () => {
      const questaoV3 = {
        id: 1,
        tipo: 'DISSERTATIVA',
        titulo: 'A Crise da Monarquia',
        enunciado: 'Cite e explique dois fatores que contribuíram para o enfraquecimento da monarquia.',
        gabarito: 'Fatores como a questão religiosa e a pressão militar foram cruciais.',
        nivel_bloom: 'ENTENDER',
        justificativa: 'A resposta correta deve mencionar a relevância da Igreja e do Exército.',
        habilidades_trabalhadas: ['EF09HI01', 'EF09HI02'],
      } as any;

      const result = normalizeQuestao(questaoV3);

      expect(result.numero).toBe(1);
      expect(result.tipo).toBe('DISSERTATIVA');
      expect(result.enunciado).toContain('Cite e explique');
      expect(result.gabarito?.resposta_curta).toContain('Fatores como a questão religiosa');
      expect(result.nivel_bloom).toBe('ENTENDER');
      expect(result.habilidade_bncc).toBe('EF09HI01'); // Pega a primeira
      expect(result.justificativa_pedagogica).toContain('relevância da Igreja');
    });

    it('should handle v2 format (backward compat)', () => {
      const questaoV2 = {
        numero: 1,
        enunciado: 'Pergunta?',
        gabarito: { resposta_curta: 'Resposta' },
        nivel_bloom: 'APLICAR',
      } as any;

      const result = normalizeQuestao(questaoV2);

      expect(result.numero).toBe(1);
      expect(result.gabarito).toEqual({ resposta_curta: 'Resposta' });
    });
  });

  describe('normalizeAnaliseV3 - Full Integration', () => {
    it('should normalize complete v3 analysis to v2 format', () => {
      const analiseV3 = {
        id: '981f8026-a9be-4802-b09f-d7cd0cdddda9',
        aula: {
          id: '7ce963d8-29d6-424b-a009-dc80b3fb846d',
          titulo: 'Aula - Historia 9B',
          data_aula: '2026-02-09T00:00:00.000Z',
          turma: {
            nome: 'Historia 9B',
            serie: 'NONO_ANO',
            disciplina: 'HISTORIA',
          },
        },
        cobertura_bncc: {
          habilidades: [
            {
              objetivo_codigo: 'EF09HI01',
              nivel_cobertura: 2,
              evidencias: ['Evidência 1'],
              observacoes: 'Descrição',
            },
          ],
        },
        analise_qualitativa: {
          analise_qualitativa: {
            pontos_fortes: ['Forte 1'],
            pontos_melhoria: ['Melhoria 1'],
            adequacao_publico: 'ADEQUADO',
            clareza_conceitual: 'MEDIA',
          },
        },
        relatorio: '# Relatório',
        exercicios: {
          questoes: [{ numero: 1, enunciado: 'Pergunta?', nivel_bloom: 'ENTENDER' }],
        },
        alertas: {
          alertas: [
            {
              tipo: 'TIPO_ALERTA',
              titulo: 'Título',
              descricao: 'Descrição',
              severidade: 'IMPORTANTE',
              recomendacao: 'Recomendação',
            },
          ],
          resumo_alertas: {
            atencao: 1,
            criticos: 0,
            importantes: 1,
            reconhecimentos: 0,
          },
          score_geral_aula: 75,
        },
        metadata: {
          tempo_processamento_ms: 130191,
          custo_total_usd: 0.1702998,
          prompt_versoes: {
            alertas: 'v3.0.0',
            cobertura: 'v3.0.0',
            relatorio: 'v3.0.0',
            exercicios: 'v3.0.0',
            qualitativa: 'v3.0.0',
          },
          created_at: '2026-02-13T18:26:28.524Z',
        },
      };

      const result = normalizeAnaliseV3(analiseV3);

      // Verify cobertura_bncc normalization
      expect(result.cobertura_bncc.habilidades).toHaveLength(1);
      expect(result.cobertura_bncc.habilidades[0].codigo).toBe('EF09HI01');
      expect(result.cobertura_bncc.habilidades[0].nivel_cobertura).toBe('PARTIAL');
      expect(result.cobertura_bncc.habilidades[0].evidencias[0].texto_literal).toBe('Evidência 1');

      // Verify analise_qualitativa normalization
      expect(result.analise_qualitativa.resumo_geral.nota_geral).toBe(7.5);
      expect(result.analise_qualitativa.resumo_geral.pontos_fortes).toEqual(['Forte 1']);
      expect(result.analise_qualitativa.resumo_geral.pontos_atencao).toEqual(['Melhoria 1']);

      // Verify alertas normalization
      expect(result.alertas.alertas).toHaveLength(1);
      expect(result.alertas.alertas[0].nivel).toBe('WARNING');
      expect(result.alertas.alertas[0].mensagem).toBe('Descrição');
      expect(result.alertas.alertas[0].acoes_sugeridas).toEqual(['Recomendação']);

      // Verify exercicios
      expect(result.exercicios.questoes).toHaveLength(1);
      expect(result.exercicios.questoes[0].numero).toBe(1);
    });

    it('should pass through v2 format unchanged', () => {
      const analiseV2 = {
        id: '123',
        cobertura_bncc: {
          habilidades: [
            {
              codigo: 'EF09HI01',
              nivel_cobertura: 'COMPLETE',
              evidencias: [{ texto_literal: 'Evidência' }],
            },
          ],
        },
        analise_qualitativa: {
          resumo_geral: { nota_geral: 8, pontos_fortes: [] },
        },
        metadata: {
          prompt_versoes: {
            cobertura: 'v2.0.0',
          },
        },
      };

      const result = normalizeAnaliseV3(analiseV2);

      // Should be unchanged (not v3)
      expect(result.cobertura_bncc.habilidades[0].codigo).toBe('EF09HI01');
      expect(result.cobertura_bncc.habilidades[0].nivel_cobertura).toBe('COMPLETE');
    });
  });
});
