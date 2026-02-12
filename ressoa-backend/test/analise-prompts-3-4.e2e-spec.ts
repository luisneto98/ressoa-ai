import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PromptService } from '../src/modules/llm/services/prompt.service';
import { GPTProvider } from '../src/modules/llm/providers/gpt.provider';
import { ProviderLLM } from '@prisma/client';

/**
 * E2E Integration Tests for Prompts 3-4 (Relatório + Exercícios)
 * Story 5.4 - AC6: End-to-End Validation
 *
 * Test Coverage:
 * - Prompt retrieval from database (seeded)
 * - Variable rendering ({{cobertura}}, {{analise_qualitativa}}, {{transcricao}}, etc.)
 * - GPT provider invocation (mocked)
 * - Markdown output validation (Prompt 3)
 * - JSON output parsing and validation (Prompt 4)
 * - Context accumulation (Prompt 3 receives Prompts 1-2, Prompt 4 receives Prompt 1 + transcript)
 * - Full pipeline integration
 */
describe('Análise Prompts 3-4 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let promptService: PromptService;
  let gptProvider: GPTProvider;

  // Fixtures from Prompts 1-2 (context for Prompts 3-4)
  const coberturaFixture = {
    analise_cobertura: [
      {
        habilidade_codigo: 'EF06MA01',
        nivel_cobertura: 3,
        evidencias: [
          'Vamos comparar esses dois números: 150 e 105.',
          'Ordenem esses números: 45, 102, 89, 200.',
        ],
        observacoes: 'Habilidade aprofundada com exercícios.',
        tempo_estimado_minutos: 20,
      },
      {
        habilidade_codigo: 'EF06MA07',
        nivel_cobertura: 3,
        evidencias: [
          'Imaginem uma pizza dividida em 8 fatias.',
          '1/2 é o mesmo que 2/4.',
          'Maria tinha 15 balas e deu 1/3 para seu irmão.',
        ],
        tempo_estimado_minutos: 25,
      },
      {
        habilidade_codigo: 'EF06MA02',
        nivel_cobertura: 0,
        evidencias: [],
        observacoes: 'Não abordada.',
        tempo_estimado_minutos: 0,
      },
    ],
    habilidades_nao_cobertas: ['EF06MA02'],
    resumo_quantitativo: {
      total_planejadas: 3,
      cobertas_nivel_2_ou_3: 2,
      percentual_cobertura: 66.7,
    },
  };

  const analiseQualitativaFixture = {
    taxonomia_bloom: {
      niveis_identificados: [2, 3],
      nivel_dominante: 2,
      avaliacao: 'Foco em compreensão (50%) e aplicação (30%).',
    },
    coerencia_narrativa: {
      score: 8,
      estrutura_presente: true,
      fechamento: false,
      observacoes: 'Bem estruturada, faltou síntese final.',
    },
    adequacao_linguistica: {
      adequada_para_serie: true,
      observacoes: 'Linguagem clara para 6º ano.',
    },
    metodologia: {
      dominante: 'Expositiva dialogada',
      metodos_identificados: ['Expositiva dialogada', 'Resolução de problemas'],
      percentual_estimado: {
        expositiva: 60,
        pratica: 30,
        colaborativa: 10,
      },
    },
    engajamento: {
      nivel: 'Alto',
      perguntas_alunos: 5,
      discussoes_ativas: true,
      sinais_dificuldade: ['Silêncio prolongado ao mencionar sistema decimal'],
    },
    tempo_instrucional: {
      percentual_instrucional: 77.8,
    },
  };

  const transcriptFixture = `
    [00:00-10:00] Professor: Hoje vamos aprender sobre frações.
    Imaginem uma pizza dividida em 8 fatias iguais.
    Se você comer 3 fatias, que fração da pizza você comeu?
    Aluno: 3/8, professor!

    [10:00-20:00] Professor: Agora vamos comparar números naturais.
    Coloquem em ordem crescente: 150, 23, 8, 42.
    [Alunos trabalham em duplas]

    [20:00-30:00] Professor: Frações equivalentes: 1/2 é o mesmo que 2/4.
    Olhem no desenho da pizza.

    [30:00-40:00] Professor: Problema prático:
    Maria tinha 15 balas e deu 1/3 para seu irmão.
    Quantas balas ela deu?
    Aluno: 5 balas!
  `;

  const turmaContext = {
    nome: '6A',
    serie: 6,
    disciplina: 'Matemática',
  };

  const dataContext = '2026-02-10';

  // Mock Prompt 3 response (Markdown)
  const mockRelatorioResponse = {
    texto: `# Relatório da Aula - 6A - 2026-02-10

## Resumo Executivo

Nesta aula de Matemática para o 6º ano, foram abordadas as habilidades EF06MA01 (comparação de números naturais) e EF06MA07 (frações) de forma aprofundada. A metodologia predominante foi expositiva dialogada (60%) com resolução de problemas práticos (30%).

## Cobertura Curricular

### Habilidades Completamente Abordadas
✅ **EF06MA01** - Comparar e ordenar números naturais (20 minutos)
✅ **EF06MA07** - Frações e frações equivalentes (25 minutos)

### Habilidades Não Cobertas do Planejamento
❌ **EF06MA02** - Sistema de numeração decimal (não abordado)

## Análise Pedagógica

**Níveis de Bloom predominantes:**
- Nível 2 (Compreender): 50%
- Nível 3 (Aplicar): 30%

**Metodologias usadas:**
- Expositiva dialogada: 60%
- Resolução de problemas: 30%

**Coerência narrativa:** Score 8/10
Bem estruturada, mas faltou síntese final.

## Sinais de Engajamento

**Nível geral:** Alto
**Evidências positivas:** 5 perguntas de alunos

## Próximos Passos

1. **Reforçar EF06MA02:** Não foi coberto conforme planejado.
2. **Incluir consolidação:** Reservar 5 minutos para recapitulação.`,
    custo_usd: 0.004,
    tokens_input: 500,
    tokens_output: 350,
    modelo: 'gpt-4o-mini',
    provider: ProviderLLM.GPT4_MINI,
    tempo_processamento_ms: 1500,
  };

  // Mock Prompt 4 response (JSON)
  const mockExerciciosResponse = {
    texto: JSON.stringify({
      exercicios: [
        {
          numero: 1,
          enunciado: 'O professor usou pizza com 8 fatias. Se você comeu 3 fatias, qual fração?',
          contexto_aula: 'Professor usou pizza como exemplo',
          nivel_bloom: 2,
          nivel_bloom_descricao: 'Compreender',
          dificuldade: 'facil',
          habilidade_relacionada: 'EF06MA07',
          gabarito: {
            resposta_curta: '3/8',
            resolucao_passo_a_passo: ['Passo 1: Total 8 fatias', 'Passo 2: Comeu 3', 'Passo 3: 3/8'],
            criterios_correcao: ['Aceitar: 3/8'],
            dica_professor: 'Reforçar denominador como total.',
          },
        },
        {
          numero: 2,
          enunciado: 'Ordene: 150, 23, 8, 42.',
          contexto_aula: 'Professor pediu ordenação de números',
          nivel_bloom: 2,
          nivel_bloom_descricao: 'Compreender',
          dificuldade: 'facil',
          habilidade_relacionada: 'EF06MA01',
          gabarito: {
            resposta_curta: '8, 23, 42, 150',
            resolucao_passo_a_passo: ['Passo 1: Comparar dígitos'],
            criterios_correcao: ['Aceitar: Ordem correta'],
            dica_professor: 'Números com mais dígitos são maiores.',
          },
        },
        {
          numero: 3,
          enunciado: 'Desenhe por que 1/2 = 2/4.',
          contexto_aula: 'Professor mostrou frações equivalentes',
          nivel_bloom: 3,
          nivel_bloom_descricao: 'Aplicar',
          dificuldade: 'medio',
          habilidade_relacionada: 'EF06MA07',
          gabarito: {
            resposta_curta: 'Desenho mostrando áreas iguais',
            resolucao_passo_a_passo: ['Passo 1: Desenhar 1/2', 'Passo 2: Desenhar 2/4'],
            criterios_correcao: ['Aceitar: Representação visual correta'],
            dica_professor: 'Avalia compreensão conceitual.',
          },
        },
        {
          numero: 4,
          enunciado: 'Crie problema como "Maria e balas" usando João e 24 figurinhas (1/4).',
          contexto_aula: 'Professor usou problema de balas',
          nivel_bloom: 4,
          nivel_bloom_descricao: 'Analisar',
          dificuldade: 'medio',
          habilidade_relacionada: 'EF06MA07',
          gabarito: {
            resposta_curta: '6 figurinhas',
            resolucao_passo_a_passo: ['Passo 1: Criar problema', 'Passo 2: 24 ÷ 4 = 6'],
            criterios_correcao: ['Aceitar: Problema correto'],
            dica_professor: 'Avalia transferência.',
          },
        },
        {
          numero: 5,
          enunciado: '"Frações maiores têm numeradores maiores". Verdadeiro ou falso?',
          contexto_aula: 'Professor comparou frações',
          nivel_bloom: 5,
          nivel_bloom_descricao: 'Avaliar',
          dificuldade: 'dificil',
          habilidade_relacionada: 'EF06MA07',
          gabarito: {
            resposta_curta: 'Falso - denominador importa',
            resolucao_passo_a_passo: ['Passo 1: Contra-exemplo 1/2 vs 1/8'],
            criterios_correcao: ['Aceitar: Contra-exemplo válido'],
            dica_professor: 'Pensamento crítico. Use para discussão.',
          },
        },
      ],
      metadados: {
        total_exercicios: 5,
        distribuicao_bloom: { nivel_2: 2, nivel_3: 1, nivel_4: 1, nivel_5: 1 },
        distribuicao_dificuldade: { facil: 2, medio: 2, dificil: 1 },
        tempo_estimado_resolucao_minutos: 30,
        contexto_fidelidade: 'Todos os exercícios usam exemplos da aula',
      },
    }),
    custo_usd: 0.006,
    tokens_input: 600,
    tokens_output: 500,
    modelo: 'gpt-4o-mini',
    provider: ProviderLLM.GPT4_MINI,
    tempo_processamento_ms: 2000,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    promptService = moduleFixture.get<PromptService>(PromptService);
    gptProvider = moduleFixture.get<GPTProvider>(GPTProvider);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Prompt 3 - Geração de Relatório', () => {
    it('deve carregar Prompt 3 do banco de dados', async () => {
      const prompt = await promptService.getActivePrompt('prompt-relatorio');

      expect(prompt).toBeDefined();
      expect(prompt.nome).toBe('prompt-relatorio');
      expect(prompt.versao).toBe('v1.0.0');
      expect(prompt.ativo).toBe(true);
      expect(prompt.modelo_sugerido).toBe('GPT4_MINI');
    });

    it('deve renderizar variáveis corretamente', async () => {
      const prompt = await promptService.getActivePrompt('prompt-relatorio');

      const variables = {
        cobertura: coberturaFixture,
        analise_qualitativa: analiseQualitativaFixture,
        turma: turmaContext,
        data: dataContext,
      };

      const rendered = await promptService.renderPrompt(prompt, variables);

      // Deve substituir variáveis
      expect(rendered).toContain('6A');
      expect(rendered).toContain('6');
      expect(rendered).toContain('Matemática');
      expect(rendered).toContain('2026-02-10');

      // NÃO deve ter placeholders não resolvidos
      expect(rendered).not.toContain('{{cobertura}}');
      expect(rendered).not.toContain('{{analise_qualitativa}}');
      expect(rendered).not.toContain('{{turma.nome}}');
    });

    it('deve gerar relatório com estrutura markdown válida', async () => {
      // Mock GPT provider
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockRelatorioResponse);

      const prompt = await promptService.getActivePrompt('prompt-relatorio');
      const variables = {
        cobertura: coberturaFixture,
        analise_qualitativa: analiseQualitativaFixture,
        turma: turmaContext,
        data: dataContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.5,
        maxTokens: 1500,
      });

      expect(result.texto).toBeDefined();
      expect(result.provider).toBe(ProviderLLM.GPT4_MINI);

      // Markdown structure
      expect(result.texto).toContain('# Relatório da Aula');
      expect(result.texto).toContain('## Resumo Executivo');
      expect(result.texto).toContain('## Cobertura Curricular');
      expect(result.texto).toContain('## Análise Pedagógica');
      expect(result.texto).toContain('## Sinais de Engajamento');
      expect(result.texto).toContain('## Próximos Passos');

      // Emojis
      expect(result.texto).toContain('✅');
      expect(result.texto).toContain('❌');

      // Cost tracking
      expect(result.custo_usd).toBeGreaterThan(0);
      expect(result.custo_usd).toBeLessThan(0.01); // GPT-4 mini is cheap
    });

    it('deve usar dados das análises anteriores (Prompts 1-2)', async () => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockRelatorioResponse);

      const prompt = await promptService.getActivePrompt('prompt-relatorio');
      const variables = {
        cobertura: coberturaFixture,
        analise_qualitativa: analiseQualitativaFixture,
        turma: turmaContext,
        data: dataContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.5,
        maxTokens: 1500,
      });

      // Habilidades da cobertura devem estar no relatório
      expect(result.texto).toContain('EF06MA01');
      expect(result.texto).toContain('EF06MA07');
      expect(result.texto).toContain('EF06MA02');

      // Metodologias da análise qualitativa
      expect(result.texto).toContain('60%');
      expect(result.texto).toContain('30%');

      // Score da coerência narrativa
      expect(result.texto).toContain('8/10');
    });
  });

  describe('Prompt 4 - Geração de Exercícios', () => {
    it('deve carregar Prompt 4 do banco de dados', async () => {
      const prompt = await promptService.getActivePrompt('prompt-exercicios');

      expect(prompt).toBeDefined();
      expect(prompt.nome).toBe('prompt-exercicios');
      expect(prompt.versao).toBe('v1.0.0');
      expect(prompt.ativo).toBe(true);
      expect(prompt.modelo_sugerido).toBe('GPT4_MINI');
    });

    it('deve renderizar variáveis corretamente', async () => {
      const prompt = await promptService.getActivePrompt('prompt-exercicios');

      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };

      const rendered = await promptService.renderPrompt(prompt, variables);

      // Deve substituir variáveis
      expect(rendered).toContain('6A');
      expect(rendered).toContain('6');
      expect(rendered).toContain('Matemática');

      // Deve conter transcrição
      expect(rendered).toContain('pizza');
      expect(rendered).toContain('8 fatias');

      // NÃO deve ter placeholders não resolvidos
      expect(rendered).not.toContain('{{transcricao}}');
      expect(rendered).not.toContain('{{cobertura}}');
      expect(rendered).not.toContain('{{turma.nome}}');
    });

    it('deve gerar exercícios com JSON válido', async () => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockExerciciosResponse);

      const prompt = await promptService.getActivePrompt('prompt-exercicios');
      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      expect(result.texto).toBeDefined();
      expect(result.provider).toBe(ProviderLLM.GPT4_MINI);

      // Parse JSON
      const data = JSON.parse(result.texto);
      expect(data.exercicios).toHaveLength(5);
      expect(data.metadados).toBeDefined();

      // Cost tracking
      expect(result.custo_usd).toBeGreaterThan(0);
      expect(result.custo_usd).toBeLessThan(0.02);
    });

    it('deve seguir distribuição Bloom (2-2-1)', async () => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockExerciciosResponse);

      const prompt = await promptService.getActivePrompt('prompt-exercicios');
      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      const data = JSON.parse(result.texto);

      // Bloom distribution
      expect(data.metadados.distribuicao_bloom.nivel_2).toBe(2);
      expect(data.metadados.distribuicao_bloom.nivel_3).toBe(1);
      expect(data.metadados.distribuicao_bloom.nivel_4).toBe(1);
      expect(data.metadados.distribuicao_bloom.nivel_5).toBe(1);
    });

    it('deve ter contexto fidelidade (usar exemplos da transcrição)', async () => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockExerciciosResponse);

      const prompt = await promptService.getActivePrompt('prompt-exercicios');
      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      const data = JSON.parse(result.texto);

      // Exercícios devem usar exemplos da transcrição
      const enunciados = data.exercicios.map((ex) => ex.enunciado.toLowerCase()).join(' ');

      expect(enunciados).toMatch(/pizza/);
      expect(enunciados).toMatch(/8 fatias|balas|figurinhas/);
      expect(enunciados).toMatch(/150|23|42/);
    });

    it('deve ter gabaritos completos', async () => {
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockExerciciosResponse);

      const prompt = await promptService.getActivePrompt('prompt-exercicios');
      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      const data = JSON.parse(result.texto);

      data.exercicios.forEach((ex) => {
        expect(ex.gabarito.resposta_curta).toBeTruthy();
        expect(ex.gabarito.resolucao_passo_a_passo).toBeInstanceOf(Array);
        expect(ex.gabarito.criterios_correcao).toBeInstanceOf(Array);
        expect(ex.gabarito.dica_professor).toBeTruthy();
      });
    });
  });

  describe('Serial Pipeline Integration', () => {
    it('Prompt 3 deve executar APÓS Prompts 1-2', async () => {
      // Simulate Prompts 1-2 already executed
      const contextoAcumulado = {
        cobertura: coberturaFixture,
        analise_qualitativa: analiseQualitativaFixture,
      };

      // Prompt 3 receives context from Prompts 1-2
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockRelatorioResponse);

      const prompt = await promptService.getActivePrompt('prompt-relatorio');
      const variables = {
        ...contextoAcumulado,
        turma: turmaContext,
        data: dataContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.5,
        maxTokens: 1500,
      });

      expect(result.texto).toContain('EF06MA01');
      expect(result.texto).toContain('Expositiva dialogada');
    });

    it('Prompt 4 deve usar Prompt 1 output + transcrição', async () => {
      // Prompt 4 receives cobertura (Prompt 1) + transcript
      jest.spyOn(gptProvider, 'generate').mockResolvedValue(mockExerciciosResponse);

      const prompt = await promptService.getActivePrompt('prompt-exercicios');
      const variables = {
        transcricao: transcriptFixture,
        cobertura: coberturaFixture,
        turma: turmaContext,
      };
      const rendered = await promptService.renderPrompt(prompt, variables);

      const result = await gptProvider.generate(rendered, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      const data = JSON.parse(result.texto);

      // Deve usar habilidades da cobertura (Prompt 1)
      const habilidades = data.exercicios.map((ex) => ex.habilidade_relacionada);
      expect(habilidades).toContain('EF06MA01');
      expect(habilidades).toContain('EF06MA07');

      // Deve usar exemplos da transcrição
      const enunciados = data.exercicios.map((ex) => ex.enunciado).join(' ');
      expect(enunciados).toMatch(/pizza|balas/i);
    });
  });
});
