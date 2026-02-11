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
   * Cria um novo planejamento bimestral
   * @param dto Dados do planejamento
   * @param user Usuário autenticado (professor)
   * @returns Planejamento criado com habilidades
   */
  async create(dto: CreatePlanejamentoDto, user: AuthenticatedUser) {
    // 🔴 CRITICAL: Multi-tenancy - Get escola_id from context
    const escolaId = this.prisma.getEscolaIdOrThrow();

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

    // 3️⃣ Validar que todas habilidades existem no banco (Issue #2: habilidades validation)
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

    // 4️⃣ Validar que habilidades são compatíveis com disciplina e série da turma (Issue #6: cross-disciplina validation)
    const serieMap: Record<string, number> = {
      SEXTO_ANO: 6,
      SETIMO_ANO: 7,
      OITAVO_ANO: 8,
      NONO_ANO: 9,
    };
    const serieNumero = serieMap[turma.serie];

    const habilidadesIncompativeis = habilidadesExistentes.filter((hab) => {
      // Disciplina deve ser a mesma
      if (hab.disciplina !== turma.disciplina) {
        return true;
      }

      // Série deve estar no range da habilidade
      // ano_fim = null → habilidade específica para ano_inicio
      // ano_fim != null → bloco compartilhado (ex: EF67LP para 6º e 7º)
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

    // 5️⃣ Aplicar RN-PLAN-02: Distribuir peso igualmente se não informado
    const totalHabilidades = dto.habilidades.length;
    const pesoDefault = 1.0 / totalHabilidades;

    const habilidadesComPeso = dto.habilidades.map((h) => ({
      ...h,
      peso: h.peso ?? pesoDefault,
    }));

    // 6️⃣ Aplicar RN-PLAN-03: Estimar aulas_previstas se não informado (Issue #8: dynamic calculation)
    const aulasPorBimestre =
      this.AULAS_POR_BIMESTRE_MAP[turma.disciplina] || 40;
    const aulasEstimadas = Math.ceil(aulasPorBimestre / totalHabilidades);

    const habilidadesComPrevisao = habilidadesComPeso.map((h) => ({
      ...h,
      aulas_previstas: h.aulas_previstas ?? aulasEstimadas,
    }));

    // 7️⃣ Criar planejamento com relacionamentos (transação atômica)
    try {
      const planejamento = await this.prisma.planejamento.create({
        data: {
          turma_id: dto.turma_id,
          bimestre: dto.bimestre,
          ano_letivo: dto.ano_letivo,
          escola_id: escolaId, // ✅ Injetar escola_id do contexto
          professor_id: user.userId, // ✅ Injetar professor_id do JWT
          validado_coordenacao: false, // RN-PLAN-01: Flag inicial
          habilidades: {
            createMany: {
              data: habilidadesComPrevisao.map((h) => ({
                habilidade_id: h.habilidade_id,
                peso: h.peso,
                aulas_previstas: h.aulas_previstas,
              })),
            },
          },
        },
        include: {
          turma: true,
          habilidades: {
            include: {
              habilidade: true,
            },
          },
        },
      });

      return planejamento;
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
   * @returns Array de planejamentos
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
        turma: true,
        habilidades: {
          include: {
            habilidade: true,
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
   * @returns Planejamento completo
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
            habilidade: true,
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
        const serieMap: Record<string, number> = {
          SEXTO_ANO: 6,
          SETIMO_ANO: 7,
          OITAVO_ANO: 8,
          NONO_ANO: 9,
        };
        const serieNumero = serieMap[turmaCompleta.serie];

        const habilidadesIncompativeis = habilidadesExistentes.filter((hab) => {
          if (hab.disciplina !== turmaCompleta.disciplina) return true;
          const anoFim = hab.ano_fim ?? hab.ano_inicio;
          if (serieNumero < hab.ano_inicio || serieNumero > anoFim) return true;
          return false;
        });

        if (habilidadesIncompativeis.length > 0) {
          throw new BadRequestException(
            'Uma ou mais habilidades não são compatíveis com a disciplina ou série da turma',
          );
        }
      }

      // Aplicar regras de negócio
      const totalHabilidades = dto.habilidades.length;
      const pesoDefault = 1.0 / totalHabilidades;
      const aulasPorBimestre =
        this.AULAS_POR_BIMESTRE_MAP[turmaCompleta?.disciplina || 'MATEMATICA'] ||
        40;
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
            habilidade: true,
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
