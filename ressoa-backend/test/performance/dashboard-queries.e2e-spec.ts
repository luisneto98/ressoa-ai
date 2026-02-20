/**
 * Story 10.8: Performance Tests for Dashboard Queries with Multi-Tipo Support
 *
 * Purpose: Validate that dashboard queries remain fast (<2s) with simulated load of
 * 100 turmas (50 Fundamental + 50 Médio) × 4 bimestres = 400 planejamentos
 *
 * NFR-PERF-04 Requirements:
 * - Dashboard load time <2s (p95) for schools with 100+ turmas
 * - Single query <500ms for filtered endpoints
 * - Materialized view refresh <30s for 400 planejamentos
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TipoEnsino, Serie, RoleUsuario } from '@prisma/client';

describe('Dashboard Query Performance (Story 10.8)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let escolaId: string;
  let coordenadorToken: string;
  let diretorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // === SEED DATA: Simulated Large School ===
    await seedLargeSchoolData();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.escola.deleteMany({
      where: { nome: 'Escola Performance Test' },
    });
    await app.close();
  });

  /**
   * Seed 100 turmas (50 Fundamental + 50 Médio) with 4 planejamentos each
   * Total: 400 planejamentos
   */
  async function seedLargeSchoolData() {
    // Create school
    const escola = await prisma.escola.create({
      data: { nome: 'Escola Performance Test', cnpj: '12345678000199' },
    });
    escolaId = escola.id;

    // Create coordenador and diretor
    const coordenador = await prisma.usuario.create({
      data: {
        nome: 'Coordenador Teste',
        email: 'coordenador@perf.test',
        senha_hash: 'hash',
        escola_id: escolaId,
        perfil_usuario: {
          create: { role: RoleUsuario.COORDENADOR },
        },
      },
    });

    const diretor = await prisma.usuario.create({
      data: {
        nome: 'Diretor Teste',
        email: 'diretor@perf.test',
        senha_hash: 'hash',
        escola_id: escolaId,
        perfil_usuario: {
          create: { role: RoleUsuario.DIRETOR },
        },
      },
    });

    // Generate JWT tokens
    coordenadorToken = jwtService.sign({
      sub: coordenador.id,
      escolaId,
      role: RoleUsuario.COORDENADOR,
    });

    diretorToken = jwtService.sign({
      sub: diretor.id,
      escolaId,
      role: RoleUsuario.DIRETOR,
    });

    // Create 10 professors
    const professores = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        prisma.usuario.create({
          data: {
            nome: `Professor ${i + 1}`,
            email: `professor${i + 1}@perf.test`,
            senha_hash: 'hash',
            escola_id: escolaId,
            perfil_usuario: {
              create: { role: RoleUsuario.PROFESSOR },
            },
          },
        }),
      ),
    );

    // Create 50 turmas Fundamental (6º-9º ano)
    const seriesFundamental = [
      Serie.SEXTO_ANO,
      Serie.SETIMO_ANO,
      Serie.OITAVO_ANO,
      Serie.NONO_ANO,
    ];
    const disciplinas = ['MATEMATICA', 'LINGUA_PORTUGUESA', 'CIENCIAS'];

    const turmasFundamental = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        prisma.turma.create({
          data: {
            nome: `Turma F${i + 1}`,
            disciplina: disciplinas[i % 3],
            serie: seriesFundamental[i % 4],
            tipo_ensino: TipoEnsino.FUNDAMENTAL,
            ano_letivo: 2026,
            turno: 'MATUTINO',
            escola_id: escolaId,
            professor_id: professores[i % 10].id,
          },
        }),
      ),
    );

    // Create 50 turmas Médio (1º-3º EM)
    const seriesMedio = [
      Serie.PRIMEIRO_ANO_EM,
      Serie.SEGUNDO_ANO_EM,
      Serie.TERCEIRO_ANO_EM,
    ];

    const turmasMedio = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        prisma.turma.create({
          data: {
            nome: `Turma M${i + 1}`,
            disciplina: disciplinas[i % 3],
            serie: seriesMedio[i % 3],
            tipo_ensino: TipoEnsino.MEDIO,
            ano_letivo: 2026,
            turno: 'VESPERTINO',
            escola_id: escolaId,
            professor_id: professores[i % 10].id,
          },
        }),
      ),
    );

    const allTurmas = [...turmasFundamental, ...turmasMedio];

    // Create 4 planejamentos per turma (1 per bimestre)
    for (const turma of allTurmas) {
      await Promise.all(
        [1, 2, 3, 4].map((bimestre) =>
          prisma.planejamento.create({
            data: {
              turma_id: turma.id,
              bimestre,
              ano_letivo: 2026,
              escola_id: escolaId,
              professor_id: turma.professor_id,
              validado_coordenacao: false,
            },
          }),
        ),
      );
    }

    // Refresh materialized view to populate cobertura_bimestral
    await prisma.$executeRawUnsafe(
      'REFRESH MATERIALIZED VIEW cobertura_bimestral;',
    );
  }

  /**
   * AC5: Dashboard queries load in <2s with 100 turmas × 4 bimestres
   */
  describe('Performance: Dashboard Queries (AC5)', () => {
    it('Dashboard queries with tipo_ensino filter should perform well (<1s)', async () => {
      // Test direct query performance (bypassing API layer for pure DB testing)
      const start = Date.now();

      const result = await prisma.$queryRaw`
        SELECT
          cb.professor_id,
          cb.professor_nome,
          cb.disciplina,
          COUNT(DISTINCT cb.turma_id) as total_turmas,
          AVG(cb.percentual_cobertura) as media_cobertura
        FROM cobertura_bimestral cb
        WHERE cb.escola_id = ${escolaId}
          AND cb.turma_tipo_ensino = 'MEDIO'
        GROUP BY cb.professor_id, cb.professor_nome, cb.disciplina
      `;

      const duration = Date.now() - start;

      expect(Array.isArray(result)).toBe(true);
      expect(duration).toBeLessThan(1000); // <1s (AC5 requirement)
    });

    it('Dashboard breakdown by tipo_ensino query should perform well (<1s)', async () => {
      const start = Date.now();

      const result = await prisma.$queryRaw`
        SELECT
          cb.turma_tipo_ensino as tipo_ensino,
          AVG(cb.percentual_cobertura) as cobertura_media,
          COUNT(DISTINCT cb.turma_id) as total_turmas
        FROM cobertura_bimestral cb
        WHERE cb.escola_id = ${escolaId}
        GROUP BY cb.turma_tipo_ensino
      `;

      const duration = Date.now() - start;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // FUNDAMENTAL + MEDIO
      expect(duration).toBeLessThan(1000); // <1s (AC5 requirement)
    });
  });

  /**
   * AC5: Verify queries use composite indexes (no sequential scans)
   */
  describe('Query Plan Validation (AC5)', () => {
    it('should use idx_cobertura_bimestral_escola_tipo for tipo_ensino filter', async () => {
      const explainResult = await prisma.$queryRawUnsafe<any[]>(`
        EXPLAIN (FORMAT JSON)
        SELECT * FROM cobertura_bimestral
        WHERE escola_id = '${escolaId}'
          AND turma_tipo_ensino = 'MEDIO'
          AND bimestre = 1
      `);

      const plan = JSON.stringify(explainResult[0]['QUERY PLAN']);

      // Verify index scan (not sequential scan)
      expect(plan).toContain('Index Scan');
      expect(plan).toContain('idx_cobertura_bimestral_escola_tipo');
    });

    it('should use index scan (not sequential scan) for escola_id + tipo_ensino queries', async () => {
      const explainResult = await prisma.$queryRawUnsafe<any[]>(`
        EXPLAIN (FORMAT JSON)
        SELECT * FROM turma
        WHERE escola_id = '${escolaId}'
          AND tipo_ensino = 'FUNDAMENTAL'
      `);

      const plan = JSON.stringify(explainResult[0]['QUERY PLAN']);

      // Verify index scan (PostgreSQL may choose escola_id_idx + filter, which is still optimized)
      expect(plan).toContain('Index Scan');
      expect(plan).not.toContain('Seq Scan'); // No sequential scan
    });
  });

  /**
   * AC7: Materialized view refresh completes in <30s
   */
  describe('Materialized View Refresh Performance (AC7)', () => {
    it('REFRESH MATERIALIZED VIEW CONCURRENTLY should complete in <30s with 400 planejamentos', async () => {
      const start = Date.now();

      await prisma.$executeRawUnsafe(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral;',
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(30000); // <30s (AC7 requirement)
    });

    it('should allow reads during CONCURRENTLY refresh (non-blocking)', async () => {
      // Start refresh in background (don't await)
      const refreshPromise = prisma.$executeRawUnsafe(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral;',
      );

      // Immediately query view (should not block)
      const queryStart = Date.now();
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) FROM cobertura_bimestral WHERE escola_id = '${escolaId}'`,
      );
      const queryDuration = Date.now() - queryStart;

      // Query should complete quickly (not blocked by refresh)
      expect(queryDuration).toBeLessThan(500);
      expect(result).toBeDefined();

      // Wait for refresh to complete
      await refreshPromise;
    });
  });
});
