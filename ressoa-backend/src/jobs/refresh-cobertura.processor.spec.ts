// src/jobs/refresh-cobertura.processor.spec.ts
// Story 7.1: Unit tests for RefreshCoberturaProcessor

import { Test, TestingModule } from '@nestjs/testing';
import { RefreshCoberturaProcessor } from './refresh-cobertura.processor';
import { PrismaService } from '../prisma/prisma.service';
import type { Job } from 'bull';

describe('RefreshCoberturaProcessor', () => {
  let processor: RefreshCoberturaProcessor;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      $executeRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshCoberturaProcessor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    processor = module.get<RefreshCoberturaProcessor>(
      RefreshCoberturaProcessor,
    );
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshCoberturaBimestral', () => {
    let mockJob: Job;

    beforeEach(() => {
      mockJob = {
        id: 'test-job-123',
        data: {},
      } as Job;
    });

    it('should execute REFRESH MATERIALIZED VIEW CONCURRENTLY', async () => {
      prisma.$executeRaw.mockResolvedValue(0);

      await processor.refreshCoberturaBimestral(mockJob);

      expect(prisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining(
            'REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral',
          ),
        ]),
      );
    });

    it('should return success with duration', async () => {
      prisma.$executeRaw.mockResolvedValue(0);

      const result = await processor.refreshCoberturaBimestral(mockJob);

      expect(result).toMatchObject({
        success: true,
        duration: expect.any(Number),
      });
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should log start with job ID', async () => {
      prisma.$executeRaw.mockResolvedValue(0);
      const logSpy = jest.spyOn(processor['logger'], 'log');

      await processor.refreshCoberturaBimestral(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Starting materialized view refresh for job test-job-123...',
      );
    });

    it('should log success with duration and job ID', async () => {
      prisma.$executeRaw.mockResolvedValue(0);
      const logSpy = jest.spyOn(processor['logger'], 'log');

      await processor.refreshCoberturaBimestral(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Job test-job-123 completed in \d+ms/),
      );
    });

    it('should throw error on failure (for Bull retry)', async () => {
      const dbError = new Error('Database connection failed');
      prisma.$executeRaw.mockRejectedValue(dbError);

      await expect(
        processor.refreshCoberturaBimestral(mockJob),
      ).rejects.toThrow('Database connection failed');
    });

    it('should log error with stack trace on failure', async () => {
      const dbError = new Error('Refresh failed');
      prisma.$executeRaw.mockRejectedValue(dbError);
      const errorSpy = jest.spyOn(processor['logger'], 'error');

      await expect(
        processor.refreshCoberturaBimestral(mockJob),
      ).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Failed to refresh materialized view for job test-job-123/,
        ),
        expect.stringContaining('Error: Refresh failed'),
      );
    });

    it('should handle non-Error exceptions', async () => {
      prisma.$executeRaw.mockRejectedValue('String error');
      const errorSpy = jest.spyOn(processor['logger'], 'error');

      await expect(processor.refreshCoberturaBimestral(mockJob)).rejects.toBe(
        'String error',
      );

      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), 'String error');
    });
  });
});
