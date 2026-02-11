import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HabilidadesService, HabilidadesResponse } from './habilidades.service';
import { QueryHabilidadesDto } from './dto/query-habilidades.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleUsuario } from '@prisma/client';

/**
 * Controller para consulta de Habilidades BNCC
 *
 * Endpoint público para professores, coordenadores e diretores.
 * Habilidades são dados GLOBAIS (BNCC nacional - compartilhados entre todas escolas).
 *
 * Features:
 * - Full-text search (PostgreSQL tsvector)
 * - Filtros combinados (disciplina, serie, unidade_tematica)
 * - Blocos compartilhados LP (EF67LP, EF69LP, EF89LP)
 * - Pagination (limit 50, max 200)
 * - Redis cache (7 dias TTL)
 *
 * @route /api/v1/habilidades (global prefix já adiciona /api/v1)
 */
@Controller('habilidades')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteger endpoint (autenticação + autorização)
@Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR) // RBAC: apenas usuários educacionais
export class HabilidadesController {
  constructor(private readonly habilidadesService: HabilidadesService) {}

  /**
   * GET /api/v1/habilidades
   *
   * Query params (todos opcionais):
   * - disciplina: MATEMATICA | LINGUA_PORTUGUESA | CIENCIAS
   * - serie: 6-9 (considera blocos compartilhados LP)
   * - unidade_tematica: substring match (ex: "Álgebra")
   * - search: full-text search no código + descrição
   * - limit: limite de resultados (default 50, max 200)
   * - offset: número de registros a pular (pagination)
   *
   * Response:
   * {
   *   "data": [ ... habilidades ... ],
   *   "total": 121,
   *   "limit": 50,
   *   "offset": 0
   * }
   *
   * Rate Limiting: 100 requests/min (relaxed - data is mostly cached)
   *
   * @example
   * GET /api/v1/habilidades?disciplina=MATEMATICA&serie=6
   * GET /api/v1/habilidades?search=equações&limit=10
   * GET /api/v1/habilidades?disciplina=LINGUA_PORTUGUESA&serie=7 (inclui EF67LP, EF69LP)
   *
   * @param query - Query params validados pelo DTO
   * @returns HabilidadesResponse (data, total, limit, offset)
   */
  @Get()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req/min (relaxed but protected)
  async findAll(
    @Query() query: QueryHabilidadesDto,
  ): Promise<HabilidadesResponse> {
    return this.habilidadesService.findAll(query);
  }
}
