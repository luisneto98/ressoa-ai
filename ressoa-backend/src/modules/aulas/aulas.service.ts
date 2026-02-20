import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, StatusProcessamento, TipoEntrada } from '@prisma/client';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { QueryAulasDto } from './dto/query-aulas.dto';
import { UploadTranscricaoDto } from './dto/upload-transcricao.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';
import { CreateAulaRascunhoDto } from './dto/create-aula-rascunho.dto';
import { UpdateAulaDescricaoDto } from './dto/update-aula-descricao.dto';
import { IniciarProcessamentoDto } from './dto/iniciar-processamento.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AulasService {
  private readonly logger = new Logger(AulasService.name);
  // State transition rules for professor
  private readonly PROFESSOR_ALLOWED_TRANSITIONS: Record<
    StatusProcessamento,
    StatusProcessamento[]
  > = {
    RASCUNHO: ['CRIADA'], // Story 16.2: via iniciarProcessamento com AUDIO
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

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('transcription')
    private readonly transcriptionQueue: Queue,
  ) {}

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

    // Filter by status (supports multiple statuses)
    if (query.status && query.status.length > 0) {
      where.status_processamento = { in: query.status };
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

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    return this.prisma.aula.findMany({
      where,
      include: {
        turma: true,
        planejamento: true,
      },
      orderBy: [{ data: 'desc' }, { created_at: 'desc' }],
      skip,
      take: limit,
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

  /**
   * Upload Transcrição: Create aula with complete transcription text
   *
   * @description Skips CRIADA state, goes directly to TRANSCRITA.
   *              Creates bi-directional link: Aula ↔ Transcricao (one-to-one).
   *              Uses atomic transaction to ensure data consistency.
   *
   * @param dto - Transcription upload payload (turma_id, data, transcricao_texto)
   * @param user - Authenticated professor
   * @returns Created Aula with transcricao relation
   * @throws ForbiddenException - If turma doesn't belong to professor
   * @throws BadRequestException - If planejamento is invalid/soft-deleted/cross-turma
   */
  async uploadTranscricao(dto: UploadTranscricaoDto, user: AuthenticatedUser) {
    return this.createAulaFromText({
      escolaId: this.prisma.getEscolaIdOrThrow(),
      user,
      turmaId: dto.turma_id,
      planejamentoId: dto.planejamento_id,
      data: dto.data,
      texto: dto.transcricao_texto,
      tipoEntrada: TipoEntrada.TRANSCRICAO,
      confianca: 1.0, // Complete transcription = high confidence
    });
  }

  /**
   * Entrada Manual: Create aula with manual summary/resume
   *
   * @description Skips CRIADA state, goes directly to TRANSCRITA.
   *              Creates bi-directional link: Aula ↔ Transcricao (one-to-one).
   *              Uses atomic transaction to ensure data consistency.
   *
   * @param dto - Manual entry payload (turma_id, data, resumo)
   * @param user - Authenticated professor
   * @returns Created Aula with transcricao relation
   * @throws ForbiddenException - If turma doesn't belong to professor
   * @throws BadRequestException - If planejamento is invalid/soft-deleted/cross-turma
   */
  async entradaManual(dto: EntradaManualDto, user: AuthenticatedUser) {
    return this.createAulaFromText({
      escolaId: this.prisma.getEscolaIdOrThrow(),
      user,
      turmaId: dto.turma_id,
      planejamentoId: dto.planejamento_id,
      data: dto.data,
      texto: dto.resumo,
      tipoEntrada: TipoEntrada.MANUAL,
      confianca: 0.5, // Manual resume = lower confidence than full transcription
    });
  }

  /**
   * DRY Helper: Create aula from text (transcription or manual resume)
   *
   * @description Atomic transaction that creates Transcricao + Aula + bidirectional link.
   *              Validates turma ownership and planejamento constraints.
   *              Handles all Prisma errors gracefully with user-friendly messages.
   *
   * @private
   */
  private async createAulaFromText(params: {
    escolaId: string;
    user: AuthenticatedUser;
    turmaId: string;
    planejamentoId: string | undefined;
    data: string;
    texto: string;
    tipoEntrada: TipoEntrada;
    confianca: number;
  }) {
    const {
      escolaId,
      user,
      turmaId,
      planejamentoId,
      data,
      texto,
      tipoEntrada,
      confianca,
    } = params;

    try {
      // Step 1: Validate turma ownership (outside transaction for early fail)
      await this.validateTurmaOwnership(escolaId, user.userId, turmaId);

      // Step 2: Validate planejamento constraints (if provided)
      if (planejamentoId) {
        await this.validatePlanejamento(escolaId, turmaId, planejamentoId);
      }

      // Step 3: Create Aula + Transcricao in atomic transaction
      const aula = await this.prisma.$transaction(async (tx) => {
        // Create aula first with TRANSCRITA status
        const createdAula = await tx.aula.create({
          data: {
            escola_id: escolaId,
            professor_id: user.userId,
            turma_id: turmaId,
            planejamento_id: planejamentoId,
            data: this.parseDate(data),
            tipo_entrada: tipoEntrada,
            status_processamento: StatusProcessamento.TRANSCRITA,
          },
          include: {
            turma: true,
            planejamento: true,
            transcricao: true,
          },
        });

        // Create transcricao linked to aula
        await tx.transcricao.create({
          data: {
            aula_id: createdAula.id,
            texto,
            provider: 'MANUAL', // MANUAL provider for both TRANSCRICAO and MANUAL entry types
            confianca,
            duracao_segundos: null, // Not applicable for manual text
          },
        });

        return createdAula;
      });

      // Log successful creation (audit trail)
      this.logger.log(
        `[${tipoEntrada}] Professor ${user.userId} (escola: ${escolaId}) criou transcrição para aula ${aula.id} | ` +
          `Turma: ${turmaId} | Tamanho: ${texto.length} chars | Confiança: ${confianca}`,
      );

      // TODO (Epic 5): Enqueue analysis job
      // await this.bullQueue.add('analyze-aula', { aulaId: aula.id });

      return aula;
    } catch (error) {
      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          throw new ConflictException('Transcrição já existe para esta aula');
        }
        if (error.code === 'P2003') {
          // Foreign key constraint violation
          throw new BadRequestException(
            'Relação inválida (escola/turma não existem)',
          );
        }
      }

      // Re-throw known business exceptions
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao criar aula com transcrição (tipo: ${tipoEntrada}): ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Erro ao processar transcrição');
    }
  }

  /**
   * Validate turma ownership (multi-tenancy + RBAC)
   * @throws ForbiddenException if turma doesn't belong to professor
   */
  private async validateTurmaOwnership(
    escolaId: string,
    professorId: string,
    turmaId: string,
  ): Promise<void> {
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId,
        professor_id: professorId,
      },
    });

    if (!turma) {
      throw new ForbiddenException(
        'Turma não encontrada ou não pertence ao professor',
      );
    }
  }

  /**
   * Validate planejamento constraints (cross-turma protection + soft-delete)
   * @throws BadRequestException if planejamento is invalid/soft-deleted/cross-turma
   */
  private async validatePlanejamento(
    escolaId: string,
    turmaId: string,
    planejamentoId: string,
  ): Promise<void> {
    const planejamento = await this.prisma.planejamento.findUnique({
      where: {
        id: planejamentoId,
        escola_id: escolaId,
        turma_id: turmaId, // Cross-turma protection
        deleted_at: null, // Soft-delete protection (Code review learning from Story 3.1)
      },
    });

    if (!planejamento) {
      throw new BadRequestException(
        'Planejamento não encontrado ou não pertence à turma',
      );
    }
  }

  /**
   * Enqueue transcription job for async processing (Story 4.3)
   *
   * @description Adds transcription job to Bull queue with retry and priority settings.
   *              Used by TUS upload completion and reprocessing endpoint.
   *
   * Priority levels:
   * - P1 (1): Pilot schools (beta testers) - highest priority
   * - P2 (2): Regular schools - standard priority
   *
   * Retry strategy: 3 attempts with exponential backoff (1min, 2min, 4min)
   *
   * @param aulaId - UUID of the Aula to transcribe
   * @param priority - Priority level ('P1' or 'P2'), defaults to 'P2'
   * @returns Promise<void>
   */
  async enqueueTranscription(
    aulaId: string,
    priority: 'P1' | 'P2' = 'P2',
  ): Promise<void> {
    const priorityValue = priority === 'P1' ? 1 : 2;

    await this.transcriptionQueue.add(
      'transcribe-aula',
      { aulaId },
      {
        priority: priorityValue,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute base delay
        },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Job transcribe-aula enfileirado: aulaId=${aulaId}, priority=${priority}`,
    );
  }

  /**
   * Reprocessar aula com erro (Story 4.3 - AC4)
   *
   * @description Re-enqueue failed transcription jobs for retry.
   *              Only allows reprocessing of aulas with status ERRO.
   *              Validates ownership (professor must own the aula).
   *
   * @param id - UUID of the Aula to reprocess
   * @param user - Authenticated professor
   * @returns Success message
   * @throws NotFoundException - If aula not found
   * @throws ForbiddenException - If aula doesn't belong to professor
   * @throws BadRequestException - If aula status is not ERRO
   */
  async reprocessarAula(id: string, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Find aula with tenant isolation and ownership validation
    const aula = await this.prisma.aula.findUnique({
      where: {
        id,
        escola_id: escolaId, // ✅ Multi-tenancy
        professor_id: user.userId, // ✅ Ownership validation
        deleted_at: null,
      },
    });

    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Validate status: only ERRO aulas can be reprocessed
    if (aula.status_processamento !== 'ERRO') {
      throw new BadRequestException(
        'Apenas aulas com erro podem ser reprocessadas',
      );
    }

    // Reset status to AGUARDANDO_TRANSCRICAO
    await this.prisma.aula.update({
      where: {
        id,
        escola_id: escolaId, // ✅ Multi-tenancy
      },
      data: {
        status_processamento: 'AGUARDANDO_TRANSCRICAO',
      },
    });

    // Enqueue transcription job
    await this.enqueueTranscription(id);

    this.logger.log(
      `Aula ${id} reprocessada por professor ${user.userId} (escola: ${escolaId})`,
    );

    return {
      message: 'Aula adicionada à fila de processamento',
    };
  }

  /**
   * Story 16.2: Criar rascunho de aula (sem áudio/tipo_entrada)
   *
   * @description Cria aula com status RASCUNHO para planejamento antecipado.
   *              Aceita datas futuras. Não exige tipo_entrada nem arquivo_url.
   *
   * @param dto - Dados do rascunho (turma_id, data, planejamento_id?, descricao?)
   * @param user - Professor autenticado
   * @returns Aula criada com status RASCUNHO
   */
  async createRascunho(dto: CreateAulaRascunhoDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validate: turma belongs to professor
    await this.validateTurmaOwnership(escolaId, user.userId, dto.turma_id);

    // Validate: planejamento (if provided) belongs to turma
    if (dto.planejamento_id) {
      await this.validatePlanejamento(escolaId, dto.turma_id, dto.planejamento_id);
    }

    const aula = await this.prisma.aula.create({
      data: {
        escola_id: escolaId,
        professor_id: user.userId,
        turma_id: dto.turma_id,
        planejamento_id: dto.planejamento_id,
        data: this.parseDate(dto.data),
        descricao: dto.descricao,
        status_processamento: StatusProcessamento.RASCUNHO,
        // tipo_entrada: null — intencionalmente omitido para rascunhos
      },
      include: {
        turma: true,
        planejamento: true,
      },
    });

    this.logger.log(
      `[RASCUNHO] Professor ${user.userId} (escola: ${escolaId}) criou rascunho de aula ${aula.id}`,
    );

    return aula;
  }

  /**
   * Story 16.2: Atualizar descrição de uma aula rascunho
   *
   * @description Atualiza o campo descricao somente quando status === RASCUNHO.
   *              Após início do processamento, a descrição é imutável (DT-4).
   *
   * @param id - UUID da aula
   * @param dto - Dados da descrição
   * @param user - Professor autenticado
   * @returns Aula atualizada
   * @throws BadRequestException se status !== RASCUNHO
   */
  async updateDescricao(id: string, dto: UpdateAulaDescricaoDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

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

    if (aula.status_processamento !== StatusProcessamento.RASCUNHO) {
      throw new BadRequestException(
        'Descrição só pode ser editada em aulas com status RASCUNHO',
      );
    }

    return this.prisma.aula.update({
      where: { id, escola_id: escolaId },
      data: { descricao: dto.descricao },
      include: {
        turma: true,
        planejamento: true,
      },
    });
  }

  /**
   * Story 16.2: Iniciar processamento de um rascunho
   *
   * @description Transiciona RASCUNHO → CRIADA (AUDIO) ou RASCUNHO → TRANSCRITA (TRANSCRICAO/MANUAL).
   *              Para AUDIO: apenas atualiza status e tipo_entrada; TUS upload ocorre separadamente.
   *              Para TRANSCRICAO/MANUAL: cria Transcricao atomicamente.
   *
   * @param id - UUID da aula
   * @param dto - Tipo de entrada e dados opcionais (transcricao_texto ou resumo)
   * @param user - Professor autenticado
   * @returns Aula atualizada
   * @throws BadRequestException se status !== RASCUNHO
   */
  async iniciarProcessamento(id: string, dto: IniciarProcessamentoDto, user: AuthenticatedUser) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

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

    if (aula.status_processamento !== StatusProcessamento.RASCUNHO) {
      throw new BadRequestException(
        'Apenas aulas em RASCUNHO podem ser iniciadas',
      );
    }

    if (dto.tipo_entrada === TipoEntrada.AUDIO) {
      // RASCUNHO → CRIADA: TUS upload acontecerá separadamente
      const updated = await this.prisma.aula.update({
        where: { id, escola_id: escolaId },
        data: {
          tipo_entrada: TipoEntrada.AUDIO,
          status_processamento: StatusProcessamento.CRIADA,
        },
        include: { turma: true, planejamento: true },
      });

      this.logger.log(
        `[INICIAR_AUDIO] Professor ${user.userId} iniciou rascunho ${id} → CRIADA (aguardando TUS upload)`,
      );

      return updated;
    }

    // TRANSCRICAO ou MANUAL: criar Transcricao atomicamente
    const texto = dto.tipo_entrada === TipoEntrada.TRANSCRICAO ? dto.transcricao_texto! : dto.resumo!;
    const confianca = dto.tipo_entrada === TipoEntrada.TRANSCRICAO ? 1.0 : 0.5;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.aula.update({
        where: { id, escola_id: escolaId },
        data: {
          tipo_entrada: dto.tipo_entrada,
          status_processamento: StatusProcessamento.TRANSCRITA,
        },
      });

      await tx.transcricao.create({
        data: {
          aula_id: id,
          texto,
          provider: 'MANUAL',
          confianca,
          duracao_segundos: null,
        },
      });

      // Buscar aula após criar transcricao para que a relação esteja presente na resposta
      return tx.aula.findUniqueOrThrow({
        where: { id, escola_id: escolaId },
        include: { turma: true, planejamento: true, transcricao: true },
      });
    });

    this.logger.log(
      `[INICIAR_${dto.tipo_entrada}] Professor ${user.userId} iniciou rascunho ${id} → TRANSCRITA`,
    );

    return updated;
  }

  /**
   * Atualiza status de processamento de uma aula.
   *
   * **Story 6.2:** Usado para atualizar aula para APROVADA ou REJEITADA
   * quando professor aprova/rejeita o relatório.
   *
   * **IMPORTANT:** Este método NÃO valida transições de estado.
   * É usado internamente pelo sistema (analysis-processor, analise-approval).
   *
   * @param aulaId ID da aula
   * @param novoStatus Novo status de processamento
   * @returns Aula atualizada
   * @throws NotFoundException se aula não existir
   */
  async updateStatus(aulaId: string, novoStatus: StatusProcessamento) {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Verify aula exists and belongs to school (multi-tenancy)
    const aula = await this.prisma.aula.findUnique({
      where: {
        id: aulaId,
        escola_id: escolaId,
      },
    });

    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Update status
    return this.prisma.aula.update({
      where: { id: aulaId },
      data: {
        status_processamento: novoStatus,
      },
    });
  }
}
