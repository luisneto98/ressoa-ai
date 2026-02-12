import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MonitoramentoPromptsService } from './monitoramento-prompts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MonitoramentoPromptsService', () => {
  let service: MonitoramentoPromptsService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoPromptsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MonitoramentoPromptsService>(
      MonitoramentoPromptsService,
    );
  });

  describe('getQualidadePrompts', () => {
    it('should return metrics for all 5 prompt types', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
          ab_testing: false,
          total_analises: BigInt(100),
          aprovadas: BigInt(92),
          rejeitadas: BigInt(8),
          tempo_medio_revisao: 120.5,
        },
      ]);

      const result = await service.getQualidadePrompts('30d');

      expect(result.metricas.length).toBe(5); // 1 row per prompt, 5 prompts
      expect(result.periodo).toBe('30d');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(5);
    });

    it('should calculate taxa_aprovacao correctly', async () => {
      mockPrisma.$queryRaw.mockImplementation(() =>
        Promise.resolve([
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: BigInt(50),
            aprovadas: BigInt(45),
            rejeitadas: BigInt(5),
            tempo_medio_revisao: 60.0,
          },
        ]),
      );

      const result = await service.getQualidadePrompts('7d');
      const first = result.metricas[0];

      expect(first.taxa_aprovacao).toBe(90);
      expect(first.status).toBe('Excelente');
    });

    it('should mark low performers correctly (<80%)', async () => {
      mockPrisma.$queryRaw.mockImplementation(() =>
        Promise.resolve([
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: BigInt(100),
            aprovadas: BigInt(70),
            rejeitadas: BigInt(30),
            tempo_medio_revisao: 200.0,
          },
        ]),
      );

      const result = await service.getQualidadePrompts('30d');
      const first = result.metricas[0];

      expect(first.taxa_aprovacao).toBe(70);
      expect(first.status).toBe('Low Performer');
    });

    it('should mark Bom status for 80-89% approval', async () => {
      mockPrisma.$queryRaw.mockImplementation(() =>
        Promise.resolve([
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: BigInt(100),
            aprovadas: BigInt(85),
            rejeitadas: BigInt(15),
            tempo_medio_revisao: 150.0,
          },
        ]),
      );

      const result = await service.getQualidadePrompts('30d');
      expect(result.metricas[0].status).toBe('Bom');
    });

    it('should handle zero analyses (taxa_aprovacao = 0)', async () => {
      mockPrisma.$queryRaw.mockImplementation(() =>
        Promise.resolve([
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: BigInt(0),
            aprovadas: BigInt(0),
            rejeitadas: BigInt(0),
            tempo_medio_revisao: null,
          },
        ]),
      );

      const result = await service.getQualidadePrompts('30d');
      const first = result.metricas[0];

      expect(first.taxa_aprovacao).toBe(0);
      expect(first.tempo_medio_revisao).toBe(0);
      expect(first.status).toBe('Low Performer');
    });

    it('should handle empty result for a prompt type', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getQualidadePrompts('30d');

      expect(result.metricas.length).toBe(0);
      expect(result.resumo.total_versoes).toBe(0);
      expect(result.resumo.taxa_aprovacao_geral).toBe(0);
    });

    it('should convert BigInt to Number correctly', async () => {
      mockPrisma.$queryRaw.mockImplementation(() =>
        Promise.resolve([
          {
            nome: 'prompt-cobertura',
            versao: 'v1.0.0',
            ab_testing: true,
            total_analises: BigInt(999),
            aprovadas: BigInt(800),
            rejeitadas: BigInt(199),
            tempo_medio_revisao: 45.7,
          },
        ]),
      );

      const result = await service.getQualidadePrompts('90d');
      const first = result.metricas[0];

      expect(typeof first.total_analises).toBe('number');
      expect(typeof first.aprovadas).toBe('number');
      expect(typeof first.rejeitadas).toBe('number');
      expect(first.total_analises).toBe(999);
      expect(first.ab_testing).toBe(true);
    });

    it('should calculate resumo.low_performers count', async () => {
      // First 3 prompts return low performer, last 2 return excelente
      let callCount = 0;
      mockPrisma.$queryRaw.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.resolve([
            {
              nome: `prompt-${callCount}`,
              versao: 'v1.0.0',
              ab_testing: false,
              total_analises: BigInt(100),
              aprovadas: BigInt(50),
              rejeitadas: BigInt(50),
              tempo_medio_revisao: 60.0,
            },
          ]);
        }
        return Promise.resolve([
          {
            nome: `prompt-${callCount}`,
            versao: 'v1.0.0',
            ab_testing: false,
            total_analises: BigInt(100),
            aprovadas: BigInt(95),
            rejeitadas: BigInt(5),
            tempo_medio_revisao: 30.0,
          },
        ]);
      });

      const result = await service.getQualidadePrompts('30d');

      expect(result.resumo.low_performers).toBe(3);
    });

    it('should handle periodo 7d correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.getQualidadePrompts('7d');

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('getDiffsPorVersao', () => {
    it('should return top 20 most edited analyses', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          analise_id: 'uuid-1',
          turma_nome: '6A',
          data: new Date('2026-02-10'),
          change_count: BigInt(500),
          original_length: BigInt(2000),
          edited_length: BigInt(2500),
          original: 'texto original',
          editado: 'texto editado',
        },
      ]);

      const result = await service.getDiffsPorVersao(
        'prompt-relatorio',
        'v1.0.0',
      );

      expect(result.nome).toBe('prompt-relatorio');
      expect(result.versao).toBe('v1.0.0');
      expect(result.diffs.length).toBe(1);
      expect(result.diffs[0].change_count).toBe(500);
      expect(result.diffs[0].original_length).toBe(2000);
      expect(result.diffs[0].edited_length).toBe(2500);
      expect(typeof result.diffs[0].data_aula).toBe('string');
    });

    it('should return empty diffs when no edited analyses', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getDiffsPorVersao(
        'prompt-cobertura',
        'v1.0.0',
      );

      expect(result.diffs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should convert BigInt values correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          analise_id: 'uuid-2',
          turma_nome: '7B',
          data: new Date('2026-02-11'),
          change_count: BigInt(123),
          original_length: BigInt(1500),
          edited_length: BigInt(1623),
          original: 'original text',
          editado: 'edited text',
        },
      ]);

      const result = await service.getDiffsPorVersao(
        'prompt-qualitativa',
        'v1.1.0',
      );
      const diff = result.diffs[0];

      expect(typeof diff.change_count).toBe('number');
      expect(typeof diff.original_length).toBe('number');
      expect(typeof diff.edited_length).toBe('number');
    });

    it('should reject invalid prompt names', async () => {
      await expect(
        service.getDiffsPorVersao('prompt-invalido', 'v1.0.0'),
      ).rejects.toThrow('Prompt inválido');
    });
  });

  describe('verificarPromptsBaixaPerformance', () => {
    it('should log warning for low performing prompts', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      mockPrisma.$queryRaw.mockResolvedValue([
        {
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
          total: BigInt(50),
          aprovadas: BigInt(30),
        },
      ]);

      await service.verificarPromptsBaixaPerformance();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERTA PROMPT'),
        expect.objectContaining({
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
        }),
      );

      warnSpy.mockRestore();
    });

    it('should not log for well-performing prompts', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      mockPrisma.$queryRaw.mockResolvedValue([
        {
          nome: 'prompt-cobertura',
          versao: 'v1.0.0',
          total: BigInt(50),
          aprovadas: BigInt(45),
        },
      ]);

      await service.verificarPromptsBaixaPerformance();

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should not alert when analyses count is below minimum threshold (HAVING filter)', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      // HAVING COUNT >= 10 should filter this out (only 5 analyses)
      // The SQL HAVING clause prevents rows with < 10 analyses from being returned
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.verificarPromptsBaixaPerformance();

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection lost'));

      await service.verificarPromptsBaixaPerformance();

      expect(errorSpy).toHaveBeenCalledWith(
        'Falha ao verificar prompts com baixa performance',
        expect.stringContaining('DB connection lost'),
      );

      errorSpy.mockRestore();
    });
  });
});
