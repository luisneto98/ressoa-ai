import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Serie, TipoEntrada, StatusProcessamento } from '@prisma/client';

describe('Aulas CRUD API (E2E) - Story 3.1', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & IDs
  let escola1Id: string;
  let escola2Id: string;
  let professor1Token: string;
  let professor2Token: string;
  let turma1Id: string;
  let turma2Id: string;
  let planejamento1Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Wait for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // === SETUP TEST DATA ===

    // 1️⃣ Use Demo School + create additional school for cross-tenant tests
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });

    if (!escolaDemo) {
      throw new Error('Demo school not found. Run: npx prisma db seed');
    }
    escola1Id = escolaDemo.id;

    const escola2 = await prisma.escola.upsert({
      where: { cnpj: '33.333.333/0001-33' },
      update: {},
      create: {
        nome: 'Escola Teste Aulas B',
        cnpj: '33.333.333/0001-33',
        email_contato: 'aulas@escolab.com',
      },
    });
    escola2Id = escola2.id;

    // 2️⃣ Use existing demo professor + create professor for escola2
    const professor1 = await prisma.usuario.findFirst({
      where: {
        email: 'professor@escolademo.com',
        escola_id: escola1Id,
      },
    });

    if (!professor1) {
      throw new Error('Demo professor not found. Run: npx prisma db seed');
    }

    const senhaHash = await bcrypt.hash('Test@123', 10);

    const professor2 = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof2@aulas.com',
          escola_id: escola2Id,
        },
      },
      update: {},
      create: {
        nome: 'Professor 2',
        email: 'prof2@aulas.com',
        senha_hash: senhaHash,
        escola_id: escola2Id,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });

    // 3️⃣ Create test turmas
    const turma1 = await prisma.turma.create({
      data: {
        nome: '6A Aulas',
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        ano_letivo: 2026,
        escola_id: escola1Id,
        professor_id: professor1.id,
      },
    });
    turma1Id = turma1.id;

    const turma2 = await prisma.turma.create({
      data: {
        nome: '7B Aulas',
        disciplina: 'LINGUA_PORTUGUESA',
        serie: Serie.SETIMO_ANO,
        ano_letivo: 2026,
        escola_id: escola2Id,
        professor_id: professor2.id,
      },
    });
    turma2Id = turma2.id;

    // 4️⃣ Create test planejamento for turma1
    const habilidades = await prisma.habilidade.findMany({
      where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
      take: 2,
      select: {
        id: true,
        codigo: true,
        descricao: true,
        disciplina: true,
        ano_inicio: true,
        ano_fim: true,
        // Exclude searchable (tsvector) to avoid deserialization error
      },
    });

    if (habilidades.length < 2) {
      throw new Error(
        'Need at least 2 Math 6º ano habilidades. Run: npx prisma db seed',
      );
    }

    const planejamento1 = await prisma.planejamento.create({
      data: {
        turma_id: turma1Id,
        bimestre: 1,
        ano_letivo: 2026,
        escola_id: escola1Id,
        professor_id: professor1.id,
        habilidades: {
          create: [
            {
              habilidade_id: habilidades[0].id,
              peso: 1.0,
              aulas_previstas: 10,
            },
            {
              habilidade_id: habilidades[1].id,
              peso: 1.0,
              aulas_previstas: 8,
            },
          ],
        },
      },
    });
    planejamento1Id = planejamento1.id;

    // 5️⃣ Login users
    const prof1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'professor@escolademo.com',
        senha: 'Demo@123',
      });

    if (prof1Login.status !== 200) {
      throw new Error(
        `Professor 1 login failed: ${prof1Login.status} - ${JSON.stringify(prof1Login.body)}`,
      );
    }
    professor1Token = prof1Login.body.accessToken;

    const prof2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'prof2@aulas.com',
        senha: 'Test@123',
      });

    if (prof2Login.status !== 200) {
      throw new Error(
        `Professor 2 login failed: ${prof2Login.status} - ${JSON.stringify(prof2Login.body)}`,
      );
    }
    professor2Token = prof2Login.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup: delete transcricoes first (FK dependency)
    // Note: Transcricao no longer has escola_id, filter via Aula relation
    await prisma.transcricao.deleteMany({
      where: {
        aula: {
          escola_id: { in: [escola1Id, escola2Id] },
        },
      },
    });

    // Cleanup: delete test aulas
    await prisma.aula.deleteMany({
      where: {
        turma: {
          escola_id: { in: [escola1Id, escola2Id] },
        },
      },
    });

    await prisma.planejamentoHabilidade.deleteMany({
      where: {
        planejamento: {
          turma: {
            escola_id: { in: [escola1Id, escola2Id] },
          },
        },
      },
    });
    await prisma.planejamento.deleteMany({
      where: {
        turma: {
          escola_id: { in: [escola1Id, escola2Id] },
        },
      },
    });
    await prisma.turma.deleteMany({
      where: { escola_id: { in: [escola1Id, escola2Id] } },
    });

    await app.close();
  });

  // ============================================
  // TEST SUITE: Complete CRUD Flow (AC: 8 steps)
  // ============================================

  describe('Complete CRUD Flow (AC: Fluxo completo)', () => {
    let aulaId: string;

    it('1. Login como professor → recebe token', () => {
      expect(professor1Token).toBeDefined();
    });

    it('2. GET /aulas → retorna array vazio', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('3. POST /aulas com dados válidos → retorna 201 com aula (status: CRIADA)', async () => {
      const createDto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        tipo_entrada: TipoEntrada.MANUAL,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        turma_id: turma1Id,
        tipo_entrada: TipoEntrada.MANUAL,
        status_processamento: StatusProcessamento.CRIADA,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.turma).toBeDefined();

      aulaId = response.body.id;
    });

    it('4. GET /aulas → retorna array com 1 aula', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(aulaId);
    });

    it('5. GET /aulas/:id → retorna aula completa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(aulaId);
      expect(response.body.turma).toBeDefined();
      expect(response.body.turma.nome).toBe('6A Aulas');
      // Validate future relations are null (Story 3.1)
      expect(response.body.transcricao_id).toBeNull();
      expect(response.body.analise_id).toBeNull();
    });

    it('6. PATCH /aulas/:id alterando planejamento → retorna 200 atualizado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ planejamento_id: planejamento1Id });

      expect(response.status).toBe(200);
      expect(response.body.planejamento_id).toBe(planejamento1Id);
    });

    it('7. Filtro GET /aulas?status_processamento=CRIADA → retorna apenas aulas criadas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .query({ status_processamento: StatusProcessamento.CRIADA })
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status_processamento).toBe(
        StatusProcessamento.CRIADA,
      );
    });

    it('8. Filtro GET /aulas?data_inicio=2026-02-01&data_fim=2026-02-28 → retorna aulas de fevereiro', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .query({
          data_inicio: '2026-02-01',
          data_fim: '2026-02-28',
        })
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  // ============================================
  // TEST SUITE: Multi-Tenancy Validation
  // ============================================

  describe('Multi-Tenancy Validation', () => {
    let aula1Id: string;

    beforeAll(async () => {
      // Create aula for professor1 (escola1)
      const aula1 = await prisma.aula.create({
        data: {
          turma_id: turma1Id,
          data: new Date('2026-02-11T10:00:00Z'),
          tipo_entrada: TipoEntrada.MANUAL,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          escola_id: escola1Id,
          status_processamento: StatusProcessamento.CRIADA,
        },
      });
      aula1Id = aula1.id;
    });

    it('should block cross-tenant access (GET by ID)', async () => {
      // Professor2 (escola2) tries to access aula from escola1
      const response = await request(app.getHttpServer())
        .get(`/api/v1/aulas/${aula1Id}`)
        .set('Authorization', `Bearer ${professor2Token}`);

      expect(response.status).toBe(404); // Blocked by escola_id filter
    });

    it('should block cross-tenant access (PATCH)', async () => {
      // Professor2 tries to update aula from escola1
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aula1Id}`)
        .set('Authorization', `Bearer ${professor2Token}`)
        .send({ planejamento_id: planejamento1Id });

      expect(response.status).toBe(404); // Blocked by escola_id filter
    });

    it('should not list cross-tenant aulas (GET list)', async () => {
      // Professor2 should NOT see aulas from escola1
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor2Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]); // Empty for professor2
    });
  });

  // ============================================
  // TEST SUITE: Validation Tests
  // ============================================

  describe('Validation Tests', () => {
    it('should reject future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: futureDate.toISOString(),
          tipo_entrada: TipoEntrada.MANUAL,
        });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        'não pode estar no futuro',
      );
    });

    it('should reject invalid turma_id (not owned by professor)', async () => {
      // Professor1 tries to create aula for turma2 (owned by professor2)
      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma2Id, // Turma belongs to professor2
          data: '2026-02-11T10:00:00Z',
          tipo_entrada: TipoEntrada.MANUAL,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('não pertence ao professor');
    });

    it('should reject invalid planejamento_id (not for turma)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11T10:00:00Z',
          tipo_entrada: TipoEntrada.MANUAL,
          planejamento_id: 'invalid-uuid-not-for-turma',
        });

      expect(response.status).toBe(400); // DTO validation fails
    });

    it('should reject planejamento_id from different turma (same professor)', async () => {
      // Create another turma and planejamento for professor1
      const turma3 = await prisma.turma.create({
        data: {
          nome: '7C Aulas',
          disciplina: 'MATEMATICA',
          serie: Serie.SETIMO_ANO,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
        },
      });

      const habilidade7 = await prisma.habilidade.findFirst({
        where: { disciplina: 'MATEMATICA', ano_inicio: 7 },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          disciplina: true,
          ano_inicio: true,
          ano_fim: true,
          // Exclude searchable (tsvector) to avoid deserialization error
        },
      });

      const planejamento3 = await prisma.planejamento.create({
        data: {
          turma_id: turma3.id,
          bimestre: 1,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          habilidades: {
            create: [
              {
                habilidade_id: habilidade7!.id,
                peso: 1.0,
              },
            ],
          },
        },
      });

      // Try to create aula for turma1 with planejamento from turma3
      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id, // Turma 1
          data: '2026-02-11T10:00:00Z',
          tipo_entrada: TipoEntrada.MANUAL,
          planejamento_id: planejamento3.id, // Planejamento for Turma 3
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não pertence à turma');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamento3.id },
      });
      await prisma.planejamento.delete({ where: { id: planejamento3.id } });
      await prisma.turma.delete({ where: { id: turma3.id } });
    });

    it('should reject soft-deleted planejamento_id', async () => {
      // Create a planejamento and soft-delete it
      const habilidade = await prisma.habilidade.findFirst({
        where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          disciplina: true,
          ano_inicio: true,
          ano_fim: true,
          // Exclude searchable (tsvector) to avoid deserialization error
        },
      });

      const planejamentoDeleted = await prisma.planejamento.create({
        data: {
          turma_id: turma1Id,
          bimestre: 2,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          deleted_at: new Date(), // Soft-deleted
          habilidades: {
            create: [
              {
                habilidade_id: habilidade!.id,
                peso: 1.0,
              },
            ],
          },
        },
      });

      // Try to create aula with soft-deleted planejamento
      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          data: '2026-02-11T10:00:00Z',
          tipo_entrada: TipoEntrada.MANUAL,
          planejamento_id: planejamentoDeleted.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não encontrado');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamentoDeleted.id },
      });
      await prisma.planejamento.delete({
        where: { id: planejamentoDeleted.id },
      });
    });
  });

  // ============================================
  // TEST SUITE: State Transition Validation
  // ============================================

  describe('State Transition Validation', () => {
    let aulaId: string;

    beforeEach(async () => {
      // Create fresh aula for each test
      const aula = await prisma.aula.create({
        data: {
          turma_id: turma1Id,
          data: new Date('2026-02-11T10:00:00Z'),
          tipo_entrada: TipoEntrada.AUDIO,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          escola_id: escola1Id,
          status_processamento: StatusProcessamento.CRIADA,
        },
      });
      aulaId = aula.id;
    });

    it('should allow: CRIADA → AGUARDANDO_TRANSCRICAO (professor)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          status_processamento: StatusProcessamento.AGUARDANDO_TRANSCRICAO,
        });

      expect(response.status).toBe(200);
      expect(response.body.status_processamento).toBe(
        StatusProcessamento.AGUARDANDO_TRANSCRICAO,
      );
    });

    it('should reject: CRIADA → TRANSCRITA (worker only)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ status_processamento: StatusProcessamento.TRANSCRITA });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não permitida para professor');
    });

    it('should allow: ANALISADA → APROVADA (professor)', async () => {
      // First, set status to ANALISADA (simulate worker processing)
      await prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: StatusProcessamento.ANALISADA },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ status_processamento: StatusProcessamento.APROVADA });

      expect(response.status).toBe(200);
      expect(response.body.status_processamento).toBe(
        StatusProcessamento.APROVADA,
      );
    });

    it('should allow: ANALISADA → REJEITADA (professor)', async () => {
      // First, set status to ANALISADA
      await prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: StatusProcessamento.ANALISADA },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ status_processamento: StatusProcessamento.REJEITADA });

      expect(response.status).toBe(200);
      expect(response.body.status_processamento).toBe(
        StatusProcessamento.REJEITADA,
      );
    });

    it('should reject: TRANSCRITA → CRIADA (invalid)', async () => {
      // Set status to TRANSCRITA (simulate worker processing)
      await prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: StatusProcessamento.TRANSCRITA },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ status_processamento: StatusProcessamento.CRIADA });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não permitida para professor');
    });

    it('should reject: UPLOAD_PROGRESSO → APROVADA (invalid)', async () => {
      // Set status to UPLOAD_PROGRESSO
      await prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: StatusProcessamento.UPLOAD_PROGRESSO },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({ status_processamento: StatusProcessamento.APROVADA });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não permitida para professor');
    });
  });

  // ============================================
  // TEST SUITE: Soft Delete
  // ============================================

  describe('Soft Delete', () => {
    it('should exclude soft-deleted aulas from GET list', async () => {
      // Create aula
      const aula = await prisma.aula.create({
        data: {
          turma_id: turma1Id,
          data: new Date('2026-02-11T10:00:00Z'),
          tipo_entrada: TipoEntrada.MANUAL,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          escola_id: escola1Id,
          status_processamento: StatusProcessamento.CRIADA,
        },
      });

      // Soft delete it
      await prisma.aula.update({
        where: { id: aula.id },
        data: { deleted_at: new Date() },
      });

      // Should not appear in list
      const response = await request(app.getHttpServer())
        .get('/api/v1/aulas')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      const foundAula = response.body.find((a: any) => a.id === aula.id);
      expect(foundAula).toBeUndefined();
    });
  });

  // ============================================
  // TEST SUITE: Story 3.3 - Multiple Input Methods
  // ============================================

  describe('Story 3.3: Upload Transcrição (AC: Método 2)', () => {
    it('should create aula with complete transcription upload', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        planejamento_id: planejamento1Id,
        transcricao_texto: 'A'.repeat(100), // 100 chars (min valid)
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.tipo_entrada).toBe('TRANSCRICAO');
      expect(response.body.status_processamento).toBe('TRANSCRITA');
      expect(response.body.transcricao).toBeDefined();
      expect(response.body.transcricao.provider).toBe('MANUAL');
      expect(response.body.transcricao.confianca).toBe(1.0);
      expect(response.body.transcricao.duracao_segundos).toBeNull();
      expect(response.body.transcricao.texto).toHaveLength(100);
    });

    it('should reject transcription with less than 100 chars', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        transcricao_texto: 'Muito curto', // < 100 chars
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        'no mínimo 100 caracteres',
      );
    });

    it('should reject transcription exceeding 50k chars', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        transcricao_texto: 'A'.repeat(50001), // > 50k
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        '50.000 caracteres',
      );
    });

    it('should reject future date (upload-transcricao)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const dto = {
        turma_id: turma1Id,
        data: futureDate.toISOString(),
        transcricao_texto: 'A'.repeat(100),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        'não pode estar no futuro',
      );
    });

    it('should block upload-transcricao for turma from different escola', async () => {
      // Professor1 tries to create aula for turma2 (escola2)
      const dto = {
        turma_id: turma2Id,
        data: '2026-02-11T10:00:00Z',
        transcricao_texto: 'A'.repeat(100),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(403); // Blocked by escola_id + professor_id filter
      expect(response.body.message).toContain('não pertence ao professor');
    });

    it('should reject planejamento from different turma (upload-transcricao)', async () => {
      // Create another turma and planejamento for professor1
      const turma3 = await prisma.turma.create({
        data: {
          nome: '7D Aulas',
          disciplina: 'MATEMATICA',
          serie: Serie.SETIMO_ANO,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
        },
      });

      const habilidade7 = await prisma.habilidade.findFirstOrThrow({
        where: { disciplina: 'MATEMATICA', ano_inicio: 7 },
      });

      const planejamento3 = await prisma.planejamento.create({
        data: {
          turma_id: turma3.id,
          bimestre: 1,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          habilidades: {
            create: [{ habilidade_id: habilidade7.id, peso: 1.0 }],
          },
        },
      });

      const dto = {
        turma_id: turma1Id, // Turma 1
        planejamento_id: planejamento3.id, // Planejamento for Turma 3
        data: '2026-02-11T10:00:00Z',
        transcricao_texto: 'A'.repeat(100),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não pertence à turma');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamento3.id },
      });
      await prisma.planejamento.delete({ where: { id: planejamento3.id } });
      await prisma.turma.delete({ where: { id: turma3.id } });
    });

    it('should reject soft-deleted planejamento (upload-transcricao)', async () => {
      // Create a planejamento and soft-delete it
      const habilidade = await prisma.habilidade.findFirstOrThrow({
        where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
      });

      const planejamentoDeleted = await prisma.planejamento.create({
        data: {
          turma_id: turma1Id,
          bimestre: 3,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          deleted_at: new Date(), // Soft-deleted
          habilidades: {
            create: [{ habilidade_id: habilidade.id, peso: 1.0 }],
          },
        },
      });

      const dto = {
        turma_id: turma1Id,
        planejamento_id: planejamentoDeleted.id,
        data: '2026-02-11T10:00:00Z',
        transcricao_texto: 'A'.repeat(100),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/upload-transcricao')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não encontrado');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamentoDeleted.id },
      });
      await prisma.planejamento.delete({
        where: { id: planejamentoDeleted.id },
      });
    });
  });

  describe('Story 3.3: Entrada Manual (AC: Método 3)', () => {
    it('should create aula with manual entry', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        planejamento_id: planejamento1Id,
        resumo: 'A'.repeat(200), // 200 chars (min valid)
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.tipo_entrada).toBe('MANUAL');
      expect(response.body.status_processamento).toBe('TRANSCRITA');
      expect(response.body.transcricao).toBeDefined();
      expect(response.body.transcricao.provider).toBe('MANUAL');
      expect(response.body.transcricao.confianca).toBe(0.5); // Lower confidence for resume
      expect(response.body.transcricao.duracao_segundos).toBeNull();
      expect(response.body.transcricao.texto).toHaveLength(200);
    });

    it('should reject manual entry with less than 200 chars', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        resumo: 'Resumo muito curto', // < 200 chars
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        'no mínimo 200 caracteres',
      );
    });

    it('should reject manual entry exceeding 5k chars', async () => {
      const dto = {
        turma_id: turma1Id,
        data: '2026-02-11T10:00:00Z',
        resumo: 'A'.repeat(5001), // > 5k
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        '5.000 caracteres',
      );
    });

    it('should reject future date (entrada-manual)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const dto = {
        turma_id: turma1Id,
        data: futureDate.toISOString(),
        resumo: 'A'.repeat(200),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.message)).toContain(
        'não pode estar no futuro',
      );
    });

    it('should block entrada-manual for turma from different escola', async () => {
      // Professor1 tries to create aula for turma2 (escola2)
      const dto = {
        turma_id: turma2Id,
        data: '2026-02-11T10:00:00Z',
        resumo: 'A'.repeat(200),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(403); // Blocked by escola_id + professor_id filter
      expect(response.body.message).toContain('não pertence ao professor');
    });

    it('should reject soft-deleted planejamento (entrada-manual)', async () => {
      // Create a planejamento and soft-delete it
      const habilidade = await prisma.habilidade.findFirstOrThrow({
        where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
      });

      const planejamentoDeleted = await prisma.planejamento.create({
        data: {
          turma_id: turma1Id,
          bimestre: 4,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          deleted_at: new Date(), // Soft-deleted
          habilidades: {
            create: [{ habilidade_id: habilidade.id, peso: 1.0 }],
          },
        },
      });

      const dto = {
        turma_id: turma1Id,
        planejamento_id: planejamentoDeleted.id,
        data: '2026-02-11T10:00:00Z',
        resumo: 'A'.repeat(200),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não encontrado');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamentoDeleted.id },
      });
      await prisma.planejamento.delete({
        where: { id: planejamentoDeleted.id },
      });
    });

    it('should reject planejamento from different turma (entrada-manual)', async () => {
      // Create another turma and planejamento for professor1
      const turma3 = await prisma.turma.create({
        data: {
          nome: '7E Aulas',
          disciplina: 'MATEMATICA',
          serie: Serie.SETIMO_ANO,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
        },
      });

      const habilidade7 = await prisma.habilidade.findFirstOrThrow({
        where: { disciplina: 'MATEMATICA', ano_inicio: 7 },
      });

      const planejamento3 = await prisma.planejamento.create({
        data: {
          turma_id: turma3.id,
          bimestre: 1,
          ano_letivo: 2026,
          escola_id: escola1Id,
          professor_id: (
            await prisma.usuario.findFirstOrThrow({
              where: { email: 'professor@escolademo.com' },
            })
          ).id,
          habilidades: {
            create: [{ habilidade_id: habilidade7.id, peso: 1.0 }],
          },
        },
      });

      const dto = {
        turma_id: turma1Id, // Turma 1
        planejamento_id: planejamento3.id, // Planejamento for Turma 3
        data: '2026-02-11T10:00:00Z',
        resumo: 'A'.repeat(200),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/aulas/entrada-manual')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(dto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('não pertence à turma');

      // Cleanup
      await prisma.planejamentoHabilidade.deleteMany({
        where: { planejamento_id: planejamento3.id },
      });
      await prisma.planejamento.delete({ where: { id: planejamento3.id } });
      await prisma.turma.delete({ where: { id: turma3.id } });
    });
  });
});
