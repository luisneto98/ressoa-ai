import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MonitoramentoSTTService', () => {
  let service: MonitoramentoSTTService;

  const mockPrismaService = {
    transcricao: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    aula: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('WHISPER'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoSTTService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MonitoramentoSTTService>(MonitoramentoSTTService);
    jest.clearAllMocks();
  });

  describe('getMetricas', () => {
    const setupMocks = (overrides?: {
      total?: number;
      erros?: number;
      fallback?: number;
      avgTempo?: number | null;
      avgConfianca?: number | null;
      sumCusto?: number | null;
    }) => {
      const {
        total = 100,
        erros = 3,
        fallback = 5,
        avgTempo = 15000,
        avgConfianca = 0.92,
        sumCusto = 1.5,
      } = overrides || {};

      mockPrismaService.transcricao.count
        .mockResolvedValueOnce(total) // total transcricoes
        .mockResolvedValueOnce(fallback); // fallback count

      mockPrismaService.aula.count.mockResolvedValueOnce(erros); // erros STT

      mockPrismaService.transcricao.aggregate.mockResolvedValueOnce({
        _avg: {
          tempo_processamento_ms: avgTempo,
          confianca: avgConfianca,
        },
        _sum: { custo_usd: sumCusto },
      });

      mockPrismaService.transcricao.groupBy.mockResolvedValueOnce([
        {
          provider: 'WHISPER',
          _count: { _all: 80 },
          _avg: {
            tempo_processamento_ms: 14000,
            confianca: 0.93,
            custo_usd: 0.012,
          },
        },
        {
          provider: 'GOOGLE',
          _count: { _all: 20 },
          _avg: {
            tempo_processamento_ms: 18000,
            confianca: 0.89,
            custo_usd: 0.015,
          },
        },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        {
          hora: new Date('2026-02-12T10:00:00Z'),
          erros_stt: BigInt(1),
          transcricoes_ok: BigInt(25),
        },
        {
          hora: new Date('2026-02-12T11:00:00Z'),
          erros_stt: BigInt(0),
          transcricoes_ok: BigInt(30),
        },
      ]);

      mockPrismaService.aula.findMany.mockResolvedValueOnce([
        {
          id: 'aula-err-1',
          escola_id: 'escola-1',
          data: new Date('2026-02-12'),
          updated_at: new Date('2026-02-12T10:30:00Z'),
          arquivo_tamanho: 5242880,
          tipo_entrada: 'AUDIO',
        },
      ]);
    };

    it('should return correct KPIs for normal data', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.kpis.total_transcricoes).toBe(100);
      expect(result.kpis.erros_stt).toBe(3);
      // taxaSucesso = 100 / (100 + 3) * 100 = 97.09
      expect(result.kpis.taxa_sucesso).toBeCloseTo(97.09, 1);
      // taxaErro = 3 / (100 + 3) * 100 = 2.91
      expect(result.kpis.taxa_erro).toBeCloseTo(2.91, 1);
      expect(result.kpis.fallback_count).toBe(5);
      expect(result.kpis.tempo_medio_ms).toBe(15000);
      expect(result.kpis.confianca_media).toBeCloseTo(0.92, 2);
      expect(result.kpis.custo_total_usd).toBeCloseTo(1.5, 2);
    });

    it('should return correct provider distribution', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.por_provider).toHaveLength(2);
      expect(result.por_provider[0].provider).toBe('WHISPER');
      expect(result.por_provider[0].count).toBe(80);
      expect(result.por_provider[1].provider).toBe('GOOGLE');
      expect(result.por_provider[1].count).toBe(20);
    });

    it('should convert BigInt to Number in erros_timeline', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.erros_timeline).toHaveLength(2);
      expect(typeof result.erros_timeline[0].erros_stt).toBe('number');
      expect(typeof result.erros_timeline[0].transcricoes_ok).toBe('number');
      expect(result.erros_timeline[0].erros_stt).toBe(1);
      expect(result.erros_timeline[0].transcricoes_ok).toBe(25);
    });

    it('should return formatted erros_recentes', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.erros_recentes).toHaveLength(1);
      expect(result.erros_recentes[0].aula_id).toBe('aula-err-1');
      expect(result.erros_recentes[0].escola_id).toBe('escola-1');
      expect(result.erros_recentes[0].tipo_entrada).toBe('AUDIO');
      expect(result.erros_recentes[0].arquivo_tamanho).toBe(5242880);
    });

    it('should handle 0 transcricoes (avoid division by zero)', async () => {
      setupMocks({
        total: 0,
        erros: 0,
        fallback: 0,
        avgTempo: null,
        avgConfianca: null,
        sumCusto: null,
      });
      const result = await service.getMetricas('24h');

      expect(result.kpis.total_transcricoes).toBe(0);
      expect(result.kpis.erros_stt).toBe(0);
      expect(result.kpis.taxa_sucesso).toBe(0);
      expect(result.kpis.taxa_erro).toBe(0);
      expect(result.kpis.fallback_count).toBe(0);
      expect(result.kpis.tempo_medio_ms).toBe(0);
      expect(result.kpis.confianca_media).toBe(0);
      expect(result.kpis.custo_total_usd).toBe(0);
    });

    it('should handle all errors (100% error rate)', async () => {
      setupMocks({ total: 0, erros: 10 });
      const result = await service.getMetricas('24h');

      // totalBase = 0 + 10 = 10
      // taxaErro = 10 / 10 * 100 = 100
      expect(result.kpis.taxa_erro).toBe(100);
      expect(result.kpis.taxa_sucesso).toBe(0);
    });

    it('should handle all success (0% error rate)', async () => {
      setupMocks({ total: 50, erros: 0 });
      const result = await service.getMetricas('24h');

      expect(result.kpis.taxa_sucesso).toBe(100);
      expect(result.kpis.taxa_erro).toBe(0);
    });

    it('should use correct date range for each periodo', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('1h');

      // Check that transcricao.count was called with a date close to 1 hour ago
      const firstCall = mockPrismaService.transcricao.count.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 60 * 60 * 1000;
      // Allow 5 second tolerance
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should use 7d period correctly', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('7d');

      const firstCall = mockPrismaService.transcricao.count.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should default to 24h for unknown periodo', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('invalid');

      const firstCall = mockPrismaService.transcricao.count.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 24 * 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should use NOT primaryProvider for fallback count', async () => {
      setupMocks();
      await service.getMetricas('24h');

      // Second call to transcricao.count is fallback
      const fallbackCall = mockPrismaService.transcricao.count.mock.calls[1][0];
      expect(fallbackCall.where.provider).toEqual({ not: 'WHISPER' });
    });

    it('should query erros with null transcricao (STT failures)', async () => {
      setupMocks();
      await service.getMetricas('24h');

      const errosCall = mockPrismaService.aula.count.mock.calls[0][0];
      expect(errosCall.where.status_processamento).toBe('ERRO');
      expect(errosCall.where.transcricao).toBeNull();
    });
  });

  describe('getTaxaErroUltimaHora', () => {
    it('should return correct taxa when there are errors', async () => {
      mockPrismaService.transcricao.count.mockResolvedValueOnce(90);
      mockPrismaService.aula.count.mockResolvedValueOnce(10);

      const result = await service.getTaxaErroUltimaHora();

      expect(result.taxaErro).toBe(10); // 10 / (90 + 10) * 100
      expect(result.erros).toBe(10);
      expect(result.total).toBe(100);
    });

    it('should return 0 when no transcriptions at all', async () => {
      mockPrismaService.transcricao.count.mockResolvedValueOnce(0);
      mockPrismaService.aula.count.mockResolvedValueOnce(0);

      const result = await service.getTaxaErroUltimaHora();

      expect(result.taxaErro).toBe(0);
      expect(result.erros).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should return 100% when all are errors', async () => {
      mockPrismaService.transcricao.count.mockResolvedValueOnce(0);
      mockPrismaService.aula.count.mockResolvedValueOnce(5);

      const result = await service.getTaxaErroUltimaHora();

      expect(result.taxaErro).toBe(100);
      expect(result.erros).toBe(5);
      expect(result.total).toBe(5);
    });

    it('should query with 1 hour window', async () => {
      mockPrismaService.transcricao.count.mockResolvedValueOnce(10);
      mockPrismaService.aula.count.mockResolvedValueOnce(1);

      const beforeCall = Date.now();
      await service.getTaxaErroUltimaHora();

      const transcricaoCall =
        mockPrismaService.transcricao.count.mock.calls[0][0];
      const gteDate = transcricaoCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });
  });
});
