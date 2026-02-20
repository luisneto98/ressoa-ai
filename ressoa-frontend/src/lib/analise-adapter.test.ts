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

    it('should handle MULTIPLA_ESCOLHA with alternativas and mark correct answer', () => {
      const questaoV3 = {
        id: 1,
        tipo: 'MULTIPLA_ESCOLHA',
        enunciado: 'Qual o ano da Proclamação da República?',
        gabarito: 'B',
        nivel_bloom: 'LEMBRAR',
        justificativa: 'A Proclamação da República foi em 1889.',
        habilidades_trabalhadas: ['EF09HI03'],
        alternativas: [
          { letra: 'A', texto: '1888' },
          { letra: 'B', texto: '1889' },
          { letra: 'C', texto: '1890' },
          { letra: 'D', texto: '1891' },
        ],
      } as any;

      const result = normalizeQuestao(questaoV3);

      expect(result.numero).toBe(1);
      expect(result.tipo).toBe('MULTIPLA_ESCOLHA');
      // Alternativas devem ser preservadas
      expect(result.alternativas).toHaveLength(4);
      // Só B deve estar marcada como correta
      expect(result.alternativas?.find(a => a.letra === 'B')?.correta).toBe(true);
      expect(result.alternativas?.find(a => a.letra === 'A')?.correta).toBe(false);
      expect(result.alternativas?.find(a => a.letra === 'C')?.correta).toBe(false);
      // Gabarito não deve ser gerado (a informação está nas alternativas)
      expect(result.gabarito).toBeUndefined();
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

    it('should normalize complete v4 analysis with new fields', () => {
      const analiseV4 = {
        id: 'v4-test-id',
        aula: {
          id: 'aula-v4',
          titulo: 'Aula - Português 6º ano',
          data_aula: '2026-02-19T00:00:00.000Z',
          turma: { nome: 'Turma 6A', serie: 'SEXTO_ANO', disciplina: 'LINGUA_PORTUGUESA' },
        },
        cobertura_bncc: {
          habilidades: [
            {
              objetivo_codigo: 'EF06LP04',
              nivel_cobertura: 2,
              evidencias: [
                { tipo: 'professor-explanation', texto: '[00:33:740] [PROFESSOR] Substantivos próprios.', speaker: 'PROFESSOR' },
                { tipo: 'student-response', texto: '[00:51:740] [ALUNO] Dando nomes.', speaker: 'ALUNO' },
              ],
              observacoes: 'Professora explica substantivos.',
              nivel_bloom_detectado: 'Compreensão',
              nivel_bloom_planejado: 'Conhecimento',
              tempo_estimado_minutos: 15,
              adequacao_nivel_cognitivo: 'ADEQUADO',
            },
          ],
        },
        analise_qualitativa: {
          analise_qualitativa: {
            pontos_fortes: ['Contextualização do conteúdo'],
            pontos_melhoria: ['Estruturação da aula'],
            adequacao_publico: 'ADEQUADO',
            clareza_conceitual: 'MEDIA',
            engajamento_alunos: 'MEDIO',
            comentario_sintetico: 'Aula com bom potencial.',
            niveis_bloom_estimulados: ['LEMBRAR', 'ENTENDER'],
            estrategias_metodologicas: ['Exposição dialogada'],
            participacao_alunos: {
              observacoes: 'Participação incentivada por perguntas.',
              perguntas_alunos: 3,
              respostas_alunos: 18,
              qualidade_interacoes: 'MEDIA',
              intervencoes_contadas: 21,
              tempo_estimado_fala_alunos_pct: 20,
            },
          },
        },
        relatorio: '## Relatório V4',
        exercicios: {
          questoes: [
            { id: 1, tipo: 'DISSERTATIVA', enunciado: 'Questão 1?', gabarito: 'Resposta 1.', nivel_bloom: 'ENTENDER', habilidades_trabalhadas: ['EF06LP04'] },
          ],
        },
        exercicios_original: {
          exercicios: [
            { id: 1, tipo: 'DISSERTATIVA', enunciado: 'Questão 1?', gabarito: 'Resposta 1.', nivel_bloom: 'ENTENDER', habilidades_trabalhadas: ['EF06LP04'] },
          ],
          observacoes_gerais: 'Exercícios contextualizados.',
        },
        alertas: {
          alertas: [
            { tipo: 'PARTICIPACAO_DESEQUILIBRADA', titulo: 'Participação Desequilibrada', descricao: 'Professor fala 80%.', severidade: 'IMPORTANTE', recomendacao: 'Incentivar mais participação.' },
          ],
          resumo_alertas: { atencao: 1, criticos: 0, importantes: 2, reconhecimentos: 1 },
          score_geral_aula: 75,
          speaker_analysis: {
            professor_fala_pct: 80,
            alunos_fala_pct: 20,
            trocas_dialogicas: 26,
            total_intervencoes_alunos: 21,
            total_perguntas_professor: 5,
          },
        },
        metadata: {
          tempo_processamento_ms: 61549,
          custo_total_usd: 0.034,
          prompt_versoes: { alertas: 'v4.0.0', cobertura: 'v4.0.0', relatorio: 'v4.0.0', exercicios: 'v4.0.0', qualitativa: 'v4.0.0' },
          created_at: '2026-02-19T18:20:45.853Z',
        },
      };

      const result = normalizeAnaliseV3(analiseV4);

      // V4 evidencias: {tipo, texto, speaker} → {texto_literal, speaker, tipo}
      const hab = result.cobertura_bncc.habilidades[0];
      expect(hab.codigo).toBe('EF06LP04');
      expect(hab.nivel_cobertura).toBe('PARTIAL');
      expect(hab.evidencias).toHaveLength(2);
      expect(hab.evidencias[0].texto_literal).toBe('[00:33:740] [PROFESSOR] Substantivos próprios.');
      expect(hab.evidencias[0].speaker).toBe('PROFESSOR');
      expect(hab.evidencias[0].tipo).toBe('professor-explanation');
      expect(hab.evidencias[1].speaker).toBe('ALUNO');

      // participacao_alunos normalization
      expect(result.analise_qualitativa.participacao_alunos).toBeDefined();
      expect(result.analise_qualitativa.participacao_alunos.perguntas_alunos).toBe(3);
      expect(result.analise_qualitativa.participacao_alunos.respostas_alunos).toBe(18);
      expect(result.analise_qualitativa.participacao_alunos.intervencoes_contadas).toBe(21);
      expect(result.analise_qualitativa.participacao_alunos.tempo_fala_alunos_pct).toBe(20);
      expect(result.analise_qualitativa.participacao_alunos.qualidade_interacoes).toBe('MEDIA');

      // speaker_analysis passthrough
      expect(result.alertas.speaker_analysis).toBeDefined();
      expect(result.alertas.speaker_analysis.professor_fala_pct).toBe(80);
      expect(result.alertas.speaker_analysis.alunos_fala_pct).toBe(20);
      expect(result.alertas.speaker_analysis.trocas_dialogicas).toBe(26);

      // exercicios_original V4 (exercicios → questoes)
      expect(result.exercicios_original.questoes).toHaveLength(1);
      expect(result.exercicios_original.questoes[0].numero).toBe(1);

      // exercicios normalization
      expect(result.exercicios.questoes[0].habilidade_bncc).toBe('EF06LP04');
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

  describe('normalizeAnaliseV3 — Story 16.5', () => {
    const baseAnalise = {
      id: 'v5-test-id',
      aula: {
        id: 'aula-v5',
        titulo: 'Aula de Matemática',
        data_aula: '2026-02-20T00:00:00.000Z',
        turma: { nome: 'Turma 7A', serie: 'SETIMO_ANO', disciplina: 'MATEMATICA' },
        descricao: 'Trabalhar frações equivalentes com material concreto',
      },
      cobertura_bncc: { habilidades: [] },
      analise_qualitativa: {
        analise_qualitativa: { pontos_fortes: [], pontos_melhoria: [] },
      },
      relatorio: '# Relatório',
      exercicios: { questoes: [] },
      alertas: { alertas: [], score_geral_aula: 80 },
      metadata: {
        tempo_processamento_ms: 1000,
        custo_total_usd: 0.01,
        prompt_versoes: { cobertura: 'v5.0.0' },
        created_at: '2026-02-20T00:00:00.000Z',
      },
    };

    const mockAderencia = {
      faixa_aderencia: 'ALTA' as const,
      descricao_faixa: 'Entre 70% e 90% do objetivo declarado foi trabalhado',
      analise_qualitativa: 'O professor planejou trabalhar frações equivalentes.',
      pontos_atingidos: ['Uso de exemplos visuais'],
      pontos_nao_atingidos: ['Atividade em grupos não realizada'],
      recomendacao: 'Retomar a atividade em grupos na próxima aula.',
    };

    it('passa aderencia_objetivo_json sem transformação quando presente', () => {
      const analise = { ...baseAnalise, aderencia_objetivo_json: mockAderencia };
      const result = normalizeAnaliseV3(analise);

      expect(result.aderencia_objetivo_json).toBeDefined();
      expect(result.aderencia_objetivo_json?.faixa_aderencia).toBe('ALTA');
      expect(result.aderencia_objetivo_json?.pontos_atingidos).toEqual(['Uso de exemplos visuais']);
      expect(result.aderencia_objetivo_json?.recomendacao).toBe('Retomar a atividade em grupos na próxima aula.');
    });

    it('preserva aderencia_objetivo_json como null quando ausente', () => {
      const analise = { ...baseAnalise, aderencia_objetivo_json: null };
      const result = normalizeAnaliseV3(analise);

      expect(result.aderencia_objetivo_json).toBeNull();
    });

    it('passa aula.descricao sem transformação', () => {
      const analise = { ...baseAnalise, aderencia_objetivo_json: mockAderencia };
      const result = normalizeAnaliseV3(analise);

      expect(result.aula.descricao).toBe('Trabalhar frações equivalentes com material concreto');
    });

    it('normalizeAnaliseV3 é retrocompatível com responses v4 (sem aderencia)', () => {
      const analiseV4 = {
        ...baseAnalise,
        metadata: {
          ...baseAnalise.metadata,
          prompt_versoes: { cobertura: 'v4.0.0' },
        },
        // No aderencia_objetivo_json field at all
      };
      // Should not throw
      expect(() => normalizeAnaliseV3(analiseV4)).not.toThrow();
      const result = normalizeAnaliseV3(analiseV4);
      expect(result.aderencia_objetivo_json).toBeNull();
      expect(result.cobertura_bncc).toBeDefined();
    });

    it('preserva aderencia_objetivo_json no caminho de normalização v3/v4', () => {
      // Exercises the explicit `aderencia_objetivo_json: analise.aderencia_objetivo_json ?? null`
      // in the normalization return (not the early-return path)
      const analiseV3ComAderencia = {
        ...baseAnalise,
        metadata: {
          ...baseAnalise.metadata,
          prompt_versoes: { cobertura: 'v3.0.0' },
        },
        aderencia_objetivo_json: mockAderencia,
      };
      const result = normalizeAnaliseV3(analiseV3ComAderencia);

      expect(result.aderencia_objetivo_json).toBeDefined();
      expect(result.aderencia_objetivo_json?.faixa_aderencia).toBe('ALTA');
      expect(result.aderencia_objetivo_json?.pontos_atingidos).toEqual(['Uso de exemplos visuais']);
      // Normalization should not have mutated aderencia
      expect(result.aderencia_objetivo_json?.recomendacao).toBe('Retomar a atividade em grupos na próxima aula.');
    });
  });
});
