import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import { InviteProfessorDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class CoordenadorService {
  private readonly logger = new Logger(CoordenadorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Invites a Professor via email with unique token (Story 13.6)
   * @param escolaId - School ID from JWT (multi-tenancy enforcement)
   * @param dto - Email, name, disciplina, and optional fields for the professor
   * @returns Success message
   */
  async inviteProfessor(
    escolaId: string,
    dto: InviteProfessorDto,
    userId?: string,
  ): Promise<{ message: string }> {
    // AC4: Validate escola is active
    const escola = await this.prisma.escola.findUnique({
      where: { id: escolaId },
      select: { id: true, nome: true, status: true },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada');
    }

    if (escola.status !== 'ativa') {
      throw new BadRequestException('Escola inativa ou suspensa');
    }

    // AC3: Validate email uniqueness (case-insensitive)
    const emailNormalized = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        email: emailNormalized,
        escola_id: escolaId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta escola');
    }

    // AC6: Generate unique 64-char token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // AC6: Store token in Redis with 24h TTL
    // Trim optional fields and exclude empty strings (pattern from Story 13.5)
    const tokenPayload = {
      email: emailNormalized,
      escolaId: escola.id,
      nome: dto.nome,
      disciplina: dto.disciplina,
      ...(dto.formacao?.trim() && { formacao: dto.formacao.trim() }),
      ...(dto.registro?.trim() && { registro: dto.registro.trim() }),
      ...(dto.telefone?.trim() && { telefone: dto.telefone.trim() }),
    };

    await this.redisService.setex(
      `invite_professor:${inviteToken}`, // ✅ SAME prefix as Story 13.5
      86400, // 24 hours in seconds
      JSON.stringify(tokenPayload),
    );

    // Dual-write: persist to DB for listing/management (Story 13.11)
    if (userId) {
      try {
        await this.prisma.conviteUsuario.create({
          data: {
            email: emailNormalized,
            nome_completo: dto.nome,
            tipo_usuario: 'professor',
            escola_id: escolaId,
            criado_por: userId,
            token: inviteToken,
            expira_em: new Date(Date.now() + 86400 * 1000),
            status: 'pendente',
            dados_extras: tokenPayload.disciplina
              ? {
                  disciplina: tokenPayload.disciplina,
                  ...(tokenPayload.formacao && {
                    formacao: tokenPayload.formacao,
                  }),
                  ...(tokenPayload.registro && {
                    registro: tokenPayload.registro,
                  }),
                  ...(tokenPayload.telefone && {
                    telefone: tokenPayload.telefone,
                  }),
                }
              : undefined,
          },
        });
      } catch (error) {
        this.logger.error('Failed to persist invite to DB (dual-write)', {
          error: error instanceof Error ? error.message : String(error),
          email: emailNormalized,
        });
      }
    }

    // AC7 & AC8: Send invitation email with graceful degradation
    try {
      await this.emailService.sendProfessorInvitationEmail({
        to: emailNormalized,
        professorNome: dto.nome,
        escolaNome: escola.nome,
        disciplina: dto.disciplina,
        inviteToken,
      });
    } catch (error) {
      // AC8: Graceful degradation - log error but don't throw
      this.logger.error('Failed to send professor invitation email', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        email: emailNormalized,
      });
      // Token remains valid in Redis even if email fails
    }

    return { message: 'Convite enviado com sucesso' };
  }
}
