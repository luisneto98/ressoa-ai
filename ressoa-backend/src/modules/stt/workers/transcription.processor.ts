import { Processor, Process, InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TranscricaoService } from '../transcricao.service';
import { NotificacoesService } from '../../notificacoes/notificacoes.service';
import { ProviderSTT } from '@prisma/client';

// CRITICAL FIX (Code Review Issue #4): Import analysis queue to trigger Epic 5 pipeline

/**
 * Transcription Worker - Processes audio transcription jobs asynchronously.
 *
 * Responsibilities:
 * - Process 'transcribe-aula' jobs from Bull queue
 * - Download audio from S3/MinIO
 * - Transcribe using STTService (with automatic failover)
 * - Update Aula status lifecycle (AGUARDANDO_TRANSCRICAO → TRANSCRITA/ERRO)
 * - Enqueue next job for analysis (Epic 5)
 * - Track progress (0% → 10% → 90% → 100%)
 *
 * Concurrency: 3 workers max (prevent Whisper rate limiting - 50 RPM)
 * Retry: 3 attempts with exponential backoff (1min, 2min, 4min)
 * Timeout: 5 minutes max per job
 *
 * @see architecture.md lines 500-550 (Async Processing with Bull)
 * @see story 4.3 Dev Notes (Worker Architecture)
 */
