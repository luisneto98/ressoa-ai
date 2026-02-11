import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Ensure env vars are set for ConfigModule validation (CI-safe)
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://ressoa_user:ressoa_pwd@localhost:5432/ressoa_db?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-refresh-secret-at-least-32-characters-long';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

describe('RBAC (Role-Based Access Control) E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let professorToken: string;
  let coordenadorToken: string;
  let diretorToken: string;
  let testEscolaId: string;
  let testUserIds: string[] = [];

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

    prisma = app.get<PrismaService>(PrismaService);

    // Wait for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create test escola if not exists
    const escola = await prisma.escola.upsert({
      where: { cnpj: '12345678000195' },
      update: {},
      create: {
        cnpj: '12345678000195',
        nome: 'Escola Teste RBAC',
        cidade: 'São Paulo',
        estado: 'SP',
      },
    });
    testEscolaId = escola.id;

    // Create test users programmatically
    const senhaHash = await bcrypt.hash('SenhaSegura123!', 10);

    // Professor
    const professor = await prisma.usuario.upsert({
      where: { email: 'professor.rbac.test@escola.com' },
      update: {},
      create: {
        email: 'professor.rbac.test@escola.com',
        nome: 'Professor Teste',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'PROFESSOR',
          },
        },
      },
    });
    testUserIds.push(professor.id);

    // Coordenador
    const coordenador = await prisma.usuario.upsert({
      where: { email: 'coordenador.rbac.test@escola.com' },
      update: {},
      create: {
        email: 'coordenador.rbac.test@escola.com',
        nome: 'Coordenador Teste',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'COORDENADOR',
          },
        },
      },
    });
    testUserIds.push(coordenador.id);

    // Diretor
    const diretor = await prisma.usuario.upsert({
      where: { email: 'diretor.rbac.test@escola.com' },
      update: {},
      create: {
        email: 'diretor.rbac.test@escola.com',
        nome: 'Diretor Teste',
        senha_hash: senhaHash,
        escola_id: testEscolaId,
        perfil_usuario: {
          create: {
            role: 'DIRETOR',
          },
        },
      },
    });
    testUserIds.push(diretor.id);

    // Login as Professor
    const profLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'professor.rbac.test@escola.com',
        senha: 'SenhaSegura123!',
      });
    professorToken = profLogin.body.accessToken;

    // Login as Coordenador
    const coordLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'coordenador.rbac.test@escola.com',
        senha: 'SenhaSegura123!',
      });
    coordenadorToken = coordLogin.body.accessToken;

    // Login as Diretor
    const dirLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'diretor.rbac.test@escola.com',
        senha: 'SenhaSegura123!',
      });
    diretorToken = dirLogin.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup: Delete test users and escola
    // Note: perfil_usuario will be cascade deleted due to FK constraint
    await prisma.usuario.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });

    // Only delete escola if no other users reference it
    const remainingUsers = await prisma.usuario.count({
      where: { escola_id: testEscolaId },
    });
    if (remainingUsers === 0) {
      await prisma.escola.delete({
        where: { id: testEscolaId },
      });
    }

    await app.close();
  });

  describe('Professor-only endpoint', () => {
    it('should allow access for professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Professor');
      expect(response.body.user.role).toBe('PROFESSOR');
    });

    it('should deny access for coordenador (403 Forbidden)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(403); // Forbidden
    });

    it('should deny access for diretor (403 Forbidden)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/test/professor-only',
      );

      expect(response.status).toBe(401); // Unauthorized
    });

    it('should deny access with invalid token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/professor-only')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
    });
  });

  describe('Coordenador-only endpoint', () => {
    it('should allow access for coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Coordenador');
      expect(response.body.user.role).toBe('COORDENADOR');
    });

    it('should deny access for professor (403 Forbidden)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access for diretor (403 Forbidden)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/test/coordenador-only',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Multi-role endpoint (COORDENADOR, DIRETOR)', () => {
    it('should allow access for coordenador', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Admin');
      expect(response.body.user.role).toBe('COORDENADOR');
    });

    it('should allow access for diretor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Admin');
      expect(response.body.user.role).toBe('DIRETOR');
    });

    it('should deny access for professor (403 Forbidden)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/admin')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/test/admin',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Protected endpoints without @Roles decorator', () => {
    it('should allow professor to access authenticated endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/authenticated')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('autenticado');
      expect(response.body.user.role).toBe('PROFESSOR');
    });

    it('should allow coordenador to access authenticated endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/authenticated')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('COORDENADOR');
    });

    it('should allow diretor to access authenticated endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/authenticated')
        .set('Authorization', `Bearer ${diretorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('DIRETOR');
    });

    it('should deny access without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/test/authenticated',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Public endpoints (@Public decorator)', () => {
    it('should allow login without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor.rbac.test@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should allow refresh without access token', async () => {
      // First, login to get refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor.rbac.test@escola.com',
          senha: 'SenhaSegura123!',
        });

      const refreshToken = loginRes.body.refreshToken;

      // Now refresh without providing access token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Protected auth endpoints (should require JWT)', () => {
    it('should allow /auth/me with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('professor.rbac.test@escola.com');
    });

    it('should deny /auth/me without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/auth/me',
      );

      expect(response.status).toBe(401);
    });

    it('should allow /auth/logout with valid token', async () => {
      // Login to get fresh tokens
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor.rbac.test@escola.com',
          senha: 'SenhaSegura123!',
        });

      const refreshToken = loginRes.body.refreshToken;

      // Logout should require authentication
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
    });

    it('should deny /auth/logout without token (401 Unauthorized)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'fake-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('Guard execution order validation', () => {
    it('should execute JwtAuthGuard before RolesGuard (auth then authz)', async () => {
      // If JWT validation fails, should return 401 (not 403)
      // This proves JwtAuthGuard executes first
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401); // JWT fails first
      // If RolesGuard ran first, would return 403 (but user doesn't exist yet)
    });

    it('should execute RolesGuard after JwtAuthGuard (authz after auth)', async () => {
      // If JWT is valid but role is wrong, should return 403
      // This proves RolesGuard executes after JwtAuthGuard
      const response = await request(app.getHttpServer())
        .get('/api/v1/test/coordenador-only')
        .set('Authorization', `Bearer ${professorToken}`); // Valid JWT, wrong role

      expect(response.status).toBe(403); // Role validation fails
    });
  });
});
