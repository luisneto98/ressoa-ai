import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoAlertasService } from './monitoramento-alertas.service';
import { MonitoramentoSTTService } from './monitoramento-stt.service';
import { Logger } from '@nestjs/common';

describe('MonitoramentoAlertasService', () => {
  let service: MonitoramentoAlertasService;
  let mockSTTService: jest.Mocked<Pick<MonitoramentoSTTService, 'getTaxaErroUltimaHora'>>;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockSTTService = {
      getTaxaErroUltimaHora: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoAlertasService,
        {
          provide: MonitoramentoSTTService,
          useValue: mockSTTService,
        },
      ],
    }).compile();

    service = module.get<MonitoramentoAlertasService>(MonitoramentoAlertasService);
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
        expect.objectContaining({ taxaErro: 8.5, erros: 17, total: 200, threshold: 5 }),
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
});
