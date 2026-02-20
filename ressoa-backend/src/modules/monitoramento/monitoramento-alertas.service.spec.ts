import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoAlertasService } from './monitoramento-alertas.service';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { MonitoramentoAnaliseService } from './monitoramento-analise.service';
import { MonitoramentoCustosService } from './monitoramento-custos.service';
import { Logger } from '@nestjs/common';

describe('MonitoramentoAlertasService', () => {
  let service: MonitoramentoAlertasService;
  let mockSTTService: jest.Mocked<
    Pick<MonitoramentoSTTService, 'getTaxaErroUltimaHora'>
  >;
  let mockAnaliseService: jest.Mocked<
    Pick<MonitoramentoAnaliseService, 'getQueueWaitingCount'>
  >;
  let mockCustosService: jest.Mocked<
    Pick<MonitoramentoCustosService, 'getMetricas'>
  >;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockSTTService = {
      getTaxaErroUltimaHora: jest.fn(),
    };

    mockAnaliseService = {
      getQueueWaitingCount: jest.fn(),
    };

    mockCustosService = {
      getMetricas: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoAlertasService,
        {
          provide: MonitoramentoSTTService,
          useValue: mockSTTService,
        },
        {
          provide: MonitoramentoAnaliseService,
          useValue: mockAnaliseService,
        },
        {
          provide: MonitoramentoCustosService,
          useValue: mockCustosService,
        },
      ],
    }).compile();

    service = module.get<MonitoramentoAlertasService>(
      MonitoramentoAlertasService,
    );
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verificarTaxaErroSTT', () => {
    it('should log warning when taxa de erro > 5%', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 8.5,
        erros: 17,
        total: 200,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERTA STT'),
        expect.objectContaining({
          taxaErro: 8.5,
          erros: 17,
          total: 200,
          threshold: 5,
        }),
      );
    });

    it('should NOT log when taxa de erro <= 5%', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 3.2,
        erros: 3,
        total: 94,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log when taxa de erro is exactly 5%', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 5.0,
        erros: 5,
        total: 100,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log when there are 0 transcriptions', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 0,
        erros: 0,
        total: 0,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should log when taxa is slightly above threshold (5.01%)', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 5.01,
        erros: 5,
        total: 100,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should log when all transcriptions are errors (100%)', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockResolvedValueOnce({
        taxaErro: 100,
        erros: 10,
        total: 10,
      });

      await service.verificarTaxaErroSTT();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('100.00%'),
        expect.objectContaining({ taxaErro: 100 }),
      );
    });

    it('should log error and not crash when service throws', async () => {
      mockSTTService.getTaxaErroUltimaHora.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      await expect(service.verificarTaxaErroSTT()).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Falha ao verificar taxa de erro STT',
        expect.stringContaining('Database connection failed'),
      );
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('verificarFilaAnalise', () => {
    it('should log warning when queue waiting > 50', async () => {
      mockAnaliseService.getQueueWaitingCount.mockResolvedValueOnce(75);

      await service.verificarFilaAnalise();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('75 jobs aguardando'),
        expect.objectContaining({ waiting: 75, threshold: 50 }),
      );
    });

    it('should NOT log when queue waiting <= 50', async () => {
      mockAnaliseService.getQueueWaitingCount.mockResolvedValueOnce(30);

      await service.verificarFilaAnalise();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log when queue waiting is exactly 50', async () => {
      mockAnaliseService.getQueueWaitingCount.mockResolvedValueOnce(50);

      await service.verificarFilaAnalise();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log when queue is empty', async () => {
      mockAnaliseService.getQueueWaitingCount.mockResolvedValueOnce(0);

      await service.verificarFilaAnalise();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should log when queue has 51 jobs (just above threshold)', async () => {
      mockAnaliseService.getQueueWaitingCount.mockResolvedValueOnce(51);

      await service.verificarFilaAnalise();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should log error and not crash when service throws', async () => {
      mockAnaliseService.getQueueWaitingCount.mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      await expect(service.verificarFilaAnalise()).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Falha ao verificar fila de análise',
        expect.stringContaining('Redis connection failed'),
      );
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('verificarCustosAltos', () => {
    const makeResponse = (
      escolas: Array<{ escola_nome: string; custo_total: number }>,
    ) => ({
      escolas: escolas.map((e, i) => ({
        escola_id: `uuid-${i}`,
        escola_nome: e.escola_nome,
        custo_stt: e.custo_total * 0.3,
        custo_llm: e.custo_total * 0.7,
        custo_total: e.custo_total,
        total_aulas: 100,
        professores_ativos: 5,
        custo_por_aula: e.custo_total / 100,
      })),
      totais: {
        custo_total: escolas.reduce((sum, e) => sum + e.custo_total, 0),
        total_aulas: escolas.length * 100,
        total_escolas: escolas.length,
        projecao_mensal: escolas.reduce((sum, e) => sum + e.custo_total, 0),
      },
      mes: '2026-02',
    });

    it('should log warning when escola has custo > $50', async () => {
      mockCustosService.getMetricas.mockResolvedValueOnce(
        makeResponse([{ escola_nome: 'Escola Cara', custo_total: 75 }]),
      );

      await service.verificarCustosAltos();

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERTA CUSTOS'),
        expect.objectContaining({
          escolas: expect.arrayContaining([
            expect.objectContaining({ nome: 'Escola Cara', custo: 75 }),
          ]),
        }),
      );
    });

    it('should NOT log when all escolas have custo <= $50', async () => {
      mockCustosService.getMetricas.mockResolvedValueOnce(
        makeResponse([
          { escola_nome: 'Escola A', custo_total: 30 },
          { escola_nome: 'Escola B', custo_total: 50 },
        ]),
      );

      await service.verificarCustosAltos();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log when custo is exactly $50 (threshold)', async () => {
      mockCustosService.getMetricas.mockResolvedValueOnce(
        makeResponse([{ escola_nome: 'Escola Limite', custo_total: 50 }]),
      );

      await service.verificarCustosAltos();

      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should log error and not crash when service throws', async () => {
      mockCustosService.getMetricas.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      await expect(service.verificarCustosAltos()).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Falha ao verificar custos altos',
        expect.stringContaining('Database connection failed'),
      );
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });
  });
});
