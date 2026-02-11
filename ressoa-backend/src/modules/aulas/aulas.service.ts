import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, StatusProcessamento } from '@prisma/client';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { QueryAulasDto } from './dto/query-aulas.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AulasService {
  // State transition rules for professor
  private readonly PROFESSOR_ALLOWED_TRANSITIONS: Record<
    StatusProcessamento,
    StatusProcessamento[]
  > = {
    CRIADA: ['AGUARDANDO_TRANSCRICAO'],
    ANALISADA: ['APROVADA', 'REJEITADA'],
    UPLOAD_PROGRESSO: [],
    AGUARDANDO_TRANSCRICAO: [],
    TRANSCRITA: [],
    ANALISANDO: [],
    APROVADA: [],
    REJEITADA: [],
    ERRO: [],
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Parse ISO date string to Date object
   */
  private parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Helper: Parse optional ISO date string to Date or undefined
   */
  private parseDateOrUndefined(dateString?: string): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  async create(dto: CreateAulaDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validate: turma belongs to professor
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: dto.turma_id,
        escola_id: escolaId,
        professor_id: user.userId,
      },
    });

    if (!turma) {
      throw new ForbiddenException(
        'Turma não encontrada ou não pertence ao professor',
      );
    }

    // Validate: planejamento (if provided) belongs to turma
    if (dto.planejamento_id) {
      const planejamento = await this.prisma.planejamento.findUnique({
        where: {
          id: dto.planejamento_id,
          escola_id: escolaId,
          turma_id: dto.turma_id,
          deleted_at: null, // Prevent linking to soft-deleted planejamento
        },
      });

      if (!planejamento) {
        throw new BadRequestException(
          'Planejamento não encontrado ou não pertence à turma',
        );
      }
    }

    // Create aula with status CRIADA
    const aula = await this.prisma.aula.create({
      data: {
        ...dto,
        data: this.parseDate(dto.data),
        professor_id: user.userId,
        escola_id: escolaId,
        status_processamento: 'CRIADA',
      },
      include: {
        turma: true,
        planejamento: true,
      },
    });

    return aula;
  }

  async findAll(query: QueryAulasDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    const where: Prisma.AulaWhereInput = {
      escola_id: escolaId,
      professor_id: user.userId,
      deleted_at: null,
    };

    // Filter by turma
    if (query.turma_id) {
      where.turma_id = query.turma_id;
    }

    // Filter by status
    if (query.status_processamento) {
      where.status_processamento = query.status_processamento;
    }

    // Filter by date range
    if (query.data_inicio || query.data_fim) {
      where.data = {};
      if (query.data_inicio) {
        where.data.gte = this.parseDate(query.data_inicio);
      }
      if (query.data_fim) {
        where.data.lte = this.parseDate(query.data_fim);
      }
    }

    return this.prisma.aula.findMany({
      where,
      include: {
        turma: true,
        planejamento: true,
      },
      orderBy: [{ data: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    const aula = await this.prisma.aula.findUnique({
      where: {
        id,
        escola_id: escolaId,
        professor_id: user.userId,
        deleted_at: null,
      },
      include: {
        turma: true,
        planejamento: true,
        // transcricao and analise will be added in future stories
      },
    });

    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    return aula;
  }

  async update(id: string, dto: UpdateAulaDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Find aula with tenant isolation
    const aula = await this.prisma.aula.findUnique({
      where: {
        id,
        escola_id: escolaId,
        professor_id: user.userId,
        deleted_at: null,
      },
    });

    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Validate status transition if status_processamento is being updated
    if (dto.status_processamento) {
      this.validateStatusTransition(
        aula.status_processamento,
        dto.status_processamento,
      );
    }

    // Update aula
    const updated = await this.prisma.aula.update({
      where: {
        id,
        escola_id: escolaId, // Required for multi-tenancy
      },
      data: {
        ...dto,
        data: this.parseDateOrUndefined(dto.data),
      },
      include: {
        turma: true,
        planejamento: true,
      },
    });

    return updated;
  }

  private validateStatusTransition(
    currentStatus: StatusProcessamento,
    newStatus: StatusProcessamento,
  ) {
    const allowedTransitions =
      this.PROFESSOR_ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transição de ${currentStatus} para ${newStatus} não permitida para professor`,
      );
    }
  }
}
