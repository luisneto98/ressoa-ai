import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MonitoramentoAnaliseService', () => {
  let service: MonitoramentoAnaliseService;

  const mockPrismaService = {
    analise: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAnalysisQueue = {
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoAnaliseService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: getQueueToken('analysis-pipeline'),
          useValue: mockAnalysisQueue,
        },
      ],
    }).compile();

    service = module.get<MonitoramentoAnaliseService>(
      MonitoramentoAnaliseService,
    );
    jest.clearAllMocks();
  });

  describe('getMetricas', () => {
    const setupMocks = (overrides?: {
      total?: number;
      avgTempoMs?: number | null;
      avgCustoUsd?: number | null;
      avgTempoRevisao?: number | null;
      statusDistribution?: Array<{
        status: string;
        _count: { _all: number };
      }>;
      queueWaiting?: number;
      queueActive?: number;
      queueCompleted?: number;
      queueFailed?: number;
      queueDelayed?: number;
    }) => {
      const {
        total = 50,
        avgTempoMs = 45200,
        avgCustoUsd = 0.12,
        avgTempoRevisao = 180,
        statusDistribution = [
          { status: 'AGUARDANDO_REVISAO', _count: { _all: 20 } },
          { status: 'APROVADO', _count: { _all: 25 } },
          { status: 'REJEITADO', _count: { _all: 5 } },
        ],
        queueWaiting = 3,
        queueActive = 1,
        queueCompleted = 100,
        queueFailed = 2,
        queueDelayed = 0,
      } = overrides || {};

      // First aggregate call: KPI aggregations
      mockPrismaService.analise.aggregate.mockResolvedValueOnce({
        _count: { _all: total },
        _avg: {
          tempo_processamento_ms: avgTempoMs,
          custo_total_usd: avgCustoUsd,
        },
      });

      // Second aggregate call: avg tempo_revisao
      mockPrismaService.analise.aggregate.mockResolvedValueOnce({
        _avg: {
          tempo_revisao: avgTempoRevisao,
        },
      });

      // groupBy for status distribution
      mockPrismaService.analise.groupBy.mockResolvedValueOnce(
        statusDistribution,
      );

      // Queue stats
      mockAnalysisQueue.getWaitingCount.mockResolvedValueOnce(queueWaiting);
      mockAnalysisQueue.getActiveCount.mockResolvedValueOnce(queueActive);
      mockAnalysisQueue.getCompletedCount.mockResolvedValueOnce(
        queueCompleted,
      );
      mockAnalysisQueue.getFailedCount.mockResolvedValueOnce(queueFailed);
      mockAnalysisQueue.getDelayedCount.mockResolvedValueOnce(queueDelayed);
    };

    it('should return correct KPIs for normal data', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.kpis.total).toBe(50);
      // tempo_medio_s = 45200 / 1000 = 45.2
      expect(result.kpis.tempo_medio_s).toBeCloseTo(45.2, 1);
      expect(result.kpis.custo_medio_usd).toBeCloseTo(0.12, 2);
      expect(result.kpis.tempo_revisao_medio_s).toBeCloseTo(180, 0);
    });

    it('should return correct status distribution', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.por_status).toHaveLength(3);
      expect(result.por_status[0]).toEqual({
        status: 'AGUARDANDO_REVISAO',
        count: 20,
      });
      expect(result.por_status[1]).toEqual({
        status: 'APROVADO',
        count: 25,
      });
      expect(result.por_status[2]).toEqual({
        status: 'REJEITADO',
        count: 5,
      });
    });

    it('should return real-time queue stats', async () => {
      setupMocks();
      const result = await service.getMetricas('24h');

      expect(result.queue_stats).toEqual({
        waiting: 3,
        active: 1,
        completed: 100,
        failed: 2,
        delayed: 0,
      });
    });

    it('should handle 0 analyses (avoid division by zero)', async () => {
      setupMocks({
        total: 0,
        avgTempoMs: null,
        avgCustoUsd: null,
        avgTempoRevisao: null,
        statusDistribution: [],
      });
      const result = await service.getMetricas('24h');

      expect(result.kpis.total).toBe(0);
      expect(result.kpis.tempo_medio_s).toBe(0);
      expect(result.kpis.custo_medio_usd).toBe(0);
      expect(result.kpis.tempo_revisao_medio_s).toBe(0);
      expect(result.por_status).toHaveLength(0);
    });

    it('should handle null tempo_revisao (no reviewed analyses)', async () => {
      setupMocks({ avgTempoRevisao: null });
      const result = await service.getMetricas('24h');

      expect(result.kpis.tempo_revisao_medio_s).toBe(0);
    });

    it('should handle all same status', async () => {
      setupMocks({
        statusDistribution: [
          { status: 'APROVADO', _count: { _all: 50 } },
        ],
      });
      const result = await service.getMetricas('24h');

      expect(result.por_status).toHaveLength(1);
      expect(result.por_status[0]).toEqual({
        status: 'APROVADO',
        count: 50,
      });
    });

    it('should use correct date range for 1h period', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('1h');

      const firstCall =
        mockPrismaService.analise.aggregate.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should use correct date range for 7d period', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('7d');

      const firstCall =
        mockPrismaService.analise.aggregate.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should use correct date range for 30d period', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('30d');

      const firstCall =
        mockPrismaService.analise.aggregate.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should default to 24h for unknown period', async () => {
      setupMocks();
      const beforeCall = Date.now();
      await service.getMetricas('invalid');

      const firstCall =
        mockPrismaService.analise.aggregate.mock.calls[0][0];
      const gteDate = firstCall.where.created_at.gte as Date;
      const expectedGte = beforeCall - 24 * 60 * 60 * 1000;
      expect(Math.abs(gteDate.getTime() - expectedGte)).toBeLessThan(5000);
    });

    it('should filter tempo_revisao aggregate with NOT NULL', async () => {
      setupMocks();
      await service.getMetricas('24h');

      // Second aggregate call is for tempo_revisao
      const tempoRevisaoCall =
        mockPrismaService.analise.aggregate.mock.calls[1][0];
      expect(tempoRevisaoCall.where.tempo_revisao).toEqual({ not: null });
    });

    it('should convert tempo_processamento_ms to seconds', async () => {
      setupMocks({ avgTempoMs: 120000 }); // 120000ms = 120s
      const result = await service.getMetricas('24h');

      expect(result.kpis.tempo_medio_s).toBe(120);
    });
  });

  describe('getQueueWaitingCount', () => {
    it('should return waiting count from Bull queue', async () => {
      mockAnalysisQueue.getWaitingCount.mockResolvedValueOnce(42);

      const result = await service.getQueueWaitingCount();

      expect(result).toBe(42);
      expect(mockAnalysisQueue.getWaitingCount).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when queue is empty', async () => {
      mockAnalysisQueue.getWaitingCount.mockResolvedValueOnce(0);

      const result = await service.getQueueWaitingCount();

      expect(result).toBe(0);
    });
  });
});
