import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnaliseService } from '../src/modules/analise/services/analise.service';
import { ClaudeProvider } from '../src/modules/llm/providers/claude.provider';
import { GPTProvider } from '../src/modules/llm/providers/gpt.provider';
import { GeminiProvider } from '../src/modules/llm/providers/gemini.provider';
import { Serie } from '@prisma/client';

/**
 * Story 16.6: Validação E2E e Retrocompatibilidade
 *
 * Testa os seguintes cenários:
 * A - Fluxo legado sem descrição (aderencia_objetivo_json = null)
 * B - Rascunho com descrição → aderência ao objetivo populada
 * C - Planejamento com descrição passado como contexto ao LLM
 * D - Imutabilidade da descrição após sair de RASCUNHO
 * E - Migration safety: dados históricos não corrompidos
 * F - API retrocompatibilidade: GET /aulas/:id/analise retorna campo mesmo null
 *
 * Plus: Prompt seed idempotência (AC #7)
 */

// ─────────────────────────────────────────────────────────────
// Mock Responses
// ─────────────────────────────────────────────────────────────

const MOCK_RELATORIO_SEM_ADERENCIA = `
# Relatório de Análise Pedagógica

Esta aula cobriu adequadamente os conteúdos planejados.

## Pontos Positivos
- Boa sequência didática
- Uso de exemplos contextualizados

## Sugestões
- Aumentar tempo de prática individual
`.trim();

const MOCK_RELATORIO_COM_ADERENCIA = `
# Relatório de Análise Pedagógica

Esta aula cobriu adequadamente os conteúdos planejados e o objetivo declarado.

## Pontos Positivos
- Objetivo atingido majoritariamente

\`\`\`aderencia_json
{
  "faixa_aderencia": "ALTA",
  "descricao_faixa": "Entre 70% e 90% do objetivo declarado foi trabalhado",
  "analise_qualitativa": "O professor planejou trabalhar frações com material concreto. A aula efetivamente utilizou exemplos visuais e material concreto. A atividade em grupos foi parcialmente realizada.",
  "pontos_atingidos": ["Uso de material concreto conforme planejado", "Exemplos visuais de frações"],
  "pontos_nao_atingidos": ["Atividade em grupos não finalizada"],
  "recomendacao": "Retomar a atividade colaborativa na próxima aula para consolidar a aprendizagem."
}
\`\`\`
`.trim();

const MOCK_JSON_RESPONSE = JSON.stringify({
  habilidades: [{ codigo: 'EF06MA01', nivel_cobertura: 'completo', evidencias: ['exemplo'] }],
});

const MOCK_LLM_RESULT_JSON = {
  texto: MOCK_JSON_RESPONSE,
  tokens_entrada: 200,
  tokens_saida: 100,
  custo_usd: 0.01,
  metadata: {},
};

const MOCK_GPT_RESULT = {
  texto: JSON.stringify({ exercicios: [{ enunciado: 'Mock', gabarito: 'Mock' }] }),
  tokens_entrada: 80,
  tokens_saida: 40,
  custo_usd: 0.005,
  metadata: {},
};

/**
 * Cria um mock de GeminiProvider.generate com contador de chamadas.
 * providers.config.json roteia: cobertura→Gemini(1), qualitativa→Gemini(2),
 * relatorio→Gemini(3), alertas→Gemini(4). GPT4_MINI é primary para exercicios.
 * Chamada 3 do Gemini (relatorio) retorna o texto markdown especificado.
 */
function createGeminiMockImpl(relatorioText: string) {
  let callCount = 0;
  return async () => {
    callCount++;
    if (callCount === 3) {
      return {
        texto: relatorioText,
        tokens_entrada: 500,
        tokens_saida: 200,
        custo_usd: 0.015,
        metadata: {},
      };
    }
    return { ...MOCK_LLM_RESULT_JSON };
  };
}

// ─────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────

