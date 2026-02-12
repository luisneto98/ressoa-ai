import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PromptService } from '../src/modules/llm/services/prompt.service';
import { ClaudeProvider } from '../src/modules/llm/providers/claude.provider';
import { ProviderLLM } from '@prisma/client';

/**
 * E2E Integration Tests for Prompts 1-2 (Cobertura + Qualitativa)
 * Story 5.3 - AC4 & AC5: End-to-End Validation
 *
 * Test Coverage:
 * - Prompt retrieval from database (seeded)
 * - Variable rendering ({{transcricao}}, {{planejamento}}, etc.)
 * - LLM provider invocation (mocked)
 * - JSON output parsing and validation
 * - Context accumulation (Prompt 2 receives Prompt 1 output)
 * - Full pipeline integration
 */
describe('Análise Prompts 1-2 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let promptService: PromptService;
  let claudeProvider: ClaudeProvider;

  // Realistic transcript fixture (Matemática 6º ano, 45min)
  const transcriptFixture = `
    [00:00-05:00] Professor: Bom dia turma! Hoje vamos falar sobre números naturais e sua ordem.
    [05:00-15:00] Professor: Vamos comparar esses dois números: 150 e 105. Quem consegue me dizer qual é maior?
    Aluno: 150 é maior, professor!
    Professor: Muito bem! Agora vamos fazer um exercício. Ordenem esses números: 45, 102, 89, 200.
    [15:00-30:00] [Alunos fazem exercício em duplas]
    Professor: Quem quer mostrar a resposta? João, pode ir ao quadro?
    [João escreve: 45, 89, 102, 200]
    Professor: Perfeito! Todos entenderam?
    [30:00-40:00] Professor: Agora vamos falar rapidamente sobre múltiplos. Múltiplos de 2 são números que podem ser divididos por 2.
    Exemplo: 2, 4, 6, 8, 10... Vamos ver isso melhor na próxima aula.
  `;

  const planejamentoFixture = `
    Habilidades Planejadas:
    - EF06MA01: Comparar, ordenar, ler e escrever números naturais
    - EF06MA02: Reconhecer o sistema de numeração decimal
    - EF06MA03: Resolver e elaborar problemas com as quatro operações
  `;

  const turmaContext = {
    serie: 6,
    disciplina: 'Matemática',
  };

  // Mock responses
  const mockCoberturaResponse = {
    texto: JSON.stringify({
      analise_cobertura: [
        {
          habilidade_codigo: 'EF06MA01',
          nivel_cobertura: 3,
          evidencias: [
            'Vamos comparar esses dois números: 150 e 105. Quem consegue me dizer qual é maior?',
            'Ordenem esses números: 45, 102, 89, 200.',
          ],
          observacoes: 'Habilidade aprofundada com exercício prático.',
          tempo_estimado_minutos: 25,
        },
        {
          habilidade_codigo: 'EF06MA02',
          nivel_cobertura: 2,
          evidencias: ['Múltiplos de 2 são números que podem ser divididos por 2.'],
          observacoes: 'Parcialmente coberta, sem exercícios.',
          tempo_estimado_minutos: 10,
        },
        {
          habilidade_codigo: 'EF06MA03',
          nivel_cobertura: 0,
          evidencias: [],
          observacoes: 'Não abordada.',
          tempo_estimado_minutos: 0,
        },
      ],
      habilidades_nao_cobertas: ['EF06MA03'],
      habilidades_extras: [],
      resumo_quantitativo: {
        total_planejadas: 3,
        cobertas_nivel_2_ou_3: 2,
        apenas_mencionadas: 0,
        nao_cobertas: 1,
        percentual_cobertura: 66.7,
      },
    }),
    custo_usd: 0.005,
    tokens_usados: 850,
    modelo: 'claude-sonnet-4.5',
    provider: ProviderLLM.CLAUDE_SONNET,
  };

  const mockQualitativaResponse = {
    texto: JSON.stringify({
      taxonomia_bloom: {
        niveis_identificados: [2, 3],
        nivel_dominante: 2,
        avaliacao: 'Foco em compreensão e aplicação.',
        sugestao: 'Incluir análise comparativa.',
      },
      coerencia_narrativa: {
        score: 8,
        estrutura_presente: true,
        conexao_conhecimento_previo: true,
        sequencia_logica: true,
        fechamento: false,
        observacoes: 'Bem estruturada, faltou síntese final.',
      },
      adequacao_linguistica: {
        adequada_para_serie: true,
        observacoes: 'Linguagem clara para 6º ano.',
        exemplos_adequacao: ['Comparação de números', 'Exercícios práticos'],
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
        avaliacao: 'Boa combinação.',
      },
      engajamento: {
        nivel: 'alto',
        perguntas_alunos: 3,
        participacao_estimulada: true,
        discussoes: true,
        sinais_positivos: ['Alunos participaram ativamente'],
        sinais_dificuldade: [],
        avaliacao: 'Engajamento alto.',
      },
      clareza_comunicacao: {
        score: 9,
        explicacoes_claras: true,
        uso_exemplos: true,
        reformulacoes: 1,
        observacoes: 'Excelente clareza.',
      },
      resumo_geral: {
        pontos_fortes: ['Clareza', 'Engajamento', 'Exemplos práticos'],
        pontos_atencao: ['Faltou fechamento'],
        nota_geral: 8.5,
      },
    }),
    custo_usd: 0.007,
    tokens_usados: 1200,
    modelo: 'claude-sonnet-4.5',
    provider: ProviderLLM.CLAUDE_SONNET,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    promptService = app.get<PromptService>(PromptService);
    claudeProvider = app.get<ClaudeProvider>(ClaudeProvider);

    // Mock ClaudeProvider to avoid real API calls
    jest
      .spyOn(claudeProvider, 'generate')
      .mockImplementation(async (promptText: string) => {
        // Return Prompt 1 or 2 output based on content
        if (promptText.includes('Analise a transcrição da aula abaixo')) {
          return mockCoberturaResponse;
        } else if (promptText.includes('forneça insights qualitativos')) {
          return mockQualitativaResponse;
        }
        throw new Error('Unknown prompt');
      });
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * AC4: Test Prompt 1 - Full Flow
   */
  describe('Prompt 1 - Cobertura BNCC', () => {
    it('should retrieve active prompt from database', async () => {
      const prompt = await promptService.getActivePrompt('prompt-cobertura');

      expect(prompt).toBeDefined();
      expect(prompt.nome).toBe('prompt-cobertura');
      expect(prompt.versao).toBe('v1.0.0');
      expect(prompt.ativo).toBe(true);
      expect(prompt.modelo_sugerido).toBe(ProviderLLM.CLAUDE_SONNET);
    });

    it('should render prompt with variables', async () => {
      const prompt = await promptService.getActivePrompt('prompt-cobertura');

      const rendered = await promptService.renderPrompt(prompt, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      expect(rendered).toContain(transcriptFixture);
      expect(rendered).toContain(planejamentoFixture);
      expect(rendered).toContain('6º ano');
      expect(rendered).toContain('Matemática');
      expect(rendered).not.toContain('{{transcricao}}');
      expect(rendered).not.toContain('{{planejamento}}');
      expect(rendered).not.toContain('{{turma.serie}}');
    });

    it('should call ClaudeProvider with rendered prompt', async () => {
      const prompt = await promptService.getActivePrompt('prompt-cobertura');
      const rendered = await promptService.renderPrompt(prompt, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(
        rendered,
        {
          modelo: prompt.modelo_sugerido || ProviderLLM.CLAUDE_SONNET,
          temperature: (prompt.variaveis as any)?.temperature || 0.3,
          max_tokens: (prompt.variaveis as any)?.max_tokens || 2000,
        },
        'test-user-id',
      );

      expect(result).toBeDefined();
      expect(result.texto).toBeDefined();
    });

    it('should parse JSON response from Prompt 1', async () => {
      const prompt = await promptService.getActivePrompt('prompt-cobertura');
      const rendered = await promptService.renderPrompt(prompt, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(
        rendered,
        {
          modelo: prompt.modelo_sugerido || ProviderLLM.CLAUDE_SONNET,
          temperature: (prompt.variaveis as any)?.temperature || 0.3,
          max_tokens: (prompt.variaveis as any)?.max_tokens || 2000,
        },
        'test-user-id',
      );

      const output = JSON.parse(result.texto);

      expect(output).toHaveProperty('analise_cobertura');
      expect(output).toHaveProperty('habilidades_nao_cobertas');
      expect(output).toHaveProperty('resumo_quantitativo');
      expect(Array.isArray(output.analise_cobertura)).toBe(true);
    });

    it('should validate Prompt 1 output matches AC4 schema', async () => {
      const prompt = await promptService.getActivePrompt('prompt-cobertura');
      const rendered = await promptService.renderPrompt(prompt, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(rendered, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const output = JSON.parse(result.texto);

      // Validate structure
      expect(output.analise_cobertura[0]).toHaveProperty('habilidade_codigo');
      expect(output.analise_cobertura[0]).toHaveProperty('nivel_cobertura');
      expect(output.analise_cobertura[0]).toHaveProperty('evidencias');
      expect(output.analise_cobertura[0]).toHaveProperty('tempo_estimado_minutos');

      // Validate types
      expect(typeof output.analise_cobertura[0].habilidade_codigo).toBe('string');
      expect(typeof output.analise_cobertura[0].nivel_cobertura).toBe('number');
      expect(Array.isArray(output.analise_cobertura[0].evidencias)).toBe(true);
    });
  });

  /**
   * AC5: Test Prompt 2 - Full Flow with Context from Prompt 1
   */
  describe('Prompt 2 - Análise Qualitativa', () => {
    it('should retrieve active prompt from database', async () => {
      const prompt = await promptService.getActivePrompt('prompt-qualitativa');

      expect(prompt).toBeDefined();
      expect(prompt.nome).toBe('prompt-qualitativa');
      expect(prompt.versao).toBe('v1.0.0');
      expect(prompt.ativo).toBe(true);
      expect(prompt.modelo_sugerido).toBe(ProviderLLM.CLAUDE_SONNET);
    });

    it('should render Prompt 2 with context INCLUDING Prompt 1 output', async () => {
      const prompt1 = await promptService.getActivePrompt('prompt-cobertura');
      const rendered1 = await promptService.renderPrompt(prompt1, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      const result1 = await claudeProvider.generate(rendered1, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const cobertura = JSON.parse(result1.texto);

      // Now render Prompt 2 with cobertura context
      const prompt2 = await promptService.getActivePrompt('prompt-qualitativa');
      const rendered2 = await promptService.renderPrompt(prompt2, {
        transcricao: transcriptFixture,
        cobertura: cobertura, // Context from Prompt 1
        turma: turmaContext,
      });

      expect(rendered2).toContain(transcriptFixture);
      expect(rendered2).toContain('6º ano');
      expect(rendered2).not.toContain('{{transcricao}}');
      expect(rendered2).not.toContain('{{cobertura}}');
    });

    it('should call ClaudeProvider with Prompt 2', async () => {
      const prompt2 = await promptService.getActivePrompt('prompt-qualitativa');
      const rendered2 = await promptService.renderPrompt(prompt2, {
        transcricao: transcriptFixture,
        cobertura: JSON.parse(mockCoberturaResponse.texto),
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(
        rendered2,
        {
          modelo: prompt2.modelo_sugerido || ProviderLLM.CLAUDE_SONNET,
          temperature: (prompt2.variaveis as any)?.temperature || 0.4,
          max_tokens: (prompt2.variaveis as any)?.max_tokens || 2500,
        },
        'test-user-id',
      );

      expect(result).toBeDefined();
      expect(result.texto).toBeDefined();
    });

    it('should parse JSON response from Prompt 2', async () => {
      const prompt2 = await promptService.getActivePrompt('prompt-qualitativa');
      const rendered2 = await promptService.renderPrompt(prompt2, {
        transcricao: transcriptFixture,
        cobertura: JSON.parse(mockCoberturaResponse.texto),
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(rendered2, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const output = JSON.parse(result.texto);

      expect(output).toHaveProperty('taxonomia_bloom');
      expect(output).toHaveProperty('coerencia_narrativa');
      expect(output).toHaveProperty('adequacao_linguistica');
      expect(output).toHaveProperty('metodologia');
      expect(output).toHaveProperty('engajamento');
      expect(output).toHaveProperty('clareza_comunicacao');
      expect(output).toHaveProperty('resumo_geral');
    });

    it('should validate Prompt 2 output matches AC5 schema', async () => {
      const prompt2 = await promptService.getActivePrompt('prompt-qualitativa');
      const rendered2 = await promptService.renderPrompt(prompt2, {
        transcricao: transcriptFixture,
        cobertura: JSON.parse(mockCoberturaResponse.texto),
        turma: turmaContext,
      });

      const result = await claudeProvider.generate(rendered2, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const output = JSON.parse(result.texto);

      // Validate Bloom
      expect(output.taxonomia_bloom).toHaveProperty('niveis_identificados');
      expect(output.taxonomia_bloom).toHaveProperty('nivel_dominante');
      expect(Array.isArray(output.taxonomia_bloom.niveis_identificados)).toBe(true);

      // Validate Coerência
      expect(output.coerencia_narrativa).toHaveProperty('score');
      expect(output.coerencia_narrativa.score).toBeGreaterThanOrEqual(1);
      expect(output.coerencia_narrativa.score).toBeLessThanOrEqual(10);

      // Validate Resumo
      expect(output.resumo_geral).toHaveProperty('pontos_fortes');
      expect(output.resumo_geral).toHaveProperty('pontos_atencao');
      expect(output.resumo_geral).toHaveProperty('nota_geral');
      expect(Array.isArray(output.resumo_geral.pontos_fortes)).toBe(true);
    });
  });

  /**
   * AC4 & AC5: Full Pipeline Integration (Prompt 1 → Prompt 2)
   */
  describe('Full Pipeline Integration', () => {
    it('should execute both prompts sequentially with context accumulation', async () => {
      // Step 1: Execute Prompt 1
      const prompt1 = await promptService.getActivePrompt('prompt-cobertura');
      const rendered1 = await promptService.renderPrompt(prompt1, {
        transcricao: transcriptFixture,
        planejamento: planejamentoFixture,
        turma: turmaContext,
      });

      const result1 = await claudeProvider.generate(rendered1, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const cobertura = JSON.parse(result1.texto);

      // Step 2: Execute Prompt 2 with Prompt 1 output as context
      const prompt2 = await promptService.getActivePrompt('prompt-qualitativa');
      const rendered2 = await promptService.renderPrompt(prompt2, {
        transcricao: transcriptFixture,
        cobertura: cobertura, // Context from Prompt 1
        turma: turmaContext,
      });

      const result2 = await claudeProvider.generate(rendered2, {
        modelo: ProviderLLM.CLAUDE_SONNET,
      }, 'test-user-id');

      const qualitativa = JSON.parse(result2.texto);

      // Validate full pipeline
      expect(cobertura).toHaveProperty('analise_cobertura');
      expect(qualitativa).toHaveProperty('taxonomia_bloom');
      expect(qualitativa).toHaveProperty('resumo_geral');

      // Verify context accumulation worked
      expect(rendered2).toContain(transcriptFixture);
    });
  });
});
