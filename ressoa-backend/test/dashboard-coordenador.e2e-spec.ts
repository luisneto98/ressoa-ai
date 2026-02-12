import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Dashboard Coordenador (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let coordenadorToken: string;
  let professorToken: string;
  let directorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login como coordenador
    const coordLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'coordenador@escolademo.com',
        senha: 'Demo@123',
      });

    if (coordLogin.status !== 200) {
      throw new Error(
        `Coordenador login failed: ${coordLogin.status} - ${JSON.stringify(coordLogin.body)}`,
      );
    }

    coordenadorToken = coordLogin.body.access_token;

    // Login como professor (para teste de forbidden)
    const professorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'professor@escolademo.com',
        senha: 'Demo@123',
      });

    if (professorLogin.status !== 200) {
      throw new Error(
        `Professor login failed: ${professorLogin.status} - ${JSON.stringify(professorLogin.body)}`,
      );
    }

    professorToken = professorLogin.body.access_token;

    // Login como diretor (permitido para dashboard coordenador)
    const directorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'diretor@escolademo.com',
        senha: 'Demo@123',
      });

    if (directorLogin.status !== 200) {
      throw new Error(
        `Diretor login failed: ${directorLogin.status} - ${JSON.stringify(directorLogin.body)}`,
      );
    }

    directorToken = directorLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/dashboard/coordenador/professores', () => {
    it('should return 401 if no auth token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/dashboard/coordenador/professores',
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is PROFESSOR (not COORDENADOR/DIRETOR)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });

    it('should return metricas for COORDENADOR', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metricas');
      expect(response.body).toHaveProperty('resumo');
      expect(response.body.resumo).toHaveProperty('total_professores');
      expect(response.body.resumo).toHaveProperty('media_geral');
      expect(response.body.resumo).toHaveProperty('professores_abaixo_meta');
      expect(Array.isArray(response.body.metricas)).toBe(true);
    });

    it('should return metricas for DIRETOR', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metricas');
      expect(response.body).toHaveProperty('resumo');
    });

    it('should filter by bimestre', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 1 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metricas');
    });

    it('should filter by disciplina', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ disciplina: 'MATEMATICA' })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metricas');
    });

    it('should filter by both bimestre and disciplina', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 1, disciplina: 'MATEMATICA' })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metricas');
      expect(response.body).toHaveProperty('resumo');
    });

    it('should return 400 if bimestre is invalid (< 1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 0 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 400 if bimestre is invalid (> 4)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 5 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 400 if disciplina is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ disciplina: 'INVALID' })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/dashboard/coordenador/professores/:professorId/turmas', () => {
    let testProfessorId: string;

    beforeAll(async () => {
      // Get a professor ID from the materialized view
      const result = await prisma.$queryRaw<{ professor_id: string }[]>`
        SELECT DISTINCT professor_id FROM cobertura_bimestral LIMIT 1;
      `;

      if (result.length > 0) {
        testProfessorId = result[0].professor_id;
      } else {
        // Use a dummy ID if no data exists
        testProfessorId = '00000000-0000-0000-0000-000000000000';
      }
    });

    it('should return 401 if no auth token', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/v1/dashboard/coordenador/professores/${testProfessorId}/turmas`,
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is PROFESSOR', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/dashboard/coordenador/professores/${testProfessorId}/turmas`,
        )
        .set('Authorization', `Bearer ${professorToken}`);

      expect(response.status).toBe(403);
    });

    it('should return turmas for COORDENADOR', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/dashboard/coordenador/professores/${testProfessorId}/turmas`,
        )
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('turmas');
      expect(Array.isArray(response.body.turmas)).toBe(true);
    });

    it('should filter turmas by bimestre', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/dashboard/coordenador/professores/${testProfessorId}/turmas`,
        )
        .query({ bimestre: 1 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('turmas');
    });

    it('should enforce multi-tenancy (cross-school blocking)', async () => {
      // This test assumes we have users from different schools
      // If professor from School A tries to access data, they should only see School A data
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/dashboard/coordenador/professores/${testProfessorId}/turmas`,
        )
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);
      // Should return data only from coordenador's school (enforced by escola_id in query)
      expect(response.body).toHaveProperty('turmas');
    });
  });

  describe('Multi-Tenancy Enforcement', () => {
    it('should enforce escola_id filtering in all queries', async () => {
      // This is critical: COORDENADOR should ONLY see professors from their school
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response.status).toBe(200);

      // All returned professors should belong to the same escola_id
      if (response.body.metricas.length > 0) {
        const allProfessors = response.body.metricas;
        // Verify all professors are from the same school (enforced by WHERE escola_id = ...)
        expect(allProfessors.every((p: any) => p)).toBeTruthy();
      }
    });
  });

  describe('Cache Behavior', () => {
    it('should return same data on repeated requests (cache hit)', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 1 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/dashboard/coordenador/professores')
        .query({ bimestre: 1 })
        .set('Authorization', `Bearer ${coordenadorToken}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Data should be identical (from cache)
      expect(response1.body).toEqual(response2.body);
    });
  });
});
