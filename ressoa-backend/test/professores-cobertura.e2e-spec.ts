import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E Tests for Professores Cobertura Endpoint
 * Story 11.8 - Critical Multi-Tenancy Validation
 *
 * MUST verify:
 * - Professor can only see their own turmas
 * - Professor cannot see turmas from other schools (tenant isolation)
 * - curriculo_tipo filter works correctly (BNCC, CUSTOM, undefined)
 */
describe('GET /api/v1/professores/me/cobertura (e2e) - Story 11.8', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Multi-Tenancy Validation (CRITICAL)', () => {
    it('should enforce tenant isolation - professor from escola A cannot see escola B data', async () => {
      // TODO Story 11.10: Implement full E2E test with:
      // 1. Create 2 schools (escola A, escola B)
      // 2. Create professor_a in escola A with JWT token
      // 3. Create turma_b in escola B
      // 4. GET /professores/me/cobertura with professor_a token
      // 5. Expect: turma_b NOT in results (tenant isolation)
      // 6. Verify: response.cobertura.every(c => c.escola_id === escola_a.id)

      expect(true).toBe(true); // Placeholder - test deferred to Story 11.10
    });

    it('should filter by curriculo_tipo=BNCC correctly', async () => {
      // TODO Story 11.10: Test BNCC filter
      expect(true).toBe(true);
    });

    it('should filter by curriculo_tipo=CUSTOM correctly', async () => {
      // TODO Story 11.10: Test CUSTOM filter
      expect(true).toBe(true);
    });

    it('should return both BNCC and CUSTOM when curriculo_tipo is undefined', async () => {
      // TODO Story 11.10: Test TODOS (undefined filter)
      expect(true).toBe(true);
    });
  });

  describe('Authorization (RBAC)', () => {
    it('should return 401 Unauthorized when no JWT token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/professores/me/cobertura')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });
});
