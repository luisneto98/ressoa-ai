import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

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

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication<App>;

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

    // Wait a bit for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(response.status).toBe(200); // FIX: AC specifies 200 OK
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('professor@escola.com');
      expect(response.body.user.role).toBe('PROFESSOR');
      expect(response.body.user.escola).toHaveProperty('id');
      expect(response.body.user.escola).toHaveProperty('nome');
      expect(response.body.user).not.toHaveProperty('senha_hash');
    });

    it('should return 401 with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'naoexiste@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('should return 401 with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaErrada123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('should return 400 with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          senha: 'SenhaSegura123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email inválido');
    });

    it('should return 400 with password less than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'Short1',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Senha deve ter no mínimo 8 caracteres',
      );
    });

    // FIX Issue #2: Add missing rate limiting test
    it('should enforce rate limiting after 20 login attempts', async () => {
      const testEmail = `ratelimit-test-${Date.now()}@escola.com`;

      // Make 20 requests (within limit)
      for (let i = 0; i < 20; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testEmail,
            senha: 'WrongPassword123',
          });

        // Should return 401 (invalid credentials) not 429 (rate limited)
        expect(response.status).toBe(401);
      }

      // 21st request should be rate limited
      const rateLimitedResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          senha: 'WrongPassword123',
        });

      expect(rateLimitedResponse.status).toBe(429);
    }, 30000); // Increase timeout for multiple requests
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return user data with valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('nome');
      expect(response.body).toHaveProperty('role');
      expect(response.body.email).toBe('professor@escola.com');
      expect(response.body).not.toHaveProperty('senha_hash');
    });

    it('should return 401 without JWT', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/auth/me',
      );

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200); // FIX: Refresh also returns 200 (POST default is 201 but we want consistency)
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // Token rotation
      expect(response.body.user.email).toBe('professor@escola.com');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token inválido ou expirado');
    });

    it('should fail to refresh with already used token (after first refresh)', async () => {
      // First refresh
      const firstRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(firstRefresh.status).toBe(200);

      // Try to use old token again
      const secondRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(secondRefresh.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should logout and invalidate refresh token', async () => {
      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logout realizado com sucesso');

      // Try to use refresh token after logout
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });

    it('should return 401 when logout without JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(401);
    });

    // FIX Issue #4: Test logout validation (should fail with invalid token)
    it('should return 401 when logout with non-existent refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'non-existent-token-uuid' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('inválido ou já expirado');
    });
  });

  describe('Complete Auth Flow', () => {
    it('should complete full auth cycle: login → me → refresh → logout', async () => {
      // Step 1: Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(loginRes.status).toBe(200);
      const { accessToken, refreshToken } = loginRes.body;

      // Step 2: Access protected route with JWT
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe('professor@escola.com');

      // Step 3: Refresh tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      const newAccessToken = refreshRes.body.accessToken;
      const newRefreshToken = refreshRes.body.refreshToken;
      expect(newRefreshToken).not.toBe(refreshToken); // Token rotation

      // Step 4: Access with new JWT
      const meRes2 = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(meRes2.status).toBe(200);

      // Step 5: Logout
      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken: newRefreshToken });

      expect(logoutRes.status).toBe(200);

      // Step 6: Old refresh token should fail after logout
      const refreshRes2 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: newRefreshToken });

      expect(refreshRes2.status).toBe(401);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should allow different users to login simultaneously', async () => {
      // Login as Professor
      const professorLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'professor@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(professorLogin.status).toBe(200);
      expect(professorLogin.body.user.role).toBe('PROFESSOR');

      // Login as Coordenador
      const coordenadorLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'coordenador@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(coordenadorLogin.status).toBe(200);
      expect(coordenadorLogin.body.user.role).toBe('COORDENADOR');

      // Login as Diretor
      const diretorLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'diretor@escola.com',
          senha: 'SenhaSegura123!',
        });

      expect(diretorLogin.status).toBe(200);
      expect(diretorLogin.body.user.role).toBe('DIRETOR');

      // Verify each user's /me endpoint
      const professorMe = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${professorLogin.body.accessToken}`);

      expect(professorMe.body.email).toBe('professor@escola.com');

      const coordenadorMe = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${coordenadorLogin.body.accessToken}`);

      expect(coordenadorMe.body.email).toBe('coordenador@escola.com');
    });
  });
});
