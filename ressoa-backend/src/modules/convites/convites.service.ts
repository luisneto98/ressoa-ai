import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import { StatusConvite, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ConvitesService {
  private readonly logger = new Logger(ConvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async listConvites(
    callerRole: string,
    callerEscolaId: string | null,
    query: { page: number; limit: number; status?: StatusConvite },
  ) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ConviteUsuarioWhereInput = {};

    // Multi-tenancy: non-Admin scoped by escola_id
    if (callerRole !== 'ADMIN') {
      if (!callerEscolaId) {
        throw new ForbiddenException('Escola não identificada para o usuário');
      }
      where.escola_id = callerEscolaId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.conviteUsuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criado_em: 'desc' },
        include: {
          escola: { select: { nome: true } },
        },
      }),
      this.prisma.conviteUsuario.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        id: c.id,
        email: c.email,
        nome_completo: c.nome_completo,
        tipo_usuario: c.tipo_usuario,
        escola_id: c.escola_id,
        escola_nome: c.escola.nome,
        status: c.status,
        expira_em: c.expira_em.toISOString(),
        criado_em: c.criado_em.toISOString(),
        aceito_em: c.aceito_em?.toISOString() ?? null,
        dados_extras: c.dados_extras,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async cancelarConvite(
    id: string,
    callerRole: string,
    callerEscolaId: string | null,
  ) {
    const where: Prisma.ConviteUsuarioWhereInput = { id };

    // Multi-tenancy: non-Admin scoped by escola_id
    if (callerRole !== 'ADMIN') {
      if (!callerEscolaId) {
        throw new ForbiddenException('Escola não identificada para o usuário');
      }
      where.escola_id = callerEscolaId;
    }

    const convite = await this.prisma.conviteUsuario.findFirst({ where });

    if (!convite) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (convite.status === 'aceito') {
      throw new BadRequestException(
        'Não é possível cancelar convite já aceito',
      );
    }

    if (convite.status === 'cancelado') {
      throw new ConflictException('Convite já foi cancelado');
    }

    // Update DB status
    await this.prisma.conviteUsuario.update({
      where: { id: convite.id },
      data: { status: 'cancelado' },
    });

    // Delete Redis token (invalidate email link)
    const redisKey = `invite_${convite.tipo_usuario === 'diretor' ? 'director' : convite.tipo_usuario}:${convite.token}`;
    await this.redisService.del(redisKey);

    return { message: `Convite para ${convite.email} foi cancelado` };
  }

  async reenviarConvite(
    id: string,
    callerRole: string,
    callerEscolaId: string | null,
  ) {
    const where: Prisma.ConviteUsuarioWhereInput = { id };

    // Multi-tenancy: non-Admin scoped by escola_id
    if (callerRole !== 'ADMIN') {
      if (!callerEscolaId) {
        throw new ForbiddenException('Escola não identificada para o usuário');
      }
      where.escola_id = callerEscolaId;
    }

    const convite = await this.prisma.conviteUsuario.findFirst({
      where,
      include: { escola: { select: { nome: true } } },
    });

    if (!convite) {
      throw new NotFoundException('Convite não encontrado');
    }

    // Cannot resend accepted invite
    if (convite.status === 'aceito') {
      throw new BadRequestException(
        'Não é possível reenviar convite já aceito',
      );
    }

    // Generate new token
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiraEm = new Date(Date.now() + 86400 * 1000);

    // Prisma transaction: cancel old invite + create new one
    const [, newConvite] = await this.prisma.$transaction([
      this.prisma.conviteUsuario.update({
        where: { id: convite.id },
        data: { status: 'cancelado' },
      }),
      this.prisma.conviteUsuario.create({
        data: {
          email: convite.email,
          nome_completo: convite.nome_completo,
          tipo_usuario: convite.tipo_usuario,
          escola_id: convite.escola_id,
          criado_por: convite.criado_por,
          dados_extras: convite.dados_extras ?? undefined,
          token: newToken,
          expira_em: newExpiraEm,
          status: 'pendente',
        },
      }),
    ]);

    // Redis: set new token, delete old token
    const redisKeyPrefix = `invite_${convite.tipo_usuario === 'diretor' ? 'director' : convite.tipo_usuario}`;
    const newRedisKey = `${redisKeyPrefix}:${newToken}`;
    const oldRedisKey = `${redisKeyPrefix}:${convite.token}`;

    await this.redisService.setex(
      newRedisKey,
      86400,
      JSON.stringify({
        email: convite.email,
        escolaId: convite.escola_id,
        nome: convite.nome_completo,
      }),
    );
    await this.redisService.del(oldRedisKey);

    // Send email (graceful degradation - don't throw on failure)
    try {
      await this.sendInviteEmail(
        convite.tipo_usuario,
        convite.email,
        convite.nome_completo,
        convite.escola.nome,
        newToken,
        (convite.dados_extras as Record<string, unknown>) ?? null,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(
        `Email failed for resent invite ${newConvite.id}: ${errorMessage}. Token remains valid.`,
      );
    }

    return { message: `Convite reenviado para ${convite.email}` };
  }

  private async sendInviteEmail(
    tipoUsuario: string,
    email: string,
    nome: string,
    escolaNome: string,
    token: string,
    dadosExtras: Record<string, unknown> | null,
  ): Promise<void> {
    switch (tipoUsuario) {
      case 'diretor':
        await this.emailService.sendDirectorInvitationEmail(
          email,
          nome,
          escolaNome,
          token,
        );
        break;
      case 'coordenador':
        await this.emailService.sendCoordenadorInvitationEmail({
          to: email,
          coordenadorNome: nome,
          escolaNome,
          inviteToken: token,
        });
        break;
      case 'professor':
        await this.emailService.sendProfessorInvitationEmail({
          to: email,
          professorNome: nome,
          escolaNome,
          disciplina: (dadosExtras?.disciplina as string) ?? '',
          inviteToken: token,
        });
        break;
    }
  }
}
