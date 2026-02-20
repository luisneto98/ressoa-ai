import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { TipoNotificacao } from '@prisma/client';

/**
 * NotificacaoService - Business logic for notification system
 * Story 4.4 - AC2: NotificacaoService with Email Integration
 *
 * Handles:
 * - Creating in-app notifications (database)
 * - Sending email notifications (conditional on user preference)
 * - Querying user notifications
 * - Marking notifications as read
 */
@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Notify professor when transcription is complete
   * Story 4.4 - AC2, AC3: Integration Point
   *
   * CRITICAL: This method NEVER throws - graceful degradation
   * - In-app notification MUST be created
   * - Email failure is logged but doesn't block notification
   *
   * @param aulaId - Aula ID that was transcribed
   */
  async notifyTranscricaoPronta(aulaId: string): Promise<void> {
    try {
      // 1. Load aula with relations (critical - must succeed)
      // CRITICAL FIX (Code Review HIGH-1, HIGH-2, HIGH-3):
      // Worker runs OUTSIDE HTTP request context, so no TenantInterceptor.
      // We load Aula WITHOUT escola_id filter (can't use getEscolaIdOrThrow()).
      // Multi-tenancy is PASSIVE here - validated via FK relations.
      // Aula → Professor → Escola ensures data belongs to same tenant.
      const aula = await this.prisma.aula.findUnique({
        where: { id: aulaId },
        include: {
          turma: true,
          professor: {
            include: {
              escola: true, // ✅ Load escola to validate tenant context
              perfil_usuario: true, // ✅ Load email preference in single query
            },
          },
        },
      });

      if (!aula) {
        this.logger.error(
          `Aula ${aulaId} not found for notification - skipping`,
        );
        return; // Graceful degradation
      }

      // Validate professor belongs to same escola as aula (FK integrity check)
      if (aula.professor.escola_id !== aula.escola_id) {
        this.logger.error(
          `Data integrity violation: Aula ${aulaId} escola_id (${aula.escola_id}) != Professor escola_id (${aula.professor.escola_id}) - skipping notification`,
        );
        return; // Prevent cross-tenant notification
      }

      const formattedDate = new Date(aula.data).toLocaleDateString('pt-BR');

      // 2. Create in-app notification (MUST succeed)
      // Code Review MEDIUM-1: Add idempotency to prevent duplicate notifications
      // Use metadata_json aulaId as idempotency key (check if notification exists)
      const existingNotification = await this.prisma.notificacao.findFirst({
        where: {
          usuario_id: aula.professor_id,
          tipo: TipoNotificacao.TRANSCRICAO_PRONTA,
          metadata_json: {
            path: ['aulaId'],
            equals: aulaId,
          },
        },
      });

      if (existingNotification) {
        this.logger.log(
          `Notification already exists for aula ${aulaId} - skipping duplicate creation (idempotent)`,
        );
        return; // Idempotent - notification already created
      }

      await this.prisma.notificacao.create({
        data: {
          usuario_id: aula.professor_id,
          tipo: TipoNotificacao.TRANSCRICAO_PRONTA,
          titulo: 'Transcrição pronta!',
          mensagem: `Sua aula de ${aula.turma.nome} (${formattedDate}) foi transcrita e está pronta para análise.`,
          link: `/aulas/${aulaId}`,
          metadata_json: {
            aulaId,
            turmaId: aula.turma_id,
            turmaNome: aula.turma.nome,
          },
        },
      });

      this.logger.log(
        `In-app notification created for professor ${aula.professor_id} (aula: ${aulaId}, escola: ${aula.escola_id})`,
      );

      // 3. Check email preference and send if enabled
      try {
        const perfilUsuario = aula.professor.perfil_usuario;

        if (perfilUsuario?.notificacoes_email) {
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:5173';
          await this.emailService.sendTranscricaoProntaEmail({
            to: aula.professor.email,
            professorNome: aula.professor.nome,
            turmaNome: aula.turma.nome,
            aulaData: aula.data,
            link: `${frontendUrl}/aulas/${aulaId}`,
          });
        } else {
          this.logger.log(
            `Email notification skipped for professor ${aula.professor_id} (preference disabled)`,
          );
        }
      } catch (emailError) {
        // Log but don't throw - in-app notification is already created
        const errorMessage =
          emailError instanceof Error
            ? emailError.message
            : 'Unknown email error';
        this.logger.error(
          `Failed to send email notification for aula ${aulaId}: ${errorMessage}`,
        );
      }
    } catch (error) {
      // Log critical errors but don't re-throw (don't fail transcription job)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create notification for aula ${aulaId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Get notifications for a user with pagination
   * Story 4.4 - AC4: REST API
   *
   * @param usuarioId - User ID
   * @param options - Pagination options
   * @returns List of notifications (sorted by created_at DESC)
   */
  async getNotificacoes(
    usuarioId: string,
    options?: { limit?: number; offset?: number },
  ) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.notificacao.findMany({
      where: {
        usuario_id: usuarioId,
        usuario: {
          escola_id: escolaId, // ✅ Multi-tenancy enforcement
        },
      },
      orderBy: { created_at: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Notify professor when transcription fails after all retries
   * Code Review HIGH-4: Missing error notification
   *
   * CRITICAL: This method NEVER throws - graceful degradation
   * - Email is ALWAYS sent for errors (ignores notificacoes_email preference)
   * - In-app notification MUST be created
   *
   * @param aulaId - Aula ID that failed transcription
   * @param errorMessage - Error message to display
   */
  async notifyTranscricaoErro(
    aulaId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      // Load aula with relations (same pattern as notifyTranscricaoPronta)
      const aula = await this.prisma.aula.findUnique({
        where: { id: aulaId },
        include: {
          turma: true,
          professor: {
            include: {
              escola: true,
            },
          },
        },
      });

      if (!aula) {
        this.logger.error(
          `Aula ${aulaId} not found for error notification - skipping`,
        );
        return;
      }

      // Validate FK integrity
      if (aula.professor.escola_id !== aula.escola_id) {
        this.logger.error(
          `Data integrity violation: Aula ${aulaId} escola mismatch - skipping error notification`,
        );
        return;
      }

      const formattedDate = new Date(aula.data).toLocaleDateString('pt-BR');
      const truncatedError =
        errorMessage.length > 100
          ? errorMessage.substring(0, 100) + '...'
          : errorMessage;

      // Create in-app notification
      await this.prisma.notificacao.create({
        data: {
          usuario_id: aula.professor_id,
          tipo: TipoNotificacao.ERRO_PROCESSAMENTO,
          titulo: 'Erro ao transcrever aula',
          mensagem: `Sua aula de ${aula.turma.nome} (${formattedDate}) falhou ao ser transcrita após 3 tentativas. Erro: ${truncatedError}. Clique para reprocessar.`,
          link: `/aulas/${aulaId}`,
          metadata_json: {
            aulaId,
            turmaId: aula.turma_id,
            turmaNome: aula.turma.nome,
            errorMessage,
          },
        },
      });

      this.logger.log(
        `Error notification created for professor ${aula.professor_id} (aula: ${aulaId})`,
      );

      // ALWAYS send email for errors (ignores preference)
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // NOTE: Reusing transcription email template for now
        // Future: Create dedicated error email template
        await this.emailService.sendTranscricaoProntaEmail({
          to: aula.professor.email,
          professorNome: aula.professor.nome,
          turmaNome: aula.turma.nome,
          aulaData: aula.data,
          link: `${frontendUrl}/aulas/${aulaId}`,
        });
      } catch (emailError) {
        const errorMsg =
          emailError instanceof Error
            ? emailError.message
            : 'Unknown email error';
        this.logger.error(
          `Failed to send error notification email for aula ${aulaId}: ${errorMsg}`,
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create error notification for aula ${aulaId}: ${errorMsg}`,
      );
    }
  }

  /**
   * Notify professor when pedagogical analysis is complete
   * Story 5.5 - Integration Point
   *
   * CRITICAL: This method NEVER throws - graceful degradation
   * - In-app notification MUST be created
   * - Email failure is logged but doesn't block notification
   *
   * @param aulaId - Aula ID that was analyzed
   */
  async notifyAnalisePronta(aulaId: string): Promise<void> {
    try {
      // 1. Load aula with relations (same pattern as notifyTranscricaoPronta)
      const aula = await this.prisma.aula.findUnique({
        where: { id: aulaId },
        include: {
          turma: true,
          professor: {
            include: {
              escola: true,
              perfil_usuario: true,
            },
          },
        },
      });

      if (!aula) {
        this.logger.error(
          `Aula ${aulaId} not found for analysis notification - skipping`,
        );
        return;
      }

      // Validate FK integrity
      if (aula.professor.escola_id !== aula.escola_id) {
        this.logger.error(
          `Data integrity violation: Aula ${aulaId} escola mismatch - skipping analysis notification`,
        );
        return;
      }

      const formattedDate = new Date(aula.data).toLocaleDateString('pt-BR');

      // 2. Create in-app notification (idempotent)
      const existingNotification = await this.prisma.notificacao.findFirst({
        where: {
          usuario_id: aula.professor_id,
          tipo: TipoNotificacao.ANALISE_PRONTA,
          metadata_json: {
            path: ['aulaId'],
            equals: aulaId,
          },
        },
      });

      if (existingNotification) {
        this.logger.log(
          `Analysis notification already exists for aula ${aulaId} - skipping duplicate (idempotent)`,
        );
        return;
      }

      await this.prisma.notificacao.create({
        data: {
          usuario_id: aula.professor_id,
          tipo: TipoNotificacao.ANALISE_PRONTA,
          titulo: 'Análise pedagógica pronta!',
          mensagem: `Sua aula de ${aula.turma.nome} (${formattedDate}) foi analisada e está pronta para revisão. Relatório, exercícios e alertas estão disponíveis.`,
          link: `/aulas/${aulaId}`,
          metadata_json: {
            aulaId,
            turmaId: aula.turma_id,
            turmaNome: aula.turma.nome,
          },
        },
      });

      this.logger.log(
        `Analysis notification created for professor ${aula.professor_id} (aula: ${aulaId}, escola: ${aula.escola_id})`,
      );

      // 3. Send email if preference enabled
      // MEDIUM FIX (Code Review Issue #8): Use dedicated analysis email template
      try {
        const perfilUsuario = aula.professor.perfil_usuario;

        if (perfilUsuario?.notificacoes_email) {
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:5173';
          await this.emailService.sendAnaliseProntaEmail({
            to: aula.professor.email,
            professorNome: aula.professor.nome,
            turmaNome: aula.turma.nome,
            aulaData: aula.data,
            link: `${frontendUrl}/aulas/${aulaId}`,
          });
        } else {
          this.logger.log(
            `Email notification skipped for professor ${aula.professor_id} (preference disabled)`,
          );
        }
      } catch (emailError) {
        const errorMessage =
          emailError instanceof Error
            ? emailError.message
            : 'Unknown email error';
        this.logger.error(
          `Failed to send analysis email for aula ${aulaId}: ${errorMessage}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create analysis notification for aula ${aulaId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Get count of unread notifications for a user
   * Story 4.4 - AC4: REST API
   *
   * @param usuarioId - User ID
   * @returns Number of unread notifications
   */
  async getUnreadCount(usuarioId: string): Promise<number> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.notificacao.count({
      where: {
        usuario_id: usuarioId,
        lida: false,
        usuario: {
          escola_id: escolaId, // ✅ Multi-tenancy enforcement
        },
      },
    });
  }

  /**
   * Mark single notification as read
   * Story 4.4 - AC4: REST API
   *
   * CRITICAL: Validates user ownership before updating
   * Code Review HIGH-7 Fix: Prisma update() doesn't support relation filters in WHERE
   *
   * @param notificacaoId - Notification ID
   * @param usuarioId - User ID (for ownership validation)
   * @returns Updated notification
   */
  async markAsRead(notificacaoId: string, usuarioId: string) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // FIXED: Prisma update() doesn't support nested WHERE filters
    // Use findFirst() to validate, then update() separately
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id: notificacaoId,
        usuario_id: usuarioId, // User ownership
        usuario: {
          escola_id: escolaId, // Multi-tenancy enforcement
        },
      },
    });

    if (!notificacao) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notificacao.update({
      where: { id: notificacaoId },
      data: { lida: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   * Story 4.4 - AC4: REST API
   *
   * @param usuarioId - User ID
   * @returns Update result
   */
  async markAllAsRead(usuarioId: string) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.notificacao.updateMany({
      where: {
        usuario_id: usuarioId,
        lida: false,
        usuario: {
          escola_id: escolaId, // ✅ Multi-tenancy enforcement
        },
      },
      data: { lida: true },
    });
  }
}
