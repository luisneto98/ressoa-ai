import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TurmasController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  let escola1Id: string;
  let escola2Id: string;
  let professor1Id: string;
  let professor2Id: string;
  let turma1Id: string;
  let turma2Id: string;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // Match main.ts global prefix
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Cleanup before tests
    await prisma.turma.deleteMany({});
    await prisma.perfilUsuario.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.escola.deleteMany({});

    // Create test schools
    const escola1 = await prisma.escola.create({
      data: {
        nome: 'Escola A - Turmas Test',
        cnpj: '11111111000191',
        email_contato: 'admin@escolaa-turmas.com',
        telefone: '11999999991',
      },
    });
    escola1Id = escola1.id;

    const escola2 = await prisma.escola.create({
      data: {
        nome: 'Escola B - Turmas Test',
        cnpj: '22222222000192',
        email_contato: 'admin@escolab-turmas.com',
        telefone: '11999999992',
      },
    });
    escola2Id = escola2.id;

    // Hash password for test users
    const testPassword = 'SenhaSegura123!';
    const senhaHash = await bcrypt.hash(testPassword, 10);

    // Create test users (professors)
    const prof1 = await prisma.usuario.create({
      data: {
        email: 'professor1@turmas.com',
        senha_hash: senhaHash,
        nome: 'Professor 1',
        escola_id: escola1Id,
      },
    });
    professor1Id = prof1.id;

    await prisma.perfilUsuario.create({
      data: {
        usuario_id: professor1Id,
        role: 'PROFESSOR',
      },
    });

    const prof2 = await prisma.usuario.create({
      data: {
        email: 'professor2@turmas.com',
        senha_hash: senhaHash,
        nome: 'Professor 2',
        escola_id: escola2Id,
      },
    });
    professor2Id = prof2.id;

    await prisma.perfilUsuario.create({
      data: {
        usuario_id: professor2Id,
        role: 'PROFESSOR',
      },
    });

    // Create turmas
    const turma1 = await prisma.turma.create({
      data: {
        nome: '6A',
        disciplina: 'MATEMATICA',
        serie: 'SEXTO_ANO',
        ano_letivo: 2026,
        escola_id: escola1Id,
        professor_id: professor1Id,
      },
    });
    turma1Id = turma1.id;

    await prisma.turma.create({
      data: {
        nome: '7B',
        disciplina: 'LINGUA_PORTUGUESA',
        serie: 'SETIMO_ANO',
        ano_letivo: 2026,
        escola_id: escola1Id,
        professor_id: professor1Id,
      },
    });

    const turma2 = await prisma.turma.create({
      data: {
        nome: '8C',
        disciplina: 'CIENCIAS',
        serie: 'OITAVO_ANO',
        ano_letivo: 2026,
        escola_id: escola2Id,
        professor_id: professor2Id,
      },
    });
    turma2Id = turma2.id;

    // Login to get tokens
    const login1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'professor1@turmas.com', senha: testPassword });

    if (login1.status !== 200) {
      throw new Error(
        `Professor1 login failed: ${login1.status} - ${JSON.stringify(login1.body)}`,
      );
    }
    token1 = login1.body.accessToken; // ✅ camelCase, not snake_case

    const login2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'professor2@turmas.com', senha: testPassword });

    if (login2.status !== 200) {
      throw new Error(
        `Professor2 login failed: ${login2.status} - ${JSON.stringify(login2.body)}`,
      );
    }
    token2 = login2.body.accessToken; // ✅ camelCase, not snake_case
  });

  afterAll(async () => {
    // Cleanup after tests
    await prisma.turma.deleteMany({});
    await prisma.perfilUsuario.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.escola.deleteMany({});
    await app.close();
  });

  describe('GET /api/v1/turmas', () => {
    it('should return professor turmas with escola_id isolation (professor1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Professor 1 has 2 turmas

      // Check first turma
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nome');
      expect(response.body[0]).toHaveProperty('disciplina');
      expect(response.body[0]).toHaveProperty('serie');
      expect(response.body[0]).toHaveProperty('ano_letivo');

      // Verify all turmas belong to professor1
      response.body.forEach((turma) => {
        expect(['6A', '7B']).toContain(turma.nome);
      });
    });

    it('should return professor turmas with escola_id isolation (professor2)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1); // Professor 2 has 1 turma
          expect(res.body[0].nome).toBe('8C');
          expect(res.body[0].disciplina).toBe('CIENCIAS');
        });
    });

    it('should enforce tenant isolation - professor1 cannot see professor2 turmas', () => {
      return request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200)
        .expect((res) => {
          // Professor 1 should NOT see turma "8C" from escola2
          const turmaNames = res.body.map((t) => t.nome);
          expect(turmaNames).not.toContain('8C');
        });
    });

    it('should return 401 when no JWT token provided', () => {
      return request(app.getHttpServer()).get('/api/v1/turmas').expect(401);
    });

    it('should return 401 with invalid JWT token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });

    it('should return empty array when professor has no turmas', async () => {
      // Hash password for test user
      const testPassword = 'SenhaSegura123!';
      const senhaHash = await bcrypt.hash(testPassword, 10);

      // Create professor without turmas
      const prof3 = await prisma.usuario.create({
        data: {
          email: 'professor3@turmas.com',
          senha_hash: senhaHash,
          nome: 'Professor 3',
          escola_id: escola1Id,
        },
      });

      await prisma.perfilUsuario.create({
        data: {
          usuario_id: prof3.id,
          role: 'PROFESSOR',
        },
      });

      const login3 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'professor3@turmas.com', senha: testPassword });

      return request(app.getHttpServer())
        .get('/api/v1/turmas')
        .set('Authorization', `Bearer ${login3.body.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });
});
