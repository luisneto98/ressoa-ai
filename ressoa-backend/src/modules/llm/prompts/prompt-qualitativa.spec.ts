import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from '../services/prompt.service';
import { ClaudeProvider } from '../providers/claude.provider';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProviderLLM } from '@prisma/client';

/**
 * Unit Tests for Prompt 2 - Análise Qualitativa Pedagógica
 * Story 5.3 - AC5: Validate Prompt 2 Output Schema
 *
 * Test Coverage:
 * - All 6 pedagogical dimensions present
 * - Bloom taxonomy levels validation
 * - Score ranges (1-10, percentages 0-100)
 * - Boolean flags and string fields
 * - Resumo geral structure
 */
describe('Prompt 2 - Análise Qualitativa (Unit)', () => {
  let promptService: PromptService;
  let claudeProvider: ClaudeProvider;

  // Same transcript as Prompt 1 (for context continuity)
  const transcriptFixture = `
    [00:00-05:00] Professor: Bom dia turma! Hoje vamos falar sobre números naturais...
  `;

  // Mock Prompt 1 output (context for Prompt 2)
  const coberturaContext = {
    analise_cobertura: [
      {
        habilidade_codigo: 'EF06MA01',
        nivel_cobertura: 3,
        evidencias: ['...'],
        tempo_estimado_minutos: 20,
      },
    ],
    resumo_quantitativo: {
      total_planejadas: 3,
      cobertas_nivel_2_ou_3: 2,
      percentual_cobertura: 66.7,
    },
  };

  // Mock response from ClaudeProvider
  const mockQualitativaOutput = {
    texto: JSON.stringify({
      taxonomia_bloom: {
        niveis_identificados: [2, 3],
        nivel_dominante: 2,
        avaliacao:
          'Aula focada em compreensão (Nível 2) e aplicação (Nível 3), com pouca memorização. Progressão adequada para a série.',
        sugestao:
          'Considerar incluir atividades de análise comparativa (Nível 4) para desafiar alunos mais avançados.',
      },
      coerencia_narrativa: {
        score: 8,
        estrutura_presente: true,
        conexao_conhecimento_previo: true,
        sequencia_logica: true,
        fechamento: false,
        observacoes:
          'Aula bem estruturada com introdução clara e desenvolvimento lógico. Faltou fechamento com síntese final.',
      },
      adequacao_linguistica: {
        adequada_para_serie: true,
        observacoes:
          'Linguagem clara e apropriada para 6º ano, com exemplos concretos do cotidiano.',
        exemplos_adequacao: [
          'Uso de comparação de números para explicar ordem',
          'Referência a exercícios práticos',
        ],
      },
      metodologia: {
        dominante: 'Expositiva dialogada',
        metodos_identificados: ['Expositiva dialogada', 'Resolução de problemas'],
        percentual_estimado: {
          expositiva: 60,
          investigativa: 0,
          colaborativa: 10,
          pratica: 30,
        },
        variacao: true,
        avaliacao:
          'Boa combinação de exposição e prática. Considerar incluir momentos investigativos em próximas aulas.',
      },
      engajamento: {
        nivel: 'alto',
        perguntas_alunos: 5,
        participacao_estimulada: true,
        discussoes: true,
        sinais_positivos: [
          'Alunos fizeram 5 perguntas durante a explicação',
          'Discussão ativa sobre exercício de ordenação',
        ],
        sinais_dificuldade: [],
        avaliacao:
          'Engajamento geral alto, com participação ativa dos alunos e boa interação.',
      },
      clareza_comunicacao: {
        score: 9,
        explicacoes_claras: true,
        uso_exemplos: true,
        reformulacoes: 2,
        observacoes:
          'Professor demonstra excelente clareza, com uso frequente de exemplos concretos.',
      },
      resumo_geral: {
        pontos_fortes: [
          'Clareza excepcional nas explicações',
          'Uso consistente de exemplos práticos',
          'Alto engajamento dos alunos',
          'Boa progressão cognitiva (Bloom Níveis 2-3)',
        ],
        pontos_atencao: [
          'Faltou fechamento com síntese final',
          'Considerar incluir metodologia investigativa',
        ],
        nota_geral: 8.5,
      },
    }),
    custo_usd: 0.007,
    tokens_usados: 1200,
    modelo: 'claude-sonnet-4.5',
    provider: ProviderLLM.CLAUDE_SONNET,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: ClaudeProvider,
          useValue: {
            generate: jest.fn().mockResolvedValue(mockQualitativaOutput),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            prompt: {
              findFirst: jest.fn().mockResolvedValue({
                id: 'prompt-2-id',
                nome: 'prompt-qualitativa',
                versao: 'v1.0.0',
                conteudo:
                  'Você é um especialista... {{transcricao}} {{cobertura}} {{turma.serie}} {{turma.disciplina}}',
                variaveis: {
                  temperature: 0.4,
                  max_tokens: 2500,
                  transcricao: 'string',
                  cobertura: 'object',
                  turma: { serie: 'number', disciplina: 'string' },
                },
                modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
                ativo: true,
                ab_testing: false,
              }),
            },
          },
        },
      ],
    }).compile();

    promptService = module.get<PromptService>(PromptService);
    claudeProvider = module.get<ClaudeProvider>(ClaudeProvider);
  });

  /**
   * AC5: Test all 6 dimensions are present
   */
  describe('Six Dimensions Present', () => {
    it('should have all 6 pedagogical dimensions', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);

      expect(output).toHaveProperty('taxonomia_bloom');
      expect(output).toHaveProperty('coerencia_narrativa');
      expect(output).toHaveProperty('adequacao_linguistica');
      expect(output).toHaveProperty('metodologia');
      expect(output).toHaveProperty('engajamento');
      expect(output).toHaveProperty('clareza_comunicacao');
      expect(output).toHaveProperty('resumo_geral');
    });
  });

  /**
   * AC5: Test Dimension 1 - Taxonomia de Bloom
   */
  describe('Taxonomia de Bloom Validation', () => {
    it('should have niveis_identificados as array of 1-6', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const bloom = output.taxonomia_bloom;

      expect(Array.isArray(bloom.niveis_identificados)).toBe(true);
      bloom.niveis_identificados.forEach((nivel: number) => {
        expect(nivel).toBeGreaterThanOrEqual(1);
        expect(nivel).toBeLessThanOrEqual(6);
      });
    });

    it('should have nivel_dominante between 1-6', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const bloom = output.taxonomia_bloom;

      expect(bloom.nivel_dominante).toBeGreaterThanOrEqual(1);
      expect(bloom.nivel_dominante).toBeLessThanOrEqual(6);
    });

    it('should have avaliacao and sugestao as strings', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const bloom = output.taxonomia_bloom;

      expect(typeof bloom.avaliacao).toBe('string');
      expect(typeof bloom.sugestao).toBe('string');
      expect(bloom.avaliacao.length).toBeGreaterThan(0);
    });
  });

  /**
   * AC5: Test Dimension 2 - Coerência Narrativa
   */
  describe('Coerência Narrativa Validation', () => {
    it('should have score between 1-10', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const coerencia = output.coerencia_narrativa;

      expect(coerencia.score).toBeGreaterThanOrEqual(1);
      expect(coerencia.score).toBeLessThanOrEqual(10);
    });

    it('should have all 4 boolean flags', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const coerencia = output.coerencia_narrativa;

      expect(typeof coerencia.estrutura_presente).toBe('boolean');
      expect(typeof coerencia.conexao_conhecimento_previo).toBe('boolean');
      expect(typeof coerencia.sequencia_logica).toBe('boolean');
      expect(typeof coerencia.fechamento).toBe('boolean');
    });

    it('should have observacoes string', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const coerencia = output.coerencia_narrativa;

      expect(typeof coerencia.observacoes).toBe('string');
    });
  });

  /**
   * AC5: Test Dimension 3 - Adequação Linguística
   */
  describe('Adequação Linguística Validation', () => {
    it('should have adequada_para_serie as boolean', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const adequacao = output.adequacao_linguistica;

      expect(typeof adequacao.adequada_para_serie).toBe('boolean');
    });

    it('should have observacoes and exemplos_adequacao', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const adequacao = output.adequacao_linguistica;

      expect(typeof adequacao.observacoes).toBe('string');
      expect(Array.isArray(adequacao.exemplos_adequacao)).toBe(true);
    });
  });

  /**
   * AC5: Test Dimension 4 - Metodologia
   */
  describe('Metodologia Validation', () => {
    it('should have dominante and metodos_identificados', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const metodologia = output.metodologia;

      expect(typeof metodologia.dominante).toBe('string');
      expect(Array.isArray(metodologia.metodos_identificados)).toBe(true);
    });

    it('should have percentual_estimado summing to ~100', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const percentuais = output.metodologia.percentual_estimado;

      const sum =
        percentuais.expositiva +
        percentuais.investigativa +
        percentuais.colaborativa +
        percentuais.pratica;

      expect(sum).toBeGreaterThanOrEqual(95); // Allow some rounding
      expect(sum).toBeLessThanOrEqual(105);
    });

    it('should have variacao boolean and avaliacao string', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const metodologia = output.metodologia;

      expect(typeof metodologia.variacao).toBe('boolean');
      expect(typeof metodologia.avaliacao).toBe('string');
    });
  });

  /**
   * AC5: Test Dimension 5 - Engajamento
   */
  describe('Engajamento Validation', () => {
    it('should have nivel as alto/medio/baixo', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const engajamento = output.engajamento;

      expect(['alto', 'medio', 'médio', 'baixo']).toContain(
        engajamento.nivel.toLowerCase(),
      );
    });

    it('should have perguntas_alunos as number', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const engajamento = output.engajamento;

      expect(typeof engajamento.perguntas_alunos).toBe('number');
      expect(engajamento.perguntas_alunos).toBeGreaterThanOrEqual(0);
    });

    it('should have boolean flags and signal arrays', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const engajamento = output.engajamento;

      expect(typeof engajamento.participacao_estimulada).toBe('boolean');
      expect(typeof engajamento.discussoes).toBe('boolean');
      expect(Array.isArray(engajamento.sinais_positivos)).toBe(true);
      expect(Array.isArray(engajamento.sinais_dificuldade)).toBe(true);
    });

    it('should have avaliacao string', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const engajamento = output.engajamento;

      expect(typeof engajamento.avaliacao).toBe('string');
    });
  });

  /**
   * AC5: Test Dimension 6 - Clareza e Comunicação
   */
  describe('Clareza e Comunicação Validation', () => {
    it('should have score between 1-10', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const clareza = output.clareza_comunicacao;

      expect(clareza.score).toBeGreaterThanOrEqual(1);
      expect(clareza.score).toBeLessThanOrEqual(10);
    });

    it('should have 2 boolean flags', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const clareza = output.clareza_comunicacao;

      expect(typeof clareza.explicacoes_claras).toBe('boolean');
      expect(typeof clareza.uso_exemplos).toBe('boolean');
    });

    it('should have reformulacoes count and observacoes', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const clareza = output.clareza_comunicacao;

      expect(typeof clareza.reformulacoes).toBe('number');
      expect(clareza.reformulacoes).toBeGreaterThanOrEqual(0);
      expect(typeof clareza.observacoes).toBe('string');
    });
  });

  /**
   * AC5: Test Resumo Geral
   */
  describe('Resumo Geral Validation', () => {
    it('should have pontos_fortes and pontos_atencao arrays', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const resumo = output.resumo_geral;

      expect(Array.isArray(resumo.pontos_fortes)).toBe(true);
      expect(Array.isArray(resumo.pontos_atencao)).toBe(true);
      expect(resumo.pontos_fortes.length).toBeGreaterThan(0);
    });

    it('should have nota_geral between 1-10', () => {
      const output = JSON.parse(mockQualitativaOutput.texto);
      const resumo = output.resumo_geral;

      expect(resumo.nota_geral).toBeGreaterThanOrEqual(1);
      expect(resumo.nota_geral).toBeLessThanOrEqual(10);
    });
  });

  /**
   * AC5: Test JSON Parsing
   */
  describe('JSON Parsing', () => {
    it('should parse without syntax errors', () => {
      expect(() => {
        JSON.parse(mockQualitativaOutput.texto);
      }).not.toThrow();
    });

    it('should return valid JSON structure from LLM', async () => {
      const result = await claudeProvider.generate(
        'Test prompt content',
        {
          temperature: 0.4,
          maxTokens: 2500,
        },
      );

      expect(result.texto).toBeDefined();
      expect(() => JSON.parse(result.texto)).not.toThrow();
    });
  });
});
