import { describe, it, expect } from 'vitest';
import { normalizeAnaliseV3 } from './analise-adapter';

describe('analise-adapter E2E', () => {
  it('should normalize real v3 analysis from backend', () => {
    const realAnaliseV3 = {
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
        status: 'ANALISADA',
        planejamento: null,
      },
      cobertura_bncc: {
        habilidades: [
          {
            evidencias: [
              'Agora no nono ano, os primeiros capítulos do livro vai abordar sobre a república...',
              'E para entender por que a proclamação da república aconteceu...',
            ],
            observacoes: 'Professor explica detalhadamente os fatores que levaram à crise da monarquia',
            nivel_cobertura: 2,
            objetivo_codigo: 'EF09HI01',
            criterios_atendidos: ['explicação dos antecedentes', 'fatores da crise monárquica'],
            nivel_bloom_detectado: 'Compreender',
            nivel_bloom_planejado: 'Compreender',
            tempo_estimado_minutos: 25,
            adequacao_nivel_cognitivo: 'ADEQUADO',
          },
          {
            evidencias: [
              'E aí nós vamos entender a diferença desses dois sistemas de governo...',
            ],
            observacoes: 'Professor estabelece comparações claras entre os sistemas monárquico e republicano',
            nivel_cobertura: 2,
            objetivo_codigo: 'EF09HI02',
            criterios_atendidos: ['diferenciação de sistemas', 'características da república'],
            nivel_bloom_detectado: 'Compreender',
            nivel_bloom_planejado: 'Analisar',
            tempo_estimado_minutos: 15,
            adequacao_nivel_cognitivo: 'ABAIXO',
          },
        ],
      },
      analise_qualitativa: {
        analise_qualitativa: {
          pontos_fortes: [
            'Estabelece conexões temporais claras entre eventos históricos',
            'Utiliza comparações efetivas entre sistemas de governo',
          ],
          pontos_melhoria: [
            'Melhorar organização temporal da aula',
            'Reduzir digressões e tangentes',
          ],
          adequacao_publico: 'ADEQUADO',
          clareza_conceitual: 'MEDIA',
          engajamento_alunos: 'MEDIO',
          comentario_sintetico: 'Aula com boa fundamentação histórica',
          niveis_bloom_estimulados: ['LEMBRAR', 'ENTENDER'],
          estrategias_metodologicas: [
            'Exposição dialogada predominante',
            'Perguntas diretas aos alunos',
          ],
        },
      },
      relatorio: '# Relatório de Análise Pedagógica...',
      relatorio_original: '# Relatório de Análise Pedagógica...',
      tem_edicao_relatorio: false,
      exercicios: {
        questoes: [
          {
            id: 1,
            tipo: 'DISSERTATIVA',
            titulo: 'A Crise da Monarquia',
            gabarito: 'Fatores como a questão religiosa...',
            enunciado: 'A crise da monarquia no Brasil...',
            nivel_bloom: 'ENTENDER',
            justificativa: 'A resposta correta deve mencionar...',
            habilidades_trabalhadas: ['EF09HI01'],
          },
        ],
      },
      exercicios_original: {
        exercicios: [
          {
            id: 1,
            tipo: 'DISSERTATIVA',
            titulo: 'A Crise da Monarquia',
            gabarito: 'Fatores como a questão religiosa...',
            enunciado: 'A crise da monarquia no Brasil...',
            nivel_bloom: 'ENTENDER',
            justificativa: 'A resposta correta deve mencionar...',
            habilidades_trabalhadas: ['EF09HI01'],
          },
        ],
      },
      tem_edicao_exercicios: false,
      alertas: {
        alertas: [
          {
            tipo: 'EXCELENTE_COBERTURA',
            titulo: 'Excelente cobertura curricular atingida',
            descricao: 'A aula apresentou 80% de cobertura das habilidades planejadas',
            severidade: 'RECONHECIMENTO',
            recomendacao: 'Manter essa abordagem sistemática de cobertura curricular',
            dados_suporte: {
              total_habilidades: 5,
              percentual_cobertura: 80,
            },
          },
          {
            tipo: 'CLAREZA_BAIXA',
            titulo: 'Estruturação didática necessita melhorias',
            descricao: 'A análise qualitativa indica clareza conceitual MEDIA',
            severidade: 'IMPORTANTE',
            recomendacao: 'Elaborar roteiro de aula mais estruturado',
            dados_suporte: {
              clareza_conceitual: 'MEDIA',
            },
          },
        ],
        resumo_alertas: {
          atencao: 2,
          criticos: 0,
          importantes: 2,
          reconhecimentos: 2,
        },
        score_geral_aula: 72,
      },
      status: 'AGUARDANDO_REVISAO',
      planejamento_id: null,
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

    const normalized = normalizeAnaliseV3(realAnaliseV3);

    // Verify it was detected as v3
    expect(normalized).toBeDefined();

    // Verify cobertura_bncc
    expect(normalized.cobertura_bncc.habilidades).toHaveLength(2);

    const hab1 = normalized.cobertura_bncc.habilidades[0];
    expect(hab1.codigo).toBe('EF09HI01');
    expect(hab1.descricao).toBe('Professor explica detalhadamente os fatores que levaram à crise da monarquia');
    expect(hab1.nivel_cobertura).toBe('PARTIAL'); // nivel 2 → PARTIAL
    expect(hab1.evidencias).toHaveLength(2);
    expect(hab1.evidencias[0].texto_literal).toContain('Agora no nono ano');
    expect(hab1.criterios_atendidos).toContain('explicação dos antecedentes');
    expect(hab1.nivel_bloom_detectado).toBe('Compreender');
    expect(hab1.adequacao_nivel_cognitivo).toBe('ADEQUADO');

    const hab2 = normalized.cobertura_bncc.habilidades[1];
    expect(hab2.codigo).toBe('EF09HI02');
    expect(hab2.nivel_cobertura).toBe('PARTIAL');
    expect(hab2.adequacao_nivel_cognitivo).toBe('ABAIXO');

    // Verify analise_qualitativa
    expect(normalized.analise_qualitativa.resumo_geral).toBeDefined();
    expect(normalized.analise_qualitativa.resumo_geral.nota_geral).toBe(7.2); // score 72 → nota 7.2
    expect(normalized.analise_qualitativa.resumo_geral.pontos_fortes).toHaveLength(2);
    expect(normalized.analise_qualitativa.resumo_geral.pontos_fortes[0]).toContain('conexões temporais');
    expect(normalized.analise_qualitativa.resumo_geral.pontos_atencao).toHaveLength(2);
    expect(normalized.analise_qualitativa.resumo_geral.pontos_atencao[0]).toContain('organização temporal');

    expect(normalized.analise_qualitativa.taxonomia_bloom.niveis_identificados).toEqual(['LEMBRAR', 'ENTENDER']);
    expect(normalized.analise_qualitativa.metodologia.metodos_identificados).toContain('Exposição dialogada predominante');
    expect(normalized.analise_qualitativa.engajamento.nivel).toBe('MEDIO');

    // Verify alertas
    expect(normalized.alertas.alertas).toHaveLength(2);

    const alerta1 = normalized.alertas.alertas[0];
    expect(alerta1.tipo).toBe('EXCELENTE_COBERTURA');
    expect(alerta1.nivel).toBe('INFO'); // RECONHECIMENTO → INFO
    expect(alerta1.titulo).toBe('Excelente cobertura curricular atingida');
    expect(alerta1.mensagem).toContain('80% de cobertura');
    expect(alerta1.acoes_sugeridas).toHaveLength(1);
    expect(alerta1.acoes_sugeridas[0]).toContain('Manter essa abordagem');
    expect(alerta1.metadata.percentual_cobertura).toBe(80);

    const alerta2 = normalized.alertas.alertas[1];
    expect(alerta2.tipo).toBe('CLAREZA_BAIXA');
    expect(alerta2.nivel).toBe('WARNING'); // IMPORTANTE → WARNING
    expect(alerta2.mensagem).toContain('clareza conceitual MEDIA');

    // Verify alertas resumo
    expect(normalized.alertas.resumo.total_alertas).toBe(4); // atencao(2) + criticos(0) + importantes(2)
    expect(normalized.alertas.resumo.alertas_criticos).toBe(0);
    expect(normalized.alertas.resumo.alertas_atencao).toBe(4); // atencao + importantes
    expect(normalized.alertas.resumo.alertas_informativos).toBe(2); // reconhecimentos
    expect(normalized.alertas.resumo.status_geral).toBe('BOM'); // score 72 → BOM

    // Verify exercicios normalization (v3 → v2)
    expect(normalized.exercicios.questoes).toHaveLength(1);

    const questao = normalized.exercicios.questoes[0];
    expect(questao.numero).toBe(1); // id → numero
    expect(questao.tipo).toBe('DISSERTATIVA');
    expect(questao.enunciado).toContain('A crise da monarquia no Brasil');
    expect(questao.gabarito?.resposta_curta).toContain('Fatores como a questão religiosa'); // string → object
    expect(questao.nivel_bloom).toBe('ENTENDER');
    expect(questao.habilidade_bncc).toBe('EF09HI01'); // habilidades_trabalhadas[0] → habilidade_bncc
    expect(questao.justificativa_pedagogica).toContain('A resposta correta deve mencionar');

    // Verify other fields pass through unchanged
    expect(normalized.id).toBe('981f8026-a9be-4802-b09f-d7cd0cdddda9');
    expect(normalized.relatorio).toContain('Relatório de Análise Pedagógica');
    expect(normalized.status).toBe('AGUARDANDO_REVISAO');
  });
});
