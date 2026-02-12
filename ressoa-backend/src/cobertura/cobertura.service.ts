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
    // Agendar refresh diário às 2h da manhã (low-traffic time)
    await this.coberturaQueue.add(
      'refresh-cobertura-bimestral',
      {},
      {
        repeat: {
          cron: '0 2 * * *', // 2:00 AM todos os dias
        },
        removeOnComplete: true, // Remove job após completar (evita acúmulo histórico)
      },
    );

    this.logger.log('Daily refresh job scheduled at 2:00 AM (cron: 0 2 * * *)');
  }

  /**
   * Trigger manual refresh (on-demand)
   * Use case: Admin force refresh after bulk data import or schema change
   */
  async triggerRefresh(): Promise<{ message: string }> {
    await this.coberturaQueue.add(
      'refresh-cobertura-bimestral',
      {},
      {
        priority: 1, // Alta prioridade para execução imediata
        removeOnComplete: true,
      },
    );

    this.logger.log('Manual refresh triggered with high priority');
    return { message: 'Refresh enfileirado com sucesso' };
  }
}
