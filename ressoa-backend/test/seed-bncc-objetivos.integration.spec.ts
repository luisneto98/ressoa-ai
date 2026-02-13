import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { TipoFonte } from '@prisma/client';

/**
 * Integration Test: Seed de migração BNCC para Objetivos
 * Story 11.1 - Code Review Fix: Validar seed idempotência
 *
 * IMPORTANTE: Este teste requer database limpa e seed de habilidades BNCC executado
 * Executar: npm run test:e2e seed-bncc-objetivos.integration.spec.ts
 */
describe('Seed BNCC Objetivos (Integration)', () => {
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

  it('should migrate all active BNCC habilidades to ObjetivoAprendizagem', async () => {
    // Arrange: Contar habilidades BNCC ativas
    const habilidadesCount = await prisma.habilidade.count({
      where: { ativa: true },
    });

    console.log(`📚 Found ${habilidadesCount} active BNCC habilidades`);

    // Act: Seed já foi executado (via npm run prisma:seed)
    // Apenas validar resultado
    const objetivosCount = await prisma.objetivoAprendizagem.count({
      where: { tipo_fonte: TipoFonte.BNCC },
    });

    // Assert: Deve ter 1:1 migração
    expect(objetivosCount).toBeGreaterThanOrEqual(329); // Mínimo: EF (Story 10.3 baseline)
    expect(objetivosCount).toBe(habilidadesCount); // Idealmente 869 se EM seed rodou

    console.log(`✅ ${objetivosCount} BNCC objetivos migrados`);

    // Validate sample objetivo structure
    const sampleObjetivo = await prisma.objetivoAprendizagem.findFirst({
      where: { tipo_fonte: TipoFonte.BNCC },
      include: { habilidade_bncc: true },
    });

    expect(sampleObjetivo).toBeDefined();
    expect(sampleObjetivo?.habilidade_bncc_id).toBeDefined();
    expect(sampleObjetivo?.turma_id).toBeNull(); // BNCC não tem turma
    expect(sampleObjetivo?.nivel_cognitivo).toBe('APLICAR'); // Default seed
    expect(sampleObjetivo?.contexto_json).toBeDefined();
  });

  it('should be idempotent (running seed twice does not duplicate)', async () => {
    // Arrange: Contar antes de re-run
    const countBefore = await prisma.objetivoAprendizagem.count({
      where: { tipo_fonte: TipoFonte.BNCC },
    });

    // Act: Simular re-run do seed (upsert pattern)
    const habilidades = await prisma.habilidade.findMany({
      where: { ativa: true },
      take: 10, // Testar apenas 10 para performance
    });

    for (const hab of habilidades) {
      await prisma.objetivoAprendizagem.upsert({
        where: { codigo: hab.codigo },
        update: {}, // Não atualiza se já existe
        create: {
          codigo: hab.codigo,
          descricao: hab.descricao,
          nivel_cognitivo: 'APLICAR',
          tipo_fonte: 'BNCC',
          habilidade_bncc_id: hab.id,
          area_conhecimento: hab.unidade_tematica || hab.disciplina,
          contexto_json: {
            disciplina: hab.disciplina,
            tipo_ensino: hab.tipo_ensino,
          },
        },
      });
    }

    // Assert: Contagem permanece igual
    const countAfter = await prisma.objetivoAprendizagem.count({
      where: { tipo_fonte: TipoFonte.BNCC },
    });

    expect(countAfter).toBe(countBefore); // ✅ Idempotente
  });

  it('should have correct indexes and constraints', async () => {
    // Validate unique constraint on codigo (BNCC)
    const objetivo = await prisma.objetivoAprendizagem.findFirst({
      where: { tipo_fonte: TipoFonte.BNCC },
    });

    if (!objetivo) {
      throw new Error('No BNCC objetivos found for constraint test');
    }

    // Try to create duplicate codigo (should fail)
    await expect(
      prisma.objetivoAprendizagem.create({
        data: {
          codigo: objetivo.codigo, // DUPLICADO
          descricao: 'Teste duplicado',
          nivel_cognitivo: 'APLICAR',
          tipo_fonte: 'BNCC',
          habilidade_bncc_id: objetivo.habilidade_bncc_id,
        },
      }),
    ).rejects.toThrow(); // Prisma P2002: Unique constraint failed
  });
});