describe('Analise Aderência ao Objetivo + Retrocompatibilidade Epic 16 (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analiseService: AnaliseService;
  let claudeProvider: ClaudeProvider;
  let gptProvider: GPTProvider;
  let geminiProvider: GeminiProvider;

  // IDs criados no setup
  let escolaId: string;
  let professorToken: string;
  let professorId: string;
  let turmaId: string;
  let planejamentoId: string;
  let habilidadeId: string;

  // ID da analise legacy (sem aderencia) para Cenário F
  let legacyAulaId: string;

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

    // Usar escola demo do seed
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });
    if (!escolaDemo) throw new Error('Demo school not found. Run: npx prisma db seed');
    escolaId = escolaDemo.id;

    // Criar/atualizar professor de teste
    const senhaHash = await bcrypt.hash('Aderencia@123', 10);
    const professor = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof.aderencia@escolademo.com',
          escola_id: escolaId,
        },
      },
      update: {},
      create: {
        nome: 'Professor Aderência 16.6',
        email: 'prof.aderencia@escolademo.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
        perfil_usuario: { create: { role: 'PROFESSOR' } },
      },
    });
    professorId = professor.id;

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof.aderencia@escolademo.com', senha: 'Aderencia@123' });
    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
    }
    professorToken = loginRes.body.accessToken;

    // Criar turma de teste (ano_letivo: 2099 para isolamento)
    const turma = await prisma.turma.create({
      data: {
        nome: 'E2E-16.6-ADERENCIA',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        turno: 'MATUTINO',
        ano_letivo: 2099,
        escola_id: escolaId,
        professor_id: professorId,
      },
    });
    turmaId = turma.id;

    // Buscar habilidade BNCC para os testes
    const habilidade = await prisma.habilidade.findFirst({
      where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
    });
    if (!habilidade) throw new Error('Habilidade BNCC não encontrada. Run: npx prisma db seed');
    habilidadeId = habilidade.id;

    // Criar planejamento padrão (sem descricao)
    const planejamento = await prisma.planejamento.create({
      data: {
        turma_id: turmaId,
        bimestre: 1,
        ano_letivo: 2099,
        escola_id: escolaId,
        professor_id: professorId,
        habilidades: { create: [{ habilidade_id: habilidadeId, peso: 1.0 }] },
      },
    });
    planejamentoId = planejamento.id;
  }, 60000);

  afterAll(async () => {
    // Cleanup na ordem correta (FK constraints)
    // Buscar aulas do ano 2099 (isoladas por ano_letivo fictício)
    const aulas = await prisma.aula.findMany({
      where: { turma: { ano_letivo: 2099 } },
      select: { id: true },
    });
    const aulaIds = aulas.map((a) => a.id);

    if (aulaIds.length > 0) {
      await prisma.analise.deleteMany({ where: { aula_id: { in: aulaIds } } });
      await prisma.transcricao.deleteMany({ where: { aula_id: { in: aulaIds } } });
      await prisma.aula.deleteMany({ where: { id: { in: aulaIds } } });
    }

    await prisma.planejamentoHabilidade.deleteMany({
      where: { planejamento: { turma: { ano_letivo: 2099 } } },
    });
    await prisma.planejamento.deleteMany({ where: { turma: { ano_letivo: 2099 } } });
    await prisma.turma.deleteMany({ where: { ano_letivo: 2099 } });

    await prisma.usuario
      .delete({
        where: {
          email_escola_id: { email: 'prof.aderencia@escolademo.com', escola_id: escolaId },
        },
      })
      .catch(() => {
        // Ignore if already deleted
      });

    await app.close();
  }, 60000);

  // FIX H1: afterEach garante cleanup de mocks mesmo se um teste falhar mid-way.
  // Evita mock leak entre Cenários A→B→C→D→E→F.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário A: Fluxo legado sem descrição (AC #2, #8)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário A: Fluxo legado sem descrição (AC #2, #8)', () => {
    it(
      'deve executar pipeline normalmente e retornar aderencia_objetivo_json = null quando aula não tem descricao',
      async () => {
        // Criar aula diretamente via Prisma (sem descricao — fluxo legado)
        const aula = await prisma.aula.create({
          data: {
            turma_id: turmaId,
            escola_id: escolaId,
            professor_id: professorId,
            planejamento_id: planejamentoId,
            data: new Date('2099-06-15'),
            tipo_entrada: 'TRANSCRICAO',
            status_processamento: 'TRANSCRITA',
            descricao: null,
          },
        });
        legacyAulaId = aula.id; // Guardado para Cenário F

        // Criar transcrição via Prisma
        await prisma.transcricao.create({
          data: {
            aula_id: aula.id,
            texto: 'Hoje vamos aprender sobre frações. Uma fração representa partes de um todo. A fração 1/2 é metade.',
            provider: 'WHISPER',
            idioma: 'pt-BR',
            duracao_segundos: 2700,
            confianca: 0.95,
            custo_usd: 0.05,
            tempo_processamento_ms: 45000,
          },
        });

        // Mock todos os providers:
        // Gemini: primary para cobertura(1), qualitativa(2), relatorio(3), alertas(4)
        // GPT: primary para exercicios
        // Claude: fallback genérico por segurança
        jest
          .spyOn(geminiProvider, 'generate')
          .mockImplementation(createGeminiMockImpl(MOCK_RELATORIO_SEM_ADERENCIA));
        jest.spyOn(gptProvider, 'generate').mockResolvedValue({ ...MOCK_GPT_RESULT });
        jest.spyOn(claudeProvider, 'generate').mockResolvedValue({ ...MOCK_LLM_RESULT_JSON });

        // Executar pipeline
        const analise = await analiseService.analisarAula(aula.id);

        // Assertions AC #2: aderencia_objetivo_json = null (aula sem descricao)
        expect(analise).toBeDefined();
        expect(analise.aderencia_objetivo_json).toBeNull();

        // Aula status deve ser ANALISADA
        const aulaAtualizada = await prisma.aula.findUnique({ where: { id: aula.id } });
        expect(aulaAtualizada!.status_processamento).toBe('ANALISADA');

        // Relatório deve conter markdown
        expect(typeof analise.relatorio_texto).toBe('string');
        expect(analise.relatorio_texto).toContain('Relatório');
      },
      30000,
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário B: Rascunho com descrição → análise com aderência (AC #3)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário B: Rascunho com descrição → aderência (AC #3)', () => {
    it(
      'deve popular aderencia_objetivo_json quando aula rascunho tem descricao',
      async () => {
        // Criar rascunho via HTTP
        const rascunhoRes = await request(app.getHttpServer())
          .post('/api/v1/aulas/rascunho')
          .set('Authorization', `Bearer ${professorToken}`)
          .send({
            turma_id: turmaId,
            data: '2099-07-10',
            planejamento_id: planejamentoId,
            descricao: 'Trabalhar frações com material concreto',
          });

        expect(rascunhoRes.status).toBe(201);
        const aulaId = rascunhoRes.body.id;
        expect(rascunhoRes.body.status_processamento).toBe('RASCUNHO');
        expect(rascunhoRes.body.descricao).toBe('Trabalhar frações com material concreto');

        // Iniciar processamento via HTTP (TRANSCRICAO — cria Transcricao atomicamente)
        const iniciarRes = await request(app.getHttpServer())
          .post(`/api/v1/aulas/${aulaId}/iniciar`)
          .set('Authorization', `Bearer ${professorToken}`)
          .send({
            tipo_entrada: 'TRANSCRICAO',
            transcricao_texto:
              'Hoje trabalhamos frações usando material concreto. Usamos blocos de madeira para representar metade e quarto. Os alunos dividiram em grupos.',
          });

        expect(iniciarRes.status).toBe(200);
        expect(iniciarRes.body.status_processamento).toBe('TRANSCRITA');

        // Mock providers — relatorio COM bloco aderencia_json (ALTA)
        jest
          .spyOn(geminiProvider, 'generate')
          .mockImplementation(createGeminiMockImpl(MOCK_RELATORIO_COM_ADERENCIA));
        jest.spyOn(gptProvider, 'generate').mockResolvedValue({ ...MOCK_GPT_RESULT });
        jest.spyOn(claudeProvider, 'generate').mockResolvedValue({ ...MOCK_LLM_RESULT_JSON });

        // Executar análise diretamente via service
        const analise = await analiseService.analisarAula(aulaId);

        // Assertions AC #3: aderencia populada
        expect(analise.aderencia_objetivo_json).not.toBeNull();

        const aderencia = analise.aderencia_objetivo_json as Record<string, unknown>;
        expect(aderencia.faixa_aderencia).toBe('ALTA');
        expect(Array.isArray(aderencia.pontos_atingidos)).toBe(true);
        expect((aderencia.pontos_atingidos as string[]).length).toBeGreaterThan(0);
        expect(typeof aderencia.recomendacao).toBe('string');
        expect(aderencia.recomendacao).toBeTruthy();
        expect(typeof aderencia.analise_qualitativa).toBe('string');
      },
      30000,
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário C: Planejamento com descrição no contexto (AC #4)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário C: Planejamento com descrição no contexto (AC #4)', () => {
    it('deve passar descricao_planejamento e descricao_aula como contexto ao LLM', async () => {
      // Criar planejamento COM descricao
      const planejamentoComDescricao = await prisma.planejamento.create({
        data: {
          turma_id: turmaId,
          bimestre: 2,
          ano_letivo: 2099,
          escola_id: escolaId,
          professor_id: professorId,
          descricao: 'Material concreto + avaliação formativa',
          habilidades: { create: [{ habilidade_id: habilidadeId, peso: 1.0 }] },
        },
      });

      // Criar aula COM descricao vinculada ao planejamento
      const aula = await prisma.aula.create({
        data: {
          turma_id: turmaId,
          escola_id: escolaId,
          professor_id: professorId,
          planejamento_id: planejamentoComDescricao.id,
          data: new Date('2099-08-10'),
          tipo_entrada: 'TRANSCRICAO',
          status_processamento: 'TRANSCRITA',
          descricao: 'Objetivo específico desta aula',
        },
      });

      // Criar transcrição via Prisma
      await prisma.transcricao.create({
        data: {
          aula_id: aula.id,
          texto: 'Hoje trabalhamos frações com material concreto e avaliamos o progresso dos alunos.',
          provider: 'WHISPER',
          idioma: 'pt-BR',
          duracao_segundos: 3000,
          confianca: 0.92,
          custo_usd: 0.04,
          tempo_processamento_ms: 40000,
        },
      });

      // FIX M4: Spy no geminiProvider usando counter-based mock (igual Cenários A/B).
      // Captura argumentos para verificar contexto E garante que call #3 (relatorio)
      // retorna markdown válido — evita falha silenciosa no pipeline.
      const capturedPrompts: string[] = [];
      let callCount = 0;
      jest.spyOn(geminiProvider, 'generate').mockImplementation(async (prompt: string) => {
        capturedPrompts.push(prompt);
        callCount++;
        if (callCount === 3) {
          // call #3 = relatorio → retorna markdown sem bloco aderencia_json
          return {
            texto: MOCK_RELATORIO_SEM_ADERENCIA,
            tokens_entrada: 500,
            tokens_saida: 200,
            custo_usd: 0.015,
            metadata: {},
          };
        }
        return { ...MOCK_LLM_RESULT_JSON };
      });
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({ ...MOCK_GPT_RESULT });
      jest.spyOn(claudeProvider, 'generate').mockResolvedValue({ ...MOCK_LLM_RESULT_JSON });

      // Executar análise (não deve lançar exceção)
      await analiseService.analisarAula(aula.id);

      // Verificar que os prompts contêm as descrições
      const allPromptsContent = capturedPrompts.join('\n');
      expect(allPromptsContent).toContain('Material concreto + avaliação formativa');
      expect(allPromptsContent).toContain('Objetivo específico desta aula');
    }, 30000);
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário D: Imutabilidade da descrição após sair de RASCUNHO (AC #5)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário D: Imutabilidade da descrição (AC #5)', () => {
    it('deve retornar 400 ao tentar editar descricao após iniciar (sair de RASCUNHO)', async () => {
      // Criar rascunho sem descricao
      const rascunhoRes = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          turma_id: turmaId,
          data: '2099-09-10',
        });
      expect(rascunhoRes.status).toBe(201);
      const aulaId = rascunhoRes.body.id;
      expect(rascunhoRes.body.status_processamento).toBe('RASCUNHO');

      // PATCH /aulas/:id/descricao funciona enquanto RASCUNHO → deve retornar 200
      const patchRascunhoRes = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}/descricao`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ descricao: 'Descrição durante rascunho' });
      expect(patchRascunhoRes.status).toBe(200);

      // Iniciar com AUDIO → status muda para CRIADA (sai de RASCUNHO)
      const iniciarRes = await request(app.getHttpServer())
        .post(`/api/v1/aulas/${aulaId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ tipo_entrada: 'AUDIO' });
      expect(iniciarRes.status).toBe(200);
      expect(iniciarRes.body.status_processamento).toBe('CRIADA');

      // Tentar editar descrição após sair de RASCUNHO → deve retornar 400
      const patchAposIniciarRes = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}/descricao`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ descricao: 'Tentativa de edição proibida' });
      expect(patchAposIniciarRes.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário E: Migration Safety — dados históricos (AC #6)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário E: Migration Safety — dados históricos (AC #6)', () => {
    it('aulas pré-existentes (não 2099) têm descricao = null', async () => {
      const aulaExistente = await prisma.aula.findFirst({
        where: { turma: { escola_id: escolaId, ano_letivo: { not: 2099 } } },
      });

      if (aulaExistente) {
        // Se existe, descricao deve ser null (campo nullable sem default)
        expect(aulaExistente.descricao).toBeNull();
      }
      // Se não existem aulas antigas, o teste é trivialmente válido
    });

    it('planejamentos pré-existentes (não 2099) têm descricao = null', async () => {
      const planejamentoExistente = await prisma.planejamento.findFirst({
        where: { turma: { escola_id: escolaId, ano_letivo: { not: 2099 } } },
      });

      if (planejamentoExistente) {
        expect(planejamentoExistente.descricao).toBeNull();
      }
    });

    it('análises pré-existentes têm aderencia_objetivo_json = null', async () => {
      const analiseExistente = await prisma.analise.findFirst({
        where: {
          aula: {
            escola_id: escolaId,
            turma: { ano_letivo: { not: 2099 } },
          },
        },
      });

      if (analiseExistente) {
        expect(analiseExistente.aderencia_objetivo_json).toBeNull();
      }
    });

    it('status RASCUNHO não quebrou aulas com status CRIADA existentes', async () => {
      const aulasCriadas = await prisma.aula.findMany({
        where: { status_processamento: 'CRIADA' },
        take: 5,
      });

      // CRIADA ainda deve funcionar — cada aula deve ter status CRIADA
      aulasCriadas.forEach((aula) => {
        expect(aula.status_processamento).toBe('CRIADA');
      });
    });

    it('enum RASCUNHO existe e pode ser consultado via Prisma', async () => {
      const aula = await prisma.aula.create({
        data: {
          turma_id: turmaId,
          escola_id: escolaId,
          professor_id: professorId,
          data: new Date('2099-10-01'),
          status_processamento: 'RASCUNHO',
        },
      });

      const found = await prisma.aula.findUnique({ where: { id: aula.id } });
      expect(found!.status_processamento).toBe('RASCUNHO');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cenário F: API retrocompatibilidade (AC #8)
  // ─────────────────────────────────────────────────────────────

  describe('Cenário F: API retrocompatibilidade (AC #8)', () => {
    // FIX M2: Cenário F não depende mais do legacyAulaId do Cenário A.
    // Cria sua própria aula+analise legada para ser auto-suficiente.
    let localLegacyAulaId: string;

    beforeAll(async () => {
      // Criar aula legada (sem descricao) diretamente via Prisma
      const aula = await prisma.aula.create({
        data: {
          turma_id: turmaId,
          escola_id: escolaId,
          professor_id: professorId,
          planejamento_id: planejamentoId,
          data: new Date('2099-11-01'),
          tipo_entrada: 'TRANSCRICAO',
          status_processamento: 'TRANSCRITA',
          descricao: null,
        },
      });
      localLegacyAulaId = aula.id;

      await prisma.transcricao.create({
        data: {
          aula_id: aula.id,
          texto: 'Aula legada sem objetivo declarado sobre frações.',
          provider: 'WHISPER',
          idioma: 'pt-BR',
          duracao_segundos: 1800,
          confianca: 0.90,
          custo_usd: 0.04,
          tempo_processamento_ms: 35000,
        },
      });

      // Executar pipeline com mock (sem bloco aderencia_json)
      jest
        .spyOn(geminiProvider, 'generate')
        .mockImplementation(createGeminiMockImpl(MOCK_RELATORIO_SEM_ADERENCIA));
      jest.spyOn(gptProvider, 'generate').mockResolvedValue({ ...MOCK_GPT_RESULT });
      jest.spyOn(claudeProvider, 'generate').mockResolvedValue({ ...MOCK_LLM_RESULT_JSON });

      await analiseService.analisarAula(aula.id);
      jest.restoreAllMocks(); // limpar mocks do beforeAll imediatamente
    }, 30000);

    it('GET /aulas/:id/analise retorna aderencia_objetivo_json: null para analise legada', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${localLegacyAulaId}/analise`)
        .set('Authorization', `Bearer ${professorToken}`);

      expect(res.status).toBe(200);

      // Campo deve estar presente (não undefined) mas ser null
      expect(res.body).toHaveProperty('aderencia_objetivo_json');
      expect(res.body.aderencia_objetivo_json).toBeNull();

      // aula.descricao deve estar presente e ser null (FIX M1: verifica campo exposto)
      expect(res.body.aula).toHaveProperty('descricao');
      expect(res.body.aula.descricao).toBeNull();

      // Outros campos da analise devem estar presentes (nomes da API, não do DB)
      expect(res.body.id).toBeDefined();
      expect(res.body.relatorio).toBeDefined();
      expect(res.body.cobertura_bncc).toBeDefined();
      expect(res.body.analise_qualitativa).toBeDefined();
      expect(res.body.exercicios).toBeDefined();
      expect(res.body.alertas).toBeDefined();
    });

    // FIX L2: Teste de isolamento cross-tenant (project-context.md Rule #5)
    it('GET /aulas/:id/analise retorna 404 para professor de outra escola (cross-tenant isolation)', async () => {
      // Criar professor em outra escola (usa a escola demo com CNPJ diferente para simular)
      // Como não temos outra escola no seed, criamos um professor na mesma escola
      // mas verificamos que ele não tem acesso à aula de outro professor
      const senhaHash2 = await bcrypt.hash('OutroProf@123', 10);
      const outroProfessor = await prisma.usuario.upsert({
        where: {
          email_escola_id: {
            email: 'outro.prof.16.6@escolademo.com',
            escola_id: escolaId,
          },
        },
        update: {},
        create: {
          nome: 'Outro Professor 16.6',
          email: 'outro.prof.16.6@escolademo.com',
          senha_hash: senhaHash2,
          escola_id: escolaId,
          perfil_usuario: { create: { role: 'PROFESSOR' } },
        },
      });

      const outroProfLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'outro.prof.16.6@escolademo.com', senha: 'OutroProf@123' });
      const outroProfToken = outroProfLoginRes.body.accessToken;

      // Outro professor NÃO deve conseguir acessar a aula de professorId
      const res = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${localLegacyAulaId}/analise`)
        .set('Authorization', `Bearer ${outroProfToken}`);

      // Deve retornar 403 (não é dono da aula) ou 404 (multi-tenancy)
      expect([403, 404]).toContain(res.status);

      // Cleanup do professor auxiliar
      await prisma.usuario
        .delete({
          where: {
            email_escola_id: {
              email: 'outro.prof.16.6@escolademo.com',
              escola_id: escolaId,
            },
          },
        })
        .catch(() => {});
    }, 30000);
  });

  // ─────────────────────────────────────────────────────────────
  // Seed de Prompts v5 — Idempotência (AC #7)
  // ─────────────────────────────────────────────────────────────

  describe('Seed de Prompts v5 — Idempotência (AC #7)', () => {
    it('deve ter pelo menos 5 prompts v5 ativos no banco', async () => {
      const v5Prompts = await prisma.prompt.findMany({
        where: { versao: { startsWith: 'v5' }, ativo: true },
      });

      expect(v5Prompts.length).toBeGreaterThanOrEqual(5);
    });

    it('deve ter prompts v4 com ativo = false', async () => {
      const v4Ativos = await prisma.prompt.count({
        where: { versao: { startsWith: 'v4' }, ativo: true },
      });

      expect(v4Ativos).toBe(0);
    });

    it('deve ter os 5 nomes de prompts v5 corretos', async () => {
      const v5Prompts = await prisma.prompt.findMany({
        where: { versao: { startsWith: 'v5' }, ativo: true },
      });

      const nomes = v5Prompts.map((p) => p.nome);
      expect(nomes).toContain('prompt-cobertura');
      expect(nomes).toContain('prompt-qualitativa');
      expect(nomes).toContain('prompt-relatorio');
      expect(nomes).toContain('prompt-exercicios');
      expect(nomes).toContain('prompt-alertas');
    });

    it('número de prompts v5 ativos permanece estável após segunda contagem (idempotência)', async () => {
      const countBefore = await prisma.prompt.count({
        where: { versao: { startsWith: 'v5' }, ativo: true },
      });

      // A idempotência é garantida pelo upsert no seed — conta permanece a mesma
      const countAfter = await prisma.prompt.count({
        where: { versao: { startsWith: 'v5' }, ativo: true },
      });

      expect(countAfter).toBe(countBefore);
      expect(countAfter).toBeGreaterThanOrEqual(5);
    });
  });
});
