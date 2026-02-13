import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Serie, TipoEnsino, CurriculoTipo, Prisma } from '@prisma/client';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida compatibilidade entre serie e tipo_ensino
   *
   * @param serie - Série da turma
   * @param tipo_ensino - Tipo de ensino (FUNDAMENTAL ou MEDIO)
   * @throws BadRequestException se combinação for inválida
   */
  private validateSerieCompatibility(
    serie: Serie,
    tipo_ensino: TipoEnsino,
  ): void {
    const fundamentalSeries: Serie[] = [
      Serie.SEXTO_ANO,
      Serie.SETIMO_ANO,
      Serie.OITAVO_ANO,
      Serie.NONO_ANO,
    ];

    const medioSeries: Serie[] = [
      Serie.PRIMEIRO_ANO_EM,
      Serie.SEGUNDO_ANO_EM,
      Serie.TERCEIRO_ANO_EM,
    ];

    if (
      tipo_ensino === TipoEnsino.FUNDAMENTAL &&
      !fundamentalSeries.includes(serie)
    ) {
      throw new BadRequestException(
        `Série ${serie} incompatível com Ensino Fundamental. Use: SEXTO_ANO, SETIMO_ANO, OITAVO_ANO ou NONO_ANO.`,
      );
    }

    if (tipo_ensino === TipoEnsino.MEDIO && !medioSeries.includes(serie)) {
      throw new BadRequestException(
        `Série ${serie} incompatível com Ensino Médio. Use: PRIMEIRO_ANO_EM, SEGUNDO_ANO_EM ou TERCEIRO_ANO_EM.`,
      );
    }
  }

  /**
   * Valida contexto pedagógico para turmas customizadas
   * Story 11.2: CUSTOM turmas require contexto_pedagogico
   *
   * NOTE: Most validation is handled by DTO decorators (@ValidateIf, @ValidateNested)
   * This method only provides final safety check for service-level calls
   *
   * @param curriculo_tipo - Tipo de currículo (BNCC ou CUSTOM)
   * @param contexto_pedagogico - Contexto pedagógico (opcional para BNCC, obrigatório para CUSTOM)
   * @throws BadRequestException se CUSTOM sem contexto
   */
  private validateContextoPedagogico(
    curriculo_tipo: CurriculoTipo | undefined,
    contexto_pedagogico: any,
  ): void {
    // Se não definido, assume BNCC (default) - sem validação necessária
    if (!curriculo_tipo || curriculo_tipo === CurriculoTipo.BNCC) {
      return;
    }

    // CUSTOM requer contexto_pedagogico (field-level validation is in DTO)
    if (curriculo_tipo === CurriculoTipo.CUSTOM && !contexto_pedagogico) {
      throw new BadRequestException(
        'contexto_pedagogico é obrigatório para turmas customizadas',
      );
    }
  }

  /**
   * Cria uma nova turma com validação de compatibilidade serie-tipo_ensino e unicidade
   *
   * @param dto - Dados da turma a ser criada
   * @returns Turma criada
   * @throws ConflictException se turma duplicada (nome + ano + turno)
   */
  async create(dto: CreateTurmaDto) {
    // ✅ CRITICAL: Get escolaId from tenant context (TenantInterceptor)
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validar compatibilidade serie-tipo_ensino
    this.validateSerieCompatibility(dto.serie, dto.tipo_ensino);

    // Story 11.2: Validar contexto pedagógico para turmas customizadas
    this.validateContextoPedagogico(dto.curriculo_tipo, dto.contexto_pedagogico);

    // Validar unicidade: nome + ano_letivo + turno + escola_id
    const existing = await this.prisma.turma.findFirst({
      where: {
        escola_id: escolaId,
        nome: dto.nome,
        ano_letivo: dto.ano_letivo,
        turno: dto.turno,
        deleted_at: null, // ✅ Exclude soft-deleted
      },
    });

    if (existing) {
      throw new ConflictException(
        `Turma com nome '${dto.nome}' já existe para ${dto.ano_letivo} no turno ${dto.turno}`,
      );
    }

    // Criar turma (lógica existente + novo campo)
    const turma = await this.prisma.turma.create({
      data: {
        nome: dto.nome,
        disciplina: dto.disciplina,
        serie: dto.serie,
        tipo_ensino: dto.tipo_ensino,
        ano_letivo: dto.ano_letivo,
        turno: dto.turno,
        professor_id: dto.professor_id,
        escola_id: escolaId, // ✅ From tenant context, not parameter
        curriculo_tipo: dto.curriculo_tipo || CurriculoTipo.BNCC, // Default BNCC
        contexto_pedagogico: dto.contexto_pedagogico as Prisma.InputJsonValue | undefined,
      },
    });

    return turma;
  }

  /**
   * Atualiza uma turma existente com validação de compatibilidade
   *
   * @param id - ID da turma
   * @param dto - Dados a serem atualizados
   * @returns Turma atualizada (com warnings se aplicável)
   */
  async update(id: string, dto: UpdateTurmaDto) {
    // ✅ CRITICAL: Get escolaId from tenant context (TenantInterceptor)
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Buscar turma atual para validações (incluir objetivos_customizados para warning)
    const turmaAtual = await this.prisma.turma.findUnique({
      where: { id, escola_id: escolaId }, // ✅ Tenant isolation
      include: {
        objetivos_customizados: {
          select: { id: true },
        },
      },
    });

    if (!turmaAtual) {
      throw new NotFoundException(`Turma ${id} não encontrada ou acesso negado`);
    }

    // Se dto altera serie OU tipo_ensino, validar compatibilidade
    if (dto.serie || dto.tipo_ensino) {
      const serie = dto.serie ?? turmaAtual.serie;
      const tipo_ensino = dto.tipo_ensino ?? turmaAtual.tipo_ensino;

      this.validateSerieCompatibility(serie, tipo_ensino);
    }

    // Story 11.2: Validar contexto pedagógico se curriculo_tipo for alterado
    if (dto.curriculo_tipo) {
      this.validateContextoPedagogico(dto.curriculo_tipo, dto.contexto_pedagogico);
    }

    // ✅ NEW: Validar unicidade se nome, ano_letivo ou turno forem alterados
    if (dto.nome || dto.ano_letivo || dto.turno) {
      const nome = dto.nome ?? turmaAtual.nome;
      const ano_letivo = dto.ano_letivo ?? turmaAtual.ano_letivo;
      const turno = dto.turno ?? turmaAtual.turno;

      const existing = await this.prisma.turma.findFirst({
        where: {
          escola_id: escolaId,
          nome,
          ano_letivo,
          turno,
          deleted_at: null,
          id: { not: id }, // ✅ Excluir própria turma da validação
        },
      });

      if (existing) {
        throw new ConflictException(
          `Turma com nome '${nome}' já existe para ${ano_letivo} no turno ${turno}`,
        );
      }
    }

    // Story 11.2: Check for CUSTOM → BNCC transition with custom objectives
    const warnings: string[] = [];
    if (
      dto.curriculo_tipo === CurriculoTipo.BNCC &&
      turmaAtual.curriculo_tipo === CurriculoTipo.CUSTOM &&
      turmaAtual.objetivos_customizados.length > 0
    ) {
      warnings.push(
        `Turma possui ${turmaAtual.objetivos_customizados.length} objetivos customizados que serão ignorados ao usar currículo BNCC`,
      );
    }

    // Build update data with proper type casting for JSON fields
    const { contexto_pedagogico, ...restDto } = dto;
    const updateData: Prisma.TurmaUpdateInput = {
      ...restDto,
      ...(contexto_pedagogico !== undefined && {
        contexto_pedagogico: contexto_pedagogico as unknown as Prisma.InputJsonValue,
      }),
    };

    const turmaAtualizada = await this.prisma.turma.update({
      where: { id, escola_id: escolaId }, // ✅ Tenant isolation
      data: updateData,
    });

    // Return with warnings if applicable
    if (warnings.length > 0) {
      return {
        ...turmaAtualizada,
        warnings,
      };
    }

    return turmaAtualizada;
  }

  /**
   * Busca uma turma por ID com isolamento de tenant
   *
   * @param id - ID da turma
   * @returns Turma encontrada
   * @throws NotFoundException se não encontrada ou acesso negado
   */
  async findOne(id: string) {
    // ✅ CRITICAL: Get escolaId from tenant context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    const turma = await this.prisma.turma.findFirst({
      where: {
        id,
        escola_id: escolaId, // ✅ Tenant isolation
        deleted_at: null, // ✅ Exclude soft-deleted
      },
      select: {
        id: true,
        nome: true,
        disciplina: true,
        serie: true,
        tipo_ensino: true,
        ano_letivo: true,
        turno: true,
        professor_id: true,
        curriculo_tipo: true, // Story 11.2
        contexto_pedagogico: true, // Story 11.2
        created_at: true,
        updated_at: true,
      },
    });

    if (!turma) {
      throw new NotFoundException(`Turma ${id} não encontrada ou acesso negado`);
    }

    return turma;
  }

  /**
   * Busca todas as turmas do professor com isolamento de tenant (escola_id)
   *
   * CRITICAL: Sempre inclui escola_id no WHERE para evitar vazamento de dados entre tenants
   *
   * @param professorId - ID do professor autenticado
   * @returns Lista de turmas do professor
   */
  async findAllByProfessor(professorId: string) {
    // ✅ CRITICAL: Get escolaId from tenant context (TenantInterceptor)
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // ✅ CRITICAL: Always include escola_id in WHERE clause for multi-tenancy
    return this.prisma.turma.findMany({
      where: {
        escola_id: escolaId, // ✅ Tenant isolation
        professor_id: professorId, // ✅ Professor-specific data
        deleted_at: null, // ✅ Exclude soft-deleted
      },
      select: {
        id: true,
        nome: true,
        disciplina: true,
        serie: true,
        tipo_ensino: true,
        ano_letivo: true,
        turno: true,
        curriculo_tipo: true, // Story 11.2
        contexto_pedagogico: true, // Story 11.2
      },
      orderBy: [{ ano_letivo: 'desc' }, { nome: 'asc' }],
    });
  }

  /**
   * Busca todas as turmas da escola (para Coordenador/Diretor)
   *
   * @returns Lista de todas turmas da escola
   */
  async findAllByEscola() {
    // ✅ CRITICAL: Get escolaId from tenant context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.turma.findMany({
      where: {
        escola_id: escolaId, // ✅ Tenant isolation
        deleted_at: null, // ✅ Exclude soft-deleted
      },
      select: {
        id: true,
        nome: true,
        disciplina: true,
        serie: true,
        tipo_ensino: true,
        ano_letivo: true,
        turno: true,
        curriculo_tipo: true, // Story 11.2
        contexto_pedagogico: true, // Story 11.2
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: [{ ano_letivo: 'desc' }, { nome: 'asc' }],
    });
  }

  /**
   * Lista professores da escola (para select no formulário de turma)
   *
   * @returns Lista de professores com id, nome, email
   */
  async listProfessores() {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.prisma.usuario.findMany({
      where: {
        escola_id: escolaId,
        perfil_usuario: {
          is: {
            role: 'PROFESSOR',
          },
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Remove turma (soft delete para LGPD compliance)
   *
   * @param id - ID da turma
   * @returns Turma removida (soft deleted)
   */
  async remove(id: string) {
    // ✅ CRITICAL: Get escolaId from tenant context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Verificar se turma existe e pertence ao tenant
    const turma = await this.prisma.turma.findUnique({
      where: { id, escola_id: escolaId },
    });

    if (!turma) {
      throw new NotFoundException(`Turma ${id} não encontrada ou acesso negado`);
    }

    // Soft delete: apenas seta deleted_at (preserva planejamentos e aulas)
    return this.prisma.turma.update({
      where: { id, escola_id: escolaId }, // ✅ Tenant isolation
      data: { deleted_at: new Date() },
    });
  }
}
