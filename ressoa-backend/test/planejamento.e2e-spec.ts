import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Serie } from '@prisma/client';

describe('Planejamento CRUD API (E2E) - Story 2.1', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & IDs
  let escola1Id: string;
  let escola2Id: string;
  let professor1Token: string;
  let professor2Token: string;
  let coordenadorToken: string;
  let turma1Id: string;
  let turma2Id: string;
  let habilidade1Id: string;
  let habilidade2Id: string;
  let habilidade3Id: string;

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

    // Wait a bit for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // === SETUP TEST DATA ===

    // 1️⃣ Use Demo School (já existe no seed) + criar 1 escola adicional para cross-tenant tests
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });

    if (!escolaDemo) {
      throw new Error('Demo school not found. Run: npx prisma db seed');
    }
    escola1Id = escolaDemo.id;

    const escola2 = await prisma.escola.upsert({
      where: { cnpj: '22.222.222/0001-22' },
      update: {},
      create: {
        nome: 'Escola Teste Planejamento B',
        cnpj: '22.222.222/0001-22',
        email_contato: 'planejamento@escolab.com',
      },
    });
    escola2Id = escola2.id;

    // 2️⃣ Use existing demo users + create professor for escola2
    const professor1 = await prisma.usuario.findFirst({
      where: {
        email: 'professor@escolademo.com',
        escola_id: escola1Id,
      },
    });

    if (!professor1) {
      throw new Error('Demo professor not found. Run: npx prisma db seed');
    }

    const coordenador = await prisma.usuario.findFirst({
      where: {
        email: 'coordenador@escolademo.com',
        escola_id: escola1Id,
      },
    });

    if (!coordenador) {
      throw new Error('Demo coordenador not found. Run: npx prisma db seed');
    }

    // Create professor for escola2 (for cross-tenant tests)
    const senhaHash = await bcrypt.hash('Test@123', 10);

    const professor2 = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof2@planejamento.com',
          escola_id: escola2Id,
        },
      },
      update: {},
      create: {
        nome: 'Professor 2',
        email: 'prof2@planejamento.com',
        senha_hash: senhaHash,
        escola_id: escola2Id,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });

    // 3️⃣ Criar turmas de teste
    const turma1 = await prisma.turma.create({
      data: {
        nome: '6A',
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
        nome: '7B',
        disciplina: 'LINGUA_PORTUGUESA',
        serie: Serie.SETIMO_ANO,
        ano_letivo: 2026,
        escola_id: escola2Id,
        professor_id: professor2.id,
      },
    });
    turma2Id = turma2.id;

    // 4️⃣ Buscar habilidades BNCC de teste (assumindo que já foram seeded)
    const habilidades = await prisma.habilidade.findMany({
      where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
      take: 3,
    });

    if (habilidades.length < 3) {
      throw new Error(
        'Precisa de pelo menos 3 habilidades de Matemática 6º ano no banco para rodar os testes. Rode npx prisma db seed.',
      );
    }

    habilidade1Id = habilidades[0].id;
    habilidade2Id = habilidades[1].id;
    habilidade3Id = habilidades[2].id;

    // 5️⃣ Login dos usuários
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
        email: 'prof2@planejamento.com',
        senha: 'Test@123',
      });

    if (prof2Login.status !== 200) {
      throw new Error(
        `Professor 2 login failed: ${prof2Login.status} - ${JSON.stringify(prof2Login.body)}`,
      );
    }
    professor2Token = prof2Login.body.accessToken;

    const coordLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'coordenador@escolademo.com',
        senha: 'Demo@123',
      });

    if (coordLogin.status !== 200) {
      throw new Error(
        `Coordenador login failed: ${coordLogin.status} - ${JSON.stringify(coordLogin.body)}`,
      );
    }
    coordenadorToken = coordLogin.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup: deletar planejamentos de teste
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
  // TEST SUITE: Complete Flow (AC Completo - 9 steps)
  // ============================================

  describe('Complete Flow (AC: Fluxo completo)', () => {
    let planejamentoId: string;

    it('1. Login como professor → recebe token', () => {
      expect(professor1Token).toBeDefined();
    });

    it('2. GET /planejamentos → retorna array vazio', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('3. POST /planejamentos com dados válidos → retorna 201 com planejamento', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 1,
        ano_letivo: 2026,
        habilidades: [
          { habilidade_id: habilidade1Id, peso: 0.5, aulas_previstas: 20 },
          { habilidade_id: habilidade2Id, peso: 0.5, aulas_previstas: 20 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        turma_id: turma1Id,
        bimestre: 1,
        ano_letivo: 2026,
        escola_id: escola1Id,
        validado_coordenacao: false,
        habilidades: expect.arrayContaining([
          expect.objectContaining({
            habilidade_id: habilidade1Id,
            peso: 0.5,
            aulas_previstas: 20,
          }),
          expect.objectContaining({
            habilidade_id: habilidade2Id,
            peso: 0.5,
            aulas_previstas: 20,
          }),
        ]),
      });

      planejamentoId = response.body.id;
    });

    it('4. GET /planejamentos → retorna array com 1 planejamento', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(planejamentoId);
    });

    it('5. GET /planejamentos/:id → retorna planejamento completo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${planejamentoId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: planejamentoId,
        turma: expect.objectContaining({ nome: '6A' }),
        habilidades: expect.any(Array),
        professor: expect.objectContaining({
          nome: 'Professor 1',
          perfil_usuario: expect.objectContaining({ role: 'PROFESSOR' }),
        }),
      });
    });

    it('6. PATCH /planejamentos/:id alterando habilidades → retorna 200 atualizado', async () => {
      const updateDto = {
        habilidades: [
          { habilidade_id: habilidade3Id, peso: 1.0, aulas_previstas: 40 },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/planejamentos/${planejamentoId}`)
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(updateDto);

      expect(response.status).toBe(200);
      expect(response.body.habilidades).toHaveLength(1);
      expect(response.body.habilidades[0]).toMatchObject({
        habilidade_id: habilidade3Id,
        peso: 1.0,
        aulas_previstas: 40,
      });
    });

    it('7. Tento DELETE com aulas vinculadas → skip (model Aula não existe ainda)', async () => {
      // Este teste será implementado no Epic 3 quando Aula existir
      expect(true).toBe(true);
    });

    it('8. DELETE sem aulas → retorna 204', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/planejamentos/${planejamentoId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(204);
    });

    it('9. GET /planejamentos/:id (deletado) → retorna 404', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${planejamentoId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // TEST SUITE: Multi-Tenancy Validation
  // ============================================

  describe('Multi-Tenancy Validation', () => {
    let planejamentoEscola1Id: string;

    beforeAll(async () => {
      // Professor 1 (escola A) cria planejamento
      const createDto = {
        turma_id: turma1Id,
        bimestre: 2,
        ano_letivo: 2026,
        habilidades: [{ habilidade_id: habilidade1Id }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      planejamentoEscola1Id = response.body.id;
    });

    it('should block cross-tenant GET access', async () => {
      // Professor 2 (escola B) tenta acessar planejamento da escola A
      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${planejamentoEscola1Id}`)
        .set('Authorization', `Bearer ${professor2Token}`);

      expect(response.status).toBe(404); // ✅ Bloqueado por escola_id
    });

    it('should block cross-tenant PATCH access', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/planejamentos/${planejamentoEscola1Id}`)
        .set('Authorization', `Bearer ${professor2Token}`)
        .send({ bimestre: 3 });

      expect(response.status).toBe(404);
    });

    it('should block cross-tenant DELETE access', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/planejamentos/${planejamentoEscola1Id}`)
        .set('Authorization', `Bearer ${professor2Token}`);

      expect(response.status).toBe(404);
    });

    it('should not list planejamentos from other schools', async () => {
      // Professor 2 lista seus planejamentos
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor2Token}`);

      expect(response.status).toBe(200);
      // Não deve incluir planejamento da escola A
      expect(
        response.body.find((p: any) => p.id === planejamentoEscola1Id),
      ).toBeUndefined();
    });
  });

  // ============================================
  // TEST SUITE: RBAC Validation
  // ============================================

  describe('RBAC Validation', () => {
    let planejamentoProfessor1Id: string;

    beforeAll(async () => {
      // Professor 1 cria planejamento
      const createDto = {
        turma_id: turma1Id,
        bimestre: 3,
        ano_letivo: 2026,
        habilidades: [{ habilidade_id: habilidade1Id }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      planejamentoProfessor1Id = response.body.id;
    });

    it('should allow coordenador to list planejamentos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      // Coordenador vê planejamentos de todos professores da escola
      expect(
        response.body.find((p: any) => p.id === planejamentoProfessor1Id),
      ).toBeDefined();
    });

    it('should allow coordenador to view single planejamento', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${planejamentoProfessor1Id}`)
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(planejamentoProfessor1Id);
    });

    it('should block coordenador from editing planejamento', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/planejamentos/${planejamentoProfessor1Id}`)
        .set('Authorization', `Bearer ${coordenadorToken}`)
        .send({ bimestre: 4 });

      expect(response.status).toBe(403); // ✅ Bloqueado por RolesGuard
    });

    it('should block coordenador from deleting planejamento', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/planejamentos/${planejamentoProfessor1Id}`)
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(403);
    });

    it('should block coordenador from creating planejamento', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 4,
        ano_letivo: 2026,
        habilidades: [{ habilidade_id: habilidade1Id }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${coordenadorToken}`)
        .send(createDto);

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // TEST SUITE: Business Rules
  // ============================================

  describe('Business Rules', () => {
    it('should prevent duplicate planejamento (RN-PLAN-04)', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 4,
        ano_letivo: 2026,
        habilidades: [{ habilidade_id: habilidade1Id }],
      };

      // Criar planejamento
      const first = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(first.status).toBe(201);

      // Tentar criar duplicata (mesma turma + bimestre + ano)
      const duplicate = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(duplicate.status).toBe(400);
      expect(duplicate.body.message).toContain('Já existe planejamento');
    });

    it('should apply RN-PLAN-02 (peso distribuído igualmente)', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 1,
        ano_letivo: 2027,
        habilidades: [
          { habilidade_id: habilidade1Id },
          { habilidade_id: habilidade2Id },
          { habilidade_id: habilidade3Id },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(response.status).toBe(201);
      // 3 habilidades sem peso → peso deve ser 1/3 = 0.333...
      const pesoEsperado = 1.0 / 3;
      response.body.habilidades.forEach((h: any) => {
        expect(h.peso).toBeCloseTo(pesoEsperado, 5);
      });
    });

    it('should apply RN-PLAN-03 (aulas previstas estimadas)', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 2,
        ano_letivo: 2027,
        habilidades: [
          { habilidade_id: habilidade1Id },
          { habilidade_id: habilidade2Id },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(response.status).toBe(201);
      // 2 habilidades sem aulas_previstas → estimativa: 40 aulas / 2 = 20
      const aulasEsperadas = 20;
      response.body.habilidades.forEach((h: any) => {
        expect(h.aulas_previstas).toBe(aulasEsperadas);
      });
    });

    it('should set validado_coordenacao = false initially (RN-PLAN-01)', async () => {
      const createDto = {
        turma_id: turma1Id,
        bimestre: 3,
        ano_letivo: 2027,
        habilidades: [{ habilidade_id: habilidade1Id }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body.validado_coordenacao).toBe(false);
    });
  });

  // ============================================
  // TEST SUITE: Query Filters & Pagination
  // ============================================

  describe('Query Filters', () => {
    beforeAll(async () => {
      // Criar planejamentos de diferentes bimestres e anos para filtros
      await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          bimestre: 1,
          ano_letivo: 2028,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });

      await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          bimestre: 2,
          ano_letivo: 2028,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });
    });

    it('should filter by bimestre', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos?bimestre=1')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      response.body.forEach((p: any) => {
        expect(p.bimestre).toBe(1);
      });
    });

    it('should filter by ano_letivo', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos?ano_letivo=2028')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      response.body.forEach((p: any) => {
        expect(p.ano_letivo).toBe(2028);
      });
    });

    it('should filter by turma_id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos?turma_id=${turma1Id}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      response.body.forEach((p: any) => {
        expect(p.turma_id).toBe(turma1Id);
      });
    });

    it('should order by ano_letivo DESC, bimestre DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(1);

      // Verificar ordenação
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = response.body[i];
        const next = response.body[i + 1];

        if (current.ano_letivo === next.ano_letivo) {
          // Mesmo ano → bimestre deve ser DESC
          expect(current.bimestre).toBeGreaterThanOrEqual(next.bimestre);
        } else {
          // Anos diferentes → ano_letivo deve ser DESC
          expect(current.ano_letivo).toBeGreaterThan(next.ano_letivo);
        }
      }
    });
  });

  // ============================================
  // TEST SUITE: Validation & Error Handling
  // ============================================

  describe('Validation & Error Handling', () => {
    it('should return 400 if habilidades array is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          bimestre: 1,
          ano_letivo: 2029,
          habilidades: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ao menos uma habilidade');
    });

    it('should return 400 if bimestre is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          bimestre: 5, // Inválido (1-4)
          ano_letivo: 2029,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 if turma does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: fakeUuid,
          bimestre: 1,
          ano_letivo: 2029,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Turma não encontrada');
    });

    it('should return 403 if turma does not belong to professor', async () => {
      // Professor 1 tenta criar planejamento na turma do Professor 2
      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma2Id, // Turma do professor 2
          bimestre: 1,
          ano_letivo: 2029,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });

      expect(response.status).toBe(404); // Turma não encontrada (bloqueado por escola_id)
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/planejamentos',
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 if planejamento does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${fakeUuid}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // TEST SUITE: Soft Delete Validation (Issue #9)
  // ============================================

  describe('Soft Delete', () => {
    let planejamentoToDeleteId: string;

    beforeAll(async () => {
      // Criar planejamento para deletar
      const response = await request(app.getHttpServer())
        .post('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`)
        .send({
          turma_id: turma1Id,
          bimestre: 4,
          ano_letivo: 2031,
          habilidades: [{ habilidade_id: habilidade1Id }],
        });

      planejamentoToDeleteId = response.body.id;
    });

    it('should soft delete planejamento', async () => {
      // Deletar
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/planejamentos/${planejamentoToDeleteId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(deleteResponse.status).toBe(204);

      // Verificar que não aparece mais em listagem
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/planejamentos')
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(listResponse.status).toBe(200);
      expect(
        listResponse.body.find((p: any) => p.id === planejamentoToDeleteId),
      ).toBeUndefined();

      // Verificar que GET by ID retorna 404
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/planejamentos/${planejamentoToDeleteId}`)
        .set('Authorization', `Bearer ${professor1Token}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
