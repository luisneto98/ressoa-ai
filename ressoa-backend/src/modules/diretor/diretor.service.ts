import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import { InviteCoordenadorDto, InviteProfessorDto } from './dto';

@Injectable()
export class DiretorService {
  private readonly logger = new Logger(DiretorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Invites a Coordenador via email with unique token (Story 13.4)
   * @param escolaId - School ID from JWT (multi-tenancy enforcement)
   * @param dto - Email and name of the coordenador to invite
   * @returns Success message
   */
  async inviteCoordenador(
    escolaId: string,
    dto: InviteCoordenadorDto,
  ): Promise<{ message: string }> {
    const { email, nome } = dto;

    // Normalize email (case-insensitive, trimmed)
    const normalizedEmail = email.trim().toLowerCase();

    // AC3: Validate escola is active
    const escola = await this.prisma.escola.findUnique({
      where: { id: escolaId },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada');
    }

    if (escola.status !== 'ativa') {
      throw new BadRequestException('Escola inativa ou suspensa');
    }

    // AC2: Check email uniqueness within escola (case-insensitive)
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        email: normalizedEmail,
        escola_id: escolaId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta escola');
    }

    // AC5: Generate unique 64-char token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // AC5: Store token in Redis with 24h TTL
    await this.redisService.setex(
      `invite_coordenador:${inviteToken}`,
      86400, // 24 hours
      JSON.stringify({
        email: normalizedEmail,
        escolaId,
        nome,
      }),
    );

    // AC6 & AC7: Send invitation email with graceful degradation
    try {
      await this.emailService.sendCoordenadorInvitationEmail({
        to: normalizedEmail,
        coordenadorNome: nome,
        escolaNome: escola.nome,
        inviteToken,
      });
    } catch (error) {
      // AC7: Graceful degradation - log error but don't throw
      this.logger.error(
        'Failed to send coordenador invitation email',
        error instanceof Error ? error.stack : String(error),
      );
      // Token remains valid in Redis even if email fails
    }

    return { message: 'Convite enviado com sucesso' };
  }

  /**
   * Invites a Professor via email with unique token (Story 13.5)
   * @param escolaId - School ID from JWT (multi-tenancy enforcement)
   * @param dto - Email, name, disciplina, and optional fields for the professor
   * @returns Success message
   */
  async inviteProfessor(
    escolaId: string,
    dto: InviteProfessorDto,
  ): Promise<{ message: string }> {
    // AC3: Validate escola is active
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

    // AC2: Validate email uniqueness (case-insensitive)
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

    // AC5: Generate unique 64-char token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // AC5: Store token in Redis with 24h TTL
    const tokenPayload = {
      email: emailNormalized,
      escolaId: escola.id,
      nome: dto.nome,
      disciplina: dto.disciplina,
      ...(dto.formacao && { formacao: dto.formacao }),
      ...(dto.registro && { registro: dto.registro }),
      ...(dto.telefone && { telefone: dto.telefone }),
    };

    await this.redisService.setex(
      `invite_professor:${inviteToken}`,
      86400, // 24 hours in seconds
      JSON.stringify(tokenPayload),
    );

    // AC6 & AC7: Send invitation email with graceful degradation
    try {
      await this.emailService.sendProfessorInvitationEmail({
        to: emailNormalized,
        professorNome: dto.nome,
        escolaNome: escola.nome,
        disciplina: dto.disciplina,
        inviteToken,
      });
    } catch (error) {
      // AC7: Graceful degradation - log error but don't throw
      this.logger.error('Failed to send professor invitation email', {
        error: error instanceof Error ? error.message : String(error),
        email: emailNormalized,
      });
      // Token remains valid in Redis even if email fails
    }

    return { message: 'Convite enviado com sucesso' };
  }
}
