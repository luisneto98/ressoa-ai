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
