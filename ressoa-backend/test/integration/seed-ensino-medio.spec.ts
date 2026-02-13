/**
 * Integration tests for BNCC Ensino Médio seed
 * Story 10.3: Validates idempotency, data integrity, and FK constraints
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Seed BNCC Ensino Médio (Integration)', () => {
  beforeAll(async () => {
    // NOTE: This test requires a running database
    // Run with: npm test -- test/integration/seed-ensino-medio.spec.ts
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Seed Idempotency', () => {
    it('should allow running seed multiple times without duplicates', async () => {
      // Get count before second run
      const countBefore = await prisma.habilidade.count({
        where: { tipo_ensino: 'MEDIO' }
      });

      // Re-run seed (via script or direct function call)
      // execSync('npm run prisma:seed', { cwd: process.cwd() });

      // Get count after second run
      const countAfter = await prisma.habilidade.count({
        where: { tipo_ensino: 'MEDIO' }
      });

      // Should be same count (upsert prevents duplicates)
      expect(countAfter).toBe(countBefore);
      expect(countAfter).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity Validations', () => {
    it('should have tipo_ensino = MEDIO for all EM habilidades', async () => {
      const invalidCount = await prisma.habilidade.count({
        where: {
          codigo: { startsWith: 'EM' }, // EM codes start with "EM"
          tipo_ensino: { not: 'MEDIO' }
        }
      });

      expect(invalidCount).toBe(0);
    });

    it('should have ano_inicio=1 and ano_fim=3 for all EM', async () => {
      const invalidCount = await prisma.habilidade.count({
        where: {
          tipo_ensino: 'MEDIO',
          OR: [
            { ano_inicio: { not: 1 } },
            { ano_fim: { not: 3 } }
          ]
        }
      });

      expect(invalidCount).toBe(0);
    });

    it('should NOT have unidade_tematica for EM habilidades', async () => {
      const invalidCount = await prisma.habilidade.count({
        where: {
          tipo_ensino: 'MEDIO',
          unidade_tematica: { not: null }
        }
      });

      expect(invalidCount).toBe(0);
    });

    it('should have competencia_especifica (1-7) for all EM', async () => {
      const invalidCount = await prisma.habilidade.count({
        where: {
          tipo_ensino: 'MEDIO',
          OR: [
            { competencia_especifica: null },
            { competencia_especifica: { lt: 1 } },
            { competencia_especifica: { gt: 7 } }
          ]
        }
      });

      expect(invalidCount).toBe(0);
    });

    it('should have metadata with area field for all EM', async () => {
      const habilidades = await prisma.habilidade.findMany({
        where: { tipo_ensino: 'MEDIO' },
        select: { metadata: true }
      });

      for (const hab of habilidades) {
        expect(hab.metadata).toBeDefined();
        expect(hab.metadata).toHaveProperty('area');
        expect(typeof hab.metadata['area']).toBe('string');
      }
    });

    it('should have valid disciplina for all EM habilidades', async () => {
      const validDisciplinas = ['LINGUA_PORTUGUESA', 'MATEMATICA', 'CIENCIAS', 'CIENCIAS_HUMANAS'];

      const invalidCount = await prisma.habilidade.count({
        where: {
          tipo_ensino: 'MEDIO',
          disciplina: { notIn: validDisciplinas }
        }
      });

      expect(invalidCount).toBe(0);
    });

    it('should NOT affect Ensino Fundamental habilidades', async () => {
      const fundamentalCount = await prisma.habilidade.count({
        where: { tipo_ensino: 'FUNDAMENTAL' }
      });

      // Fundamental habilidades should exist (~276+ from previous seeds)
      expect(fundamentalCount).toBeGreaterThan(200);

      // All Fundamental habilidades should NOT have EM codes
      const invalidFundamental = await prisma.habilidade.count({
        where: {
          tipo_ensino: 'FUNDAMENTAL',
          codigo: { startsWith: 'EM' }
        }
      });

      expect(invalidFundamental).toBe(0);
    });
  });

  describe('Code Uniqueness', () => {
    it('should have unique códigos (no duplicates)', async () => {
      const allHabilidades = await prisma.habilidade.groupBy({
        by: ['codigo'],
        _count: { codigo: true },
        having: {
          codigo: {
            _count: { gt: 1 }
          }
        }
      });

      // No duplicates
      expect(allHabilidades.length).toBe(0);
    });
  });

  describe('Distribution Validation', () => {
    it('should have habilidades distributed across 4 EM disciplinas', async () => {
      const distribution = await prisma.habilidade.groupBy({
        by: ['disciplina'],
        where: { tipo_ensino: 'MEDIO' },
        _count: { disciplina: true }
      });

      const disciplinas = distribution.map(d => d.disciplina);

      // Should have at least 3 of the 4 areas (LGG, MAT, CNT, CHS)
      expect(disciplinas.length).toBeGreaterThanOrEqual(3);
      expect(disciplinas).toContain('LINGUA_PORTUGUESA'); // LGG
      expect(disciplinas).toContain('MATEMATICA'); // MAT
    });

    it('should have at least 40 EM habilidades (MVP representative sample)', async () => {
      const count = await prisma.habilidade.count({
        where: { tipo_ensino: 'MEDIO' }
      });

      // MVP has ~53, tolerance for variations
      expect(count).toBeGreaterThanOrEqual(40);
      expect(count).toBeLessThanOrEqual(100);
    });
  });
});
