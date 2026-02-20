// src/jobs/refresh-cobertura.processor.ts
// Story 7.1: Bull processor for refreshing cobertura_bimestral materialized view

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('refresh-cobertura-queue')
export class RefreshCoberturaProcessor {
  private readonly logger = new Logger(RefreshCoberturaProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('refresh-cobertura-bimestral')
  async refreshCoberturaBimestral(
    job: Job,
  ): Promise<{ success: boolean; duration: number }> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Starting materialized view refresh for job ${job.id}...`,
      );

      // Refresh CONCURRENTLY (não bloqueia leituras - queries retornam dados stale durante refresh)
      await this.prisma.$executeRaw`
        REFRESH MATERIALIZED VIEW CONCURRENTLY cobertura_bimestral;
      `;

      const duration = Date.now() - startTime;
      this.logger.log(`Job ${job.id} completed in ${duration}ms`);

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to refresh materialized view for job ${job.id} after ${duration}ms`,
        error instanceof Error ? error.stack : String(error),
      );

      // Throw error para Bull retry mechanism (3x exponential backoff)
      throw error;
    }
  }
}
