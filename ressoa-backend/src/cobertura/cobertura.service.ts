// src/cobertura/cobertura.service.ts
// Story 7.1: Service for scheduling and triggering cobertura_bimestral refresh

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class CoberturaService implements OnModuleInit {
  private readonly logger = new Logger(CoberturaService.name);

  constructor(
    @InjectQueue('refresh-cobertura-queue') private coberturaQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    // Agendar refresh diário às 2h da manhã BRT (5:00 AM UTC - low-traffic time)
    await this.coberturaQueue.add(
      'refresh-cobertura-bimestral',
      {},
      {
        repeat: {
          cron: '0 5 * * *', // 5:00 AM UTC = 2:00 AM BRT
          tz: 'America/Sao_Paulo', // Explicit Brazil timezone
        },
        removeOnComplete: true, // Remove job após completar (evita acúmulo histórico)
        attempts: 3, // Retry 3x on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
      },
    );

    this.logger.log('Daily refresh job scheduled at 2:00 AM BRT (cron: 0 5 * * *, tz: America/Sao_Paulo)');
  }

  /**
   * Trigger manual refresh (on-demand)
   * Use case: Admin force refresh after bulk data import or schema change
   */
  async triggerRefresh(): Promise<{ message: string }> {
    const job = await this.coberturaQueue.add(
      'refresh-cobertura-bimestral',
      {},
      {
        priority: 1, // Alta prioridade para execução imediata
        removeOnComplete: true,
        attempts: 3, // Retry 3x on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
      },
    );

    this.logger.log(`Manual refresh triggered with high priority (job: ${job.id})`);
    return { message: 'Refresh enfileirado com sucesso' };
  }
}
