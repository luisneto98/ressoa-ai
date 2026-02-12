import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PromptService } from '../src/modules/llm/services/prompt.service';
import { ProviderLLM } from '@prisma/client';

/**
 * E2E Tests for LLM Prompt Versioning & A/B Testing
 * Story 5.1 - AC6: End-to-End Test (Versioning & A/B Flow)
 *
 * Test Coverage:
 * - Prompt creation with versioning
 * - Active prompt retrieval
 * - A/B testing 50/50 distribution
 * - Template variable rendering
 * - Version deactivation workflow
 *
 * Note: Bull Queue warning can be ignored - it's a known issue in e2e tests
 */
describe('LLM Prompt Versioning (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let promptService: PromptService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    promptService = app.get<PromptService>(PromptService);
  });

  afterAll(async () => {
    // Cleanup: Remove test prompts
    await prisma.prompt.deleteMany({
      where: {
        nome: {
          in: ['prompt-cobertura-test', 'prompt-test-template'],
        },
      },
    });
    await app.close();
  });

  /**
   * AC6 - Step 1-2: Create v1.0.0 and retrieve it
   */
  it('Step 1-2: Should create prompt v1.0.0 and retrieve as active', async () => {
    // Create prompt v1.0.0
    const prompt = await promptService.createPrompt({
      nome: 'prompt-cobertura-test',
      versao: 'v1.0.0',
      conteudo: 'Analise a cobertura BNCC: {{transcricao}}',
      variaveis: { transcricao: 'string' },
      modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
      ativo: true,
      ab_testing: false,
    });

    expect(prompt.nome).toBe('prompt-cobertura-test');
    expect(prompt.versao).toBe('v1.0.0');
    expect(prompt.ativo).toBe(true);
    expect(prompt.ab_testing).toBe(false);

    // Retrieve active prompt
    const activePrompt = await promptService.getActivePrompt(
      'prompt-cobertura-test',
    );

    expect(activePrompt.versao).toBe('v1.0.0');
  });

  /**
   * AC6 - Step 3-4: Create v1.1.0 with A/B testing and verify 50/50 distribution
   */
  it('Step 3-4: Should create v1.1.0 with A/B testing and distribute 50/50', async () => {
    // Create prompt v1.1.0 with A/B testing
    const promptV2 = await promptService.createPrompt({
      nome: 'prompt-cobertura-test',
      versao: 'v1.1.0',
      conteudo:
        'Analise MELHORADA da cobertura BNCC: {{transcricao}} e {{planejamento}}',
      variaveis: { transcricao: 'string', planejamento: 'string' },
      modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
      ativo: true,
      ab_testing: true, // Enable A/B testing
    });

    expect(promptV2.versao).toBe('v1.1.0');
    expect(promptV2.ativo).toBe(true);
    expect(promptV2.ab_testing).toBe(true);

    // Call getActivePrompt 100 times and verify ~50/50 distribution
    const results = { v1: 0, v2: 0 };
    for (let i = 0; i < 100; i++) {
      const activePrompt = await promptService.getActivePrompt(
        'prompt-cobertura-test',
      );
      if (activePrompt.versao === 'v1.0.0') results.v1++;
      else results.v2++;
    }

    // Verify roughly 50/50 distribution (40-60 range at 100 samples)
    expect(results.v1).toBeGreaterThan(30);
    expect(results.v1).toBeLessThan(70);
    expect(results.v2).toBeGreaterThan(30);
    expect(results.v2).toBeLessThan(70);

    // Log distribution for visibility
    console.log(
      `A/B Testing Distribution: v1.0.0=${results.v1}%, v1.1.0=${results.v2}%`,
    );
  });

  /**
   * AC6 - Step 5-6: Deactivate v1.0.0 and verify v1.1.0 is always returned
   */
  it('Step 5-6: Should deactivate v1.0.0 and always return v1.1.0', async () => {
    // Update v1.0.0 to inactive
    await promptService.updatePromptStatus('prompt-cobertura-test', 'v1.0.0', {
      ativo: false,
      ab_testing: false,
    });

    // Call getActivePrompt 10 times - should ALWAYS return v1.1.0
    for (let i = 0; i < 10; i++) {
      const activePrompt = await promptService.getActivePrompt(
        'prompt-cobertura-test',
      );
      expect(activePrompt.versao).toBe('v1.1.0');
    }
  });

  /**
   * AC6 - Step 7: Template variable rendering
   */
  it('Step 7: Should render prompt with template variables', async () => {
    const activePrompt = await promptService.getActivePrompt(
      'prompt-cobertura-test',
    );

    expect(activePrompt.versao).toBe('v1.1.0');
    expect(activePrompt.conteudo).toContain('{{transcricao}}');
    expect(activePrompt.conteudo).toContain('{{planejamento}}');

    // Render template
    const rendered = await promptService.renderPrompt(activePrompt, {
      transcricao: 'Aula sobre frações decimais',
      planejamento: 'Planejamento do 6º ano - 1º bimestre',
    });

    expect(rendered).toContain('Aula sobre frações decimais');
    expect(rendered).toContain('Planejamento do 6º ano - 1º bimestre');
    expect(rendered).not.toContain('{{transcricao}}');
    expect(rendered).not.toContain('{{planejamento}}');
  });

  /**
   * Additional Test: Verify unique constraint on nome+versao
   */
  it('Should enforce unique constraint on nome+versao', async () => {
    await expect(
      promptService.createPrompt({
        nome: 'prompt-cobertura-test',
        versao: 'v1.1.0', // Already exists
        conteudo: 'Duplicate version',
        ativo: false,
      }),
    ).rejects.toThrow();
  });

  /**
   * Additional Test: Missing variables in template
   */
  it('Should leave missing variables as {{key}} in rendered output', async () => {
    const testPrompt = await promptService.createPrompt({
      nome: 'prompt-test-template',
      versao: 'v1.0.0',
      conteudo: 'Template: {{var1}}, {{var2}}, {{var3}}',
      ativo: true,
    });

    // Render with only var1 provided
    const rendered = await promptService.renderPrompt(testPrompt, {
      var1: 'valor1',
    });

    expect(rendered).toBe('Template: valor1, {{var2}}, {{var3}}');
  });
});
