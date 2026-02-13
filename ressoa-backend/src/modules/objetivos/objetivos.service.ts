import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import { ObjetivoAprendizagem, TipoFonte } from '@prisma/client';

/**
 * Service para gerenciamento de ObjetivosAprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 *
 * Responsabilidades:
 * - CRUD de objetivos (BNCC e custom)
 * - Validações de negócio (códigos únicos, critérios, etc)
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
        throw new BadRequestException('turma_id é obrigatório para objetivos customizados');
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
        throw new NotFoundException(`Turma não encontrada ou foi deletada: ${dto.turma_id}`);
      }

      // Validação: código único por turma (constraint do Prisma)
      const existingObjetivo = await this.prisma.objetivoAprendizagem.findFirst({
        where: {
          turma_id: dto.turma_id,
          codigo: dto.codigo,
        },
      });

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
      throw new NotFoundException(`Turma não encontrada ou foi deletada: ${turmaId}`);
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

    // BNCC: código é único globalmente
    return this.prisma.objetivoAprendizagem.findUnique({
      where: { codigo },
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
}
