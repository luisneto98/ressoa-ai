import { Test, TestingModule } from '@nestjs/testing';
import {
  MonitoramentoCustosService,
  MonitoramentoCustosResponse,
} from './monitoramento-custos.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MonitoramentoCustosService', () => {
  let service: MonitoramentoCustosService;
  let mockPrisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoCustosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MonitoramentoCustosService>(
      MonitoramentoCustosService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMetricas', () => {
    it('should return zeros for escola without aulas', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola Vazia',
          custo_stt: 0,
          custo_llm: 0,
          custo_total: 0,
          total_aulas: 0,
          professores_ativos: 0,
        },
      ]);

      const result = await service.getMetricas('2026-02');

      expect(result.escolas[0].custo_total).toBe(0);
      expect(result.escolas[0].custo_por_aula).toBe(0);
      expect(result.totais.custo_total).toBe(0);
      expect(result.totais.total_aulas).toBe(0);
    });

    it('should calculate custo_por_aula correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola ABC',
          custo_stt: 10,
          custo_llm: 30,
          custo_total: 40,
          total_aulas: 100,
          professores_ativos: 5,
        },
      ]);

      const result = await service.getMetricas('2026-02');

      expect(result.escolas[0].custo_por_aula).toBe(0.4);
    });

    it('should handle division by zero when total_aulas is 0', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola Sem Aulas',
          custo_stt: 5,
          custo_llm: 10,
          custo_total: 15,
          total_aulas: 0,
          professores_ativos: 0,
        },
      ]);

      const result = await service.getMetricas('2026-02');

      expect(result.escolas[0].custo_por_aula).toBe(0);
    });

    it('should use actual total for past months (projecao = custo_total)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola A',
          custo_stt: 20,
          custo_llm: 30,
          custo_total: 50,
          total_aulas: 80,
          professores_ativos: 4,
        },
      ]);

      const result = await service.getMetricas('2025-12');

      expect(result.totais.projecao_mensal).toBe(50);
      expect(result.mes).toBe('2025-12');
    });

    it('should calculate monthly projection for current month', async () => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const diasDecorridos = now.getDate();
      const diasNoMes = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola A',
          custo_stt: 50,
          custo_llm: 50,
          custo_total: 100,
          total_aulas: 200,
          professores_ativos: 10,
        },
      ]);

      const result = await service.getMetricas(currentMonth);

      const expectedProjection = Number(
        ((100 / diasDecorridos) * diasNoMes).toFixed(2),
      );
      expect(result.totais.projecao_mensal).toBe(expectedProjection);
      expect(result.mes).toBe(currentMonth);
    });

    it('should order escolas by custo_total DESC (ranking)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola Cara',
          custo_stt: 30,
          custo_llm: 50,
          custo_total: 80,
          total_aulas: 100,
          professores_ativos: 8,
        },
        {
          escola_id: 'uuid-2',
          escola_nome: 'Escola Barata',
          custo_stt: 5,
          custo_llm: 10,
          custo_total: 15,
          total_aulas: 50,
          professores_ativos: 3,
        },
      ]);

      const result = await service.getMetricas('2025-12');

      expect(result.escolas[0].escola_nome).toBe('Escola Cara');
      expect(result.escolas[1].escola_nome).toBe('Escola Barata');
      expect(result.escolas[0].custo_total).toBeGreaterThan(
        result.escolas[1].custo_total,
      );
    });

    it('should aggregate totais correctly across multiple escolas', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola A',
          custo_stt: 20,
          custo_llm: 30,
          custo_total: 50,
          total_aulas: 100,
          professores_ativos: 5,
        },
        {
          escola_id: 'uuid-2',
          escola_nome: 'Escola B',
          custo_stt: 10,
          custo_llm: 15,
          custo_total: 25,
          total_aulas: 50,
          professores_ativos: 3,
        },
      ]);

      const result = await service.getMetricas('2025-12');

      expect(result.totais.custo_total).toBe(75);
      expect(result.totais.total_aulas).toBe(150);
      expect(result.totais.total_escolas).toBe(2);
    });

    it('should default to current month when no mes parameter provided', async () => {
      const now = new Date();
      const expectedMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getMetricas();

      expect(result.mes).toBe(expectedMes);
    });

    it('should return empty escolas array when no schools exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getMetricas('2026-02');

      expect(result.escolas).toHaveLength(0);
      expect(result.totais.custo_total).toBe(0);
      expect(result.totais.total_aulas).toBe(0);
      expect(result.totais.total_escolas).toBe(0);
    });

    it('should handle BigInt conversion from raw query (values as numbers)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola BigInt',
          custo_stt: 12.5,
          custo_llm: 35.75,
          custo_total: 48.25,
          total_aulas: 120,
          professores_ativos: 8,
        },
      ]);

      const result = await service.getMetricas('2026-02');

      expect(typeof result.escolas[0].custo_stt).toBe('number');
      expect(typeof result.escolas[0].custo_llm).toBe('number');
      expect(typeof result.escolas[0].custo_total).toBe('number');
      expect(typeof result.escolas[0].total_aulas).toBe('number');
      expect(typeof result.escolas[0].professores_ativos).toBe('number');
      expect(typeof result.escolas[0].custo_por_aula).toBe('number');
    });

    it('should return correct response structure', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          escola_id: 'uuid-1',
          escola_nome: 'Escola A',
          custo_stt: 10,
          custo_llm: 20,
          custo_total: 30,
          total_aulas: 60,
          professores_ativos: 4,
        },
      ]);

      const result: MonitoramentoCustosResponse =
        await service.getMetricas('2025-12');

      expect(result).toHaveProperty('escolas');
      expect(result).toHaveProperty('totais');
      expect(result).toHaveProperty('mes');
      expect(result.totais).toHaveProperty('custo_total');
      expect(result.totais).toHaveProperty('total_aulas');
      expect(result.totais).toHaveProperty('total_escolas');
      expect(result.totais).toHaveProperty('projecao_mensal');
      expect(result.escolas[0]).toHaveProperty('custo_por_aula');
    });
  });
});
