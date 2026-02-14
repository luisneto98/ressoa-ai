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
import { StatusConvite, Prisma } from '@prisma/client';

@Injectable()
export class ConvitesService {
  private readonly logger = new Logger(ConvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
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
}
