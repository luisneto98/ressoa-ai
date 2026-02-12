import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ProfessoresService } from './professores.service';
import { FiltrosCoberturaDto, TimelineQueryDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('professores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfessoresController {
  constructor(
    private professoresService: ProfessoresService,
    private prisma: PrismaService,
  ) {}

  /**
   * GET /api/v1/professores/me/cobertura
   *
   * Retorna % de cobertura curricular do professor por turma/disciplina/bimestre
   *
   * @param user Professor autenticado (JWT)
   * @param filtros Filtros opcionais (turma_id, disciplina, bimestre)
   * @returns { cobertura: CoberturaResult[], stats: { total_turmas, media_cobertura, turmas_abaixo_meta } }
   *
   * CRITICAL Multi-Tenancy:
   * - escolaId extraído de TenantInterceptor context (this.prisma.getEscolaIdOrThrow())
   * - professorId extraído de JWT (@CurrentUser decorator)
   * - Service filtra queries por escola_id + professor_id
   */
  @Get('me/cobertura')
  @Roles('PROFESSOR')
  async getMinhaCobertura(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: FiltrosCoberturaDto,
  ) {
    // 🔴 CRITICAL: Get escola_id from TenantInterceptor context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    const cobertura = await this.professoresService.getCoberturaPropria(
      user.userId,
      escolaId,
      filtros,
    );

    // Calcular estatísticas agregadas
    const stats = {
      total_turmas: cobertura.length,
      media_cobertura:
        cobertura.length > 0
          ? cobertura.reduce(
              (acc, c) => acc + Number(c.percentual_cobertura),
              0,
            ) / cobertura.length
          : 0,
      turmas_abaixo_meta: cobertura.filter(
        (c) => Number(c.percentual_cobertura) < 70,
      ).length, // Meta: 70%
    };

    return {
      cobertura,
      stats,
    };
  }

  /**
   * GET /api/v1/professores/me/cobertura/timeline
   *
   * Retorna evolução temporal de cobertura (semana a semana)
   *
   * @param user Professor autenticado (JWT)
   * @param turmaId ID da turma (query param)
   * @param bimestre Bimestre 1-4 (query param)
   * @returns Array de { semana, habilidades_acumuladas, aulas_realizadas }
   *
   * CRITICAL Multi-Tenancy:
   * - Valida que turma pertence ao professor E à escola (service layer)
   */
  @Get('me/cobertura/timeline')
  @Roles('PROFESSOR')
  async getCoberturaTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TimelineQueryDto,
  ) {
    // 🔴 CRITICAL: Get escola_id from TenantInterceptor context
    const escolaId = this.prisma.getEscolaIdOrThrow();

    return this.professoresService.getCoberturaTimeline(
      user.userId,
      escolaId,
      query.turma_id,
      query.bimestre,
    );
  }
}