@Injectable()
@Processor('transcription')
export class TranscriptionProcessor {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private readonly transcricaoService: TranscricaoService,
    private readonly notificacoesService: NotificacoesService,
    private readonly prisma: PrismaService,
    @InjectQueue('transcription') private readonly transcriptionQueue: Queue,
    @InjectQueue('analysis-pipeline') private readonly analysisQueue: Queue, // CRITICAL FIX (Issue #4)
  ) {}

  /**
   * Process transcription job for an Aula.
   *
   * Job Lifecycle:
   * 1. Progress: 0% - Starting
   * 2. Validate Aula state (must be AGUARDANDO_TRANSCRICAO)
   * 3. Progress: 10% - Downloading audio from S3
   * 4. Progress: 90% - Transcribing with STT service
   * 5. Progress: 100% - Complete, enqueue analysis job
   *
   * Error Handling:
   * - Validates Aula exists and is in correct state
   * - Catches errors and updates Aula to ERRO after final retry
   * - Re-throws error for Bull to handle retry logic
   *
   * Concurrency: 3 (prevents Whisper rate limiting - 50 RPM)
   *
   * @param job - Bull job with { aulaId: string } payload
   * @returns Transcription result: { transcricaoId, provider }
   * @throws Error if Aula not found, invalid state, or transcription fails
   */
  @Process({ name: 'transcribe-aula', concurrency: 3 })
  async handleTranscription(
    job: Job<{ aulaId: string }>,
  ): Promise<{ transcricaoId: string; provider: ProviderSTT }> {
    const { aulaId } = job.data;

    this.logger.log(
      `[Job ${job.id}] Iniciando processamento de transcrição: aulaId=${aulaId}, attempt=${job.attemptsMade + 1}/3`,
    );

    try {
      // Progress: 0% - Starting
      await job.progress(0);

      // Validate Aula state
      // CRITICAL FIX (Issue #4): Include escola_id for analysis job payload
      const aula = await this.prisma.aula.findUnique({
        where: { id: aulaId },
        select: {
          id: true,
          status_processamento: true,
          escola_id: true, // Needed for analysis job
        },
      });

      if (!aula) {
        throw new Error(`Aula não encontrada: ${aulaId}`);
      }

      if (aula.status_processamento !== 'AGUARDANDO_TRANSCRICAO') {
        throw new Error(
          `Aula não está pronta para transcrição: status=${aula.status_processamento}`,
        );
      }

      this.logger.log(
        `[Job ${job.id}] Aula validada: status=${aula.status_processamento}`,
      );

      // Progress: 10% - Start downloading audio
      // Note: TranscricaoService.transcribeAula() handles:
      // - Audio download from S3
      // - Transcription with STTService (automatic failover)
      // - Saving Transcricao to database
      // - Updating Aula status to TRANSCRITA
      await job.progress(10);

      this.logger.log(
        `[Job ${job.id}] Iniciando download e transcrição via TranscricaoService...`,
      );

      const transcricao = await this.transcricaoService.transcribeAula(aulaId);

      // Progress: 90% - Transcription complete, saving to database
      await job.progress(90);

      const custoFormatted =
        transcricao.custo_usd !== null
          ? `$${transcricao.custo_usd.toFixed(4)}`
          : 'N/A';

      this.logger.log(
        `[Job ${job.id}] Transcrição concluída: transcricaoId=${transcricao.id}, provider=${transcricao.provider}, custo=${custoFormatted}`,
      );

      // Progress: 100% - Complete
      await job.progress(100);

      // Story 4.4: Notify professor that transcription is complete
      try {
        await this.notificacoesService.notifyTranscricaoPronta(aulaId);
        this.logger.log(
          `[Job ${job.id}] Notificação enviada para professor (aula: ${aulaId})`,
        );
      } catch (notificationError) {
        // Log but don't throw - transcription is complete, notification is best-effort
        const notifErrorMsg =
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown';
        this.logger.error(
          `[Job ${job.id}] Falha ao enviar notificação: ${notifErrorMsg}`,
        );
      }

      // CRITICAL FIX (Code Review Issue #4): Enqueue analysis job to trigger Epic 5 pipeline
      // Story 5.5 COMPLETE - AnalysisProcessorWorker is ready and tested
      try {
        await this.analysisQueue.add('analyze-aula', {
          aulaId,
          escolaId: aula.escola_id,
        });
        this.logger.log(
          `[Job ${job.id}] Analysis job enqueued successfully for aula ${aulaId}`,
        );
      } catch (enqueueError) {
        const errorMsg =
          enqueueError instanceof Error
            ? enqueueError.message
            : 'Unknown error';
        this.logger.error(
          `[Job ${job.id}] Failed to enqueue analysis job for aula ${aulaId}: ${errorMsg}`,
        );
        // Don't throw - transcription is complete, analysis can be triggered manually
      }

      return {
        transcricaoId: transcricao.id,
        provider: transcricao.provider,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `[Job ${job.id}] Falha ao transcrever aula ${aulaId} (attempt ${job.attemptsMade + 1}/3): ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update Aula to ERRO only AFTER Bull confirms final failure
      // attemptsMade is 0-indexed: 0, 1, 2 = 3 attempts
      // Only update if this is the LAST attempt (attemptsMade === 2)
      // Bull will NOT retry after this, so safe to mark ERRO
      if (job.attemptsMade === 2) {
        this.logger.error(
          `[Job ${job.id}] Tentativa final falhou (3/3). Marcando aula como ERRO.`,
        );

        try {
          await this.prisma.aula.update({
            where: { id: aulaId },
            data: { status_processamento: 'ERRO' },
          });

          // Code Review HIGH-4: Notify professor of transcription failure
          try {
            await this.notificacoesService.notifyTranscricaoErro(
              aulaId,
              errorMessage,
            );
            this.logger.log(
              `[Job ${job.id}] Notificação de erro enviada para professor (aula: ${aulaId})`,
            );
          } catch (notificationError) {
            // Log but don't throw - error status already saved
            const notifErrorMsg =
              notificationError instanceof Error
                ? notificationError.message
                : 'Unknown';
            this.logger.error(
              `[Job ${job.id}] Falha ao enviar notificação de erro: ${notifErrorMsg}`,
            );
          }
        } catch (updateError) {
          // Log but don't fail - job already failed, status update is best-effort
          this.logger.error(
            `[Job ${job.id}] Falha ao atualizar status para ERRO: ${updateError instanceof Error ? updateError.message : 'Unknown'}`,
          );
        }
      } else {
        this.logger.warn(
          `[Job ${job.id}] Tentativa ${job.attemptsMade + 1}/3 falhou. Bull irá fazer retry.`,
        );
      }

      // Re-throw error for Bull to handle retry logic
      throw error;
    }
  }
}
