import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnaliseService } from '../src/modules/analise/services/analise.service';
import { AnaliseModule } from '../src/modules/analise/analise.module';
import { LlmModule } from '../src/modules/llm/llm.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ClaudeProvider } from '../src/modules/llm/providers/claude.provider';
import { GPTProvider } from '../src/modules/llm/providers/gpt.provider';

/**
 * E2E Test: Analise Pipeline Execution
 *
 * Tests the complete 5-prompt serial pipeline with realistic database state.
 * Mocks LLM providers to avoid real API calls (cost + speed).
 */
describe('Analise Pipeline (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analiseService: AnaliseService;
  let claudeProvider: ClaudeProvider;
  let gptProvider: GPTProvider;

  let testEscolaId: string;
  let testProfessorId: string;
  let testTurmaId: string;
  let testPlanejamentoId: string;
  let testHabilidadeId: string;
  let testAulaId: string;
  let testTranscricaoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          ignoreEnvFile: false,
        }),
        PrismaModule,
        LlmModule,
        AnaliseModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    analiseService = moduleFixture.get<AnaliseService>(AnaliseService);
    claudeProvider = moduleFixture.get<ClaudeProvider>('CLAUDE_PROVIDER');
    gptProvider = moduleFixture.get<GPTProvider>('GPT_PROVIDER');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Seed minimal test data
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Test E2E',
        cnpj: `12345678000${Date.now().toString().slice(-3)}`,
      },
    });
    testEscolaId = escola.id;

    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Prof Test',
        email: `prof.test.${Date.now()}@example.com`,
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
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        ano_letivo: 2026,
        escola_id: testEscolaId,
        professor_id: testProfessorId,
      },
    });
    testTurmaId = turma.id;

    const habilidade = await prisma.habilidade.create({
      data: {
        codigo: 'EF06MA01',
        descricao: 'Comparar, ordenar, ler e escrever números naturais...',
        disciplina: 'MATEMATICA',
        ano_inicio: 6,
        ano_fim: null,
        unidade_tematica: 'Números',
        objeto_conhecimento: 'Sistema de numeração decimal',
      },
    });
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

    // Create mock prompts
    await prisma.prompt.upsert({
      where: { nome_versao: { nome: 'prompt-cobertura', versao: 'v1.0.0' } },
      create: {
        nome: 'prompt-cobertura',
        versao: 'v1.0.0',
        conteudo: 'Analise cobertura BNCC: {{transcricao}}',
        ativo: true,
      },
      update: {},
    });

    await prisma.prompt.upsert({
      where: { nome_versao: { nome: 'prompt-qualitativa', versao: 'v1.0.0' } },
      create: {
        nome: 'prompt-qualitativa',
        versao: 'v1.0.0',
        conteudo: 'Analise qualitativa: {{cobertura}}',
        ativo: true,
      },
      update: {},
    });

    await prisma.prompt.upsert({
      where: { nome_versao: { nome: 'prompt-relatorio', versao: 'v1.0.0' } },
      create: {
        nome: 'prompt-relatorio',
        versao: 'v1.0.0',
        conteudo: 'Gere relatório: {{analise_qualitativa}}',
        ativo: true,
      },
      update: {},
    });

    await prisma.prompt.upsert({
      where: { nome_versao: { nome: 'prompt-exercicios', versao: 'v1.0.0' } },
      create: {
        nome: 'prompt-exercicios',
        versao: 'v1.0.0',
        conteudo: 'Gere exercícios: {{relatorio}}',
        ativo: true,
      },
      update: {},
    });

    await prisma.prompt.upsert({
      where: { nome_versao: { nome: 'prompt-alertas', versao: 'v1.0.0' } },
      create: {
        nome: 'prompt-alertas',
        versao: 'v1.0.0',
        conteudo: 'Detecte alertas: {{exercicios}}',
        ativo: true,
      },
      update: {},
    });

    // Mock LLM providers to avoid real API calls
    jest.spyOn(claudeProvider, 'generate').mockImplementation(async () => {
      // Return realistic JSON structures
      return {
        texto: JSON.stringify({ habilidades: [{ codigo: 'EF06MA01', nivel_cobertura: 'completo' }] }),
        tokens_entrada: 100,
        tokens_saida: 50,
        custo_usd: 0.02,
        metadata: { model: 'claude-sonnet-4' },
      };
    });

    jest.spyOn(gptProvider, 'generate').mockImplementation(async () => {
      return {
        texto: JSON.stringify({ exercicios: [{ enunciado: 'Calcule 1/2 + 1/4', gabarito: '3/4' }] }),
        tokens_entrada: 80,
        tokens_saida: 40,
        custo_usd: 0.005,
        metadata: { model: 'gpt-4o-mini' },
      };
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.analise.deleteMany({ where: { aula_id: testAulaId } });
    await prisma.transcricao.deleteMany({ where: { aula_id: testAulaId } });
    await prisma.aula.deleteMany({ where: { id: testAulaId } });
    await prisma.planejamentoHabilidade.deleteMany({ where: { planejamento_id: testPlanejamentoId } });
    await prisma.planejamento.deleteMany({ where: { id: testPlanejamentoId } });
    await prisma.habilidade.deleteMany({ where: { id: testHabilidadeId } });
    await prisma.turma.deleteMany({ where: { id: testTurmaId } });
    await prisma.perfilUsuario.deleteMany({ where: { usuario_id: testProfessorId } });
    await prisma.usuario.deleteMany({ where: { id: testProfessorId } });
    await prisma.escola.deleteMany({ where: { id: testEscolaId } });

    jest.restoreAllMocks();
  });

  it('should execute complete 5-prompt pipeline end-to-end', async () => {
    // Mock Prompt 3 to return markdown (not JSON)
    let claudeCallCount = 0;
    jest.spyOn(claudeProvider, 'generate').mockImplementation(async () => {
      claudeCallCount++;
      if (claudeCallCount === 3) {
        // Prompt 3: Relatório em markdown
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
  });

  it('should populate cobertura_json with habilidades structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.cobertura_json).toBeDefined();
    expect(typeof analise.cobertura_json).toBe('object');
    // Should have habilidades array (from mock)
    expect(analise.cobertura_json).toHaveProperty('habilidades');
  });

  it('should populate analise_qualitativa_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.analise_qualitativa_json).toBeDefined();
    expect(typeof analise.analise_qualitativa_json).toBe('object');
  });

  it('should save relatorio_texto as markdown string (not JSON)', async () => {
    // Mock Prompt 3 specifically
    let claudeCallCount = 0;
    jest.spyOn(claudeProvider, 'generate').mockImplementation(async () => {
      claudeCallCount++;
      if (claudeCallCount === 3) {
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
  });

  it('should populate exercicios_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.exercicios_json).toBeDefined();
    expect(typeof analise.exercicios_json).toBe('object');
  });

  it('should populate alertas_json structure', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.alertas_json).toBeDefined();
    expect(typeof analise.alertas_json).toBe('object');
  });

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
  });

  it('should track custo_total_usd > 0 and < 0.50 (sanity check)', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.custo_total_usd).toBeGreaterThan(0);
    expect(analise.custo_total_usd).toBeLessThan(0.5); // Sanity check with mocks
  });

  it('should track tempo_processamento_ms > 0 and < 120000 (< 2min with mocks)', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    expect(analise.tempo_processamento_ms).toBeGreaterThan(0);
    expect(analise.tempo_processamento_ms).toBeLessThan(120000); // < 2 min with mocked providers
  });

  it('should update Aula.status_processamento to ANALISADA', async () => {
    await analiseService.analisarAula(testAulaId);

    const aulaUpdated = await prisma.aula.findUnique({
      where: { id: testAulaId },
    });

    expect(aulaUpdated).toBeDefined();
    expect(aulaUpdated!.status_processamento).toBe('ANALISADA');
  });

  it('should create one-to-one relation between Aula and Analise', async () => {
    const analise = await analiseService.analisarAula(testAulaId);

    const aulaWithAnalise = await prisma.aula.findUnique({
      where: { id: testAulaId },
      include: { analise: true },
    });

    expect(aulaWithAnalise).toBeDefined();
    expect(aulaWithAnalise!.analise).toBeDefined();
    expect(aulaWithAnalise!.analise!.id).toBe(analise.id);
  });
});
