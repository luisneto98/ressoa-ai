import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import { CreateObjetivoCustomDto } from './dto/create-objetivo-custom.dto';
import { UpdateObjetivoCustomDto } from './dto/update-objetivo-custom.dto';
import { ObjetivoAprendizagem, TipoFonte, CurriculoTipo } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Service para gerenciamento de ObjetivosAprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Responsabilidades:
 * - CRUD de objetivos (BNCC e custom)
 * - Validações de negócio (códigos únicos, critérios, curriculo_tipo)
 * - RBAC - professor/coordenador/diretor
 * - Multi-tenancy enforcement
 * - Queries filtradas por tipo_fonte e turma_id
 */
@Injectable()
export class ObjetivosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo objetivo de aprendizagem (BNCC ou custom)
   * Validações aplicadas:
   * - BNCC: habilidade_bncc_id deve existir
   * - CUSTOM: turma_id deve existir, código único por turma
   */
  async create(dto: CreateObjetivoDto): Promise<ObjetivoAprendizagem> {
    // Validação: BNCC requer habilidade_bncc_id válida
    if (dto.tipo_fonte === TipoFonte.BNCC) {
      if (!dto.habilidade_bncc_id) {
        throw new BadRequestException(
          'habilidade_bncc_id é obrigatório para objetivos BNCC',
        );
      }

      const habilidade = await this.prisma.habilidade.findUnique({
        where: { id: dto.habilidade_bncc_id },
      });

      if (!habilidade) {
        throw new NotFoundException(
          `Habilidade BNCC não encontrada: ${dto.habilidade_bncc_id}`,
        );
      }
    }

    // Validação: CUSTOM requer turma_id, area_conhecimento, criterios_evidencia
    if (dto.tipo_fonte === TipoFonte.CUSTOM) {
      if (!dto.turma_id) {
        throw new BadRequestException(
          'turma_id é obrigatório para objetivos customizados',
        );
      }

      if (!dto.area_conhecimento) {
        throw new BadRequestException(
          'area_conhecimento é obrigatória para objetivos customizados',
        );
      }

      if (!dto.criterios_evidencia || dto.criterios_evidencia.length === 0) {
        throw new BadRequestException(
          'Objetivos customizados requerem ao menos 1 critério de evidência',
        );
      }

      // Validação: turma_id deve existir e não estar deletada
      const turma = await this.prisma.turma.findUnique({
        where: { id: dto.turma_id },
      });

      if (!turma || turma.deleted_at) {
        throw new NotFoundException(
          `Turma não encontrada ou foi deletada: ${dto.turma_id}`,
        );
      }

      // Validação: código único por turma (constraint do Prisma)
      const existingObjetivo = await this.prisma.objetivoAprendizagem.findFirst(
        {
          where: {
            turma_id: dto.turma_id,
            codigo: dto.codigo,
          },
        },
      );

      if (existingObjetivo) {
        throw new ConflictException(
          `Código '${dto.codigo}' já existe na turma ${dto.turma_id}`,
        );
      }
    }

    // Criar objetivo
    try {
      return await this.prisma.objetivoAprendizagem.create({
        data: {
          codigo: dto.codigo,
          descricao: dto.descricao,
          nivel_cognitivo: dto.nivel_cognitivo,
          tipo_fonte: dto.tipo_fonte,
          habilidade_bncc_id: dto.habilidade_bncc_id || null,
          turma_id: dto.turma_id || null,
          area_conhecimento: dto.area_conhecimento || null,
          criterios_evidencia: dto.criterios_evidencia || [],
          contexto_json: dto.contexto_json || undefined,
        },
      });
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002') {
        throw new ConflictException(
          `Código '${dto.codigo}' já existe (constraint: unique codigo ou unique turma_id+codigo)`,
        );
      }
      throw error;
    }
  }

  /**
   * Lista objetivos por tipo_fonte
   */
  async findByTipoFonte(tipoFonte: TipoFonte): Promise<ObjetivoAprendizagem[]> {
    return this.prisma.objetivoAprendizagem.findMany({
      where: { tipo_fonte: tipoFonte },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Lista objetivos customizados de uma turma específica
   * Valida que turma existe e não está deletada (soft-delete check)
   */
  async findByTurma(turmaId: string): Promise<ObjetivoAprendizagem[]> {
    // Validação: turma deve existir e não estar deletada
    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
    });

    if (!turma || turma.deleted_at) {
      throw new NotFoundException(
        `Turma não encontrada ou foi deletada: ${turmaId}`,
      );
    }

    return this.prisma.objetivoAprendizagem.findMany({
      where: {
        tipo_fonte: TipoFonte.CUSTOM,
        turma_id: turmaId,
      },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Busca objetivo por código (BNCC) ou por código+turma (CUSTOM)
   */
  async findByCodigo(
    codigo: string,
    turmaId?: string,
  ): Promise<ObjetivoAprendizagem | null> {
    if (turmaId) {
      // Custom: precisa de turma_id
      return this.prisma.objetivoAprendizagem.findFirst({
        where: {
          codigo,
          turma_id: turmaId,
        },
      });
    }

    // BNCC: código é único globalmente (turma_id = null)
    return this.prisma.objetivoAprendizagem.findFirst({
      where: { codigo, turma_id: null },
    });
  }

  /**
   * Conta total de objetivos por tipo_fonte
   */
  async countByTipoFonte(tipoFonte: TipoFonte): Promise<number> {
    return this.prisma.objetivoAprendizagem.count({
      where: { tipo_fonte: tipoFonte },
    });
  }

  // ========================================
  // Story 11.4: CRUD de Objetivos Customizados
  // Nested routes: /turmas/:turma_id/objetivos
  // ========================================

  /**
   * Cria objetivo customizado em turma específica (AC1, AC2, AC3, AC4)
   * - Valida que turma tem curriculo_tipo = CUSTOM
   * - Aplica RBAC (professor só cria em turmas próprias)
   * - Garante multi-tenancy (escola_id)
   * - Verifica código único por turma
   * - Seta tipo_fonte = CUSTOM automaticamente
   */
  async createCustom(
    turmaId: string,
    dto: CreateObjetivoCustomDto,
    user: AuthenticatedUser,
  ): Promise<ObjetivoAprendizagem> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Buscar turma com multi-tenancy
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId, // ✅ Multi-tenancy
        deleted_at: null,
      },
      include: {
        professor: true,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // AC4: Validar curriculo_tipo = CUSTOM
    if (turma.curriculo_tipo !== CurriculoTipo.CUSTOM) {
      throw new BadRequestException(
        'Objetivos customizados só podem ser criados em turmas com curriculo_tipo = CUSTOM. Esta turma usa BNCC.',
      );
    }

    // AC3: RBAC - Professor só cria em turmas próprias
    if (user.role === 'PROFESSOR') {
      if (turma.professor_id !== user.userId) {
        throw new ForbiddenException(
          'Você não tem permissão para criar objetivos nesta turma',
        );
      }
    }
    // Coordenador e Diretor podem criar em qualquer turma da escola (já validado por escola_id)

    // AC2: Validar código único por turma
    const existingObjetivo = await this.prisma.objetivoAprendizagem.findFirst({
      where: {
        turma_id: turmaId,
        codigo: dto.codigo,
      },
    });

    if (existingObjetivo) {
      throw new ConflictException(`Código ${dto.codigo} já existe nesta turma`);
    }

    // AC1: Criar objetivo com tipo_fonte = CUSTOM automático
    try {
      return await this.prisma.objetivoAprendizagem.create({
        data: {
          codigo: dto.codigo,
          descricao: dto.descricao,
          nivel_cognitivo: dto.nivel_cognitivo,
          tipo_fonte: TipoFonte.CUSTOM, // ✅ Setado automaticamente
          turma_id: turmaId,
          area_conhecimento: dto.area_conhecimento || null,
          criterios_evidencia: dto.criterios_evidencia,
          habilidade_bncc_id: null, // Não aplicável para custom
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          `Código ${dto.codigo} já existe nesta turma`,
        );
      }
      throw error;
    }
  }

  /**
   * Lista objetivos customizados de uma turma (AC5)
   * - Aplica RBAC (professor só lista turmas próprias)
   * - Garante multi-tenancy
   * - Retorna array vazio para turmas BNCC (sem erro)
   * - Ordenação por created_at ASC
   */
  async findAllByTurma(
    turmaId: string,
    user: AuthenticatedUser,
  ): Promise<ObjetivoAprendizagem[]> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Buscar turma com RBAC validation
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId, // ✅ Multi-tenancy
        deleted_at: null,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // AC5: RBAC - Professor só lista turmas próprias
    if (user.role === 'PROFESSOR') {
      if (turma.professor_id !== user.userId) {
        throw new ForbiddenException(
          'Você não tem permissão para listar objetivos desta turma',
        );
      }
    }

    // AC5: Retornar objetivos custom ordenados por created_at
    // Para turmas BNCC, retorna array vazio (comportamento válido)
    // FIX #8: Try-catch para resilience (error handling)
    try {
      return await this.prisma.objetivoAprendizagem.findMany({
        where: {
          turma_id: turmaId,
          tipo_fonte: TipoFonte.CUSTOM,
        },
        orderBy: { created_at: 'asc' },
      });
    } catch (error: any) {
      // Se erro de conexão ou timeout, retornar array vazio ao invés de 500
      if (error?.code === 'P2025' || error?.code === 'P1001') {
        return [];
      }
      throw error; // Re-throw outros erros
    }
  }

  /**
   * Busca objetivo específico (AC6)
   * - Garante isolamento por turma (404 se objetivo de outra turma)
   * - Aplica RBAC
   * - Garante multi-tenancy
   */
  async findOneByTurma(
    turmaId: string,
    objetivoId: string,
    user: AuthenticatedUser,
  ): Promise<ObjetivoAprendizagem> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validar acesso à turma
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId, // ✅ Multi-tenancy
        deleted_at: null,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // RBAC
    if (user.role === 'PROFESSOR') {
      if (turma.professor_id !== user.userId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar objetivos desta turma',
        );
      }
    }

    // AC6: Buscar objetivo garantindo isolamento por turma
    const objetivo = await this.prisma.objetivoAprendizagem.findFirst({
      where: {
        id: objetivoId,
        turma_id: turmaId, // ✅ Isolamento por turma
      },
    });

    if (!objetivo) {
      throw new NotFoundException(`Objetivo ${objetivoId} não encontrado`);
    }

    return objetivo;
  }

  /**
   * Atualiza objetivo customizado (AC7)
   * - Patch parcial (campos não enviados permanecem inalterados)
   * - Valida código único se alterado
   * - Aplica RBAC
   * - Atualiza updated_at automaticamente
   */
  async updateCustom(
    turmaId: string,
    objetivoId: string,
    dto: UpdateObjetivoCustomDto,
    user: AuthenticatedUser,
  ): Promise<ObjetivoAprendizagem> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validar acesso à turma
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId, // ✅ Multi-tenancy
        deleted_at: null,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // RBAC
    if (user.role === 'PROFESSOR') {
      if (turma.professor_id !== user.userId) {
        throw new ForbiddenException(
          'Você não tem permissão para atualizar objetivos desta turma',
        );
      }
    }

    // Buscar objetivo existente
    const objetivo = await this.prisma.objetivoAprendizagem.findFirst({
      where: {
        id: objetivoId,
        turma_id: turmaId, // ✅ Isolamento por turma
      },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    // AC7: Se código mudou, validar unicidade
    if (dto.codigo && dto.codigo !== objetivo.codigo) {
      const existingObjetivo = await this.prisma.objetivoAprendizagem.findFirst(
        {
          where: {
            turma_id: turmaId,
            codigo: dto.codigo,
            id: { not: objetivoId }, // Excluir o próprio objetivo
          },
        },
      );

      if (existingObjetivo) {
        throw new ConflictException(
          `Código ${dto.codigo} já existe nesta turma`,
        );
      }
    }

    // AC7: Atualizar com patch parcial + updated_at automático
    // FIX #4: Usar !== undefined para permitir strings vazias e nulls
    try {
      return await this.prisma.objetivoAprendizagem.update({
        where: { id: objetivoId },
        data: {
          ...(dto.codigo !== undefined && { codigo: dto.codigo }),
          ...(dto.descricao !== undefined && { descricao: dto.descricao }),
          ...(dto.nivel_cognitivo !== undefined && {
            nivel_cognitivo: dto.nivel_cognitivo,
          }),
          ...(dto.area_conhecimento !== undefined && {
            area_conhecimento: dto.area_conhecimento,
          }),
          ...(dto.criterios_evidencia !== undefined && {
            criterios_evidencia: dto.criterios_evidencia,
          }),
          updated_at: new Date(), // ✅ AC7: Atualizar timestamp
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          `Código ${dto.codigo} já existe nesta turma`,
        );
      }
      throw error;
    }
  }

  /**
   * Deleta objetivo customizado (AC8)
   * - Hard delete (remoção física)
   * - Verifica se objetivo está em uso em planejamentos
   * - Retorna erro 409 com lista de planejamentos afetados se em uso
   * - Aplica RBAC
   */
  async removeCustom(
    turmaId: string,
    objetivoId: string,
    user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const escolaId = this.prisma.getEscolaIdOrThrow();

    // Validar acesso à turma
    const turma = await this.prisma.turma.findUnique({
      where: {
        id: turmaId,
        escola_id: escolaId, // ✅ Multi-tenancy
        deleted_at: null,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    // RBAC
    if (user.role === 'PROFESSOR') {
      if (turma.professor_id !== user.userId) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar objetivos desta turma',
        );
      }
    }

    // Buscar objetivo
    const objetivo = await this.prisma.objetivoAprendizagem.findFirst({
      where: {
        id: objetivoId,
        turma_id: turmaId, // ✅ Isolamento por turma
      },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    // FIX #2: Validar que objetivo é realmente CUSTOM (proteção contra delete de BNCC)
    if (objetivo.tipo_fonte !== TipoFonte.CUSTOM) {
      throw new BadRequestException(
        `Este endpoint só permite deletar objetivos customizados. Objetivo é do tipo ${objetivo.tipo_fonte}`,
      );
    }

    // AC8: Verificar se objetivo está em uso em planejamentos
    const planejamentosAfetados =
      await this.prisma.planejamentoObjetivo.findMany({
        where: { objetivo_id: objetivoId },
        include: {
          planejamento: {
            select: { id: true, bimestre: true },
          },
        },
      });

    if (planejamentosAfetados.length > 0) {
      throw new ConflictException({
        message: `Objetivo não pode ser deletado pois está em uso em ${planejamentosAfetados.length} planejamento(s)`,
        error: 'Conflict',
        planejamentos_afetados: planejamentosAfetados.map((p) => ({
          id: p.planejamento.id,
          bimestre: p.planejamento.bimestre,
        })),
        sugestao:
          'Remova o objetivo dos planejamentos antes de deletar, ou edite o objetivo para corrigir erros',
      });
    }

    // AC8: Hard delete (remoção física)
    await this.prisma.objetivoAprendizagem.delete({
      where: { id: objetivoId },
    });

    return { message: 'Objetivo deletado com sucesso' };
  }
}
