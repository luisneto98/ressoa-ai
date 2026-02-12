import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

export interface MonitoramentoAnaliseResponse {
  kpis: {
    total: number;
    tempo_medio_s: number;
    custo_medio_usd: number;
    tempo_revisao_medio_s: number;
  };
  por_status: Array<{
    status: string;
    count: number;
  }>;
  queue_stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

@Injectable()
export class MonitoramentoAnaliseService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('analysis-pipeline') private readonly analysisQueue: Queue,
  ) {}

  async getMetricas(periodo: string): Promise<MonitoramentoAnaliseResponse> {
    const dataInicio = this.calcularDataInicio(periodo);

    const [agregados, tempoRevisao, porStatus, queueStats] =
      await Promise.all([
        // KPI aggregations: total, avg tempo, avg custo
        this.prisma.analise.aggregate({
          where: { created_at: { gte: dataInicio } },
          _count: { _all: true },
          _avg: {
            tempo_processamento_ms: true,
            custo_total_usd: true,
          },
        }),

        // Avg tempo_revisao (only where not null)
        this.prisma.analise.aggregate({
          where: {
            created_at: { gte: dataInicio },
            tempo_revisao: { not: null },
          },
          _avg: {
            tempo_revisao: true,
          },
        }),

        // Status distribution
        this.prisma.analise.groupBy({
          by: ['status'],
          where: { created_at: { gte: dataInicio } },
          _count: { _all: true },
        }),

        // Queue stats (NOT cached, real-time from Bull)
        this.getQueueStats(),
      ]);

    const total = agregados._count._all;

    return {
      kpis: {
        total,
        tempo_medio_s:
          total > 0
            ? Number(
                ((agregados._avg.tempo_processamento_ms ?? 0) / 1000).toFixed(
                  2,
                ),
              )
            : 0,
        custo_medio_usd:
          total > 0
            ? Number((agregados._avg.custo_total_usd ?? 0).toFixed(4))
            : 0,
        tempo_revisao_medio_s: Number(
          (tempoRevisao._avg.tempo_revisao ?? 0).toFixed(2),
        ),
      },
      por_status: porStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      queue_stats: queueStats,
    };
  }

  /**
   * Get queue waiting count for cron alert checks
   */
  async getQueueWaitingCount(): Promise<number> {
    return this.analysisQueue.getWaitingCount();
  }

  private async getQueueStats(): Promise<MonitoramentoAnaliseResponse['queue_stats']> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.analysisQueue.getWaitingCount(),
      this.analysisQueue.getActiveCount(),
      this.analysisQueue.getCompletedCount(),
      this.analysisQueue.getFailedCount(),
      this.analysisQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  private calcularDataInicio(periodo: string): Date {
    const agora = new Date();
    switch (periodo) {
      case '1h':
        return new Date(agora.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
