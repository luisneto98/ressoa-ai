import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Serie, StatusProcessamento, TipoEntrada } from '@prisma/client';

// ==============================================================
// Story 16.2: Aula como Rascunho com Descrição e Datas Futuras
// ==============================================================

describe('Aula Rascunho E2E (Story 16.2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let escolaId: string;
  let professorToken: string;
  let professorId: string;
  let turmaId: string;
  let planejamentoId: string;

  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

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
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 1️⃣ Use Demo School
    const escolaDemo = await prisma.escola.findUnique({
      where: { cnpj: '12.345.678/0001-90' },
    });
    if (!escolaDemo) {
      throw new Error('Demo school not found. Run: npx prisma db seed');
    }
    escolaId = escolaDemo.id;

    // 2️⃣ Create/use professor
    const senhaHash = await bcrypt.hash('Rascunho@123', 10);
    const professor = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof.rascunho@escolademo.com',
          escola_id: escolaId,
        },
      },
      update: {},
      create: {
        nome: 'Professor Rascunho',
        email: 'prof.rascunho@escolademo.com',
        senha_hash: senhaHash,
        escola_id: escolaId,
        perfil_usuario: { create: { role: 'PROFESSOR' } },
      },
    });
    professorId = professor.id;

    // 3️⃣ Create test turma
    const turma = await prisma.turma.create({
      data: {
        nome: `6A Rascunho ${Date.now()}`,
        disciplina: 'MATEMATICA',
        serie: Serie.SEXTO_ANO,
        turno: 'MATUTINO',
        ano_letivo: 2026,
        escola_id: escolaId,
        professor_id: professor.id,
      },
    });
    turmaId = turma.id;

    // 4️⃣ Create planejamento for turma
    const habilidades = await prisma.habilidade.findMany({
      where: { disciplina: 'MATEMATICA', ano_inicio: 6 },
      take: 1,
    });

    const planejamento = await prisma.planejamento.create({
      data: {
        turma_id: turmaId,
        bimestre: 2,
        ano_letivo: 2026,
        escola_id: escolaId,
        professor_id: professor.id,
        habilidades:
          habilidades.length > 0
            ? {
                create: [{ habilidade_id: habilidades[0].id, peso: 1.0 }],
              }
            : undefined,
      },
    });
    planejamentoId = planejamento.id;

    // 5️⃣ Login professor
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof.rascunho@escolademo.com', senha: 'Rascunho@123' });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
    }
    professorToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.aula.deleteMany({
      where: { turma_id: turmaId },
    });
    await prisma.planejamento.delete({ where: { id: planejamentoId } });
    await prisma.turma.delete({ where: { id: turmaId } });
    await prisma.usuario.delete({
      where: {
        email_escola_id: {
          email: 'prof.rascunho@escolademo.com',
          escola_id: escolaId,
        },
      },
    });
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────
  // POST /aulas/rascunho
  // ─────────────────────────────────────────────────────────────

  describe('POST /aulas/rascunho', () => {
    it('deve retornar 201 com status RASCUNHO', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });

      expect(res.status).toBe(201);
      expect(res.body.status_processamento).toBe(StatusProcessamento.RASCUNHO);
      expect(res.body.tipo_entrada).toBeNull();
    });

    it('deve aceitar data futura (hoje + 7 dias)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });

      expect(res.status).toBe(201);
      expect(new Date(res.body.data).getTime()).toBeGreaterThan(Date.now());
    });

    it('não deve exigir tipo_entrada', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });

      expect(res.status).toBe(201);
      expect(res.body.tipo_entrada).toBeNull();
    });

    it('deve aceitar descricao opcional', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          turma_id: turmaId,
          data: futureDate,
          descricao: 'Objetivo: revisar frações decimais',
        });

      expect(res.status).toBe(201);
      expect(res.body.descricao).toBe('Objetivo: revisar frações decimais');
    });

    it('deve aceitar planejamento_id válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          turma_id: turmaId,
          data: futureDate,
          planejamento_id: planejamentoId,
        });

      expect(res.status).toBe(201);
      expect(res.body.planejamento_id).toBe(planejamentoId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH /aulas/:id/descricao
  // ─────────────────────────────────────────────────────────────

  describe('PATCH /aulas/:id/descricao', () => {
    let rascunhoId: string;
    let aulaCriadaId: string;

    beforeEach(async () => {
      // Create a fresh rascunho for each test
      const rascunhoRes = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });
      rascunhoId = rascunhoRes.body.id;
    });

    it('deve atualizar descricao em aula RASCUNHO', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${rascunhoId}/descricao`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ descricao: 'Novo objetivo: frações e decimais' });

      expect(res.status).toBe(200);
      expect(res.body.descricao).toBe('Novo objetivo: frações e decimais');
    });

    it('deve retornar 400 em aula CRIADA (não RASCUNHO)', async () => {
      // Create a regular aula with CRIADA status using existing endpoint
      const aulaRes = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          turma_id: turmaId,
          data: '2026-03-01',
          tipo_entrada: TipoEntrada.AUDIO,
        });

      aulaCriadaId = aulaRes.body.id;
      expect(aulaRes.status).toBe(201);
      expect(aulaRes.body.status_processamento).toBe(StatusProcessamento.CRIADA);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaCriadaId}/descricao`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ descricao: 'Tentativa de edição inválida' });

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /aulas/:id/iniciar
  // ─────────────────────────────────────────────────────────────

  describe('POST /aulas/:id/iniciar', () => {
    let rascunhoId: string;

    beforeEach(async () => {
      const rascunhoRes = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });
      rascunhoId = rascunhoRes.body.id;
    });

    it('deve transicionar RASCUNHO → CRIADA com AUDIO', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/aulas/${rascunhoId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ tipo_entrada: TipoEntrada.AUDIO });

      expect(res.status).toBe(200);
      expect(res.body.status_processamento).toBe(StatusProcessamento.CRIADA);
      expect(res.body.tipo_entrada).toBe(TipoEntrada.AUDIO);
    });

    it('deve transicionar RASCUNHO → TRANSCRITA com TRANSCRICAO e criar Transcricao', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/aulas/${rascunhoId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          tipo_entrada: TipoEntrada.TRANSCRICAO,
          transcricao_texto: 'Transcrição completa da aula sobre frações decimais.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status_processamento).toBe(StatusProcessamento.TRANSCRITA);

      // Verify Transcricao was created in DB
      const transcricao = await prisma.transcricao.findUnique({
        where: { aula_id: rascunhoId },
      });
      expect(transcricao).toBeTruthy();
      expect(transcricao!.provider).toBe('MANUAL');
      expect(transcricao!.confianca).toBe(1.0);
    });

    it('deve retornar 400 se aula não está em RASCUNHO', async () => {
      // First, iniciar the rascunho to change status
      await request(app.getHttpServer())
        .post(`/api/v1/aulas/${rascunhoId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ tipo_entrada: TipoEntrada.AUDIO });

      // Try to iniciar again (now CRIADA, not RASCUNHO)
      const res = await request(app.getHttpServer())
        .post(`/api/v1/aulas/${rascunhoId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ tipo_entrada: TipoEntrada.AUDIO });

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Fluxo completo: criar rascunho → editar descrição → iniciar
  // ─────────────────────────────────────────────────────────────

  describe('Fluxo completo', () => {
    it('criar rascunho → editar descrição → iniciar (AUDIO) → verificar status CRIADA', async () => {
      // Step 1: Criar rascunho
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/aulas/rascunho')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ turma_id: turmaId, data: futureDate });

      expect(createRes.status).toBe(201);
      const aulaId = createRes.body.id;
      expect(createRes.body.status_processamento).toBe(StatusProcessamento.RASCUNHO);

      // Step 2: Editar descrição
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/aulas/${aulaId}/descricao`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ descricao: 'Plano de aula: frações e porcentagem' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.descricao).toBe('Plano de aula: frações e porcentagem');

      // Step 3: Iniciar com AUDIO
      const iniciarRes = await request(app.getHttpServer())
        .post(`/api/v1/aulas/${aulaId}/iniciar`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ tipo_entrada: TipoEntrada.AUDIO });

      expect(iniciarRes.status).toBe(200);
      expect(iniciarRes.body.status_processamento).toBe(StatusProcessamento.CRIADA);
      expect(iniciarRes.body.tipo_entrada).toBe(TipoEntrada.AUDIO);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Retrocompatibilidade: POST /aulas continua funcionando
  // ─────────────────────────────────────────────────────────────

  describe('Retrocompatibilidade', () => {
    it('POST /aulas deve retornar 201 normalmente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/aulas')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          turma_id: turmaId,
          data: '2026-03-10',
          tipo_entrada: TipoEntrada.AUDIO,
        });

      expect(res.status).toBe(201);
      expect(res.body.status_processamento).toBe(StatusProcessamento.CRIADA);
      expect(res.body.tipo_entrada).toBe(TipoEntrada.AUDIO);
    });
  });
});
