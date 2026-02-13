import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { QueryHabilidadesDto } from './dto/query-habilidades.dto';
import { Prisma, Habilidade } from '@prisma/client';

/**
 * Habilidade without tsvector field (Prisma can't deserialize tsvector)
 */
export type HabilidadeResponse = Omit<Habilidade, 'searchable'>;

/**
 * Response format para endpoint GET /api/v1/habilidades
 */
export interface HabilidadesResponse {
  data: HabilidadeResponse[]; // Array de habilidades (type-safe, sem searchable)
  total: number; // Total de registros (sem pagination)
  limit: number; // Limit aplicado
  offset: number; // Offset aplicado
}

/**
 * Service para consulta de Habilidades BNCC
 *
 * CRITICAL: Habilidades são dados GLOBAIS (compartilhados entre todas escolas)
 * NÃO adicionar escola_id filter em nenhuma query!
 *
 * Features:
 * - Full-text search (PostgreSQL tsvector + GIN index)
 * - Filtros combinados (disciplina, serie, unidade_tematica)
 * - Blocos compartilhados LP (EF67LP, EF69LP, EF89LP)
 * - Pagination (limit/offset)
 * - Redis cache (TTL 7 dias - dados estáticos)
 */
@Injectable()
export class HabilidadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generate deterministic cache key from query params
   * Sorts keys alphabetically to avoid cache key collisions
   *
   * @param query - Query params
   * @returns Deterministic cache key string
   */
  private getCacheKey(query: QueryHabilidadesDto): string {
    // Sort keys alphabetically to ensure consistent cache key
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        const typedKey = key as keyof QueryHabilidadesDto;
        const value = query[typedKey];
        if (value !== undefined) {
          (acc as any)[typedKey] = value;
        }
        return acc;
      }, {} as Partial<QueryHabilidadesDto>);

    return `habilidades:${JSON.stringify(sortedQuery)}`;
  }

  /**
   * Find habilidades com filtros, pagination e cache Redis
   *
   * Cache Strategy:
   * - Cache key baseado em query params (determinístico - ordenado)
   * - TTL: 7 dias (604800 segundos) - dados estáticos BNCC
   * - Cache hit: ~1-2ms (Redis GET)
   * - Cache miss: ~5-10ms (PostgreSQL query + Redis SET)
   * - Fallback: Se Redis falhar, degrada graciosamente para DB direto
   *
   * @param query - Query params (disciplina, serie, search, etc.)
   * @returns HabilidadesResponse com data, total, limit, offset
   */
  async findAll(query: QueryHabilidadesDto): Promise<HabilidadesResponse> {
    // 1. Try cache first (with error handling)
    try {
      const cacheKey = this.getCacheKey(query);
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached); // Cache hit - retorna instantaneamente
      }
    } catch (error) {
      // Log error but continue to DB query (degraded mode)
      console.error(
        '[HabilidadesService] Redis cache read error (degraded mode):',
        error,
      );
    }

    // 2. Cache miss (or Redis error) - query database
    const result = await this.queryDatabase(query);

    // 3. Try to save to cache (best effort - don't fail if Redis is down)
    try {
      const cacheKey = this.getCacheKey(query);
      await this.redis.setex(cacheKey, 604800, JSON.stringify(result));
    } catch (error) {
      // Log error but don't fail request
      console.error('[HabilidadesService] Redis cache write error:', error);
    }

    return result;
  }

  /**
   * Query with full-text search using raw SQL
   *
   * Prisma doesn't support tsvector natively, so we use $queryRaw for full-text search.
   *
   * @param where - Prisma WHERE conditions (partial)
   * @param search - Search terms
   * @param limit - Pagination limit
   * @param offset - Pagination offset
   * @returns HabilidadesResponse
   */
  private async queryWithFullTextSearch(
    where: Prisma.HabilidadeWhereInput,
    search: string,
    limit: number,
    offset: number,
  ): Promise<HabilidadesResponse> {
    // Build SQL WHERE clause dynamically
    const conditions: string[] = ['ativa = true'];
    const whereParams: any[] = []; // Parameters for WHERE clause (shared by both queries)

    // Add tipo_ensino filter (Story 10.5)
    if (where.tipo_ensino) {
      whereParams.push(where.tipo_ensino);
      // ✅ CRITICAL: Match enum value directly (Prisma sends enum value as-is)
      conditions.push(`tipo_ensino = $${whereParams.length}`);
    }

    // Add disciplina filter
    if (where.disciplina) {
      whereParams.push(where.disciplina);
      conditions.push(`disciplina = $${whereParams.length}`);
    }

    // Add serie filter (blocos compartilhados)
    if (where.AND && Array.isArray(where.AND)) {
      const serieCondition = where.AND.find((cond: any) => cond.ano_inicio);
      if (serieCondition && serieCondition.ano_inicio && serieCondition.OR) {
        const anoInicio = serieCondition.ano_inicio;
        const serie =
          typeof anoInicio === 'object' && 'lte' in anoInicio
            ? anoInicio.lte
            : anoInicio;
        whereParams.push(serie);
        conditions.push(
          `(ano_inicio <= $${whereParams.length} AND (ano_fim >= $${whereParams.length} OR ano_fim IS NULL))`,
        );
      }
    }

    // Add unidade_tematica filter
    if (
      where.unidade_tematica &&
      typeof where.unidade_tematica === 'object' &&
      'contains' in where.unidade_tematica
    ) {
      whereParams.push(`%${where.unidade_tematica.contains}%`);
      conditions.push(`unidade_tematica ILIKE $${whereParams.length}`);
    }

    // Add full-text search
    // Fix Issue #3: Use plainto_tsquery (safer, auto-escapes special chars)
    whereParams.push(search);
    conditions.push(
      `searchable @@ plainto_tsquery('portuguese', $${whereParams.length})`,
    );

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query data with pagination (separate parameters for LIMIT/OFFSET)
    const dataParams = [...whereParams, limit, offset];
    const dataQuery = `
      SELECT id, codigo, descricao, disciplina, tipo_ensino, ano_inicio, ano_fim, unidade_tematica, objeto_conhecimento, competencia_especifica, metadata
      FROM habilidades
      ${whereClause}
      ORDER BY disciplina ASC, codigo ASC
      LIMIT $${whereParams.length + 1}
      OFFSET $${whereParams.length + 2}
    `;

    // Query total count (only uses WHERE parameters)
    const countQuery = `
      SELECT COUNT(*) as count
      FROM habilidades
      ${whereClause}
    `;

    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(dataQuery, ...dataParams),
      this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
        countQuery,
        ...whereParams,
      ),
    ]);

    return {
      data,
      total: Number(countResult[0].count),
      limit,
      offset,
    };
  }

  /**
   * Query database com filtros combinados
   *
   * Filtros suportados:
   * - tipo_ensino: FUNDAMENTAL | MEDIO (Story 10.5)
   * - disciplina: MATEMATICA | LINGUA_PORTUGUESA | CIENCIAS
   * - serie: 6-9 (considera blocos compartilhados LP) - APENAS para FUNDAMENTAL
   * - unidade_tematica: substring match (ex: "Álgebra")
   * - search: full-text search no código + descrição (PostgreSQL tsvector)
   * - limit/offset: pagination
   *
   * @param query - Query params validados pelo DTO
   * @returns HabilidadesResponse
   */
  private async queryDatabase(
    query: QueryHabilidadesDto,
  ): Promise<HabilidadesResponse> {
    const {
      tipo_ensino,
      disciplina,
      serie,
      unidade_tematica,
      search,
      limit = 50,
      offset = 0,
    } = query;

    // Build WHERE clause dinamicamente
    const where: Prisma.HabilidadeWhereInput = {
      ativa: true, // Exclude soft-deleted
    };

    // Filter: tipo_ensino (Story 10.5 - backward compatible)
    if (tipo_ensino) {
      where.tipo_ensino = tipo_ensino;
    }

    // Filter: disciplina
    if (disciplina) {
      where.disciplina = disciplina;
    }

    // Filter: serie (CRITICAL: considera blocos compartilhados LP)
    // APENAS para FUNDAMENTAL - Ensino Médio não filtra por série (é transversal)
    if (serie && tipo_ensino !== 'MEDIO') {
      // Habilidades que cobrem esta série:
      // - ano_inicio <= serie AND ano_fim >= serie
      // Ex: serie=7 retorna:
      //   - EF07LP* (ano_inicio=7, ano_fim=7)
      //   - EF67LP* (ano_inicio=6, ano_fim=7)
      //   - EF69LP* (ano_inicio=6, ano_fim=9)
      where.AND = [
        { ano_inicio: { lte: serie } },
        {
          OR: [
            { ano_fim: { gte: serie } }, // Blocos compartilhados (ano_fim preenchido)
            { ano_fim: null }, // Habilidades específicas (ano_fim null = ano_inicio == ano_fim)
          ],
        },
      ];
    }

    // Filter: unidade_tematica (substring match)
    if (unidade_tematica) {
      where.unidade_tematica = { contains: unidade_tematica };
    }

    // Filter: full-text search (PostgreSQL tsvector)
    // NOTE: Prisma doesn't support tsvector in types, so we'll use $queryRaw if search is present
    // For now, add a marker to handle this case separately
    const hasFullTextSearch = !!search;

    // Execute query com pagination
    // Se houver full-text search, usar raw SQL (Prisma não suporta tsvector nativamente)
    if (hasFullTextSearch) {
      return this.queryWithFullTextSearch(where, search, limit, offset);
    }

    // Query normal sem full-text search
    const [data, total] = await Promise.all([
      this.prisma.habilidade.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { disciplina: 'asc' }, // Ordenar por disciplina primeiro
          { codigo: 'asc' }, // Depois por código (ex: EF06MA01, EF06MA02...)
        ],
        select: {
          id: true,
          codigo: true,
          descricao: true,
          disciplina: true,
          tipo_ensino: true, // Story 10.3: Support Ensino Médio
          ano_inicio: true,
          ano_fim: true,
          unidade_tematica: true,
          competencia_especifica: true, // Story 10.3: EM competência (1-7)
          objeto_conhecimento: true,
          metadata: true, // Story 10.3: EM area metadata
          created_at: true,
          updated_at: true,
          versao_bncc: true,
          ativa: true,
          // searchable: Excluded - tsvector type not supported by Prisma deserialization
        },
      }),
      this.prisma.habilidade.count({ where }), // Total sem pagination
    ]);

    return {
      data,
      total,
      limit,
      offset,
    };
  }
}
