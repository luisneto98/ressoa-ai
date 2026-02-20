import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnaliseService } from '../src/modules/analise/services/analise.service';
import { ClaudeProvider } from '../src/modules/llm/providers/claude.provider';
import { GPTProvider } from '../src/modules/llm/providers/gpt.provider';
import { GeminiProvider } from '../src/modules/llm/providers/gemini.provider';

/**
 * E2E Test: Analise Pipeline Execution
 *
 * Tests the complete 5-prompt serial pipeline with realistic database state.
 * Mocks LLM providers to avoid real API calls (cost + speed).
 *
 * providers.config.json routes:
 *   cobertura/qualitativa/relatorio/alertas → GEMINI_FLASH (primary), CLAUDE_SONNET (fallback)
 *   exercicios → GPT4_MINI (primary), GEMINI_FLASH (fallback)
 */
describe('Analise Pipeline (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analiseService: AnaliseService;
  let claudeProvider: ClaudeProvider;
  let gptProvider: GPTProvider;
  let geminiProvider: GeminiProvider;

  let testEscolaId: string;
  let testProfessorId: string;
  let testTurmaId: string;
  let testPlanejamentoId: string;
  let testHabilidadeId: string;
  let testAulaId: string;
  let testTranscricaoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    await new Promise((resolve) => setTimeout(resolve, 100));

    prisma = app.get(PrismaService);
    analiseService = app.get(AnaliseService);
    claudeProvider = app.get<ClaudeProvider>('CLAUDE_PROVIDER');
    gptProvider = app.get<GPTProvider>('GPT_PROVIDER');
    geminiProvider = app.get<GeminiProvider>('GEMINI_PROVIDER');
  }, 60000);

  afterAll(async () => {
    await app.close();
  }, 60000);

  beforeEach(async () => {
    // Use demo escola from seed (avoids unique constraint issues)
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });
    if (!escolaDemo) throw new Error('Demo school not found. Run: npx prisma db seed');
    testEscolaId = escolaDemo.id;

    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Prof Test Pipeline',
        email: `prof.pipeline.${Date.now()}@example.com`,
        senha_hash: 'hash123',
        escola_id: testEscolaId,
      },
    });
    testProfessorId = usuario.id;

    await prisma.perfilUsuario.create({
      data: {
        usuario_id: testProfessorId,
        role: 'PROFESSOR',
      },
    });

    const turma = await prisma.turma.create({
      data: {
        nome: `Pipeline-${Date.now()}`,
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        turno: 'MATUTINO',
        ano_letivo: 2026,
        escola_id: testEscolaId,
        professor_id: testProfessorId,
      },
    });
    testTurmaId = turma.id;

    // Use seeded BNCC habilidade (avoids unique constraint on codigo)
    const habilidade = await prisma.habilidade.findFirst({
      where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
    });
    if (!habilidade) throw new Error('BNCC habilidade not found. Run: npx prisma db seed');
    testHabilidadeId = habilidade.id;

    const planejamento = await prisma.planejamento.create({
      data: {
        turma_id: testTurmaId,
        bimestre: 1,
        ano_letivo: 2026,
        escola_id: testEscolaId,
        professor_id: testProfessorId,
      },
    });
    testPlanejamentoId = planejamento.id;

    await prisma.planejamentoHabilidade.create({
      data: {
        planejamento_id: testPlanejamentoId,
        habilidade_id: testHabilidadeId,
        peso: 1.0,
        aulas_previstas: 4,
      },
    });

    const aula = await prisma.aula.create({
      data: {
        escola_id: testEscolaId,
        professor_id: testProfessorId,
        turma_id: testTurmaId,
        planejamento_id: testPlanejamentoId,
        data: new Date(),
        tipo_entrada: 'AUDIO',
        status_processamento: 'TRANSCRITA',
        arquivo_url: 's3://bucket/test.mp3',
        arquivo_tamanho: 5000000,
      },
    });
    testAulaId = aula.id;

    const transcricao = await prisma.transcricao.create({
      data: {
        aula_id: testAulaId,
        texto: 'Hoje vamos estudar frações. A fração 1/2 representa metade...',
        provider: 'WHISPER',
        idioma: 'pt-BR',
        duracao_segundos: 3000,
        confianca: 0.95,
        custo_usd: 0.05,
        tempo_processamento_ms: 45000,
      },
    });
    testTranscricaoId = transcricao.id;

    // Mock LLM providers — Gemini is primary for cobertura/qualitativa/relatorio/alertas
    jest.spyOn(geminiProvider, 'generate').mockImplementation(async () => {
      return {
        texto: JSON.stringify({
          habilidades: [{ codigo: 'EF06MA01', nivel_cobertura: 'completo' }],
        }),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: { model: 'gemini-2.0-flash' },
      };
    });

    // GPT is primary for exercicios
    jest.spyOn(gptProvider, 'generate').mockImplementation(async () => {
      return {
        texto: JSON.stringify({
          exercicios: [{ enunciado: 'Calcule 1/2 + 1/4', gabarito: '3/4' }],
        }),
        tokens_entrada: 80,
        tokens_saida: 40,
        custo_usd: 0.005,
        metadata: { model: 'gpt-4o-mini' },
      };
    });

    // Claude is fallback — mock to avoid real API calls
    jest.spyOn(claudeProvider, 'generate').mockImplementation(async () => {
      return {
        texto: JSON.stringify({
          habilidades: [{ codigo: 'EF06MA01', nivel_cobertura: 'completo' }],
        }),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: { model: 'claude-sonnet' },
      };
    });
  });

  afterEach(async () => {
    // Clean up test data (don't delete seeded escola/habilidade)
    await prisma.analise.deleteMany({ where: { aula_id: testAulaId } });
    await prisma.transcricao.deleteMany({ where: { aula_id: testAulaId } });
    await prisma.aula.deleteMany({ where: { id: testAulaId } });
    await prisma.planejamentoHabilidade.deleteMany({
      where: { planejamento_id: testPlanejamentoId },
    });
    await prisma.planejamento.deleteMany({ where: { id: testPlanejamentoId } });
    await prisma.turma.deleteMany({ where: { id: testTurmaId } });
    await prisma.perfilUsuario.deleteMany({
      where: { usuario_id: testProfessorId },
    });
    await prisma.usuario.deleteMany({ where: { id: testProfessorId } });

    jest.restoreAllMocks();
  });

  it('should execute complete 5-prompt pipeline end-to-end', async () => {
    // Mock Gemini call 3 (relatorio) to return markdown instead of JSON
    let geminiCallCount = 0;
    jest.spyOn(geminiProvider, 'generate').mockImplementation(async () => {
      geminiCallCount++;
      if (geminiCallCount === 3) {
        return {
          texto: '# Relatório Pedagógico\n\n**Cobertura:** Completa',
          tokens_entrada: 100,
          tokens_saida: 50,
          custo_usd: 0.015,
          metadata: {},
        };
      }
      return {
        texto: JSON.stringify({ data: 'mock' }),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: {},
      };
    });

    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise).toBeDefined();
    expect(analise.id).toBeDefined();
    expect(analise.aula_id).toBe(testAulaId);
    expect(analise.transcricao_id).toBe(testTranscricaoId);
    expect(analise.planejamento_id).toBe(testPlanejamentoId);
  }, 30000);

  it('should populate cobertura_json with habilidades structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.cobertura_json).toBeDefined();
    expect(typeof analise.cobertura_json).toBe('object');
    // Should have habilidades array (from mock)
    expect(analise.cobertura_json).toHaveProperty('habilidades');
  }, 30000);

  it('should populate analise_qualitativa_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.analise_qualitativa_json).toBeDefined();
    expect(typeof analise.analise_qualitativa_json).toBe('object');
  }, 30000);

  it('should save relatorio_texto as markdown string (not JSON)', async () => {
    // Mock Gemini call 3 (relatorio) to return markdown
    let geminiCallCount = 0;
    jest.spyOn(geminiProvider, 'generate').mockImplementation(async () => {
      geminiCallCount++;
      if (geminiCallCount === 3) {
        return {
          texto: '# Relatório Pedagógico\n\n**Cobertura:** Completa',
          tokens_entrada: 100,
          tokens_saida: 50,
          custo_usd: 0.015,
          metadata: {},
        };
      }
      return {
        texto: JSON.stringify({ data: 'mock' }),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: {},
      };
    });

    const analise = await analiseService.analisarAula(testAulaId);

    expect(typeof analise.relatorio_texto).toBe('string');
    expect(analise.relatorio_texto).toContain('Relatório Pedagógico');
    expect(analise.relatorio_texto).toContain('Cobertura');
  }, 30000);

  it('should populate exercicios_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.exercicios_json).toBeDefined();
    expect(typeof analise.exercicios_json).toBe('object');
  }, 30000);

  it('should populate alertas_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.alertas_json).toBeDefined();
    expect(typeof analise.alertas_json).toBe('object');
  }, 30000);

  it('should track prompt_versoes_json with 5 versions', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.prompt_versoes_json).toBeDefined();
    expect(typeof analise.prompt_versoes_json).toBe('object');

    const versoes = analise.prompt_versoes_json as any;
    expect(versoes).toHaveProperty('cobertura');
    expect(versoes).toHaveProperty('qualitativa');
    expect(versoes).toHaveProperty('relatorio');
    expect(versoes).toHaveProperty('exercicios');
    expect(versoes).toHaveProperty('alertas');
  }, 30000);

  it('should track custo_total_usd > 0 and < 0.50 (sanity check)', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.custo_total_usd).toBeGreaterThan(0);
    expect(analise.custo_total_usd).toBeLessThan(0.5); // Sanity check with mocks
  }, 30000);

  it('should track tempo_processamento_ms > 0 and < 120000 (< 2min with mocks)', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.tempo_processamento_ms).toBeGreaterThan(0);
    expect(analise.tempo_processamento_ms).toBeLessThan(120000); // < 2 min with mocked providers
  }, 30000);

  // Story 16.4/16.6 (AC #2, retrocompat): aderencia_objetivo_json deve ser null quando aula sem descricao
  it('should have aderencia_objetivo_json = null when aula has no descricao', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    // Aula criada sem descricao → aderencia_objetivo_json deve ser null
    expect(analise.aderencia_objetivo_json).toBeNull();
  }, 30000);

  it('should update Aula.status_processamento to ANALISADA', async () => {
    await analiseService.analisarAula(testAulaId);

    const aulaUpdated = await prisma.aula.findUnique({
      where: { id: testAulaId },
    });

    expect(aulaUpdated).toBeDefined();
    expect(aulaUpdated!.status_processamento).toBe('ANALISADA');
  }, 30000);

  it('should create one-to-one relation between Aula and Analise', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    const aulaWithAnalise = await prisma.aula.findUnique({
      where: { id: testAulaId },
      include: { analise: true },
    });

    expect(aulaWithAnalise).toBeDefined();
    expect(aulaWithAnalise!.analise).toBeDefined();
    expect(aulaWithAnalise!.analise!.id).toBe(analise.id);
  }, 30000);
});
