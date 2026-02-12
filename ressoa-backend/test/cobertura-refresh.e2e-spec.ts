// test/cobertura-refresh.e2e-spec.ts
// Story 7.1: E2E tests for cobertura_bimestral materialized view refresh

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RoleUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Cobertura Refresh (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let professorToken: string;
  let escolaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await app.init();

    // Create test escola
    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Test Cobertura',
        cnpj: '12345678000199',
        endereco: 'Rua Test, 123',
        telefone: '1199999999',
      },
    });
    escolaId = escola.id;

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@cobertura.test',
        senha_hash: adminHash,
        nome: 'Admin Test',
        role: RoleUsuario.ADMIN,
        escola_id: escolaId,
      },
    });

    // Create professor user
    const profHash = await bcrypt.hash('prof123', 10);
    const professor = await prisma.usuario.create({
      data: {
        email: 'prof@cobertura.test',
        senha_hash: profHash,
        nome: 'Professor Test',
        role: RoleUsuario.PROFESSOR,
        escola_id: escolaId,
      },
    });

    // Login as admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cobertura.test', password: 'admin123' });
    adminToken = adminLoginRes.body.access_token;

    // Login as professor
    const profLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof@cobertura.test', password: 'prof123' });
    professorToken = profLoginRes.body.access_token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.usuario.deleteMany({ where: { escola_id: escolaId } });
    await prisma.escola.delete({ where: { id: escolaId } });
    await app.close();
  });

  describe('POST /api/v1/admin/refresh-cobertura', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/refresh-cobertura')
        .expect(401);
    });

    it('should return 403 if role != ADMIN (professor)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/refresh-cobertura')
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(403);
    });

    it('should return 200 + success message if role = ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/refresh-cobertura')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Refresh enfileirado com sucesso',
      });
    });
  });

  describe('Materialized View Existence', () => {
    it('should have cobertura_bimestral view created', async () => {
      const result = await prisma.$queryRaw<Array<{ matviewname: string }>>`
        SELECT matviewname FROM pg_matviews
        WHERE schemaname = 'public' AND matviewname = 'cobertura_bimestral'
      `;

      expect(result).toHaveLength(1);
      expect(result[0].matviewname).toBe('cobertura_bimestral');
    });

    it('should have unique index idx_cobertura_bimestral_pk', async () => {
      const result = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'cobertura_bimestral'
          AND indexname = 'idx_cobertura_bimestral_pk'
      `;

      expect(result).toHaveLength(1);
    });

    it('should have performance indexes created', async () => {
      const result = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'cobertura_bimestral'
        ORDER BY indexname
      `;

      const indexNames = result.map((r) => r.indexname);
      expect(indexNames).toContain('idx_cobertura_bimestral_escola');
      expect(indexNames).toContain('idx_cobertura_bimestral_turma');
      expect(indexNames).toContain('idx_cobertura_bimestral_professor');
      expect(indexNames).toContain('idx_cobertura_bimestral_cobertura');
    });

    it('should query view successfully using escola_id index', async () => {
      // Verify query executes without errors (even if empty result)
      const result = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM cobertura_bimestral
        WHERE escola_id = ${escolaId}
        LIMIT 1
      `;

      // Should return empty array (no data seeded) but query should work
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Query Performance Validation', () => {
    it('should use index for escola_id + bimestre query', async () => {
      const result = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
        EXPLAIN
        SELECT * FROM cobertura_bimestral
        WHERE escola_id = ${escolaId} AND bimestre = 1
      `;

      // Should contain "Index Scan" or "Bitmap Index Scan"
      const queryPlan = result.map((r) => r['QUERY PLAN']).join(' ');
      expect(queryPlan).toMatch(/Index Scan|Bitmap Index Scan/);
    });
  });
});
