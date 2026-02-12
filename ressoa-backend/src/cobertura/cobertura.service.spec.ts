// src/cobertura/cobertura.service.spec.ts
// Story 7.1: Unit tests for CoberturaService

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { CoberturaService } from './cobertura.service';
import type { Queue } from 'bull';

describe('CoberturaService', () => {
  let service: CoberturaService;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoberturaService,
        {
          provide: getQueueToken('refresh-cobertura-queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<CoberturaService>(CoberturaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should schedule daily cron job at 5:00 AM UTC (2:00 AM BRT)', async () => {
      await service.onModuleInit();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'refresh-cobertura-bimestral',
        {},
        {
          repeat: {
            cron: '0 5 * * *',
            tz: 'America/Sao_Paulo',
          },
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    });

    it('should log successful scheduling', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        'Daily refresh job scheduled at 2:00 AM BRT (cron: 0 5 * * *, tz: America/Sao_Paulo)',
      );
    });
  });

  describe('triggerRefresh', () => {
    it('should add high-priority job to queue with retry config', async () => {
      await service.triggerRefresh();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'refresh-cobertura-bimestral',
        {},
        {
          priority: 1,
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    });

    it('should return success message', async () => {
      const result = await service.triggerRefresh();

      expect(result).toEqual({
        message: 'Refresh enfileirado com sucesso',
      });
    });

    it('should log manual trigger with job ID', async () => {
      mockQueue.add.mockResolvedValue({ id: 'manual-job-456' } as any);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.triggerRefresh();

      expect(logSpy).toHaveBeenCalledWith(
        'Manual refresh triggered with high priority (job: manual-job-456)',
      );
    });
  });
});
