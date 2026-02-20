import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  Param,
  BadRequestException,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { FiltrosDashboardDto } from './dto/filtros-dashboard.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoleUsuario } from '@prisma/client';

@ApiTags('Dashboard - Coordenador')
@Controller('dashboard/coordenador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardCoordenadorController {
  constructor(private dashboardService: DashboardService) {}

  @Get('professores')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour
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

  @Get('turmas')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache 1 hora
  @ApiOperation({
    summary: 'Métricas de cobertura curricular por turma',
    description:
      'Retorna lista de turmas com métricas agregadas de cobertura BNCC. ' +
      'Coordenador identifica turmas em atraso (< 50% crítico, 50-70% atenção).',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas agregadas por turma com classificação de urgência',
  })
  async getMetricasPorTurma(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: FiltrosDashboardDto,
  ) {
    if (!user.escolaId) {
      throw new BadRequestException(
        'Dashboard coordenador não disponível para ADMIN',
      );
    }
    return this.dashboardService.getMetricasPorTurma(user.escolaId, filtros);
  }

  @Get('turmas/:turmaId/detalhes')
  @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour
  @ApiOperation({
    summary: 'Detalhes de habilidades da turma (drill-down)',
    description:
      'Retorna status de cada habilidade planejada para a turma: COMPLETE/PARTIAL/MENTIONED/NOT_COVERED. ' +
      'Coordenador identifica quais habilidades específicas não foram trabalhadas.',
  })
  @ApiParam({
    name: 'turmaId',
    description: 'UUID da turma',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de habilidades com status de cobertura',
  })
  @ApiResponse({
    status: 400,
    description: 'turmaId inválido (deve ser UUID)',
  })
  async getDetalhesTurma(
    @Param('turmaId', new ParseUUIDPipe({ version: '4' })) turmaId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('bimestre', new ParseIntPipe({ optional: true })) bimestre?: number,
  ) {
    if (!user.escolaId) {
      throw new BadRequestException(
        'Dashboard coordenador não disponível para ADMIN',
      );
    }
    return this.dashboardService.getDetalhesTurma(
      user.escolaId,
      turmaId,
      bimestre,
    );
  }
}

@ApiTags('Dashboard - Diretor')
@Controller('dashboard/diretor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardDiretorController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metricas')
  @Roles(RoleUsuario.DIRETOR)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache 1 hora
  @ApiOperation({
    summary: 'Métricas consolidadas da escola (visão executiva do Diretor)',
    description:
      'Retorna KPIs agregados da escola inteira: cobertura geral, professores ativos, turmas ativas, ' +
      'distribuição por disciplina, e evolução temporal ao longo dos bimestres. ' +
      'Diretor tem visão estratégica sem acesso a detalhes de professores/turmas individuais.',
  })
  @ApiQuery({
    name: 'bimestre',
    required: false,
    type: Number,
    description:
      'Filtro opcional: 1-4 (se omitido, retorna dados de todos os bimestres)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'KPIs consolidados + distribuição por disciplina + evolução temporal',
  })
  async getMetricasEscola(
    @CurrentUser() user: AuthenticatedUser,
    @Query('bimestre', new ParseIntPipe({ optional: true })) bimestre?: number,
  ) {
    if (!user.escolaId) {
      throw new BadRequestException(
        'Dashboard diretor não disponível para ADMIN',
      );
    }
    return this.dashboardService.getMetricasEscola(user.escolaId, bimestre);
  }
}
