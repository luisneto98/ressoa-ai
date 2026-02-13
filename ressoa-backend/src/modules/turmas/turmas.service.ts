import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Serie, TipoEnsino } from '@prisma/client';
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
        ...dto,
        escola_id: escolaId, // ✅ From tenant context, not parameter
      },
    });

    return turma;
  }

  /**
   * Atualiza uma turma existente com validação de compatibilidade
   *
   * @param id - ID da turma
   * @param dto - Dados a serem atualizados
   * @returns Turma atualizada
   */
  async update(id: string, dto: UpdateTurmaDto) {
    // ✅ CRITICAL: Get escolaId from tenant context (TenantInterceptor)
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Buscar turma atual para validações
    const turmaAtual = await this.prisma.turma.findUnique({
      where: { id, escola_id: escolaId }, // ✅ Tenant isolation
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

    return this.prisma.turma.update({
      where: { id, escola_id: escolaId }, // ✅ Tenant isolation
      data: dto,
    });
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
