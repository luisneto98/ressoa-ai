import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnaliseService } from '../modules/analise/services/analise.service';
import { NotificacoesService } from '../modules/notificacoes/notificacoes.service';

interface AnalysisJobPayload {
  aulaId: string;
  escolaId: string;
}

@Injectable()
@Processor('analysis-pipeline')
export class AnalysisProcessorWorker {
  private readonly logger = new Logger(AnalysisProcessorWorker.name);

  constructor(
    private analiseService: AnaliseService,
    private prisma: PrismaService,
    private notificacoesService: NotificacoesService,
  ) {}

  @Process('analyze-aula')
  async handleAnalysis(job: Job<AnalysisJobPayload>): Promise<{ analiseId: string } | undefined> {
    const { aulaId, escolaId } = job.data;
    const startTime = Date.now();

    this.logger.log({
      message: 'Iniciando análise pedagógica',
      aulaId,
      escolaId,
      jobId: job.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Atualizar progresso: 0%
      await job.progress(0);

      // [1] Validar aula existe e está transcrita
      const aula = await this.prisma.aula.findUnique({
        where: { id: aulaId },
        include: { transcricao: true, turma: true },
      });

      if (!aula) {
        throw new Error(`Aula ${aulaId} não encontrada`);
      }

      if (aula.status_processamento !== 'TRANSCRITA') {
        this.logger.warn({
          message: `Aula ${aulaId} não está transcrita (status: ${aula.status_processamento})`,
          aulaId,
          currentStatus: aula.status_processamento,
        });
        return;
      }

      if (!aula.transcricao) {
        throw new Error(`Transcrição não encontrada para aula ${aulaId}`);
      }

      // [2] Atualizar status: TRANSCRITA → ANALISANDO
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: 'ANALISANDO' },
      });

      await job.progress(10);

      // [3] Executar pipeline completo (5 prompts seriais)
      // AnaliseService.analisarAula() já orquestra Prompts 1-5 (Story 5.2)
      const analise = await this.analiseService.analisarAula(aulaId);

      await job.progress(90);

      const durationMs = Date.now() - startTime;

      this.logger.log({
        message: 'Análise concluída com sucesso',
        aulaId,
        analiseId: analise.id,
        durationMs,
        custoTotalUSD: analise.custo_total_usd.toFixed(4),
        timestamp: new Date().toISOString(),
      });

      // [4] Atualizar status: ANALISANDO → ANALISADA
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: 'ANALISADA' },
      });

      // [5] Notificar professor (análise pronta para revisão)
      await this.notificacoesService.notifyAnalisePronta(aulaId);

      await job.progress(100);

      return { analiseId: analise.id };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error({
        message: 'Erro na análise pedagógica',
        aulaId,
        escolaId,
        error: errorMessage,
        stack: errorStack,
        attemptNumber: job.attemptsMade,
        timestamp: new Date().toISOString(),
      });

      // Atualizar aula: status → ERRO
      await this.prisma.aula.update({
        where: { id: aulaId },
        data: { status_processamento: 'ERRO' },
      });

      throw error; // Re-throw para Bull retry handling
    }
  }

  @OnQueueFailed()
  async handleFailure(job: Job, error: Error): Promise<void> {
    this.logger.error({
      message: 'Job falhou após todas as tentativas',
      jobId: job.id,
      aulaId: job.data.aulaId,
      attempts: job.attemptsMade,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Enviar para Dead Letter Queue (DLQ)
    // Job permanece em failed state para inspeção manual
  }
}
