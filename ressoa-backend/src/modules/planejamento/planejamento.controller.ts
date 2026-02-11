import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PlanejamentoService } from './planejamento.service';
import { CreatePlanejamentoDto, UpdatePlanejamentoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Planejamentos')
@ApiBearerAuth()
@Controller('planejamentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanejamentoController {
  constructor(private readonly planejamentoService: PlanejamentoService) {}

  /**
   * POST /api/v1/planejamentos
   * Cria novo planejamento bimestral
   * @roles PROFESSOR
   */
  @Post()
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar planejamento bimestral',
    description:
      'Permite professor criar planejamento vinculando habilidades BNCC a uma turma e bimestre',
  })
  @ApiResponse({
    status: 201,
    description: 'Planejamento criado com sucesso com habilidades vinculadas',
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos, habilidades não existem, disciplinas incompatíveis, ou planejamento duplicado para esta turma/bimestre',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para criar planejamento nesta turma',
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  async create(
    @Body() createDto: CreatePlanejamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planejamentoService.create(createDto, user);
  }

  /**
   * GET /api/v1/planejamentos
   * Lista planejamentos com filtros opcionais
   * @roles PROFESSOR, COORDENADOR, DIRETOR
   */
  @Get()
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({
    summary: 'Listar planejamentos',
    description:
      'Professor vê apenas seus planejamentos. Coordenador/Diretor veem todos da escola.',
  })
  @ApiQuery({
    name: 'turma_id',
    required: false,
    description: 'Filtrar por ID da turma',
  })
  @ApiQuery({
    name: 'bimestre',
    required: false,
    description: 'Filtrar por bimestre (1-4)',
  })
  @ApiQuery({
    name: 'ano_letivo',
    required: false,
    description: 'Filtrar por ano letivo',
  })
  @ApiQuery({
    name: 'validado',
    required: false,
    description: 'Filtrar por status de validação (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planejamentos retornada com sucesso',
  })
  async findAll(
    @Query('turma_id') turmaId?: string,
    @Query('bimestre', new ParseIntPipe({ optional: true })) bimestre?: number,
    @Query('ano_letivo', new ParseIntPipe({ optional: true }))
    anoLetivo?: number,
    @Query('validado') validado?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.planejamentoService.findAll(
      {
        turma_id: turmaId,
        bimestre,
        ano_letivo: anoLetivo,
        validado:
          validado === 'true' ? true : validado === 'false' ? false : undefined,
      },
      user!,
    );
  }

  /**
   * GET /api/v1/planejamentos/:id
   * Busca planejamento por ID
   * @roles PROFESSOR, COORDENADOR, DIRETOR
   */
  @Get(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({
    summary: 'Buscar planejamento por ID',
    description:
      'Retorna planejamento completo com turma, habilidades e professor',
  })
  @ApiParam({ name: 'id', description: 'ID do planejamento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Planejamento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Planejamento não encontrado ou sem permissão de acesso',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planejamentoService.findOne(id, user);
  }

  /**
   * PATCH /api/v1/planejamentos/:id
   * Atualiza planejamento existente
   * @roles PROFESSOR
   */
  @Patch(':id')
  @Roles('PROFESSOR')
  @ApiOperation({
    summary: 'Atualizar planejamento',
    description:
      'Professor pode atualizar bimestre, ano_letivo, turma ou habilidades (substituição completa)',
  })
  @ApiParam({ name: 'id', description: 'ID do planejamento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Planejamento atualizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou habilidades incompatíveis',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este planejamento',
  })
  @ApiResponse({ status: 404, description: 'Planejamento não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePlanejamentoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planejamentoService.update(id, updateDto, user);
  }

  /**
   * DELETE /api/v1/planejamentos/:id
   * Remove planejamento
   * @roles PROFESSOR
   */
  @Delete(':id')
  @Roles('PROFESSOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir planejamento',
    description:
      'Remove planejamento (soft delete). Bloqueia se houver aulas vinculadas.',
  })
  @ApiParam({ name: 'id', description: 'ID do planejamento (UUID)' })
  @ApiResponse({
    status: 204,
    description: 'Planejamento excluído com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível excluir planejamento com aulas vinculadas',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para excluir este planejamento',
  })
  @ApiResponse({ status: 404, description: 'Planejamento não encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.planejamentoService.remove(id, user);
  }
}
