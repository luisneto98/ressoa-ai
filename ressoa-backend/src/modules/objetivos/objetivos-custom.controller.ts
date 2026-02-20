import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ObjetivosService } from './objetivos.service';
import { CreateObjetivoCustomDto } from './dto/create-objetivo-custom.dto';
import { UpdateObjetivoCustomDto } from './dto/update-objetivo-custom.dto';

/**
 * Controller para CRUD de Objetivos Customizados (nested route under turmas)
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Endpoints:
 * - POST   /turmas/:turma_id/objetivos
 * - GET    /turmas/:turma_id/objetivos
 * - GET    /turmas/:turma_id/objetivos/:id
 * - PATCH  /turmas/:turma_id/objetivos/:id
 * - DELETE /turmas/:turma_id/objetivos/:id
 *
 * RBAC: PROFESSOR, COORDENADOR, DIRETOR
 * Multi-tenancy: Garantido via escola_id no service layer
 */
@ApiTags('Objetivos de Aprendizagem')
@Controller('turmas/:turma_id/objetivos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ObjetivosCustomController {
  constructor(private readonly objetivosService: ObjetivosService) {}

  @Post()
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar objetivo customizado' })
  @ApiParam({
    name: 'turma_id',
    description: 'UUID da turma com curriculo_tipo = CUSTOM',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Objetivo criado com sucesso',
    schema: {
      example: {
        id: 'uuid-objetivo',
        codigo: 'PM-MAT-01',
        descricao:
          'Resolver problemas de regra de três simples e composta aplicados a questões da prova PM-SP',
        nivel_cognitivo: 'APLICAR',
        tipo_fonte: 'CUSTOM',
        area_conhecimento: 'Matemática - Raciocínio Lógico',
        turma_id: 'uuid-turma',
        criterios_evidencia: [
          'Identifica grandezas proporcionais',
          'Monta proporção corretamente',
          'Resolve equação e valida resultado com contexto do problema',
        ],
        created_at: '2026-02-13T10:00:00Z',
        updated_at: '2026-02-13T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos ou turma não é CUSTOM - Objetivos customizados só podem ser criados em turmas com curriculo_tipo = CUSTOM',
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para criar objetivos nesta turma',
  })
  @ApiResponse({
    status: 409,
    description: 'Código já existe nesta turma',
  })
  async create(
    @Param('turma_id') turmaId: string,
    @Body() createDto: CreateObjetivoCustomDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.objetivosService.createCustom(turmaId, createDto, user);
  }

  @Get()
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Listar objetivos da turma' })
  @ApiParam({
    name: 'turma_id',
    description: 'UUID da turma',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de objetivos ordenados por created_at ASC',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo: { type: 'string', example: 'PM-MAT-01' },
          descricao: { type: 'string' },
          nivel_cognitivo: { type: 'string', example: 'APLICAR' },
          tipo_fonte: { type: 'string', example: 'CUSTOM' },
          area_conhecimento: { type: 'string' },
          turma_id: { type: 'string', format: 'uuid' },
          criterios_evidencia: { type: 'array', items: { type: 'string' } },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para listar objetivos desta turma',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async findAll(
    @Param('turma_id') turmaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.objetivosService.findAllByTurma(turmaId, user);
  }

  @Get(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar objetivo específico' })
  @ApiParam({ name: 'turma_id', description: 'UUID da turma', type: 'string' })
  @ApiParam({ name: 'id', description: 'UUID do objetivo', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Objetivo encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para acessar objetivos desta turma',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado (ID inexistente ou de outra turma)',
  })
  async findOne(
    @Param('turma_id') turmaId: string,
    @Param('id') objetivoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.objetivosService.findOneByTurma(turmaId, objetivoId, user);
  }

  @Patch(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @ApiOperation({ summary: 'Atualizar objetivo' })
  @ApiParam({ name: 'turma_id', description: 'UUID da turma', type: 'string' })
  @ApiParam({ name: 'id', description: 'UUID do objetivo', type: 'string' })
  @ApiResponse({
    status: 200,
    description:
      'Objetivo atualizado com sucesso (campos não enviados permanecem inalterados)',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (validações de tamanho, enum, etc)',
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para atualizar objetivos desta turma',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Código já existe em outro objetivo desta turma',
  })
  async update(
    @Param('turma_id') turmaId: string,
    @Param('id') objetivoId: string,
    @Body() updateDto: UpdateObjetivoCustomDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.objetivosService.updateCustom(
      turmaId,
      objetivoId,
      updateDto,
      user,
    );
  }

  @Delete(':id')
  @Roles('PROFESSOR', 'COORDENADOR', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deletar objetivo' })
  @ApiParam({ name: 'turma_id', description: 'UUID da turma', type: 'string' })
  @ApiParam({ name: 'id', description: 'UUID do objetivo', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Objetivo deletado com sucesso',
    schema: {
      example: { message: 'Objetivo deletado com sucesso' },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Você não tem permissão para deletar objetivos desta turma',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'Objetivo não pode ser deletado pois está em uso em planejamentos',
    schema: {
      example: {
        statusCode: 409,
        message:
          'Objetivo não pode ser deletado pois está em uso em 2 planejamento(s)',
        error: 'Conflict',
        planejamentos_afetados: [
          { id: 'uuid-plan-1', bimestre: 1 },
          { id: 'uuid-plan-2', bimestre: 2 },
        ],
        sugestao:
          'Remova o objetivo dos planejamentos antes de deletar, ou edite o objetivo para corrigir erros',
      },
    },
  })
  async remove(
    @Param('turma_id') turmaId: string,
    @Param('id') objetivoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.objetivosService.removeCustom(turmaId, objetivoId, user);
  }
}
