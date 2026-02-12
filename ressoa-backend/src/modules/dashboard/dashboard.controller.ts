import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  Param,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';

@ApiTags('Dashboard - Coordenador')
@Controller('dashboard/coordenador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('professores')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache 1 hora (3600 segundos)
  @ApiOperation({
    summary: 'Métricas de cobertura curricular por professor',
    description:
      'Retorna ranking de professores com métricas agregadas de cobertura BNCC. ' +
      'Coordenador identifica professores que precisam suporte (< 70% cobertura).',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas agregadas por professor',
  })
  async getMetricasPorProfessor(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: FiltrosDashboardDto,
  ) {
    if (!user.escolaId) {
      throw new BadRequestException(
        'Dashboard coordenador não disponível para ADMIN',
      );
    }
    return this.dashboardService.getMetricasPorProfessor(
      user.escolaId,
      filtros,
    );
  }

  @Get('professores/:professorId/turmas')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Turmas de um professor específico (drill-down)',
    description:
      'Retorna métricas de cobertura detalhadas por turma de um professor. ' +
      'Coordenador identifica quais turmas do professor estão em atraso.',
  })
  @ApiParam({
    name: 'professorId',
    description: 'UUID do professor',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas por turma do professor',
  })
  @ApiResponse({
    status: 400,
    description: 'professorId inválido (deve ser UUID)',
  })
  async getTurmasPorProfessor(
    @Param('professorId', new ParseUUIDPipe({ version: '4' }))
    professorId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: FiltrosDashboardDto,
  ) {
    if (!user.escolaId) {
      throw new BadRequestException(
        'Dashboard coordenador não disponível para ADMIN',
      );
    }
    return this.dashboardService.getTurmasPorProfessor(
      user.escolaId,
      professorId,
      filtros,
    );
  }
}
