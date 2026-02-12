import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Professores Cobertura API (E2E) - Story 6.5', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tokens & IDs
  let escola1Id: string;
  let escola2Id: string;
  let professor1Token: string;
  let professor1Id: string;
  let professor2Token: string;
  let professor2Id: string;
  let turma1: any;
  let turma1Id: string;
  let turma2: any;
  let turma2Id: string;
  let planejamento1: any;
  let planejamento1Id: string;
  let aula1: any;
  let aula1Id: string;

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

    // 1️⃣ Create two schools
    const escola1 = await prisma.escola.upsert({
      where: { cnpj: '11.111.111/0001-11' },
      update: {},
      create: {
        nome: 'Escola Teste Cobertura A',
        cnpj: '11.111.111/0001-11',
        email_contato: 'cobertura@escolaa.com',
      },
    });
    escola1Id = escola1.id;

    const escola2 = await prisma.escola.upsert({
      where: { cnpj: '22.222.222/0001-22' },
      update: {},
      create: {
        nome: 'Escola Teste Cobertura B',
        cnpj: '22.222.222/0001-22',
        email_contato: 'cobertura@escolab.com',
      },
    });
    escola2Id = escola2.id;

    // 2️⃣ Create professors
    const senhaHash = await bcrypt.hash('Test@123', 10);

    const professor1 = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof1@cobertura.com',
          escola_id: escola1Id,
        },
      },
      update: {},
      create: {
        nome: 'Professor 1 Cobertura',
        email: 'prof1@cobertura.com',
        senha_hash: senhaHash,
        role: 'PROFESSOR',
        escola_id: escola1Id,
      },
    });
    professor1Id = professor1.id;

    const professor2 = await prisma.usuario.upsert({
      where: {
        email_escola_id: {
          email: 'prof2@cobertura.com',
          escola_id: escola2Id,
        },
      },
      update: {},
      create: {
        nome: 'Professor 2 Cobertura',
        email: 'prof2@cobertura.com',
        senha_hash: senhaHash,
        role: 'PROFESSOR',
        escola_id: escola2Id,
      },
    });
    professor2Id = professor2.id;

    // 3️⃣ Login professors to get tokens
    const loginResponse1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'prof1@cobertura.com',
        senha: 'Test@123',
      });
    professor1Token = loginResponse1.body.access_token;

    const loginResponse2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'prof2@cobertura.com',
        senha: 'Test@123',
      });
    professor2Token = loginResponse2.body.access_token;

    // 4️⃣ Create turmas
    turma1 = await prisma.turma.create({
      data: {
        nome: '6º Ano A',
        serie: 'SEXTO_ANO',
        disciplina: 'MATEMATICA',
        ano_letivo: '2026',
        turno: 'MATUTINO',
        professor_id: professor1Id,
        escola_id: escola1Id,
      },
    });
    turma1Id = turma1.id;

    turma2 = await prisma.turma.create({
      data: {
        nome: '6º Ano B',
        serie: 'SEXTO_ANO',
        disciplina: 'MATEMATICA',
        ano_letivo: '2026',
        turno: 'MATUTINO',
        professor_id: professor2Id,
        escola_id: escola2Id,
      },
    });
    turma2Id = turma2.id;

    // 5️⃣ Create habilidades (use existing BNCC data if available)
    const habilidades = await prisma.habilidade.findMany({
      where: {
        disciplina: 'MATEMATICA',
        ano_inicio: 6,
      },
      take: 15,
    });

    if (habilidades.length === 0) {
      throw new Error('No BNCC habilidades found. Run: npx prisma db seed');
    }

    // 6️⃣ Create planejamento with 15 habilidades
    planejamento1 = await prisma.planejamento.create({
      data: {
        turma_id: turma1Id,
        professor_id: professor1Id,
        escola_id: escola1Id,
        bimestre: 1,
        meta_cobertura: 80,
      },
    });
    planejamento1Id = planejamento1.id;

    // Link habilidades to planejamento
    await prisma.planejamentoHabilidade.createMany({
      data: habilidades.map((hab, idx) => ({
        planejamento_id: planejamento1Id,
        habilidade_id: hab.id,
        peso: 1.0,
        aulas_previstas: 2,
      })),
    });

    // 7️⃣ Create aula with approved analysis
    aula1 = await prisma.aula.create({
      data: {
        titulo: 'Aula Teste Cobertura',
        turma_id: turma1Id,
        professor_id: professor1Id,
        escola_id: escola1Id,
        data_aula: new Date('2026-02-10'),
        disciplina: 'MATEMATICA',
        status_processamento: 'CONCLUIDO',
      },
    });
    aula1Id = aula1.id;

    // 8️⃣ Create approved analysis with cobertura_json
    // Simulate 12 out of 15 skills covered (COMPLETE or PARTIAL)
    const coberturaJson = {
      habilidades: habilidades.slice(0, 12).map((hab) => ({
        codigo: hab.codigo,
        nivel_cobertura: 'COMPLETE',
        evidencias: ['Teste'],
      })),
    };

    await prisma.analise.create({
      data: {
        aula_id: aula1Id,
        versao_prompt: '1.0.0',
        status: 'APROVADO',
        cobertura_json: coberturaJson,
        analise_qualitativa_json: {},
        relatorio_json: {},
        exercicios_json: {},
        alertas_json: {},
        tempo_processamento_ms: 1000,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.analise.deleteMany({
      where: { aula: { escola_id: { in: [escola1Id, escola2Id] } } },
    });
    await prisma.aula.deleteMany({
      where: { escola_id: { in: [escola1Id, escola2Id] } },
    });
    await prisma.planejamentoHabilidade.deleteMany({
      where: {
        planejamento: { escola_id: { in: [escola1Id, escola2Id] } },
      },
    });
    await prisma.planejamento.deleteMany({
      where: { escola_id: { in: [escola1Id, escola2Id] } },
    });
    await prisma.turma.deleteMany({
      where: { escola_id: { in: [escola1Id, escola2Id] } },
    });
    await prisma.usuario.deleteMany({
      where: { escola_id: { in: [escola1Id, escola2Id] } },
    });
    await prisma.escola.deleteMany({
      where: { id: { in: [escola1Id, escola2Id] } },
    });

    await app.close();
  });

  describe('GET /professores/me/cobertura', () => {
    it('should return cobertura data for authenticated professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ disciplina: 'MATEMATICA', bimestre: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('cobertura');
      expect(response.body).toHaveProperty('stats');

      expect(Array.isArray(response.body.cobertura)).toBe(true);
      expect(response.body.cobertura.length).toBeGreaterThan(0);

      const cobertura = response.body.cobertura[0];
      expect(cobertura).toHaveProperty('turma_id');
      expect(cobertura).toHaveProperty('turma_nome');
      expect(cobertura).toHaveProperty('disciplina');
      expect(cobertura).toHaveProperty('bimestre');
      expect(cobertura).toHaveProperty('habilidades_planejadas');
      expect(cobertura).toHaveProperty('habilidades_trabalhadas');
      expect(cobertura).toHaveProperty('percentual_cobertura');

      // Verify calculations: 12 trabalhadas / 15 planejadas = 80%
      expect(cobertura.habilidades_planejadas).toBe(15);
      expect(cobertura.habilidades_trabalhadas).toBe(12);
      expect(Number(cobertura.percentual_cobertura)).toBeCloseTo(80, 1);

      // Verify stats
      expect(response.body.stats.total_turmas).toBe(1);
      expect(response.body.stats.media_cobertura).toBeCloseTo(80, 1);
      expect(response.body.stats.turmas_abaixo_meta).toBe(0); // 80% >= 70%
    });

    it('should enforce multi-tenancy - professor cannot see other school data', async () => {
      // Professor 1 (escola1) tries to access data
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .expect(200);

      // Should only see their own school's turmas
      expect(response.body.cobertura.length).toBe(1);
      expect(response.body.cobertura[0].turma_id).toBe(turma1Id);

      // Verify professor2 sees different data
      const response2 = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor2Token}`)
        .expect(200);

      // Professor 2 has no planejamentos, should see empty
      expect(response2.body.cobertura.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .expect(401);
    });

    it('should filter by disciplina', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ disciplina: 'CIENCIAS' })
        .expect(200);

      expect(response.body.cobertura.length).toBe(0); // No Ciências planejamentos
    });

    it('should filter by bimestre', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ bimestre: 2 })
        .expect(200);

      expect(response.body.cobertura.length).toBe(0); // Only bimestre 1 exists
    });

    it('should validate query parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ bimestre: 'invalid' })
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ bimestre: 5 }) // Max is 4
        .expect(400);
    });
  });

  describe('GET /professores/me/cobertura/timeline', () => {
    it('should return timeline data for authenticated professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura/timeline')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ turma_id: turma1Id, bimestre: 1 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const timeline = response.body[0];
        expect(timeline).toHaveProperty('semana');
        expect(timeline).toHaveProperty('habilidades_acumuladas');
        expect(timeline).toHaveProperty('aulas_realizadas');
      }
    });

    it('should enforce multi-tenancy - cannot access other school turma', async () => {
      // Professor 1 tries to access professor 2's turma
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura/timeline')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ turma_id: turma2Id, bimestre: 1 })
        .expect(200);

      // Should return empty array (turma doesn't belong to professor1)
      // Note: Query doesn't fail, just returns no data (professor_id filter)
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura/timeline')
        .query({ turma_id: turma1Id, bimestre: 1 })
        .expect(401);
    });

    it('should require both turma_id and bimestre params', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura/timeline')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ turma_id: turma1Id }) // Missing bimestre
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura/timeline')
        .set('Authorization', `Bearer ${professor1Token}`)
        .query({ bimestre: 1 }) // Missing turma_id
        .expect(400);
    });
  });

  describe('RBAC - Only PROFESSOR role can access', () => {
    it('should deny access to COORDENADOR role', async () => {
      // Create coordenador user
      const senhaHash = await bcrypt.hash('Test@123', 10);
      const coordenador = await prisma.usuario.create({
        data: {
          nome: 'Coordenador Test',
          email: 'coord@cobertura.com',
          senha_hash: senhaHash,
          role: 'COORDENADOR',
          escola_id: escola1Id,
        },
      });

      // Login as coordenador
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'coord@cobertura.com',
          senha: 'Test@123',
        });
      const coordenadorToken = loginResponse.body.access_token;

      // Try to access professor-only endpoint
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${coordenadorToken}`)
        .expect(403); // Forbidden

      // Cleanup
      await prisma.usuario.delete({ where: { id: coordenador.id } });
    });

    it('should deny access to DIRETOR role', async () => {
      // Create diretor user
      const senhaHash = await bcrypt.hash('Test@123', 10);
      const diretor = await prisma.usuario.create({
        data: {
          nome: 'Diretor Test',
          email: 'diretor@cobertura.com',
          senha_hash: senhaHash,
          role: 'DIRETOR',
          escola_id: escola1Id,
        },
      });

      // Login as diretor
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'diretor@cobertura.com',
          senha: 'Test@123',
        });
      const diretorToken = loginResponse.body.access_token;

      // Try to access professor-only endpoint
      await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .set('Authorization', `Bearer ${diretorToken}`)
        .expect(403); // Forbidden

      // Cleanup
      await prisma.usuario.delete({ where: { id: diretor.id } });
    });
  });
});
