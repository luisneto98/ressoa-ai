import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanejamentoDto, UpdatePlanejamentoDto } from './dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PlanejamentoService {
  // RN-PLAN-03: Estimativa de aulas por bimestre baseada em carga horária por disciplina
  // Matemática: 4 aulas/semana × 10 semanas = 40
  // Língua Portuguesa: 5 aulas/semana × 10 semanas = 50
  // Ciências: 3 aulas/semana × 10 semanas = 30
  private readonly AULAS_POR_BIMESTRE_MAP: Record<string, number> = {
    MATEMATICA: 40,
    LINGUA_PORTUGUESA: 50,
    CIENCIAS: 30,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida compatibilidade de habilidades com turma (série e disciplina)
   * @param habilidades Habilidades a validar
   * @param turma Turma de referência
   * @throws BadRequestException se habilidades incompatíveis
   */
  private validateHabilidadesCompatibilidade(
    habilidades: Array<{
      id: string;
      disciplina: string;
      ano_inicio: number;
      ano_fim: number | null;
    }>,
    turma: { serie: string; disciplina: string },
  ): void {
    const serieMap: Record<string, number> = {
      SEXTO_ANO: 6,
      SETIMO_ANO: 7,
      OITAVO_ANO: 8,
      NONO_ANO: 9,
      PRIMEIRO_ANO_EM: 1,
      SEGUNDO_ANO_EM: 2,
      TERCEIRO_ANO_EM: 3,
    };
    const serieNumero = serieMap[turma.serie];

    const habilidadesIncompativeis = habilidades.filter((hab) => {
      if (hab.disciplina !== turma.disciplina) {
        return true;
      }
      const anoFim = hab.ano_fim ?? hab.ano_inicio;
      if (serieNumero < hab.ano_inicio || serieNumero > anoFim) {
        return true;
      }
      return false;
    });

    if (habilidadesIncompativeis.length > 0) {
      throw new BadRequestException(
        'Uma ou mais habilidades não são compatíveis com a disciplina ou série da turma',
      );
    }
  }

  /**
   * Cria um novo planejamento bimestral
   * @param dto Dados do planejamento (Story 11.3: suporta habilidades OU objetivos)
   * @param user Usuário autenticado (professor)
   * @returns Planejamento criado com habilidades e/ou objetivos
   */
  async create(dto: CreatePlanejamentoDto, user: AuthenticatedUser) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Story 11.3: Validar que pelo menos um campo está presente
    if (!dto.habilidades && !dto.objetivos) {
      throw new BadRequestException(
        'Planejamento deve ter habilidade_ids (BNCC) ou objetivos (customizados/BNCC)',
      );
    }

    // 1️⃣ Validar que turma existe e pertence ao professor E à escola
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: dto.turma_id,
        escola_id: escolaId, // ✅ Tenant isolation
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // 2️⃣ Validar ownership: turma pertence ao professor
    if (turma.professor_id !== user.userId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar planejamento nesta turma',
      );
    }

    // Story 11.3 FIX: Validar contexto_pedagogico obrigatório se turma CUSTOM
    if (turma.curriculo_tipo === 'CUSTOM' && !turma.contexto_pedagogico) {
      throw new BadRequestException(
        'Turma com currículo customizado requer contexto_pedagogico (Story 11.2)',
      );
    }

    // 3️⃣ Validar habilidades (legado - backward compatibility)
    let habilidadesComPrevisao: Array<{
      habilidade_id: string;
      peso: number;
      aulas_previstas: number;
    }> = [];

    if (dto.habilidades && dto.habilidades.length > 0) {
      const habilidadeIds = dto.habilidades.map((h) => h.habilidade_id);
      const habilidadesExistentes = await this.prisma.habilidade.findMany({
        where: { id: { in: habilidadeIds } },
        select: { id: true, disciplina: true, ano_inicio: true, ano_fim: true },
      });

      if (habilidadesExistentes.length !== habilidadeIds.length) {
        throw new BadRequestException(
          'Uma ou mais habilidades não existem no sistema',
        );
      }

      // Validar compatibilidade com disciplina e série da turma
      this.validateHabilidadesCompatibilidade(habilidadesExistentes, turma);

      // Aplicar regras de negócio (peso e aulas previstas)
      const totalHabilidades = dto.habilidades.length;
      const pesoDefault = 1.0 / totalHabilidades;
      const aulasPorBimestre =
        this.AULAS_POR_BIMESTRE_MAP[turma.disciplina] || 40;
      const aulasEstimadas = Math.ceil(aulasPorBimestre / totalHabilidades);

      habilidadesComPrevisao = dto.habilidades.map((h) => ({
        habilidade_id: h.habilidade_id,
        peso: h.peso ?? pesoDefault,
        aulas_previstas: h.aulas_previstas ?? aulasEstimadas,
      }));
    }

    // Story 11.3: Processar objetivos (novo campo)
    let objetivosProcessados: Array<{
      objetivo_id: string;
      peso: number;
      aulas_previstas?: number;
    }> = [];

    if (dto.objetivos && dto.objetivos.length > 0) {
      const objetivoIds = dto.objetivos.map((o) => o.objetivo_id);
      const objetivosExistentes = await this.prisma.objetivoAprendizagem.findMany({
        where: { id: { in: objetivoIds } },
        select: { id: true },
      });

      if (objetivosExistentes.length !== objetivoIds.length) {
        throw new BadRequestException(
          'Um ou mais objetivos não existem no sistema',
        );
      }

      objetivosProcessados = dto.objetivos.map((o) => ({
        objetivo_id: o.objetivo_id,
        peso: o.peso ?? 1.0,
        aulas_previstas: o.aulas_previstas,
      }));
    }

    // 7️⃣ Criar planejamento com relacionamentos (transação atômica)
    try {
      const planejamento = await this.prisma.$transaction(async (tx) => {
        // Criar planejamento base
        const plan = await tx.planejamento.create({
          data: {
            turma_id: dto.turma_id,
            bimestre: dto.bimestre,
            ano_letivo: dto.ano_letivo,
            escola_id: escolaId,
            professor_id: user.userId,
            validado_coordenacao: false,
          },
        });

        // Criar relações com habilidades (legado - se fornecido)
        if (habilidadesComPrevisao.length > 0) {
          await tx.planejamentoHabilidade.createMany({
            data: habilidadesComPrevisao.map((h) => ({
              planejamento_id: plan.id,
              habilidade_id: h.habilidade_id,
              peso: h.peso,
              aulas_previstas: h.aulas_previstas,
            })),
          });
        }

        // Story 11.3: Criar relações com objetivos (novo)
        if (objetivosProcessados.length > 0) {
          await tx.planejamentoObjetivo.createMany({
            data: objetivosProcessados.map((o) => ({
              planejamento_id: plan.id,
              objetivo_id: o.objetivo_id,
              peso: o.peso,
              aulas_previstas: o.aulas_previstas,
            })),
          });
        }

        return plan;
      });

      // Retornar planejamento completo com relações
      return this.findOne(planejamento.id, user);
    } catch (error: any) {
      // RN-PLAN-04: Capturar erro de unique constraint (duplicata)
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Já existe planejamento para esta turma neste bimestre',
        );
      }
      throw error;
    }
  }

  /**
   * Lista planejamentos com filtros e RBAC
   * @param query Filtros opcionais
   * @param user Usuário autenticado
   * @returns Array de planejamentos (Story 11.3: inclui _count de objetivos)
   */
  async findAll(
    query: {
      turma_id?: string;
      bimestre?: number;
      ano_letivo?: number;
      validado?: boolean;
    },
    user: AuthenticatedUser,
  ) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // RBAC: Professor vê apenas seus planejamentos, Coordenador/Diretor vê todos da escola
    const professorFilter =
      user.role === 'PROFESSOR' ? { professor_id: user.userId } : {};

    const planejamentos = await this.prisma.planejamento.findMany({
      where: {
        escola_id: escolaId, // ✅ OBRIGATÓRIO!
        deleted_at: null, // ✅ Excluir soft-deleted (Issue #9)
        ...professorFilter,
        turma_id: query.turma_id,
        bimestre: query.bimestre,
        ano_letivo: query.ano_letivo,
        validado_coordenacao: query.validado,
      },
      include: {
        turma: {
          include: {
            professor: { select: { id: true, nome: true } },
          },
        },
        habilidades: {
          include: {
            habilidade: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                disciplina: true,
                ano_inicio: true,
                ano_fim: true,
                unidade_tematica: true,
                objeto_conhecimento: true,
                // searchable: Excluded - tsvector not supported
              },
            },
          },
        },
        // Story 11.3: Include count of objetivos for summary views
        _count: {
          select: {
            habilidades: true,
            objetivos: true,
          },
        },
      },
      orderBy: [
        { ano_letivo: 'desc' },
        { bimestre: 'desc' },
        { turma: { nome: 'asc' } },
      ],
    });

    return planejamentos;
  }

  /**
   * Busca planejamento por ID com validações de acesso
   * @param id ID do planejamento
   * @param user Usuário autenticado
   * @returns Planejamento completo (Story 11.3: inclui objetivos)
   */
  async findOne(id: string, user: AuthenticatedUser) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    const planejamento = await this.prisma.planejamento.findFirst({
      where: {
        id,
        escola_id: escolaId, // ✅ Tenant isolation
        deleted_at: null, // ✅ Excluir soft-deleted (Issue #9)
      },
      include: {
        turma: true,
        habilidades: {
          include: {
            habilidade: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                disciplina: true,
                ano_inicio: true,
                ano_fim: true,
                unidade_tematica: true,
                objeto_conhecimento: true,
              },
            },
          },
        },
        // Story 11.3: Include objetivos (dual format for backward compatibility)
        objetivos: {
          include: {
            objetivo: true,
          },
        },
        professor: {
          include: {
            perfil_usuario: true,
          },
        },
      },
    });

    if (!planejamento) {
      throw new NotFoundException('Planejamento não encontrado');
    }

    // RBAC: Professor só pode ver seus próprios
    if (
      user.role === 'PROFESSOR' &&
      planejamento.professor_id !== user.userId
    ) {
      throw new NotFoundException('Planejamento não encontrado');
    }

    return planejamento;
  }

  /**
   * Atualiza planejamento existente
   * @param id ID do planejamento
   * @param dto Dados para atualizar (partial)
   * @param user Usuário autenticado (professor)
   * @returns Planejamento atualizado
   */
  async update(
    id: string,
    dto: UpdatePlanejamentoDto,
    user: AuthenticatedUser,
  ) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // 1️⃣ Buscar planejamento COM escola_id (apenas não deletados)
    const planejamento = await this.prisma.planejamento.findFirst({
      where: {
        id,
        escola_id: escolaId, // ✅ Tenant isolation
        deleted_at: null, // ✅ Excluir soft-deleted (Issue #9)
      },
    });

    if (!planejamento) {
      throw new NotFoundException('Planejamento não encontrado');
    }

    // 2️⃣ Validar ownership (professor)
    if (planejamento.professor_id !== user.userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este planejamento',
      );
    }

    // 3️⃣ Se habilidades no body, substituir todas relações
    if (dto.habilidades) {
      // Validar que habilidades existem (Issue #2)
      const habilidadeIds = dto.habilidades.map((h) => h.habilidade_id);
      const habilidadesExistentes = await this.prisma.habilidade.findMany({
        where: { id: { in: habilidadeIds } },
        select: { id: true, disciplina: true, ano_inicio: true, ano_fim: true },
      });

      if (habilidadesExistentes.length !== habilidadeIds.length) {
        throw new BadRequestException(
          'Uma ou mais habilidades não existem no sistema',
        );
      }

      // Validar compatibilidade com turma (Issue #6)
      const turmaCompleta = await this.prisma.turma.findUnique({
        where: { id: planejamento.turma_id, escola_id: escolaId },
        select: { disciplina: true, serie: true },
      });

      if (turmaCompleta) {
        this.validateHabilidadesCompatibilidade(habilidadesExistentes, turmaCompleta);
      }

      // Aplicar regras de negócio
      const totalHabilidades = dto.habilidades.length;
      const pesoDefault = 1.0 / totalHabilidades;
      const aulasPorBimestre =
        this.AULAS_POR_BIMESTRE_MAP[
          turmaCompleta?.disciplina || 'MATEMATICA'
        ] || 40;
      const aulasEstimadas = Math.ceil(aulasPorBimestre / totalHabilidades);

      const habilidadesProcessadas = dto.habilidades.map((h) => ({
        habilidade_id: h.habilidade_id,
        peso: h.peso ?? pesoDefault,
        aulas_previstas: h.aulas_previstas ?? aulasEstimadas,
      }));

      // Transação: deletar antigas + criar novas
      await this.prisma.$transaction([
        this.prisma.planejamentoHabilidade.deleteMany({
          where: { planejamento_id: id },
        }),
        this.prisma.planejamentoHabilidade.createMany({
          data: habilidadesProcessadas.map((h) => ({
            planejamento_id: id,
            ...h,
          })),
        }),
      ]);
    }

    // 4️⃣ Atualizar planejamento
    const updated = await this.prisma.planejamento.update({
      where: { id, escola_id: escolaId }, // ✅ escola_id no update também!
      data: {
        bimestre: dto.bimestre,
        ano_letivo: dto.ano_letivo,
        turma_id: dto.turma_id,
      },
      include: {
        turma: true,
        habilidades: {
          include: {
            habilidade: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                disciplina: true,
                ano_inicio: true,
                ano_fim: true,
                unidade_tematica: true,
                objeto_conhecimento: true,
                // searchable: Excluded - tsvector not supported
              },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove planejamento (soft delete)
   * @param id ID do planejamento
   * @param user Usuário autenticado (professor)
   */
  async remove(id: string, user: AuthenticatedUser) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // 1️⃣ Buscar planejamento COM escola_id (apenas não deletados)
    const planejamento = await this.prisma.planejamento.findFirst({
      where: {
        id,
        escola_id: escolaId, // ✅ Tenant isolation
        deleted_at: null, // ✅ Excluir soft-deleted (Issue #9)
      },
    });

    if (!planejamento) {
      throw new NotFoundException('Planejamento não encontrado');
    }

    // 2️⃣ Validar ownership (professor)
    if (planejamento.professor_id !== user.userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este planejamento',
      );
    }

    // 3️⃣ Verificar se há aulas vinculadas (proteção de integridade)
    // TODO: Quando model Aula existir, adicionar verificação:
    // const aulas = await this.prisma.aula.count({
    //   where: { planejamento_id: id, deleted_at: null }
    // });
    // if (aulas > 0) {
    //   throw new BadRequestException('Não é possível excluir planejamento com aulas vinculadas');
    // }

    // 4️⃣ Soft delete (LGPD compliance - Issue #9 fixed)
    await this.prisma.planejamento.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return; // 204 No Content
  }
}
